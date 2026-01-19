"""
OCR Service for Receipt Text Extraction
Supports OpenAI Vision API and fallback to Tesseract OCR
"""
import os
import base64
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
from pdf2image import convert_from_path
import numpy as np
from config import Config


def extract_receipt_with_openai(file_path):
    """
    Extract receipt data using OpenAI Vision API.
    Returns structured data with items, amounts, and total.
    """
    try:
        from openai import OpenAI
        
        if not Config.OPENAI_API_KEY:
            raise Exception("OpenAI API key not configured")
        
        client = OpenAI(api_key=Config.OPENAI_API_KEY)
        
        # Read and encode image
        with open(file_path, 'rb') as image_file:
            image_data = base64.b64encode(image_file.read()).decode('utf-8')
        
        # Determine image type
        ext = os.path.splitext(file_path)[1].lower()
        mime_type = 'image/jpeg'
        if ext == '.png':
            mime_type = 'image/png'
        elif ext == '.jpg' or ext == '.jpeg':
            mime_type = 'image/jpeg'
        
        # Call OpenAI Vision API
        response = client.chat.completions.create(
            model="gpt-4o",  # Latest multimodal model with vision
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """You are analyzing a receipt image. Your job is to extract EVERY SINGLE PURCHASED ITEM.

Look at the receipt carefully. Between the store header and the subtotal, there are product lines. Each line represents one purchased item with a description and price.

COUNT how many product lines you see. Your items array MUST have that exact number of entries.

Return this JSON structure:
{
  "store_name": "Store Name",
  "date": "MM/DD/YYYY",
  "items": [
    {"description": "ITEM NAME", "sku": "barcode if visible", "total_price": 0.00}
  ],
  "subtotal": 0.00,
  "taxes": [
    {"description": "TAX 1", "rate": 0.0, "amount": 0.00}
  ],
  "total": 0.00
}

Critical rules:
1. Count product lines first - if you count 18 lines, extract 18 items
2. Each product line = one item entry (even if same product appears multiple times)
3. Extract the EXACT price from each line
4. Do NOT skip lines that are hard to read - include them with your best interpretation
5. Do NOT include the SUBTOTAL, TAX, or TOTAL lines as items
6. Verify: sum of all item prices should equal the subtotal

Return only the JSON, nothing else."""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{image_data}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=3000,  # Increased for receipts with many items
            temperature=0  # Deterministic output for consistency
        )
        
        # Parse response
        import json
        result_text = response.choices[0].message.content
        # Remove markdown code blocks if present
        result_text = result_text.replace('```json', '').replace('```', '').strip()
        receipt_data = json.loads(result_text)
        
        # DON'T build lines here - let the endpoint handle it after filtering
        # Just return the raw structured data
        return {
            'lines': [],  # Will be built by endpoint after filtering
            'structured_data': receipt_data,
            'suggested_total_line': None  # Will be calculated by endpoint
        }
        
    except Exception as e:
        print(f"OpenAI Vision error: {e}")
        # Fall back to Tesseract
        return None


def deskew_image(img):
    """
    Attempt to straighten/deskew a tilted image.
    """
    try:
        # Try using OSD (Orientation and Script Detection)
        osd = pytesseract.image_to_osd(img)
        rotation = int([line for line in osd.split('\n') if 'Rotate:' in line][0].split(':')[1].strip())
        
        if rotation != 0:
            img = img.rotate(-rotation, expand=True, fillcolor='white')
    except:
        pass  # If OSD fails, continue without rotation
    
    return img


def preprocess_image(img):
    """
    Preprocess image for better OCR results.
    Enhances contrast, sharpness, and converts to grayscale.
    """
    # Auto-orient the image first
    img = ImageOps.exif_transpose(img)
    
    # Try to deskew
    img = deskew_image(img)
    
    # Convert to grayscale
    img = img.convert('L')
    
    # Enhance contrast more aggressively
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.5)
    
    # Enhance sharpness
    enhancer = ImageEnhance.Sharpness(img)
    img = enhancer.enhance(2.0)
    
    # Apply slight blur to reduce noise
    img = img.filter(ImageFilter.MedianFilter(size=3))
    
    return img


def extract_text_from_receipt(file_path):
    """
    Extract text from receipt image or PDF.
    Tries OpenAI Vision first, falls back to Tesseract.
    
    Args:
        file_path (str): Absolute path to the receipt file
        
    Returns:
        str: Extracted text from the receipt
        
    Raises:
        FileNotFoundError: If file doesn't exist
        Exception: If OCR extraction fails
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Receipt file not found: {file_path}")
    
    # Try OpenAI Vision first (much better for receipts)
    try:
        openai_result = extract_receipt_with_openai(file_path)
        if openai_result:
            # Return the full dict with structured data (not just text)
            return openai_result
    except Exception as e:
        print(f"OpenAI Vision failed, falling back to Tesseract: {e}")
    
    # Fallback to Tesseract
    try:
        ext = os.path.splitext(file_path)[1].lower()
        
        # Handle PDF files
        if ext == '.pdf':
            images = convert_from_path(file_path)
            text_parts = []
            for img in images:
                text_parts.append(pytesseract.image_to_string(img))
            extracted_text = "\n".join(text_parts)
        
        # Handle image files
        else:
            img = Image.open(file_path)
            
            # Preprocess image for better OCR
            processed_img = preprocess_image(img)
            
            # Try multiple OCR configurations
            best_text = ""
            configs = [
                r'--oem 3 --psm 3',  # Fully automatic page segmentation
                r'--oem 3 --psm 4',  # Assume single column of text
                r'--oem 3 --psm 6',  # Assume uniform block of text
                r'--oem 3 --psm 11', # Sparse text
            ]
            
            for config in configs:
                try:
                    text = pytesseract.image_to_string(processed_img, config=config)
                    if len(text.strip()) > len(best_text):
                        best_text = text.strip()
                except:
                    continue
            
            extracted_text = best_text
        
        return extracted_text.strip()
    
    except Exception as e:
        raise Exception(f"Failed to extract text from receipt: {str(e)}")


def parse_receipt_lines(raw_text):
    """
    Parse raw OCR text into structured lines.
    Filters out empty lines and cleans whitespace.
    
    Args:
        raw_text (str): Raw OCR output
        
    Returns:
        list: List of cleaned text lines
    """
    lines = raw_text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        cleaned = line.strip()
        if cleaned:  # Skip empty lines
            cleaned_lines.append(cleaned)
    
    return cleaned_lines


def suggest_total_line(lines):
    """
    Suggest which line is most likely the total based on patterns.
    Looks for keywords like "TOTAL", "SUBTOTAL", "BALANCE DUE", etc.
    
    Args:
        lines (list): List of text lines from receipt
        
    Returns:
        int or None: Index of suggested total line, or None if not found
    """
    total_keywords = ['total', 'balance due', 'amount due', 'grand total']
    
    for idx, line in enumerate(lines):
        line_lower = line.lower()
        for keyword in total_keywords:
            if keyword in line_lower:
                return idx
    
    # If no keyword found, return None (user must manually select)
    return None
