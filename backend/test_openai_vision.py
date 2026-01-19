"""Test OpenAI Vision on the receipt"""
from app.services.ocr import extract_receipt_with_openai
from pathlib import Path

# Test with your receipt
file_path = Path(__file__).parent / 'test_receipt.jpg'

print(f"Testing OpenAI Vision on: {file_path}")
print(f"File exists: {file_path.exists()}")
print("=" * 80)

if file_path.exists():
    try:
        result = extract_receipt_with_openai(str(file_path))
        
        if result:
            print("✅ SUCCESS! OpenAI Vision extracted:")
            print("\nSTRUCTURED DATA:")
            import json
            print(json.dumps(result['structured_data'], indent=2))
            
            print("\n" + "=" * 80)
            print(f"\nLINES ({len(result['lines'])} lines):")
            for i, line in enumerate(result['lines']):
                print(f"{i}: {line}")
                
            print("\n" + "=" * 80)
            print(f"\nSUGGESTED TOTAL LINE: {result['suggested_total_line']}")
        else:
            print("❌ OpenAI Vision returned None")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
else:
    print("FILE NOT FOUND!")
