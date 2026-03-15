# ReviewLens AI — Review Intelligence Portal

A secure, web-based portal for analyzing product reviews from multiple platforms. Ingests reviews via URL scraping or CSV upload, then enables analysts to "talk" to that data through an AI-powered Q&A interface with built-in scope guards to prevent drift into unrelated topics.

## 🎯 Features

- **Multi-Platform Ingestion**: Scrape reviews from Amazon, Google Maps, G2, Capterra, or upload via CSV
- **Scraping Summary**: View extracted reviews with metadata (rating, date, count, platform)
- **Guardrailed Q&A**: Ask questions about ingested reviews; AI declines out-of-scope queries
- **Session-Based Logging**: Every action (scrape, upload, chat) is logged to JSONL for audit trails
- **Live Logs View**: See all ingestion and chat interactions in the UI in real-time
- **No Authentication**: Direct URL access—perfect for rapid deployment and demos

## 📋 Prerequisites

- **Python 3.9+**
- **Node.js 16+** with npm
- **macOS / Linux / Windows**

No API keys required for the core demo. Logs are stored and displayed in real-time.

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt
python main.py
```


### 2. Frontend Setup (in another terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `https://reviewlens-ai-frontend-production.up.railway.app/`

### 3. Open the App

Navigate to `https://reviewlens-ai-frontend-production.up.railway.app/`

## 📖 How to Use

### 1. Ingest Reviews

**Via URL**: Enter a product URL (Amazon, G2, Google Maps, Capterra) and click "Scrape"
- BeautifulSoup attempts to extract reviews
- If scraping fails, error message suggests CSV fallback

**Via CSV**: Upload a CSV file with columns: `rating`, `text`, `date`
```
rating,text,date
5,Great product!,2024-03-10
4,Good value,2024-03-09
```

### 2. View Summary

See review count, average rating, date range, and sample reviews.

### 3. Chat with AI

Click "✨ Start Q&A Analysis" and ask questions like:
- "What are the main complaints?"
- "What do users love most?"

AI declines out-of-scope questions (weather, politics, etc.)

### 4. View Logs

Click "📋 Logs" to see the session transcript (all ingestion and chat events).

## 🏗️ Architecture

```
ReviewLens-AI/
├── backend/
│   ├── main.py           # FastAPI app + session mgmt + logging
│   ├── scraper.py        # URL scraping + CSV parsing
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── app/page.tsx      # Main React component
│   ├── package.json
│   └── node_modules/
└── ai-transcripts/       # Session logs (JSONL format)
```

### Flow

1. Frontend creates a session on mount (stores session_id)
2. User enters URL or CSV file
3. Backend scrapes/parses, generates summary, logs event
4. Frontend displays summary
5. User chats; backend logs each message
6. Frontend fetches and displays logs


## 🔐 Scope Guards

Q&A declines questions about weather, politics, sports, current events, stock prices, competitors, etc.

Response:
> "I can only answer questions about the ingested reviews. Please ask something like 'What are the main complaints?' or 'What's the overall sentiment?'"

## 📦 Dependencies

**Backend**: FastAPI, Uvicorn, BeautifulSoup4, Requests, Pydantic

**Frontend**: Next.js, React, Axios, Tailwind CSS, TypeScript

## 🔧 Configuration

Optional: Create `backend/.env` for future Claude integration
```
ANTHROPIC_API_KEY=sk-ant-...
```

## 📊 Quick Test

```bash
# Health check
curl https://reviewlens-ai-frontend-production.up.railway.app/health

# Create session
curl -X POST https://reviewlens-ai-frontend-production.up.railway.app/api/session

# Scrape (replace session_id)
curl -X POST https://reviewlens-ai-frontend-production.up.railway.app/api/scrape \
  -F 'url=https://amazon.com/dp/...' \
  -F 'session_id=<session_id>'

# View logs
cat ai-transcripts/session-<session_id>.jsonl | jq
```

## 🚢 Deployment

**Frontend (Vercel)**:
```bash
vercel deploy
```

**Backend (Render/Railway)**:
1. Create Web Service
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port 8000`

Update `NEXT_PUBLIC_API_URL` in frontend to deployed backend URL.

## 🐛 Troubleshooting

- **Backend won't start**: Activate venv, check Python 3.9+
- **Frontend won't connect**: Ensure backend on `http://localhost:8000`, check CORS
- **CSV parsing fails**: Check column names (`rating`, `text`), ensure UTF-8 encoding
- **Scraping fails**: Try CSV upload (some sites use JS rendering)

## 📄 License

MIT

---

**Built as a rapid prototype for Online Reputation Management. Zero-cost, no API keys required.**
