"""Test OCR extraction directly"""
from pathlib import Path
from app.services.ocr import extract_text_from_receipt, parse_receipt_lines, suggest_total_line

# Get the receipt file path
backend_dir = Path(__file__).parent
file_path = backend_dir / 'uploads' / 'receipts' / '25176973-a64f-4181-887f-f6737b8b1f4b_Image_1.jpg'

print(f"Testing OCR on: {file_path}")
print(f"File exists: {file_path.exists()}")
print("=" * 80)

if file_path.exists():
    try:
        # Extract text
        raw_text = extract_text_from_receipt(str(file_path))
        print("RAW TEXT:")
        print(raw_text)
        print("=" * 80)
        
        # Parse lines
        lines = parse_receipt_lines(raw_text)
        print(f"\nPARSED LINES ({len(lines)} lines):")
        for i, line in enumerate(lines):
            print(f"{i}: {line}")
        print("=" * 80)
        
        # Suggest total
        total_idx = suggest_total_line(lines)
        print(f"\nSUGGESTED TOTAL LINE: {total_idx}")
        if total_idx is not None:
            print(f"Total line text: {lines[total_idx]}")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
else:
    print("FILE NOT FOUND!")
