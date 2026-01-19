# Tesseract OCR Installation Guide

## ⚠️ IMPORTANT: System Installation Required

The Python packages are installed, but **Tesseract OCR must be installed as a system program**.

## Windows Installation (Your System)

### Option 1: Using Chocolatey (Recommended)
If you have Chocolatey package manager:
```powershell
choco install tesseract
```

### Option 2: Manual Installation
1. Download the installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Run the `.exe` installer
3. **Important**: During installation, note the installation path (usually `C:\Program Files\Tesseract-OCR`)
4. Add to PATH or configure pytesseract

### Option 3: Using Scoop
If you have Scoop:
```powershell
scoop install tesseract
```

## After Installation: Configure pytesseract

If Tesseract is not in your PATH, add this to `backend/config.py`:

```python
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

## Verify Installation

Run in PowerShell:
```powershell
tesseract --version
```

Should show version info like:
```
tesseract 5.3.0
```

## Test OCR Extraction

Once installed, test with:
```python
python -c "import pytesseract; print(pytesseract.get_tesseract_version())"
```

---

## Quick Install Command (Chocolatey - Easiest)

```powershell
choco install tesseract -y
```

Then restart your terminal and verify:
```powershell
tesseract --version
```

---

## If Installation Fails

**Workaround**: Use online OCR APIs for testing:
- OCR.space (free tier: 25,000 requests/month)
- Google Vision API (free tier: 1,000 requests/month)

We can implement these as fallback options if Tesseract installation is problematic.
