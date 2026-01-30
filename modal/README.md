# Modal PDF Extraction Service

This is the backend extraction service that processes tax returns and financial statements. It runs on [Modal](https://modal.com) - a serverless platform for Python.

## Why Modal?

- **Nearly free**: ~$0.001 per PDF (vs $3-15 with Claude Vision)
- **No server management**: Modal handles scaling automatically
- **Fast**: Optimized Python image with all dependencies pre-installed

## Prerequisites

1. A Modal account (free tier available)
2. Python 3.8+ installed on your computer
3. A terminal/command prompt

---

## Step-by-Step Deployment Instructions

### Step 1: Create a Modal Account

1. Go to [modal.com](https://modal.com)
2. Click "Sign Up" (you can use GitHub or Google)
3. Verify your email if required

### Step 2: Install Modal CLI

Open your terminal (Command Prompt on Windows, Terminal on Mac) and run:

```bash
pip install modal
```

If you get a permission error, try:
```bash
pip install --user modal
```

### Step 3: Authenticate Modal

Run this command and follow the prompts:

```bash
modal token new
```

This will:
1. Open your browser
2. Ask you to log in to Modal
3. Generate an authentication token
4. Save it to your computer

You should see: `Token saved to ~/.modal.toml`

### Step 4: Navigate to the Modal Directory

```bash
cd C:\Users\bened\Documents\business-valuation-app\modal
```

Or on Mac/Linux:
```bash
cd ~/Documents/business-valuation-app/modal
```

### Step 5: Deploy the Service

Run this command:

```bash
modal deploy extract_pdf.py
```

You'll see output like:
```
✓ Created mount /root/extract_pdf.py
✓ Created function extract_pdf
✓ Created web endpoint for extract_pdf
  → https://YOUR-USERNAME--pdf-extraction-service-extract-pdf.modal.run
```

**IMPORTANT**: Copy that URL! You'll need it for the next step.

### Step 6: Update Your Environment Variables

Open `.env.local` in your business-valuation-app folder and update:

```bash
MODAL_EXTRACTION_URL=https://YOUR-USERNAME--pdf-extraction-service-extract-pdf.modal.run
FEATURE_MODAL_EXTRACTION=true
FEATURE_CLAUDE_VISION_FALLBACK=false
```

Replace `YOUR-USERNAME` with your actual Modal username (shown in the URL from step 5).

### Step 7: Restart Your Development Server

```bash
npm run dev
```

---

## Testing the Deployment

### Option 1: Test via Modal Dashboard

1. Go to [modal.com/apps](https://modal.com/apps)
2. Click on "pdf-extraction-service"
3. Click on "extract_pdf"
4. You'll see logs when the service is called

### Option 2: Test via curl

```bash
curl -X POST https://YOUR-USERNAME--pdf-extraction-service-extract-pdf.modal.run \
  -H "Content-Type: application/json" \
  -d '{"pdf_base64": "JVBERi0xLjQK...", "document_id": "test", "filename": "test.pdf"}'
```

### Option 3: Test via the App

1. Start your app: `npm run dev`
2. Create a new valuation report
3. Upload a tax return PDF
4. Check the browser console and Modal dashboard for logs

---

## Troubleshooting

### "modal: command not found"

Your pip installation didn't add modal to PATH. Try:
```bash
python -m modal deploy extract_pdf.py
```

### "Authentication required"

Run `modal token new` again to re-authenticate.

### "Timeout" errors

The first request after deployment may be slow (cold start). Subsequent requests are fast.

### "MODAL_EXTRACTION_URL environment variable not set"

Make sure your `.env.local` file has the correct URL and restart your dev server.

### Extraction fails with "scanned document" error

The service detected a scanned PDF. Options:
1. Upload a native (digital) PDF instead
2. Set `FEATURE_CLAUDE_VISION_FALLBACK=true` to use Claude for scanned docs (costs $3-15)

---

## Monitoring Costs

1. Go to [modal.com/usage](https://modal.com/usage)
2. You'll see compute time and costs
3. Free tier includes generous credits (~$30/month)

Typical cost per extraction: **$0.0005 - $0.002** (yes, fractions of a penny!)

---

## Updating the Service

If you make changes to `extract_pdf.py`, just run:

```bash
modal deploy extract_pdf.py
```

The URL stays the same - no need to update environment variables.

---

## How It Works

1. **PyMuPDF**: Fast, high-quality text extraction from native PDFs
2. **pdfplumber**: Precise table extraction (critical for financial statements)
3. **pytesseract**: OCR fallback for scanned documents
4. **Pattern matching**: Extracts financial data from Form 1120, 1120-S, 1065, Schedule C

The service returns structured JSON that maps directly to the app's `FinalExtractionOutput` type.
