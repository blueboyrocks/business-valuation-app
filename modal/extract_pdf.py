"""
PDF Extraction Service for Business Valuation App

This Modal service extracts structured financial data from tax returns
(Form 1120, 1120-S, 1065, Schedule C) and financial statements.

Uses:
- PyMuPDF (fitz) for fast, high-quality text extraction
- pdfplumber for detailed table extraction
- pytesseract for OCR of scanned documents (fallback)

Deploy with: modal deploy extract_pdf.py
Test locally: modal run extract_pdf.py
"""

import modal
import base64
import json
import re
from datetime import datetime
from typing import Optional
from io import BytesIO

# Define the Modal app
app = modal.App("pdf-extraction-service")

# Create an image with all required dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        # For PyMuPDF
        "libmupdf-dev",
        "mupdf-tools",
        # For OCR (pytesseract)
        "tesseract-ocr",
        "tesseract-ocr-eng",
        # For pdf2image
        "poppler-utils",
    )
    .pip_install(
        "pymupdf>=1.24.0",
        "pdfplumber>=0.10.0",
        "pytesseract>=0.3.10",
        "pdf2image>=1.16.0",
        "Pillow>=10.0.0",
    )
)


@app.function(image=image, timeout=300)
@modal.web_endpoint(method="POST")
def extract_pdf(request: dict) -> dict:
    """
    Extract financial data from a PDF document.

    Request body:
    {
        "pdf_base64": "base64 encoded PDF",
        "document_id": "optional document ID",
        "filename": "optional filename"
    }

    Returns:
    {
        "success": true/false,
        "data": { extracted data },
        "error": { error info if failed }
    }
    """
    import fitz  # PyMuPDF
    import pdfplumber
    import pytesseract
    from pdf2image import convert_from_bytes

    try:
        # Validate request
        pdf_base64 = request.get("pdf_base64")
        if not pdf_base64:
            return {
                "success": False,
                "error": {
                    "code": "MISSING_PDF",
                    "message": "pdf_base64 is required"
                }
            }

        document_id = request.get("document_id", "unknown")
        filename = request.get("filename", "document.pdf")

        print(f"[EXTRACT] Processing document {document_id}: {filename}")

        # Decode PDF
        try:
            pdf_bytes = base64.b64decode(pdf_base64)
        except Exception as e:
            return {
                "success": False,
                "error": {
                    "code": "INVALID_BASE64",
                    "message": f"Failed to decode base64: {str(e)}"
                }
            }

        # Check for encrypted PDF
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            if doc.is_encrypted:
                return {
                    "success": False,
                    "error": {
                        "code": "ENCRYPTED_PDF",
                        "message": "PDF is password protected"
                    }
                }
        except Exception as e:
            return {
                "success": False,
                "error": {
                    "code": "CORRUPTED_PDF",
                    "message": f"Failed to open PDF: {str(e)}"
                }
            }

        # Extract text using PyMuPDF (fast and accurate)
        full_text = ""
        text_by_page = {}
        total_chars = 0

        for page_num in range(len(doc)):
            page = doc[page_num]
            page_text = page.get_text()
            text_by_page[page_num + 1] = page_text
            full_text += page_text + "\n"
            total_chars += len(page_text.strip())

        doc.close()

        # Check if document is scanned (low text density)
        avg_chars_per_page = total_chars / max(len(text_by_page), 1)
        is_scanned = avg_chars_per_page < 100
        ocr_confidence = None
        extraction_method = "pymupdf"

        print(f"[EXTRACT] Text extraction: {total_chars} chars, {avg_chars_per_page:.0f} avg/page")

        # If scanned, try OCR
        if is_scanned:
            print(f"[EXTRACT] Document appears scanned, attempting OCR...")
            try:
                images = convert_from_bytes(pdf_bytes, dpi=300)
                ocr_text = ""
                ocr_confidences = []

                for i, img in enumerate(images):
                    # Get OCR with confidence data
                    ocr_data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
                    page_text = " ".join([
                        word for word, conf in zip(ocr_data['text'], ocr_data['conf'])
                        if conf > 0 and word.strip()
                    ])
                    ocr_text += page_text + "\n"
                    text_by_page[i + 1] = page_text

                    # Calculate average confidence for this page
                    page_confs = [c for c in ocr_data['conf'] if c > 0]
                    if page_confs:
                        ocr_confidences.extend(page_confs)

                full_text = ocr_text
                total_chars = len(ocr_text.strip())
                ocr_confidence = sum(ocr_confidences) / len(ocr_confidences) if ocr_confidences else 0
                extraction_method = "ocr"

                print(f"[EXTRACT] OCR complete: {total_chars} chars, {ocr_confidence:.1f}% confidence")

                # Still scanned with poor OCR quality
                if total_chars < 500 or (ocr_confidence and ocr_confidence < 60):
                    return {
                        "success": False,
                        "error": {
                            "code": "SCANNED_PDF",
                            "message": f"Document is scanned with low OCR quality ({ocr_confidence:.0f}% confidence). Premium extraction recommended."
                        }
                    }
            except Exception as ocr_error:
                print(f"[EXTRACT] OCR failed: {ocr_error}")
                return {
                    "success": False,
                    "error": {
                        "code": "SCANNED_PDF",
                        "message": "Document is scanned and OCR failed. Premium extraction recommended."
                    }
                }

        # Extract tables using pdfplumber (format matches TypeScript ModalExtractedTable)
        tables = []
        try:
            with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    page_tables = page.extract_tables()
                    for table_idx, table in enumerate(page_tables):
                        if table and len(table) > 0:
                            # Extract headers (first row if it looks like headers)
                            headers = None
                            rows = table
                            if len(table) > 1:
                                first_row = table[0]
                                # Check if first row looks like headers (all strings, no numbers)
                                if first_row and all(
                                    cell and not any(c.isdigit() for c in str(cell))
                                    for cell in first_row if cell
                                ):
                                    headers = [str(cell) if cell else "" for cell in first_row]
                                    rows = table[1:]

                            tables.append({
                                "page_number": page_num + 1,
                                "table_index": table_idx,
                                "headers": headers,
                                "rows": [[str(cell) if cell else "" for cell in row] for row in rows],
                                "row_count": len(rows),
                                "column_count": len(table[0]) if table else 0
                            })
            print(f"[EXTRACT] Found {len(tables)} tables")
        except Exception as table_error:
            print(f"[EXTRACT] Table extraction warning: {table_error}")

        # Parse financial data from text and tables
        parsed_data = parse_financial_data(full_text, tables, filename)

        # Build response matching TypeScript ModalExtractionResponse type
        response_data = {
            "document_id": document_id,
            "filename": filename,
            "extraction_timestamp": datetime.utcnow().isoformat() + "Z",
            "raw_text": full_text[:50000],  # Limit raw text size
            "text_by_region": {
                "page_1": {
                    "header": "",
                    "body_left": "",
                    "body_right": "",
                    "footer": "",
                    "full_text": full_text[:50000]
                }
            },
            "tables": tables[:20],  # Limit tables
            "metadata": {
                "page_count": len(text_by_page),
                "is_scanned": is_scanned,
                "ocr_confidence": ocr_confidence,
                "extraction_method": "pdfplumber" if extraction_method == "pymupdf" else "ocr",
                "processing_time_ms": 0  # Could track this if needed
            },
            # Additional parsed data for better quality (TypeScript can use this directly)
            "parsed_data": parsed_data
        }

        return {
            "success": True,
            "data": response_data
        }

    except Exception as e:
        print(f"[EXTRACT] Error: {str(e)}")
        return {
            "success": False,
            "error": {
                "code": "UNKNOWN_ERROR",
                "message": str(e)
            }
        }


