#!/usr/bin/env python3
"""
Test script for LLM functionality
"""

import os
import sys
sys.path.append(os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

# Test OpenAI integration
try:
    import openai
    print("✓ OpenAI library imported successfully")

    # Test API key
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key and api_key != "your_openai_api_key_here":
        print("✓ OpenAI API key found")
        openai.api_key = api_key

        # Test a simple API call
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Hello, test message"}],
                max_tokens=50
            )
            print("✓ OpenAI API call successful")
            print(f"Response: {response.choices[0].message.content[:100]}...")
        except Exception as e:
            print(f"✗ OpenAI API call failed: {e}")
    else:
        print("⚠ OpenAI API key not set or is placeholder")

except ImportError:
    print("✗ OpenAI library not available")

# Test Anthropic integration
try:
    from anthropic import Anthropic
    print("✓ Anthropic library imported successfully")

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if api_key and api_key != "your_anthropic_api_key_here":
        print("✓ Anthropic API key found")
        try:
            client = Anthropic(api_key=api_key)
            print("✓ Anthropic client initialized successfully")
        except Exception as e:
            print(f"✗ Anthropic client initialization failed: {e}")
    else:
        print("⚠ Anthropic API key not set or is placeholder")

except ImportError:
    print("✗ Anthropic library not available")

print("\nTest completed!")