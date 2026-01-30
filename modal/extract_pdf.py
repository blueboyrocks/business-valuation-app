"""
PDF Extraction Service for Business Valuation App

This Modal service extracts structured financial data from tax returns
(Form 1120, 1120-S, 1065, Schedule C), financial statements, balance sheets,
and state tax returns (Virginia Form 500).

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
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass
from io import BytesIO


# ============================================================================
# Document Classification System
# ============================================================================

@dataclass
class ClassificationResult:
    """Result of document classification."""
    document_type: str
    entity_type: Optional[str]
    tax_year: Optional[int]
    jurisdiction: str
    confidence_score: float
    classification_reasons: List[str]


class DocumentClassifier:
    """
    Classifies documents based on text content and structure.
    Returns document_type, entity_type, tax_year, confidence_score.
    """

    # Document type signatures with patterns and required fields
    DOCUMENT_SIGNATURES = {
        "form_1120s": {
            "patterns": [
                r"form\s*1120[-\s]?s",
                r"u\.?s\.?\s*income\s*tax\s*return.*s\s*corporation",
                r"1120s",
                r"income\s*tax\s*return.*small\s*business\s*corporation",
            ],
            "required_fields": ["compensation of officers", "ordinary business income"],
            "entity_type": "S-Corporation",
            "jurisdiction": "Federal",
            "weight": 1.0,
        },
        "form_1120": {
            "patterns": [
                r"form\s*1120(?![-\s]?s)",
                r"u\.?s\.?\s*corporation\s*income\s*tax\s*return",
            ],
            "required_fields": ["taxable income", "total tax"],
            "entity_type": "C-Corporation",
            "jurisdiction": "Federal",
            "weight": 1.0,
        },
        "form_1065": {
            "patterns": [
                r"form\s*1065",
                r"u\.?s\.?\s*return\s*of\s*partnership\s*income",
            ],
            "required_fields": ["guaranteed payments", "ordinary business income"],
            "entity_type": "Partnership",
            "jurisdiction": "Federal",
            "weight": 1.0,
        },
        "schedule_c": {
            "patterns": [
                r"schedule\s*c",
                r"profit\s*or\s*loss\s*from\s*business",
            ],
            "required_fields": ["net profit", "gross receipts"],
            "entity_type": "Sole Proprietorship",
            "jurisdiction": "Federal",
            "weight": 1.0,
        },
        "va_form_500": {
            "patterns": [
                r"virginia.*form\s*500",
                r"virginia\s*corporation\s*income\s*tax",
                r"department\s*of\s*taxation.*virginia",
                r"va\s*form\s*500",
                # Sub-forms that are part of VA Form 500 filing
                r"schedule\s*500adj",
                r"schedule\s*500fed",
                r"schedule\s*500a\b",
                r"schedule\s*500ab",
            ],
            "required_fields": ["federal taxable income", "virginia taxable income"],
            "entity_type": "Corporation",
            "jurisdiction": "VA",
            "weight": 0.9,
        },
        "balance_sheet": {
            "patterns": [
                r"balance\s*sheet",
                r"statement\s*of\s*financial\s*position",
            ],
            "required_fields": [],  # Structural signals used instead
            "structural_signals": ["assets", "liabilities", "equity"],
            "entity_type": None,  # Determined from other docs
            "jurisdiction": "N/A",
            "weight": 0.8,
        },
        "income_statement": {
            "patterns": [
                r"profit\s*(?:and|&)\s*loss",
                r"income\s*statement",
                r"statement\s*of\s*(?:operations|income)",
            ],
            "required_fields": ["revenue", "net income"],
            "entity_type": None,
            "jurisdiction": "N/A",
            "weight": 0.7,
        },
    }

    # QuickBooks/accounting software date formats
    BALANCE_DATE_PATTERNS = [
        r"as\s*of\s*(\w+\s+\d{1,2},?\s*\d{4})",
        r"as\s*of\s*(\d{1,2}/\d{1,2}/\d{4})",
        r"as\s*of\s*(\d{4}-\d{2}-\d{2})",
        r"date:\s*(\w+\s+\d{1,2},?\s*\d{4})",
        r"through\s*(\w+\s+\d{1,2},?\s*\d{4})",
    ]

    def __init__(self, text: str, filename: str, tables: List[Dict[str, Any]]):
        self.text = text
        self.lower_text = text.lower()
        self.filename = filename.lower()
        self.tables = tables

    def classify(self) -> ClassificationResult:
        """
        Classify document and return classification result.
        """
        scores: Dict[str, Tuple[float, List[str]]] = {}

        for doc_type, signature in self.DOCUMENT_SIGNATURES.items():
            score, reasons = self._calculate_score(doc_type, signature)
            scores[doc_type] = (score, reasons)

        # Find best match
        best_type = max(scores.keys(), key=lambda k: scores[k][0])
        best_score, best_reasons = scores[best_type]

        # If score is too low, classify as Other
        if best_score < 0.3:
            return ClassificationResult(
                document_type="other",
                entity_type="Other",
                tax_year=self._extract_year(),
                jurisdiction="Unknown",
                confidence_score=best_score,
                classification_reasons=["No strong document type match found"]
            )

        signature = self.DOCUMENT_SIGNATURES[best_type]

        # Extract year based on document type
        if best_type == "balance_sheet":
            tax_year = self._extract_balance_date_year()
        else:
            tax_year = self._extract_year()

        return ClassificationResult(
            document_type=best_type,
            entity_type=signature.get("entity_type"),
            tax_year=tax_year,
            jurisdiction=signature.get("jurisdiction", "Unknown"),
            confidence_score=min(best_score, 1.0),
            classification_reasons=best_reasons
        )

    def _calculate_score(self, doc_type: str, signature: Dict[str, Any]) -> Tuple[float, List[str]]:
        """Calculate classification score for a document type."""
        score = 0.0
        reasons = []

        # Check patterns (weight: 0.4)
        patterns = signature.get("patterns", [])
        pattern_matches = 0
        for pattern in patterns:
            if re.search(pattern, self.lower_text):
                pattern_matches += 1
                reasons.append(f"Matched pattern: {pattern[:30]}...")

        if patterns:
            score += 0.4 * (pattern_matches / len(patterns))

        # Check filename hints (weight: 0.2)
        filename_hints = {
            "form_1120s": ["1120s", "1120-s"],
            "form_1120": ["1120"],
            "form_1065": ["1065"],
            "schedule_c": ["schedule-c", "schedulec", "sched_c"],
            "va_form_500": ["va_form", "form_500", "virginia"],
            "balance_sheet": ["balance", "balancesheet"],
            "income_statement": ["p&l", "profit_loss", "income_stmt"],
        }

        for hint in filename_hints.get(doc_type, []):
            if hint in self.filename:
                score += 0.2
                reasons.append(f"Filename contains: {hint}")
                break

        # Check required fields (weight: 0.2)
        required_fields = signature.get("required_fields", [])
        fields_found = 0
        for field in required_fields:
            if field.lower() in self.lower_text:
                fields_found += 1
                reasons.append(f"Found required field: {field}")

        if required_fields:
            score += 0.2 * (fields_found / len(required_fields))

        # Check structural signals for balance sheets (weight: 0.2)
        structural_signals = signature.get("structural_signals", [])
        if structural_signals:
            signals_found = 0
            for signal in structural_signals:
                # Look for section headers (usually in caps or followed by colon)
                if re.search(rf'\b{signal}\b', self.lower_text, re.IGNORECASE):
                    signals_found += 1
                    reasons.append(f"Found structural signal: {signal.upper()}")

            if signals_found >= 2:  # Need at least ASSETS and LIABILITIES
                score += 0.3  # Higher weight for structural signals
            elif signals_found == 1:
                score += 0.1

        # Apply document type weight
        score *= signature.get("weight", 1.0)

        return score, reasons

    def _extract_balance_date_year(self) -> Optional[int]:
        """Extract year from balance sheet date (As of December 31, 2023)."""
        for pattern in self.BALANCE_DATE_PATTERNS:
            match = re.search(pattern, self.lower_text, re.IGNORECASE)
            if match:
                date_str = match.group(1)
                # Extract year from various formats
                year_match = re.search(r'(\d{4})', date_str)
                if year_match:
                    year = int(year_match.group(1))
                    if 2015 <= year <= 2030:
                        return year

        # Fallback to generic year extraction
        return self._extract_year()

    def _extract_year(self) -> Optional[int]:
        """Extract tax year from document text."""
        patterns = [
            r'tax\s*year\s*(?:beginning|ending)?\s*(\d{4})',
            r'for\s*(?:calendar\s*)?year\s*(\d{4})',
            r'(\d{4})\s*(?:form|return)',
            r'december\s*31,?\s*(\d{4})',
            r'(\d{4})\s*u\.?s\.?\s*(?:income\s*)?tax',
        ]

        for pattern in patterns:
            match = re.search(pattern, self.lower_text)
            if match:
                year = int(match.group(1))
                if 2015 <= year <= 2030:
                    return year

        return None

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
        "fastapi[standard]",
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
    Handles Form 1120, 1120-S, 1065, Schedule C, Balance Sheets, Virginia Form 500.
    """
    # Use DocumentClassifier for robust document type detection
    classifier = DocumentClassifier(text, filename, tables)
    classification = classifier.classify()

    # Map internal document types to display names
    DOC_TYPE_DISPLAY = {
        "form_1120s": "Form 1120-S",
        "form_1120": "Form 1120",
        "form_1065": "Form 1065",
        "schedule_c": "Schedule C",
        "va_form_500": "Virginia Form 500",
        "balance_sheet": "Balance Sheet",
        "income_statement": "Income Statement",
        "other": "Other",
    }

    ENTITY_TYPE_DISPLAY = {
        "S-Corporation": "S-Corporation",
        "C-Corporation": "C-Corporation",
        "Partnership": "Partnership",
        "Sole Proprietorship": "Sole Proprietorship",
        "Corporation": "Corporation",
        None: "Other",
        "Other": "Other",
    }

    doc_type = DOC_TYPE_DISPLAY.get(classification.document_type, "Other")
    entity_type = ENTITY_TYPE_DISPLAY.get(classification.entity_type, "Other")
    tax_year = classification.tax_year or extract_tax_year(text)

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
        # Classification metadata for downstream systems
        "classification": {
            "document_type_internal": classification.document_type,
            "jurisdiction": classification.jurisdiction,
            "confidence_score": classification.confidence_score,
            "classification_reasons": classification.classification_reasons,
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