def parse_financial_data(text: str, tables: list, filename: str) -> dict:
    """
    Parse financial data from extracted text and tables.
    Handles Form 1120, 1120-S, 1065, Schedule C.
    """
    lower_text = text.lower()
    lower_filename = filename.lower()

    # Detect document type
    doc_type = "Other"
    entity_type = "Other"

    if "1120-s" in lower_text or "1120s" in lower_filename or "1120-s" in lower_filename:
        doc_type = "Form 1120-S"
        entity_type = "S-Corporation"
    elif "1120" in lower_text or "1120" in lower_filename:
        doc_type = "Form 1120"
        entity_type = "C-Corporation"
    elif "1065" in lower_text or "1065" in lower_filename:
        doc_type = "Form 1065"
        entity_type = "Partnership"
    elif "schedule c" in lower_text or "schedule-c" in lower_filename or "schedulec" in lower_filename:
        doc_type = "Schedule C"
        entity_type = "Sole Proprietorship"

    # Extract tax year
    tax_year = extract_tax_year(text)

    # Extract financial amounts using multiple strategies
    amounts = extract_amounts(text, tables)

    # Extract company info
    company_info = extract_company_info(text, entity_type)

    return {
        "document_type": doc_type,
        "entity_type": entity_type,
        "tax_year": tax_year,
        "company_info": company_info,
        "income_statement": {
            "gross_receipts_sales": amounts.get("gross_receipts", 0),
            "returns_allowances": amounts.get("returns_allowances", 0),
            "cost_of_goods_sold": amounts.get("cogs", 0),
            "gross_profit": amounts.get("gross_profit", 0),
            "total_income": amounts.get("total_income", 0),
            "total_deductions": amounts.get("total_deductions", 0),
            "taxable_income": amounts.get("taxable_income", 0),
            "net_income": amounts.get("net_income", 0),
        },
        "expenses": {
            "compensation_of_officers": amounts.get("officer_compensation", 0),
            "salaries_wages": amounts.get("salaries_wages", 0),
            "repairs_maintenance": amounts.get("repairs", 0),
            "bad_debts": amounts.get("bad_debts", 0),
            "rents": amounts.get("rents", 0),
            "taxes_licenses": amounts.get("taxes_licenses", 0),
            "interest": amounts.get("interest_expense", 0),
            "depreciation": amounts.get("depreciation", 0),
            "depletion": amounts.get("depletion", 0),
            "advertising": amounts.get("advertising", 0),
            "pension_profit_sharing": amounts.get("pension", 0),
            "employee_benefits": amounts.get("employee_benefits", 0),
            "other_deductions": amounts.get("other_deductions", 0),
        },
        "balance_sheet": {
            "total_assets": amounts.get("total_assets", 0),
            "cash": amounts.get("cash", 0),
            "accounts_receivable": amounts.get("accounts_receivable", 0),
            "inventory": amounts.get("inventory", 0),
            "fixed_assets": amounts.get("fixed_assets", 0),
            "accumulated_depreciation": amounts.get("accumulated_depreciation", 0),
            "other_assets": amounts.get("other_assets", 0),
            "total_liabilities": amounts.get("total_liabilities", 0),
            "accounts_payable": amounts.get("accounts_payable", 0),
            "loans_payable": amounts.get("loans_payable", 0),
            "other_liabilities": amounts.get("other_liabilities", 0),
            "retained_earnings": amounts.get("retained_earnings", 0),
            "total_equity": amounts.get("total_equity", 0),
        },
        "schedule_k": {
            "section_179_deduction": amounts.get("section_179", 0),
            "charitable_contributions": amounts.get("charitable", 0),
            "total_distributions": amounts.get("distributions", 0),
        },
        "owner_info": {
            "owner_compensation": amounts.get("officer_compensation", 0),
            "guaranteed_payments": amounts.get("guaranteed_payments", 0),
            "distributions": amounts.get("distributions", 0),
            "loans_to_shareholders": amounts.get("loans_to_shareholders", 0),
            "loans_from_shareholders": amounts.get("loans_from_shareholders", 0),
        },
    }


