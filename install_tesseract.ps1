# Tesseract OCR Installation Script for Windows
# Run this in PowerShell as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Tesseract OCR Installation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  WARNING: Not running as Administrator" -ForegroundColor Yellow
    Write-Host "   Some installation methods require admin privileges" -ForegroundColor Yellow
    Write-Host ""
}

# Check if Tesseract is already installed
Write-Host "Checking for existing Tesseract installation..." -ForegroundColor Green

try {
    $tesseractVersion = & tesseract --version 2>&1
    Write-Host "✅ Tesseract is already installed!" -ForegroundColor Green
    Write-Host $tesseractVersion[0] -ForegroundColor White
    Write-Host ""
    Write-Host "You're all set! The itemization feature should work now." -ForegroundColor Green
    Write-Host "Test it by running: python -c `"import pytesseract; print(pytesseract.get_tesseract_version())`"" -ForegroundColor Cyan
    exit 0
}
catch {
    Write-Host "❌ Tesseract not found in PATH" -ForegroundColor Red
    Write-Host ""
}

# Check for package managers
Write-Host "Detecting available package managers..." -ForegroundColor Green
$hasChoco = Get-Command choco -ErrorAction SilentlyContinue
$hasScoop = Get-Command scoop -ErrorAction SilentlyContinue
$hasWinget = Get-Command winget -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installation Options:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$optionNumber = 1
$options = @()

if ($hasChoco) {
    Write-Host "[$optionNumber] Install via Chocolatey (Recommended)" -ForegroundColor White
    $options += @{ Number = $optionNumber; Name = "Chocolatey"; Command = "choco install tesseract -y" }
    $optionNumber++
}

if ($hasScoop) {
    Write-Host "[$optionNumber] Install via Scoop" -ForegroundColor White
    $options += @{ Number = $optionNumber; Name = "Scoop"; Command = "scoop install tesseract" }
    $optionNumber++
}

if ($hasWinget) {
    Write-Host "[$optionNumber] Install via Winget" -ForegroundColor White
    $options += @{ Number = $optionNumber; Name = "Winget"; Command = "winget install -e --id UB-Mannheim.TesseractOCR" }
    $optionNumber++
}

Write-Host "[$optionNumber] Download installer manually" -ForegroundColor White
$options += @{ Number = $optionNumber; Name = "Manual"; Command = "manual" }
$optionNumber++

Write-Host "[0] Cancel" -ForegroundColor Yellow
Write-Host ""

# Get user choice
$choice = Read-Host "Select an option"

if ($choice -eq "0") {
    Write-Host "Installation cancelled." -ForegroundColor Yellow
    exit 0
}

$selectedOption = $options | Where-Object { $_.Number -eq [int]$choice }

if ($selectedOption) {
    if ($selectedOption.Name -eq "Manual") {
        Write-Host ""
        Write-Host "Opening browser to download page..." -ForegroundColor Cyan
        Start-Process "https://github.com/UB-Mannheim/tesseract/wiki"
        Write-Host ""
        Write-Host "Manual Installation Steps:" -ForegroundColor Yellow
        Write-Host "1. Download the Windows installer (.exe)" -ForegroundColor White
        Write-Host "2. Run the installer" -ForegroundColor White
        Write-Host "3. Note the installation path (usually C:\Program Files\Tesseract-OCR)" -ForegroundColor White
        Write-Host "4. The installer should add Tesseract to your PATH automatically" -ForegroundColor White
        Write-Host "5. Restart your terminal/PowerShell window" -ForegroundColor White
        Write-Host "6. Run: tesseract --version" -ForegroundColor White
        Write-Host ""
        Write-Host "If Tesseract is not in PATH after installation:" -ForegroundColor Yellow
        Write-Host "Add this to backend/config.py:" -ForegroundColor White
        Write-Host "  import pytesseract" -ForegroundColor Cyan
        Write-Host "  pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'" -ForegroundColor Cyan
        exit 0
    }
    else {
        Write-Host ""
        Write-Host "Installing Tesseract via $($selectedOption.Name)..." -ForegroundColor Cyan
        Write-Host "Command: $($selectedOption.Command)" -ForegroundColor Gray
        Write-Host ""
        
        try {
            Invoke-Expression $selectedOption.Command
            Write-Host ""
            Write-Host "✅ Installation complete!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Verifying installation..." -ForegroundColor Cyan
            
            # Refresh PATH
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            
            Start-Sleep -Seconds 2
            
            try {
                $tesseractVersion = & tesseract --version 2>&1
                Write-Host "✅ Tesseract is working!" -ForegroundColor Green
                Write-Host $tesseractVersion[0] -ForegroundColor White
                Write-Host ""
                Write-Host "🎉 You're all set! The itemization feature should work now." -ForegroundColor Green
                Write-Host ""
                Write-Host "Next Steps:" -ForegroundColor Cyan
                Write-Host "1. Restart your terminal/PowerShell" -ForegroundColor White
                Write-Host "2. Test: python -c `"import pytesseract; print(pytesseract.get_tesseract_version())`"" -ForegroundColor White
                Write-Host "3. Upload a receipt in Bened Finance" -ForegroundColor White
                Write-Host "4. Click 'Extract Text & Itemize'" -ForegroundColor White
            }
            catch {
                Write-Host "⚠️  Tesseract installed but not yet in PATH" -ForegroundColor Yellow
                Write-Host "   Please restart your terminal and try: tesseract --version" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "   If still not working, add this to backend/config.py:" -ForegroundColor Yellow
                Write-Host "   import pytesseract" -ForegroundColor Cyan
                Write-Host "   pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'" -ForegroundColor Cyan
            }
        }
        catch {
            Write-Host "❌ Installation failed!" -ForegroundColor Red
            Write-Host "Error: $_" -ForegroundColor Red
            Write-Host ""
            Write-Host "Try manual installation instead:" -ForegroundColor Yellow
            Write-Host "https://github.com/UB-Mannheim/tesseract/wiki" -ForegroundColor Cyan
        }
    }
}
else {
    Write-Host "Invalid option selected." -ForegroundColor Red
    exit 1
}
