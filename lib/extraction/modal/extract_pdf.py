"""
PDF Extraction Service for Modal.com
PRD-H: Robust PDF Extraction Pipeline - Stage 1

This Modal serverless function extracts tables and text from PDFs using pdfplumber.
Falls back to OCR (pytesseract) for scanned documents.

Deploy with: modal deploy lib/extraction/modal/extract_pdf.py
"""

import modal
import json
import io
import time
from datetime import datetime
from typing import Any

# Create Modal app
app = modal.App("pdf-extraction-service")

# Define image with required dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        # System dependencies for PDF processing
        "poppler-utils",  # for pdf2image
        "tesseract-ocr",  # for OCR
        "tesseract-ocr-eng",  # English language data
        "libgl1-mesa-glx",  # for OpenCV (used by some PDF libs)
        "libglib2.0-0",
    )
    .pip_install(
        "pdfplumber>=0.10.0",
        "pypdf>=4.0.0",
        "pytesseract>=0.3.10",
        "pdf2image>=1.16.0",
        "Pillow>=10.0.0",
        "fastapi[standard]",  # Required for web endpoints
    )
)


def extract_tables_from_page(page: Any) -> list[dict]:
    """Extract all tables from a single page with metadata."""
    tables = []

    try:
        # Extract tables with custom settings for financial documents
        page_tables = page.extract_tables({
            "vertical_strategy": "lines",
            "horizontal_strategy": "lines",
            "snap_tolerance": 3,
            "intersection_tolerance": 15,
            "edge_min_length": 10,
        })

        for table_idx, table in enumerate(page_tables or []):
            if not table or len(table) < 2:  # Skip empty/single-row tables
                continue

            # Detect headers (first row with text in most cells)
            headers = None
            data_rows = table

            if table[0] and any(cell for cell in table[0] if cell):
                # Check if first row looks like headers (not all numeric)
                first_row_cells = [str(c).strip() if c else "" for c in table[0]]
                non_empty_cells = [c for c in first_row_cells if c]

                if non_empty_cells:
                    # If less than half are pure numbers, treat as headers
                    numeric_count = sum(1 for c in non_empty_cells if c.replace(",", "").replace(".", "").replace("-", "").replace("$", "").replace("(", "").replace(")", "").isdigit())
                    if numeric_count < len(non_empty_cells) / 2:
                        headers = first_row_cells
                        data_rows = table[1:]

            # Clean up rows
            cleaned_rows = []
            for row in data_rows:
                cleaned_row = [str(cell).strip() if cell else "" for cell in row]
                # Skip completely empty rows
                if any(cell for cell in cleaned_row):
                    cleaned_rows.append(cleaned_row)

            if cleaned_rows:
                tables.append({
                    "page_number": page.page_number,
                    "table_index": table_idx,
                    "headers": headers,
                    "rows": cleaned_rows,
                    "row_count": len(cleaned_rows),
                    "column_count": len(table[0]) if table else 0,
                })
    except Exception as e:
        print(f"Error extracting tables from page {page.page_number}: {e}")

    return tables


def extract_text_by_region(page: Any) -> dict:
    """Extract text organized by page regions."""
    try:
        width = page.width
        height = page.height

        # Define regions as bounding boxes (x0, y0, x1, y1)
        regions = {
            "header": (0, 0, width, height * 0.15),
            "body_left": (0, height * 0.15, width * 0.5, height * 0.9),
            "body_right": (width * 0.5, height * 0.15, width, height * 0.9),
            "footer": (0, height * 0.9, width, height),
        }

        result = {}
        for region_name, bbox in regions.items():
            try:
                cropped = page.within_bbox(bbox)
                result[region_name] = cropped.extract_text() or ""
            except Exception:
                result[region_name] = ""

        # Also get full page text
        result["full_text"] = page.extract_text() or ""

        return result
    except Exception as e:
        print(f"Error extracting text regions from page {page.page_number}: {e}")
        return {
            "header": "",
            "body_left": "",
            "body_right": "",
            "footer": "",
            "full_text": "",
        }


def check_if_scanned(pdf_path: str, pages_to_check: int = 3) -> tuple[bool, float]:
    """Check if PDF is primarily image-based (scanned)."""
    import pdfplumber

    total_text_length = 0
    pages_checked = 0

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages[:pages_to_check]):
                text = page.extract_text() or ""
                total_text_length += len(text.strip())
                pages_checked += 1
    except Exception:
        pass

    if pages_checked == 0:
        return True, 0.0

    avg_text_per_page = total_text_length / pages_checked

    # If average text per page is less than 100 characters, likely scanned
    is_scanned = avg_text_per_page < 100
    confidence = min(1.0, avg_text_per_page / 500)  # 0-1 scale

    return is_scanned, confidence


