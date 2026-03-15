"""
ReviewLens AI - Backend Server
FastAPI application for review scraping and LLM integration
"""

from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import json
from datetime import datetime
from dotenv import load_dotenv

# Import scraper
from scraper import ReviewScraper

# Import Google Generative AI
try:
    import google.generativeai as genai
except ImportError:
    genai = None

# Logging utility
AI_TRANSCRIPTS_DIR = os.path.join(os.path.dirname(__file__), '../ai-transcripts')
os.makedirs(AI_TRANSCRIPTS_DIR, exist_ok=True)

def log_session_event(session_id: str, event: dict):
    """Append an event to the session transcript log as JSONL."""
    log_path = os.path.join(AI_TRANSCRIPTS_DIR, f'session-{session_id}.jsonl')
    event['timestamp'] = datetime.utcnow().isoformat()
    with open(log_path, 'a') as f:
        f.write(json.dumps(event) + '\n')

load_dotenv()

app = FastAPI(
    title="ReviewLens AI Backend",
    description="Review scraping and AI-powered Q&A",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for demo; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class ScrapeRequest(BaseModel):
    url: str

class ScrapeSummary(BaseModel):
    review_count: int
    average_rating: float
    date_range: Optional[str]
    platform: str
    sample_reviews: List[dict]

class ChatMessage(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    response: str
    is_scope_compliant: bool
    confidence: float

# Store for managing sessions (in-memory for demo)
sessions = {}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "reviewlens-api"}

@app.post("/api/scrape", response_model=ScrapeSummary)
async def scrape_reviews(url: str = Form(...), session_id: str = Form(...)):
    """
    Scrape reviews from the provided URL.
    Note: Amazon, Google Maps actively block scrapers.
    This endpoint returns realistic demo data for demo purposes.
    For real scraping, use CSV upload or implement Selenium/Playwright.
    """
    try:
        # Initialize session if it doesn't exist
        if session_id not in sessions:
            sessions[session_id] = {
                "id": session_id,
                "reviews": [],
                "platform": None,
                "created_at": datetime.utcnow().isoformat()
            }
        
        # Identify platform
        platform = ReviewScraper._identify_platform(url)
        
        # Try to scrape; if it fails, use demo data
        reviews, detected_platform, error = ReviewScraper.scrape_url(url)
        
        # If scraping failed and it's Amazon/Google, use realistic demo data
        if (not reviews or error) and platform in ["amazon", "google", "g2", "capterra"]:
            # Generate realistic demo reviews for the platform
            reviews = ReviewScraper.generate_demo_reviews(platform, count=15)
            platform = detected_platform or platform
        elif error:
            # If it's a real error (not a scraping platform), report it
            raise HTTPException(status_code=400, detail=f"Scraping failed: {error}. Try CSV upload instead.")
        
        # Store reviews in session
        sessions[session_id]["reviews"] = reviews
        sessions[session_id]["platform"] = platform
        
        # Generate summary from reviews
        summary_data = ReviewScraper.generate_summary(reviews)
        
        summary = ScrapeSummary(
            review_count=summary_data["review_count"],
            average_rating=summary_data["average_rating"],
            date_range=summary_data["date_range"],
            platform=platform,
            sample_reviews=summary_data["sample_reviews"]
        )
        
        # Log event
        log_session_event(session_id, {
            "event": "scrape",
            "input": {"url": url},
            "output": summary.model_dump(),
            "note": "Demo data used (real scraping blocked by platform anti-bot measures)" if (not reviews or error) else "Real data from scraper"
        })
        return summary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/upload-reviews")
async def upload_reviews(file: UploadFile = File(...), session_id: str = Form(...)):
    """
    Upload reviews via CSV file
    Expected columns: rating, text, date (optional)
    """
    try:
        # Initialize session if it doesn't exist
        if session_id not in sessions:
            sessions[session_id] = {
                "id": session_id,
                "reviews": [],
                "platform": None,
                "created_at": datetime.utcnow().isoformat()
            }
        
        # Read CSV content
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        # Parse CSV
        reviews, error = ReviewScraper.parse_csv(csv_content)
        
        if error:
            raise HTTPException(status_code=400, detail=error)
        
        # Store reviews in session
        sessions[session_id]["reviews"] = reviews
        sessions[session_id]["platform"] = "csv_upload"
        
        # Generate summary
        summary_data = ReviewScraper.generate_summary(reviews)
        
        summary = ScrapeSummary(
            review_count=summary_data["review_count"],
            average_rating=summary_data["average_rating"],
            date_range=summary_data["date_range"],
            platform="csv_upload",
            sample_reviews=summary_data["sample_reviews"]
        )
        
        # Log event
        log_session_event(session_id, {
            "event": "upload_reviews",
            "filename": file.filename,
            "output": summary.model_dump(),
        })
        
        return summary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatMessage):
    """
    Chat with the AI about scraped reviews
    Uses scope guards to prevent drift into unrelated topics
    """
    try:
        # Scope guard: check if the question is about reviews
        message_lower = request.message.lower()
        out_of_scope_keywords = [
            "weather", "stock price", "current events", "today's news", 
            "amazon product", "google", "who won", "sports", "politics",
            "tell me a joke", "write code", "sing a song"
        ]
        
        is_scope_compliant = True
        for keyword in out_of_scope_keywords:
            if keyword in message_lower:
                is_scope_compliant = False
                break
        
        if not is_scope_compliant:
            response_text = "I can only answer questions about the ingested reviews. Please ask something like 'What are the main complaints?' or 'What's the overall sentiment?'"
            confidence = 0.0
        else:
            # Check if session exists and has reviews
            if request.session_id not in sessions or not sessions[request.session_id].get("reviews"):
                response_text = "No reviews have been loaded for this session. Please scrape reviews from a URL or upload a CSV file first."
                confidence = 0.0
            elif not genai:
                response_text = "AI functionality is not available. Please install the google.generativeai package."
                confidence = 0.0
            else:
                try:
                    # Get reviews from session
                    reviews = sessions[request.session_id]["reviews"]
                    platform = sessions[request.session_id].get("platform", "unknown")
                    
                    # Create prompt for LLM
                    reviews_text = "\n".join([
                        f"Rating: {review.get('rating', 'N/A')}/5 - {review.get('text', '')}"
                        for review in reviews[:20]  # Limit to first 20 reviews for context
                    ])
                    
                    # Create prompt for Gemini with better formatting instructions
                    gemini_prompt = f"""You are an expert AI assistant analyzing customer reviews for a product/service from {platform}.

Here are the reviews to analyze:
{reviews_text}

User question: {request.message}

Please provide a well-structured, professional analysis based only on the reviews provided. Format your response with:
- Clear sections with headers
- Bullet points for key findings
- Specific examples from reviews
- Actionable insights

Keep the response concise but informative."""

                    response_text = None
                    
                    # Try Google AI Studio (Gemini) - primary LLM
                    if response_text is None and genai and os.getenv("GOOGLE_API_KEY") and os.getenv("GOOGLE_API_KEY") != "your_google_api_key_here":
                        try:
                            # Configure Google AI
                            genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
                            
                            # Try multiple Gemini models in order of preference (free tier compatible)
                            gemini_models_to_try = [
                                'gemini-2.5-flash',
                                'gemini-2.5-pro',
                                'gemini-3.1-flash',
                            ]
                            
                            # Try each model until one works
                            for model_name in gemini_models_to_try:
                                try:
                                    model = genai.GenerativeModel(model_name)
                                    response = model.generate_content(gemini_prompt)
                                    response_text = response.text
                                    print(f"✓ Used Google AI Studio ({model_name}) for response")
                                    break  # Success, exit the loop
                                except Exception as model_e:
                                    print(f"Google AI Studio {model_name} failed: {model_e}")
                                    continue  # Try next model
                            else:
                                # All models failed
                                raise Exception("All Gemini models failed")
                        except Exception as e:
                            print(f"Google AI Studio failed: {e}")
                    
                    # If still no response, provide an intelligent mock analysis
                    if response_text is None:
                        # Generate intelligent analysis based on the reviews
                        review_count = len(reviews)
                        if review_count == 0:
                            response_text = "No reviews available for analysis."
                            confidence = 0.0
                        else:
                            avg_rating = sum(r.get('rating', 0) for r in reviews) / review_count
                            
                            # Analyze sentiment
                            positive_reviews = [r for r in reviews if r.get('rating', 0) >= 4]
                            negative_reviews = [r for r in reviews if r.get('rating', 0) <= 2]
                            neutral_reviews = [r for r in reviews if 2 < r.get('rating', 0) < 4]
                            
                            # Extract common themes from review text
                            all_text = " ".join([r.get('text', '') for r in reviews if r.get('text')]).lower()
                            
                            # Simple keyword analysis
                            positive_keywords = ['great', 'excellent', 'amazing', 'love', 'best', 'good', 'perfect', 'awesome']
                            negative_keywords = ['bad', 'terrible', 'worst', 'hate', 'poor', 'awful', 'disappointed', 'broken']
                            
                            positive_count = sum(1 for word in positive_keywords if word in all_text)
                            negative_count = sum(1 for word in negative_keywords if word in all_text)
                            
                            # Generate response based on analysis
                            if avg_rating >= 4.0:
                                sentiment = "highly positive"
                            elif avg_rating >= 3.0:
                                sentiment = "generally positive"
                            elif avg_rating >= 2.0:
                                sentiment = "mixed"
                            else:
                                sentiment = "mostly negative"
                            
                            response_text = f"""## Review Analysis Summary

**Overall Sentiment**: {sentiment.title()}
**Average Rating**: {avg_rating:.1f}/5.0

### Key Statistics
- **Positive Reviews** (4-5 stars): {len(positive_reviews)}
- **Neutral Reviews** (3 stars): {len(neutral_reviews)}
- **Negative Reviews** (1-2 stars): {len(negative_reviews)}
- **Total Reviews Analyzed**: {review_count}

### Analysis
{('Strong positive feedback from customers.' if positive_count > negative_count else 'Some concerns that need attention.' if negative_count > positive_count else 'Balanced feedback with both positive and negative experiences.')}

{'Customers particularly appreciate the quality and service.' if positive_count > negative_count else 'Some customers have reported issues with reliability.' if negative_count > positive_count else 'Feedback is mixed with both positive and negative experiences.'}

*Note: This analysis is generated from review patterns. For AI-powered analysis, ensure your Google API key is configured.*"""
                            confidence = 0.7  # Higher confidence for data-driven analysis
                            print("✓ Used intelligent mock analysis (no API keys configured)")
                    
                    confidence = 0.9  # High confidence for AI-generated responses
                    
                except Exception as e:
                    response_text = f"I encountered an error analyzing the reviews: {str(e)}. Please try again."
                    confidence = 0.0
        
        response = ChatResponse(
            response=response_text,
            is_scope_compliant=is_scope_compliant,
            confidence=confidence
        )
        
        log_session_event(request.session_id, {
            "event": "chat",
            "input": request.model_dump(),
            "output": response.model_dump(),
        })
        
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
@app.get("/api/session/{session_id}/logs")
async def get_session_logs(session_id: str):
    """
    Retrieve the AI session transcript log for a session
    """
    log_path = os.path.join(AI_TRANSCRIPTS_DIR, f'session-{session_id}.jsonl')
    if not os.path.exists(log_path):
        raise HTTPException(status_code=404, detail="No logs found for this session")
    with open(log_path, 'r') as f:
        lines = f.readlines()
    # Return as JSON list
    return [json.loads(line) for line in lines]

@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """
    Retrieve session data
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return sessions[session_id]

@app.post("/api/session")
async def create_session():
    """
    Create a new analysis session
    """
    import uuid
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "id": session_id,
        "reviews": [],
        "platform": None,
        "created_at": None
    }
    return {"session_id": session_id}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
