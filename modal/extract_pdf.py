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


# ============================================================================
# Extraction Result Types
# ============================================================================

@dataclass
class ExtractionResult:
    """Standardized extraction result from any document type."""
    document_type: str
    tax_year: Optional[int]
    entity_type: Optional[str]
    company_info: Dict[str, Any]
    income_data: Dict[str, float]
    expense_data: Dict[str, float]
    balance_sheet_data: Dict[str, float]
    schedule_k_data: Dict[str, float]
    owner_info: Dict[str, float]
    covid_adjustments: Dict[str, float]
    red_flags: List[str]
    extraction_notes: List[str]
    confidence_scores: Dict[str, float]


# ============================================================================
# Base Extractor Class
# ============================================================================

class BaseExtractor:
    """Base class for all document extractors."""

    def __init__(self, text: str, tables: List[Dict[str, Any]], filename: str):
        self.text = text
        self.lower_text = text.lower()
        self.tables = tables
        self.filename = filename
        self.extraction_notes: List[str] = []
        self.red_flags: List[str] = []

    def extract(self) -> ExtractionResult:
        """Extract financial data from the document. Override in subclasses."""
        raise NotImplementedError("Subclasses must implement extract()")

    def extract_amount(self, patterns: List[str], default: float = 0.0) -> float:
        """Extract a numeric amount using multiple regex patterns."""
        for pattern in patterns:
            match = re.search(pattern, self.lower_text)
            if match:
                try:
                    value_str = match.group(1).replace(',', '').replace('$', '').strip()
                    # Handle parentheses for negative numbers
                    if '(' in value_str:
                        value_str = '-' + value_str.replace('(', '').replace(')', '')
                    return float(value_str)
                except (ValueError, IndexError):
                    continue
        return default

    def extract_from_table(self, label_pattern: str, column_index: int = -1) -> Optional[float]:
        """
        Extract a value from tables by matching row labels.

        Args:
            label_pattern: Regex pattern to match row labels
            column_index: Which column to get value from (-1 = last numeric)
        """
        for table in self.tables:
            rows = table.get("rows", [])
            for row in rows:
                if not row or len(row) < 2:
                    continue
                label = str(row[0]).lower() if row[0] else ""
                if re.search(label_pattern, label):
                    # Get numeric value from specified or last column
                    cells_to_check = [row[column_index]] if column_index >= 0 else reversed(row[1:])
                    for cell in cells_to_check:
                        if cell:
                            value = self._parse_amount(str(cell))
                            if value is not None:
                                return value
        return None

    def _parse_amount(self, value_str: str) -> Optional[float]:
        """Parse a string into a float, handling currency formatting."""
        try:
            # Remove currency symbols and whitespace
            cleaned = value_str.replace('$', '').replace(',', '').strip()
            # Handle parentheses for negative numbers
            if '(' in cleaned and ')' in cleaned:
                cleaned = '-' + cleaned.replace('(', '').replace(')', '')
            if cleaned and cleaned != '-':
                return float(cleaned)
        except ValueError:
            pass
        return None

    def add_note(self, note: str):
        """Add an extraction note for transparency."""
        self.extraction_notes.append(note)

    def add_red_flag(self, flag: str):
        """Add a red flag for valuation review."""
        self.red_flags.append(flag)


# ============================================================================
# Balance Sheet Extractor
# ============================================================================

