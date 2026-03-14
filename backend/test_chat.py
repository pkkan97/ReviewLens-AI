#!/usr/bin/env python3
"""
Test the chat endpoint with mock responses
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from main import app, sessions
from pydantic import BaseModel

# Create a test session with sample reviews
test_session_id = "test-session-123"
sessions[test_session_id] = {
    "id": test_session_id,
    "reviews": [
        {"rating": 5, "text": "Excellent product, highly recommend!"},
        {"rating": 4, "text": "Good quality but a bit expensive"},
        {"rating": 2, "text": "Poor customer service, disappointed"},
        {"rating": 5, "text": "Amazing value for money"},
        {"rating": 3, "text": "Average product, nothing special"}
    ],
    "platform": "test",
    "created_at": "2024-01-01T00:00:00"
}

class ChatMessage(BaseModel):
    message: str
    session_id: str

# Test the chat function
async def test_chat():
    from main import chat

    # Test with valid session
    request = ChatMessage(message="What is the overall sentiment?", session_id=test_session_id)
    response = await chat(request)

    print("✓ Chat endpoint test successful")
    print(f"Response: {response.response[:200]}...")
    print(f"Confidence: {response.confidence}")
    print(f"Scope compliant: {response.is_scope_compliant}")

    # Test with invalid session
    request2 = ChatMessage(message="What is the weather?", session_id="invalid-session")
    response2 = await chat(request2)

    print("\n✓ Invalid session test successful")
    print(f"Response: {response2.response[:100]}...")
    print(f"Confidence: {response2.confidence}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_chat())