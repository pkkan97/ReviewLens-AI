# LLM Setup Guide for ReviewLens AI

This guide explains how to set up Large Language Model (LLM) functionality for analyzing customer reviews.

## 🚀 Quick Start (Recommended)

### 1. Get OpenAI API Key (Most Reliable)
```bash
# Visit: https://platform.openai.com/api-keys
# 1. Create account (get $5 free credits)
# 2. Go to API Keys section
# 3. Create new secret key
# 4. Copy the key (starts with 'sk-')
```

### 2. Configure Environment
```bash
# Edit backend/.env file:
OPENAI_API_KEY=sk-your-actual-key-here
```

### 3. Test
```bash
cd backend
source venv/bin/activate
python test_llm.py
```

## Supported LLM Providers

### 1. OpenAI (Recommended - Most Reliable)

**Free Tier:** $5 free credits for new users
**Setup:**
1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Get your API key from the dashboard
3. Add to `backend/.env`:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

**Pros:** Most reliable, excellent performance, GPT-3.5-turbo is very capable
**Cons:** Requires API key setup

### 2. Anthropic Claude (Alternative)

**Free Tier:** $5 free credits for new users
**Setup:**
1. Sign up at [Anthropic Console](https://console.anthropic.com/)
2. Get your API key
3. Add to `backend/.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   ```

**Pros:** Excellent reasoning capabilities
**Cons:** May have compatibility issues with older package versions

## Current Status

The system now includes:
- ✅ **Fallback logic**: Tries OpenAI first, then Anthropic, then mock response
- ✅ **Error handling**: Clear error messages and logging
- ✅ **Mock responses**: Basic analysis when no API keys are configured
- ✅ **Session management**: Reviews stored per user session

## Testing LLM Functionality

### "proxies" Error with Anthropic

If you get `__init__() got an unexpected keyword argument 'proxies'`, this is due to:
- Environment variables setting proxy configuration
- Older Anthropic library version

**Solutions:**
1. **Use OpenAI instead** (recommended)
2. **Check environment variables:**
   ```bash
   unset HTTP_PROXY
   unset HTTPS_PROXY
   unset http_proxy
   unset https_proxy
   ```
3. **Upgrade Anthropic library** (if network allows):
   ```bash
   pip install --upgrade anthropic
   ```

### API Key Issues

- Ensure your API key is correct and has credits
- Check that the key is properly set in `.env` file
- Make sure there are no extra spaces or quotes

### Testing LLM Functionality

Run the test script:
```bash
cd backend
source venv/bin/activate
python test_llm.py
```

## How It Works

The system:
1. **Validates** questions are review-related
2. **Retrieves** reviews from user session
3. **Creates** a comprehensive prompt with up to 20 reviews
4. **Calls** the configured LLM (OpenAI preferred, Claude fallback)
5. **Returns** AI-generated analysis with confidence score

## Example Usage

After setting up reviews via scraping or CSV upload, you can ask:
- "What are the main complaints?"
- "What's the overall sentiment?"
- "What features do customers love most?"
- "Are there any recurring issues?"

The AI will provide specific, evidence-based analysis based on the actual review data.