class BalanceSheetExtractor(BaseExtractor):
    """
    Extracts financial data from standalone balance sheets.

    Handles QuickBooks, Xero, and generic accounting formats.
    Key challenge: Hierarchical structure (Current Assets > Bank Accounts > specific accounts)
    """

    def extract(self) -> ExtractionResult:
        """Extract balance sheet data."""
        # Detect balance sheet date (As of December 31, 2023)
        balance_date = self._extract_balance_date()
        tax_year = balance_date.year if balance_date else self._infer_year()

        # Extract hierarchical structure
        assets = self._extract_assets_section()
        liabilities = self._extract_liabilities_section()
        equity = self._extract_equity_section()

        # Extract company name
        company_info = self._extract_company_name()

        return ExtractionResult(
            document_type="balance_sheet",
            tax_year=tax_year,
            entity_type=None,  # Balance sheets don't specify entity type
            company_info=company_info,
            income_data={},  # Balance sheets don't have income data
            expense_data={},
            balance_sheet_data={
                "total_assets": assets.get("total", 0),
                "cash": assets.get("cash", 0),
                "accounts_receivable": assets.get("accounts_receivable", 0),
                "inventory": assets.get("inventory", 0),
                "fixed_assets": assets.get("fixed_assets", 0),
                "fixed_assets_gross": assets.get("fixed_assets_gross", 0),
                "accumulated_depreciation": assets.get("accumulated_depreciation", 0),
                "net_fixed_assets": assets.get("net_fixed_assets", 0),
                "other_assets": assets.get("other_assets", 0),
                "total_liabilities": liabilities.get("total", 0),
                "accounts_payable": liabilities.get("accounts_payable", 0),
                "current_liabilities": liabilities.get("current", 0),
                "long_term_debt": liabilities.get("long_term", 0),
                "total_equity": equity.get("total", 0),
                "retained_earnings": equity.get("retained_earnings", 0),
                # COVID-specific loans
                "eidl_loan": liabilities.get("eidl_loan", 0),
                "ppp_loan": liabilities.get("ppp_loan", 0),
            },
            schedule_k_data={},
            owner_info={
                "loans_to_shareholders": assets.get("loans_to_shareholders", 0),
                "loans_from_shareholders": liabilities.get("loans_from_shareholders", 0),
                "shareholder_distributions": equity.get("distributions", 0),
            },
            covid_adjustments={
                "eidl_loan_balance": liabilities.get("eidl_loan", 0),
                "ppp_loan_balance": liabilities.get("ppp_loan", 0),
            },
            red_flags=self.red_flags,
            extraction_notes=self.extraction_notes,
            confidence_scores={"overall": 0.85}
        )

    def _extract_balance_date(self) -> Optional[datetime]:
        """Extract the 'As of' date from balance sheet."""
        patterns = [
            r'as\s*of\s*(\w+\s+\d{1,2},?\s*\d{4})',
            r'as\s*of\s*(\d{1,2}/\d{1,2}/\d{4})',
            r'as\s*of\s*(\d{4}-\d{2}-\d{2})',
            r'date:\s*(\w+\s+\d{1,2},?\s*\d{4})',
            r'through\s*(\w+\s+\d{1,2},?\s*\d{4})',
        ]

        for pattern in patterns:
            match = re.search(pattern, self.lower_text, re.IGNORECASE)
            if match:
                date_str = match.group(1)
                try:
                    # Try various date formats
                    for fmt in ['%B %d, %Y', '%B %d %Y', '%m/%d/%Y', '%Y-%m-%d']:
                        try:
                            return datetime.strptime(date_str, fmt)
                        except ValueError:
                            continue
                except Exception:
                    pass
        return None

    def _infer_year(self) -> Optional[int]:
        """Infer year from document if date extraction fails."""
        year_match = re.search(r'20\d{2}', self.text)
        if year_match:
            year = int(year_match.group())
            if 2015 <= year <= 2030:
                return year
        return datetime.now().year

    def _extract_company_name(self) -> Dict[str, Any]:
        """Extract company name from balance sheet header."""
        # Common patterns for company name in balance sheet headers
        patterns = [
            r'^([A-Z][A-Za-z\s&,\.]+(?:Inc|LLC|Corp|Co|LP|LLP|Company))[^\n]*\n.*balance\s*sheet',
            r'([A-Z][A-Za-z\s&,\.]+(?:Inc|LLC|Corp|Co|LP|LLP|Company))\s*\n',
            r'^([^\n]+)\s*\n\s*balance\s*sheet',
        ]

        for pattern in patterns:
            match = re.search(pattern, self.text, re.IGNORECASE | re.MULTILINE)
            if match:
                name = match.group(1).strip()
                if len(name) > 2 and len(name) < 100:
                    return {"business_name": name}

        return {"business_name": "Unknown Business"}

    def _extract_assets_section(self) -> Dict[str, float]:
        """
        Parse the ASSETS section with hierarchy awareness.

        Example structure:
        ASSETS
          Current Assets
            Bank Accounts
              101 Cash - MVB          183,369.81
              102 Cash - M&T          233,306.12
            Total Bank Accounts       $420,316.25
          Fixed Assets
            Furniture                   2,208.29
            Equipment                   1,717.78
          Total Fixed Assets          $17,487.11
        TOTAL ASSETS                 $501,867.12
        """
        assets: Dict[str, float] = {}

        # Strategy 1: Look for "TOTAL ASSETS" line
        total_patterns = [
            r'total\s*assets[:\s]*\$?([\d,]+\.?\d*)',
            r'total\s*assets\s*[\$]?\s*([\d,]+\.?\d*)',
        ]
        for pattern in total_patterns:
            match = re.search(pattern, self.lower_text)
            if match:
                assets["total"] = self._parse_amount(match.group(1)) or 0
                break

        # Strategy 2: Parse tables for asset line items
        asset_patterns = {
            "cash": [r'cash', r'checking', r'savings', r'bank\s*accounts'],
            "accounts_receivable": [r'accounts?\s*receivable', r'trade\s*receivable', r'a/r'],
            "inventory": [r'inventor(?:y|ies)'],
            "prepaid": [r'prepaid'],
            "fixed_assets_gross": [r'fixed\s*assets', r'property.*equipment', r'furniture', r'vehicles', r'equipment', r'automobiles'],
            "accumulated_depreciation": [r'accumulated\s*depreciation', r'accum.*depr', r'less.*depreciation'],
            "other_assets": [r'other\s*assets', r'other\s*current\s*assets'],
            "loans_to_shareholders": [r'(?:loan|due)\s*(?:to|from)\s*(?:shareholder|owner|member)', r'shareholder\s*loan'],
        }

        for field, patterns in asset_patterns.items():
            for pattern in patterns:
                value = self.extract_from_table(pattern)
                if value is not None:
                    # Accumulated depreciation should be negative
                    if field == "accumulated_depreciation" and value > 0:
                        value = -value
                    assets[field] = value
                    break

        # Calculate net fixed assets if we have gross and depreciation
        if assets.get("fixed_assets_gross") and assets.get("accumulated_depreciation"):
            assets["net_fixed_assets"] = assets["fixed_assets_gross"] + assets["accumulated_depreciation"]
            assets["fixed_assets"] = assets["net_fixed_assets"]
        elif assets.get("fixed_assets_gross"):
            assets["fixed_assets"] = assets["fixed_assets_gross"]

        # Check for red flags
        if assets.get("loans_to_shareholders", 0) > 0:
            self.add_red_flag(f"Loans to shareholders: ${assets['loans_to_shareholders']:,.0f}")

        return assets

    def _extract_liabilities_section(self) -> Dict[str, float]:
        """Parse the LIABILITIES section."""
        liabilities: Dict[str, float] = {}

        # Total liabilities
        total_patterns = [
            r'total\s*liabilities[:\s]*\$?([\d,]+\.?\d*)',
            r'total\s*liabilities\s*[\$]?\s*([\d,]+\.?\d*)',
        ]
        for pattern in total_patterns:
            match = re.search(pattern, self.lower_text)
            if match:
                liabilities["total"] = self._parse_amount(match.group(1)) or 0
                break

        # Liability line items
        liability_patterns = {
            "accounts_payable": [r'accounts?\s*payable', r'a/p', r'trade\s*payable'],
            "current": [r'total\s*current\s*liabilities', r'current\s*liabilities'],
            "long_term": [r'long[-\s]*term.*(?:debt|liabilities)', r'notes?\s*payable'],
            "loans_from_shareholders": [r'loan.*(?:payable|from).*(?:shareholder|owner|member)', r'due\s*to\s*shareholder'],
        }

        for field, patterns in liability_patterns.items():
            for pattern in patterns:
                value = self.extract_from_table(pattern)
                if value is not None:
                    liabilities[field] = value
                    break

        # COVID loans - critical for valuation
        eidl_patterns = [
            r'eidl.*?loan[:\s]*\$?([\d,]+\.?\d*)',
            r'eidl[-\s]+([\d,]+\.?\d*)',
            r'economic\s*injury.*?loan[:\s]*\$?([\d,]+\.?\d*)',
        ]
        for pattern in eidl_patterns:
            match = re.search(pattern, self.lower_text, re.IGNORECASE)
            if match:
                liabilities["eidl_loan"] = self._parse_amount(match.group(1)) or 0
                self.add_note(f"EIDL Loan detected: ${liabilities['eidl_loan']:,.0f}")
                break

        # Also check tables for EIDL
        if not liabilities.get("eidl_loan"):
            eidl_value = self.extract_from_table(r'eidl')
            if eidl_value:
                liabilities["eidl_loan"] = eidl_value
                self.add_note(f"EIDL Loan detected: ${eidl_value:,.0f}")

        ppp_patterns = [
            r'ppp.*?loan[:\s]*\$?([\d,]+\.?\d*)',
            r'ppp[-\s]+([\d,]+\.?\d*)',
            r'paycheck\s*protection.*?loan[:\s]*\$?([\d,]+\.?\d*)',
        ]
        for pattern in ppp_patterns:
            match = re.search(pattern, self.lower_text, re.IGNORECASE)
            if match:
                liabilities["ppp_loan"] = self._parse_amount(match.group(1)) or 0
                self.add_note(f"PPP Loan detected: ${liabilities['ppp_loan']:,.0f}")
                break

        # Also check tables for PPP
        if not liabilities.get("ppp_loan"):
            ppp_value = self.extract_from_table(r'ppp')
            if ppp_value:
                liabilities["ppp_loan"] = ppp_value
                self.add_note(f"PPP Loan detected: ${ppp_value:,.0f}")

        return liabilities

    def _extract_equity_section(self) -> Dict[str, float]:
        """Parse the EQUITY section."""
        equity: Dict[str, float] = {}

        # Total equity patterns
        total_patterns = [
            r'total\s*(?:shareholders?\s*)?equity[:\s]*\$?([\d,]+\.?\d*)',
            r'total\s*(?:owner\'?s?\s*)?equity[:\s]*\$?([\d,]+\.?\d*)',
            r'total\s*liabilities\s*(?:and|&)\s*equity[:\s]*\$?([\d,]+\.?\d*)',
        ]
        for pattern in total_patterns:
            match = re.search(pattern, self.lower_text)
            if match:
                equity["total"] = self._parse_amount(match.group(1)) or 0
                break

        # Retained earnings (can be negative)
        re_patterns = [
            r'retained\s*earnings[:\s]*-?\$?([\d,]+\.?\d*)',
            r'retained\s*earnings[:\s]*\(([\d,]+\.?\d*)\)',
        ]
        for pattern in re_patterns:
            match = re.search(pattern, self.lower_text)
            if match:
                value = self._parse_amount(match.group(1)) or 0
                # Check if it was in parentheses (negative)
                if '(' in pattern:
                    value = -value
                equity["retained_earnings"] = value
                break

        # Also try table extraction for retained earnings
        if not equity.get("retained_earnings"):
            re_value = self.extract_from_table(r'retained\s*earnings')
            if re_value is not None:
                equity["retained_earnings"] = re_value

        # Distributions (negative equity item, often shown as negative)
        dist_patterns = [
            r'(?:shareholder\s*)?distributions?[:\s]*-?\$?([\d,]+\.?\d*)',
            r'distributions?[:\s]*\(([\d,]+\.?\d*)\)',
        ]
        for pattern in dist_patterns:
            match = re.search(pattern, self.lower_text)
            if match:
                value = self._parse_amount(match.group(1)) or 0
                # Distributions are typically shown negative
                if value > 0:
                    value = -value
                equity["distributions"] = abs(value)  # Store as positive for flagging
                break

        # Check for negative retained earnings (red flag)
        if equity.get("retained_earnings", 0) < 0:
            self.add_red_flag(f"Negative retained earnings: ${equity['retained_earnings']:,.0f}")

        # Check for large distributions relative to common sense
        if equity.get("distributions", 0) > 100000:
            self.add_note(f"Large shareholder distributions: ${equity['distributions']:,.0f}")

        return equity