def extract_tax_year(text: str) -> int:
    """Extract tax year from document text."""
    # Try various patterns
    patterns = [
        r'tax\s*year\s*(?:beginning|ending)?\s*(\d{4})',
        r'for\s*(?:calendar\s*)?year\s*(\d{4})',
        r'(\d{4})\s*(?:form|return)',
        r'december\s*31,?\s*(\d{4})',
        r'(\d{4})\s*u\.?s\.?\s*(?:income\s*)?tax',
    ]

    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            year = int(match.group(1))
            if 2015 <= year <= 2030:  # Sanity check
                return year

    # Default to previous year
    return datetime.now().year - 1


def extract_company_info(text: str, entity_type: str) -> dict:
    """Extract company information from document text."""
    # Business name
    name_patterns = [
        r'name\s*of\s*(?:corporation|partnership|business|company)[:\s]+([^\n]+)',
        r'business\s*name[:\s]+([^\n]+)',
        r'(?:employer|ein).*?([A-Z][A-Za-z\s&,\.]+(?:Inc|LLC|Corp|Co|LP|LLP))',
    ]

    business_name = "Unknown Business"
    for pattern in name_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            if len(name) > 2 and len(name) < 100:
                business_name = name
                break

    # EIN
    ein_match = re.search(r'(?:ein|employer\s*identification)[:\s]*(\d{2}[-\s]?\d{7})', text, re.IGNORECASE)
    ein = ein_match.group(1) if ein_match else None

    # NAICS code
    naics_match = re.search(r'(?:naics|business\s*(?:activity\s*)?code)[:\s]*(\d{6})', text, re.IGNORECASE)
    naics_code = naics_match.group(1) if naics_match else None

    # Business activity
    activity_match = re.search(r'(?:principal\s*)?business\s*activity[:\s]+([^\n]+)', text, re.IGNORECASE)
    business_activity = activity_match.group(1).strip() if activity_match else None

    return {
        "business_name": business_name,
        "ein": ein,
        "entity_type": entity_type,
        "naics_code": naics_code,
        "business_activity": business_activity,
        "fiscal_year_end": "12/31",
        "accounting_method": detect_accounting_method(text),
    }


