"""Test OCR on original high-quality image"""
from pathlib import Path
from app.services.ocr import extract_text_from_receipt, parse_receipt_lines, suggest_total_line

# Test the original image
file_path = Path(__file__).parent / 'test_receipt.jpg'

print(f"Testing OCR on original image: {file_path}")
print(f"File exists: {file_path.exists()}")
print("=" * 80)

if file_path.exists():
    try:
        raw_text = extract_text_from_receipt(str(file_path))
        print("RAW TEXT:")
        print(raw_text)
        print("=" * 80)
        
        lines = parse_receipt_lines(raw_text)
        print(f"\nPARSED LINES ({len(lines)} lines):")
        for i, line in enumerate(lines):
            print(f"{i}: {line}")
        print("=" * 80)
        
        total_idx = suggest_total_line(lines)
        print(f"\nSUGGESTED TOTAL LINE: {total_idx}")
        if total_idx is not None:
            print(f"Total line text: {lines[total_idx]}")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