# ============================================================================
# Virginia Form 500 Extractor
# ============================================================================

class VirginiaForm500Extractor(BaseExtractor):
    """
    Extracts data from Virginia Corporation Income Tax Return (Form 500).

    Key fields:
    - Federal taxable income (from enclosed federal return)
    - Virginia additions/subtractions
    - Virginia taxable income
    - Apportionment percentage (for multi-state)

    NOTE: Virginia state returns SUPPLEMENT federal returns.
    They show state-specific adjustments but the core income data
    comes from the federal return.
    """

    def extract(self) -> ExtractionResult:
        """Extract Virginia Form 500 data."""
        # Extract tax year
        tax_year = self._extract_tax_year()

        # Extract company info
        company_info = self._extract_company_info()

        # Extract income data from Page 2
        income_data = self._extract_income_data()

        # Extract Schedule 500FED data
        schedule_500fed = self._extract_schedule_500fed()

        # Extract Schedule 500A apportionment
        apportionment = self._extract_apportionment()

        # Combine expense data
        expense_data = {
            "depreciation": schedule_500fed.get("depreciation", 0),
        }

        # Add notes for transparency
        if apportionment.get("multi_factor_percentage", 0) < 100:
            self.add_note(f"Multi-state apportionment: {apportionment.get('multi_factor_percentage', 0):.2f}% to Virginia")

        return ExtractionResult(
            document_type="va_form_500",
            tax_year=tax_year,
            entity_type="Corporation",
            company_info=company_info,
            income_data={
                "federal_taxable_income": income_data.get("federal_taxable_income", 0),
                "virginia_additions": income_data.get("virginia_additions", 0),
                "virginia_subtractions": income_data.get("virginia_subtractions", 0),
                "virginia_taxable_income": income_data.get("virginia_taxable_income", 0),
                "net_operating_loss_deduction": income_data.get("net_operating_loss", 0),
                # Schedule 500FED data
                "federal_taxable_income_before_nol": schedule_500fed.get("federal_taxable_income_before_nol", 0),
                # Apportionment data
                "apportionment_percentage": apportionment.get("multi_factor_percentage", 100),
            },
            expense_data=expense_data,
            balance_sheet_data={},  # State returns don't have balance sheets
            schedule_k_data={},
            owner_info={},
            covid_adjustments={},
            red_flags=self.red_flags,
            extraction_notes=self.extraction_notes,
            confidence_scores={"overall": 0.80}
        )

    def _extract_tax_year(self) -> Optional[int]:
        """Extract tax year from VA Form 500 header."""
        patterns = [
            r'(\d{4})\s*virginia',
            r'tax\s*year\s*(\d{4})',
            r'for\s*(?:taxable\s*)?year\s*(\d{4})',
            r'virginia.*?(\d{4})\s*form\s*500',
        ]

        for pattern in patterns:
            match = re.search(pattern, self.lower_text)
            if match:
                year = int(match.group(1))
                if 2015 <= year <= 2030:
                    return year

        return None

    def _extract_company_info(self) -> Dict[str, Any]:
        """Extract company info from VA Form 500 header."""
        # FEIN
        fein_match = re.search(r'fein[:\s]*(\d{2}[-\s]?\d{7})', self.lower_text)

        # Company name - look for patterns common in VA Form 500
        name_patterns = [
            r'name\s*of\s*corporation[:\s]*([^\n]+)',
            r'corporation\s*name[:\s]*([^\n]+)',
            r'^([A-Z][A-Za-z\s&,\.]+(?:Inc|LLC|Corp|Co|LP|LLP))',
        ]

        business_name = None
        for pattern in name_patterns:
            match = re.search(pattern, self.text, re.IGNORECASE | re.MULTILINE)
            if match:
                name = match.group(1).strip()
                if len(name) > 2 and len(name) < 100:
                    business_name = name
                    break

        # NAICS code
        naics_match = re.search(r'naics\s*(?:code)?[:\s]*(\d{6})', self.lower_text)

        return {
            "business_name": business_name or "Unknown Business",
            "ein": fein_match.group(1) if fein_match else None,
            "naics_code": naics_match.group(1) if naics_match else None,
            "state": "VA",
            "entity_type": "Corporation",
        }

    def _extract_income_data(self) -> Dict[str, float]:
        """Extract income data from Page 2 of VA Form 500."""
        income_data: Dict[str, float] = {}

        # Federal taxable income (Line 1)
        federal_patterns = [
            r'federal\s*taxable\s*income.*?[\$]?\s*([\d,]+)',
            r'line\s*1[.\s]*[\$]?\s*([\d,]+)',
            r'taxable\s*income\s*from\s*federal\s*return.*?[\$]?\s*([\d,]+)',
        ]
        income_data["federal_taxable_income"] = self.extract_amount(federal_patterns)

        # Virginia additions (Line 2)
        additions_patterns = [
            r'total\s*additions.*?[\$]?\s*([\d,]+)',
            r'line\s*2[.\s]*.*?additions.*?[\$]?\s*([\d,]+)',
            r'schedule\s*500adj.*?additions.*?[\$]?\s*([\d,]+)',
        ]
        income_data["virginia_additions"] = self.extract_amount(additions_patterns)

        # Virginia subtractions (Line 4)
        subtractions_patterns = [
            r'total\s*subtractions.*?[\$]?\s*([\d,]+)',
            r'line\s*4[.\s]*.*?subtractions.*?[\$]?\s*([\d,]+)',
        ]
        income_data["virginia_subtractions"] = self.extract_amount(subtractions_patterns)

        # Virginia taxable income (Line 7)
        va_taxable_patterns = [
            r'virginia\s*taxable\s*income.*?[\$]?\s*([\d,]+)',
            r'line\s*7[.\s]*[\$]?\s*([\d,]+)',
            r'taxable\s*income\s*apportioned.*?[\$]?\s*([\d,]+)',
        ]
        income_data["virginia_taxable_income"] = self.extract_amount(va_taxable_patterns)

        # Net operating loss deduction
        nol_patterns = [
            r'net\s*operating\s*loss.*?deduction.*?[\$]?\s*([\d,]+)',
            r'nol\s*deduction.*?[\$]?\s*([\d,]+)',
        ]
        income_data["net_operating_loss"] = self.extract_amount(nol_patterns)

        return income_data

    def _extract_schedule_500fed(self) -> Dict[str, float]:
        """Extract data from Schedule 500FED (Federal Line Items)."""
        data: Dict[str, float] = {}

        # Federal taxable income before NOL
        before_nol_patterns = [
            r'federal\s*taxable\s*income\s*before\s*nol.*?[\$]?\s*([\d,]+)',
            r'taxable\s*income\s*before\s*nol.*?[\$]?\s*([\d,]+)',
        ]
        data["federal_taxable_income_before_nol"] = self.extract_amount(before_nol_patterns)

        # Depreciation (Line 11 - Other depreciation)
        depreciation_patterns = [
            r'other\s*depreciation.*?[\$]?\s*([\d,]+)',
            r'line\s*11[.\s]*[\$]?\s*([\d,]+)',
            r'depreciation.*?[\$]?\s*([\d,]+)',
        ]
        data["depreciation"] = self.extract_amount(depreciation_patterns)

        # Add note if Schedule 500FED data found
        if data.get("federal_taxable_income_before_nol") or data.get("depreciation"):
            self.add_note("Schedule 500FED data extracted")

        return data

    def _extract_apportionment(self) -> Dict[str, float]:
        """Extract apportionment data from Schedule 500A."""
        data: Dict[str, float] = {}

        # Property factor
        property_patterns = [
            r'property\s*factor.*?([\d.]+)\s*%',
        ]
        data["property_factor"] = self.extract_amount(property_patterns)

        # Payroll factor
        payroll_patterns = [
            r'payroll\s*factor.*?([\d.]+)\s*%',
        ]
        data["payroll_factor"] = self.extract_amount(payroll_patterns)

        # Sales factor
        sales_patterns = [
            r'sales\s*factor.*?([\d.]+)\s*%',
        ]
        data["sales_factor"] = self.extract_amount(sales_patterns)

        # Multi-factor percentage (double-weighted sales)
        multi_factor_patterns = [
            r'multi[-\s]*factor.*?percentage.*?([\d.]+)\s*%',
            r'apportionment.*?percentage.*?([\d.]+)\s*%',
            r'virginia.*?percentage.*?([\d.]+)\s*%',
        ]
        data["multi_factor_percentage"] = self.extract_amount(multi_factor_patterns, default=100.0)

        # If multi-factor is 0, default to 100 (single-state)
        if data["multi_factor_percentage"] == 0:
            data["multi_factor_percentage"] = 100.0

        return data


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
            # Current / End of Year values
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
            # Schedule L - Beginning of Year (BOY)
            "boy_total_assets": amounts.get("boy_total_assets", 0),
            "boy_total_liabilities": amounts.get("boy_total_liabilities", 0),
            "boy_cash": amounts.get("boy_cash", 0),
            "boy_accounts_receivable": amounts.get("boy_accounts_receivable", 0),
            "boy_inventory": amounts.get("boy_inventory", 0),
            # Schedule L - End of Year (EOY)
            "eoy_total_assets": amounts.get("eoy_total_assets", amounts.get("total_assets", 0)),
            "eoy_total_liabilities": amounts.get("eoy_total_liabilities", amounts.get("total_liabilities", 0)),
            "eoy_cash": amounts.get("eoy_cash", amounts.get("cash", 0)),
            "eoy_accounts_receivable": amounts.get("eoy_accounts_receivable", amounts.get("accounts_receivable", 0)),
            "eoy_inventory": amounts.get("eoy_inventory", amounts.get("inventory", 0)),
            "eoy_retained_earnings": amounts.get("eoy_retained_earnings", amounts.get("retained_earnings", 0)),
        },
        "schedule_k": {
            "section_179_deduction": amounts.get("section_179", 0),
            "charitable_contributions": amounts.get("charitable", 0),
            "capital_gains": (amounts.get("capital_gains_short", 0) + amounts.get("capital_gains_long", 0)),
            "capital_gains_short": amounts.get("capital_gains_short", 0),
            "capital_gains_long": amounts.get("capital_gains_long", 0),
            "total_distributions": amounts.get("distributions", 0),
            "distributions_cash": amounts.get("distributions", 0),
            "distributions_property": amounts.get("distributions_property", 0),
        },
        "owner_info": {
            "owner_compensation": amounts.get("officer_compensation", 0),
            "guaranteed_payments": amounts.get("guaranteed_payments", 0),
            "distributions": amounts.get("distributions", 0),
            "loans_to_shareholders": amounts.get("loans_to_shareholders", 0),
            "loans_from_shareholders": amounts.get("loans_from_shareholders", 0),
        },
        "covid_adjustments": {
            "ppp_loan_forgiveness": amounts.get("ppp_forgiveness", 0),
            "eidl_advances": amounts.get("eidl_advance", 0),
            "employee_retention_credit": amounts.get("erc_credit", 0),
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
            # Schedule K Line 11/12a
            r'line\s*(?:11|12a?).*?179.*?[\$]?\s*([\d,]+)',
        ],
        "capital_gains_short": [
            # Schedule K Line 7 - Short-term capital gain
            r'short[-\s]*term\s*capital\s*gain.*?[\$]?\s*([\d,]+)',
            r'line\s*7[^0-9].*?capital.*?[\$]?\s*([\d,]+)',
        ],
        "capital_gains_long": [
            # Schedule K Line 8a - Long-term capital gain
            r'long[-\s]*term\s*capital\s*gain.*?[\$]?\s*([\d,]+)',
            r'line\s*8a?[^0-9].*?capital.*?[\$]?\s*([\d,]+)',
        ],
        "distributions": [
            r'distributions?.*?[\$]?\s*([\d,]+)',
            # Schedule K Line 16a - Cash distributions
            r'line\s*16a?[^0-9].*?cash.*?[\$]?\s*([\d,]+)',
        ],
        "distributions_property": [
            # Schedule K Line 16b - Property distributions
            r'line\s*16b[^0-9].*?property.*?[\$]?\s*([\d,]+)',
            r'property\s*distributions?.*?[\$]?\s*([\d,]+)',
        ],
        "guaranteed_payments": [
            r'guaranteed\s*payments.*?[\$]?\s*([\d,]+)',
        ],
        "loans_to_shareholders": [
            r'loans?\s*to\s*(?:shareholders?|members?).*?[\$]?\s*([\d,]+)',
        ],
        # Schedule L (Balance Sheet) - Beginning of Year
        "boy_total_assets": [
            r'(?:beginning|boy)\s*.*?total\s*assets.*?[\$]?\s*([\d,]+)',
        ],
        "boy_total_liabilities": [
            r'(?:beginning|boy)\s*.*?total\s*liabilities.*?[\$]?\s*([\d,]+)',
        ],
        # Schedule L (Balance Sheet) - End of Year
        "eoy_total_assets": [
            r'(?:end|eoy)\s*.*?total\s*assets.*?[\$]?\s*([\d,]+)',
        ],
        "eoy_total_liabilities": [
            r'(?:end|eoy)\s*.*?total\s*liabilities.*?[\$]?\s*([\d,]+)',
        ],
        # COVID-specific patterns
        "ppp_forgiveness": [
            r'ppp.*?forgiveness.*?[\$]?\s*([\d,]+)',
            r'paycheck\s*protection.*?forgiveness.*?[\$]?\s*([\d,]+)',
        ],
        "eidl_advance": [
            r'eidl.*?(?:advance|grant).*?[\$]?\s*([\d,]+)',
            r'economic\s*injury.*?(?:advance|grant).*?[\$]?\s*([\d,]+)',
        ],
        "erc_credit": [
            r'employee\s*retention\s*credit.*?[\$]?\s*([\d,]+)',
            r'erc.*?[\$]?\s*([\d,]+)',
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