def detect_accounting_method(text: str) -> str:
    """Detect accounting method from text."""
    lower = text.lower()
    if "accrual" in lower:
        return "Accrual"
    elif "cash" in lower:
        return "Cash"
    return "Accrual"  # Default assumption


def extract_amounts(text: str, tables: list) -> dict:
    """
    Extract financial amounts from text and tables.
    Uses multiple strategies for robustness.
    """
    amounts = {}

    # Strategy 1: Pattern matching on text
    text_amounts = extract_amounts_from_text(text)
    amounts.update(text_amounts)

    # Strategy 2: Table parsing
    for table in tables:
        table_amounts = extract_amounts_from_table(table)
        # Only update if we found more data
        for key, value in table_amounts.items():
            if value > 0 and amounts.get(key, 0) == 0:
                amounts[key] = value

    return amounts


def extract_amounts_from_text(text: str) -> dict:
    """Extract amounts using regex patterns on text."""
    amounts = {}

    # Define patterns for each field
    patterns = {
        "gross_receipts": [
            r'gross\s*receipts.*?[\$]?\s*([\d,]+)',
            r'total\s*(?:sales|revenue).*?[\$]?\s*([\d,]+)',
            r'line\s*1[a-c]?[^0-9]*[\$]?\s*([\d,]+)',
        ],
        "cogs": [
            r'cost\s*of\s*goods\s*sold.*?[\$]?\s*([\d,]+)',
            r'line\s*2[^0-9]*[\$]?\s*([\d,]+)',
        ],
        "gross_profit": [
            r'gross\s*profit.*?[\$]?\s*([\d,]+)',
            r'line\s*3[^0-9]*[\$]?\s*([\d,]+)',
        ],
        "officer_compensation": [
            r'compensation\s*of\s*officers.*?[\$]?\s*([\d,]+)',
            r'officer.*?compensation.*?[\$]?\s*([\d,]+)',
            r'line\s*7[^0-9]*[\$]?\s*([\d,]+)',
        ],
        "salaries_wages": [
            r'salaries\s*(?:and\s*)?wages.*?[\$]?\s*([\d,]+)',
            r'line\s*8[^0-9]*[\$]?\s*([\d,]+)',
        ],
        "rents": [
            r'rents?[^a-z]*[\$]?\s*([\d,]+)',
        ],
        "interest_expense": [
            r'interest\s*(?:expense)?[^a-z]*[\$]?\s*([\d,]+)',
        ],
        "depreciation": [
            r'depreciation[^a-z]*[\$]?\s*([\d,]+)',
            r'line\s*14[^0-9]*[\$]?\s*([\d,]+)',
        ],
        "total_deductions": [
            r'total\s*deductions.*?[\$]?\s*([\d,]+)',
            r'line\s*20[^0-9]*[\$]?\s*([\d,]+)',
        ],
        "net_income": [
            r'(?:ordinary|net|taxable)\s*(?:business\s*)?income.*?[\$]?\s*([\d,]+)',
            r'line\s*(?:21|22|30|31)[^0-9]*[\$]?\s*([\d,]+)',
        ],
        "total_assets": [
            r'total\s*assets.*?[\$]?\s*([\d,]+)',
        ],
        "total_liabilities": [
            r'total\s*liabilities.*?[\$]?\s*([\d,]+)',
        ],
        "cash": [
            r'(?:^|[^a-z])cash[^a-z]*[\$]?\s*([\d,]+)',
        ],
        "accounts_receivable": [
            r'(?:accounts|trade)\s*receivable.*?[\$]?\s*([\d,]+)',
        ],
        "inventory": [
            r'inventor(?:y|ies).*?[\$]?\s*([\d,]+)',
        ],
        "retained_earnings": [
            r'retained\s*earnings.*?[\$]?\s*([\d,]+)',
        ],
        "section_179": [
            r'section\s*179.*?[\$]?\s*([\d,]+)',
            r'179\s*(?:deduction|expense).*?[\$]?\s*([\d,]+)',
        ],
        "distributions": [
            r'distributions?.*?[\$]?\s*([\d,]+)',
        ],
        "guaranteed_payments": [
            r'guaranteed\s*payments.*?[\$]?\s*([\d,]+)',
        ],
        "loans_to_shareholders": [
            r'loans?\s*to\s*(?:shareholders?|members?).*?[\$]?\s*([\d,]+)',
        ],
    }

    lower_text = text.lower()

    for field, field_patterns in patterns.items():
        for pattern in field_patterns:
            match = re.search(pattern, lower_text)
            if match:
                try:
                    value_str = match.group(1).replace(',', '').replace('$', '').strip()
                    value = int(float(value_str))
                    if value > 0:
                        amounts[field] = value
                        break
                except (ValueError, IndexError):
                    continue

    return amounts