def ocr_pdf(pdf_path: str) -> tuple[list[dict], dict[str, dict], str]:
    """Perform OCR on a scanned PDF."""
    import pytesseract
    from pdf2image import convert_from_path
    from PIL import Image

    tables = []
    text_by_region = {}
    all_text_parts = []

    try:
        # Convert PDF pages to images
        images = convert_from_path(pdf_path, dpi=300)

        for page_num, image in enumerate(images, start=1):
            # Get full page OCR text
            page_text = pytesseract.image_to_string(image)
            all_text_parts.append(page_text)

            # Simple region extraction based on image quadrants
            width, height = image.size

            # Crop regions
            header_img = image.crop((0, 0, width, int(height * 0.15)))
            body_left_img = image.crop((0, int(height * 0.15), int(width * 0.5), int(height * 0.9)))
            body_right_img = image.crop((int(width * 0.5), int(height * 0.15), width, int(height * 0.9)))
            footer_img = image.crop((0, int(height * 0.9), width, height))

            text_by_region[f"page_{page_num}"] = {
                "header": pytesseract.image_to_string(header_img),
                "body_left": pytesseract.image_to_string(body_left_img),
                "body_right": pytesseract.image_to_string(body_right_img),
                "footer": pytesseract.image_to_string(footer_img),
                "full_text": page_text,
            }

            # Try to detect tables using pytesseract's TSV output
            try:
                tsv_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
                # Basic table detection could be added here
                # For now, we'll rely on the text extraction
            except Exception:
                pass

    except Exception as e:
        print(f"OCR error: {e}")
        return [], {}, ""

    return tables, text_by_region, "\n\n".join(all_text_parts)


def extract_with_pdfplumber(pdf_bytes: bytes) -> dict:
    """Main extraction using pdfplumber."""
    import pdfplumber
    import tempfile
    import os

    start_time = time.time()

    # Write bytes to temp file (pdfplumber works better with file paths)
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_file:
        tmp_file.write(pdf_bytes)
        tmp_path = tmp_file.name

    try:
        # Check if scanned
        is_scanned, text_confidence = check_if_scanned(tmp_path)

        if is_scanned:
            print("Document appears to be scanned, attempting OCR...")
            tables, text_by_region, raw_text = ocr_pdf(tmp_path)
            extraction_method = "ocr"

            # Get page count
            with pdfplumber.open(tmp_path) as pdf:
                page_count = len(pdf.pages)
        else:
            # Standard pdfplumber extraction
            tables = []
            text_by_region = {}
            all_text_parts = []

            with pdfplumber.open(tmp_path) as pdf:
                page_count = len(pdf.pages)

                for page in pdf.pages:
                    # Extract tables
                    page_tables = extract_tables_from_page(page)
                    tables.extend(page_tables)

                    # Extract text by region
                    page_key = f"page_{page.page_number}"
                    text_by_region[page_key] = extract_text_by_region(page)
                    all_text_parts.append(text_by_region[page_key]["full_text"])

            raw_text = "\n\n".join(all_text_parts)
            extraction_method = "pdfplumber"

        processing_time_ms = int((time.time() - start_time) * 1000)

        return {
            "success": True,
            "data": {
                "tables": tables,
                "text_by_region": text_by_region,
                "raw_text": raw_text,
                "metadata": {
                    "page_count": page_count,
                    "extraction_method": extraction_method,
                    "processing_time_ms": processing_time_ms,
                    "is_scanned": is_scanned,
                    "ocr_confidence": text_confidence if is_scanned else None,
                },
            },
        }

    except Exception as e:
        error_msg = str(e)

        # Categorize error
        if "password" in error_msg.lower() or "encrypted" in error_msg.lower():
            error_code = "ENCRYPTED_PDF"
            error_message = "PDF is password protected"
        elif "invalid" in error_msg.lower() or "corrupt" in error_msg.lower():
            error_code = "CORRUPTED_PDF"
            error_message = "PDF file is corrupted or invalid"
        else:
            error_code = "UNKNOWN_ERROR"
            error_message = error_msg

        return {
            "success": False,
            "error": {
                "code": error_code,
                "message": error_message,
            },
        }

    finally:
        # Clean up temp file
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


@app.function(image=image, timeout=120)
@modal.fastapi_endpoint(method="POST")
def extract_pdf(request: dict) -> dict:
    """
    Extract tables and text from a PDF.

    Args:
        request: ExtractionRequest with pdf_base64, document_id, filename

    Returns:
        Stage1Output JSON structure
    """
    import base64

    pdf_base64 = request.get("pdf_base64", "")
    document_id = request.get("document_id", "")
    filename = request.get("filename", "")

    if not pdf_base64:
        return {
            "success": False,
            "error": {
                "code": "MISSING_INPUT",
                "message": "pdf_base64 is required",
            },
        }

    try:
        pdf_bytes = base64.b64decode(pdf_base64)
    except Exception as e:
        return {
            "success": False,
            "error": {
                "code": "INVALID_BASE64",
                "message": f"Failed to decode base64: {str(e)}",
            },
        }

    # Run extraction
    result = extract_with_pdfplumber(pdf_bytes)

    if result["success"]:
        # Add document metadata to output
        result["data"]["document_id"] = document_id or "unknown"
        result["data"]["filename"] = filename or "unknown.pdf"
        result["data"]["extraction_timestamp"] = datetime.utcnow().isoformat() + "Z"

    return result


@app.function(image=image, timeout=120)
@modal.fastapi_endpoint(method="GET")
def health() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "pdf-extraction-service",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


# For local testing
if __name__ == "__main__":
    import sys
    import base64

    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        pdf_base64 = base64.b64encode(pdf_bytes).decode()
        result = extract_with_pdfplumber(pdf_bytes)
        print(json.dumps(result, indent=2))
    else:
        print("Usage: python extract_pdf.py <pdf_path>")
