# OpenAI Vision OCR Setup

## ✅ What I Just Added

Your app now uses **GPT-4 Vision** for receipt OCR instead of Tesseract!

## 🔑 Setup Instructions

### 1. Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)

### 2. Add Your API Key

Create a file called `.env` in the `backend` folder with this content:

```bash
OPENAI_API_KEY=sk-your-actual-key-here
SECRET_KEY=dev-secret-key-change-in-production
DATABASE_PATH=database.db
JWT_EXPIRATION_HOURS=24
FLASK_DEBUG=True
```

Replace `sk-your-actual-key-here` with your actual OpenAI API key.

### 3. Restart Your Backend Server

```powershell
cd backend
python run.py
```

## 💰 Costs

- **GPT-4 Vision**: ~$0.01 per receipt image
- Most personal use will stay under $1/month
- First time users usually get $5 free credit

## 🎯 How It Works

1. User uploads a receipt
2. Clicks "Extract Text & Itemize"
3. Receipt image is sent to GPT-4 Vision
4. AI extracts items, amounts, and total
5. Returns structured JSON data
6. Falls back to Tesseract if OpenAI fails (or if no API key)

## ✨ Benefits Over Tesseract

- ✅ Handles crumpled receipts
- ✅ Works with any angle/lighting
- ✅ Returns structured data (not just text)
- ✅ Extremely accurate
- ✅ No local installation needed

## 🧪 Test It

1. Start your backend server
2. Upload a receipt
3. Click "Extract Text & Itemize"
4. Watch the magic happen! 🪄