def extract_amounts_from_table(table_data: dict) -> dict:
    """Extract amounts from a parsed table."""
    amounts = {}
    rows = table_data.get("rows", [])

    # Field name mappings (lowercase patterns -> field names)
    field_mappings = {
        "gross receipts": "gross_receipts",
        "total sales": "gross_receipts",
        "total revenue": "gross_receipts",
        "cost of goods": "cogs",
        "gross profit": "gross_profit",
        "officer comp": "officer_compensation",
        "compensation of officer": "officer_compensation",
        "salaries": "salaries_wages",
        "wages": "salaries_wages",
        "rent": "rents",
        "interest": "interest_expense",
        "depreciation": "depreciation",
        "total deduction": "total_deductions",
        "net income": "net_income",
        "ordinary income": "net_income",
        "taxable income": "taxable_income",
        "total assets": "total_assets",
        "total liabilities": "total_liabilities",
        "cash": "cash",
        "receivable": "accounts_receivable",
        "inventory": "inventory",
        "retained earnings": "retained_earnings",
        "section 179": "section_179",
        "distribution": "distributions",
        "guaranteed payment": "guaranteed_payments",
    }

    for row in rows:
        if not row or len(row) < 2:
            continue

        # Get the label (first non-empty cell)
        label = None
        for cell in row:
            if cell and str(cell).strip():
                label = str(cell).lower().strip()
                break

        if not label:
            continue

        # Check if this row matches any field
        matched_field = None
        for pattern, field in field_mappings.items():
            if pattern in label:
                matched_field = field
                break

        if not matched_field:
            continue

        # Find numeric value in this row (usually last non-empty cell)
        for cell in reversed(row):
            if cell:
                cell_str = str(cell).replace(',', '').replace('$', '').replace('(', '-').replace(')', '').strip()
                try:
                    value = int(float(cell_str))
                    if value != 0:
                        amounts[matched_field] = abs(value)
                        break
                except ValueError:
                    continue

    return amounts


# For local testing
@app.local_entrypoint()
def main():
    """Test the extraction with a sample PDF."""
    print("PDF Extraction Service ready!")
    print("Deploy with: modal deploy extract_pdf.py")
    print("Test endpoint will be available at the URL shown after deployment.")
