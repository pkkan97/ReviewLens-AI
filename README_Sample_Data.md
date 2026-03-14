# ReviewLens AI - Sample Review Data

This directory contains sample CSV files with realistic review data that you can upload to test the ReviewLens AI system. These files contain real-looking reviews that are perfect for testing the AI chat analysis features.

## Available Sample Files

### `sample_reviews_software.csv`
- **Theme**: Business software/productivity tool reviews
- **Reviews**: 20 diverse reviews (2-5 star ratings)
- **Content**: Focuses on features, pricing, support, ROI, and usability
- **Use Case**: Perfect for testing business software analysis

### `sample_reviews_restaurant.csv`
- **Theme**: Restaurant/dining establishment reviews
- **Reviews**: 15 detailed reviews (2-5 star ratings)
- **Content**: Covers food quality, service, ambiance, pricing, and dining experience
- **Use Case**: Great for hospitality industry analysis

### `sample_reviews_education.csv`
- **Theme**: Online learning platform/course reviews
- **Reviews**: 15 comprehensive reviews (2-5 star ratings)
- **Content**: Focuses on course quality, instructor expertise, platform features, and learning outcomes
- **Use Case**: Ideal for educational platform analysis

### `sample_reviews_fitness.csv`
- **Theme**: Fitness tracker/smartwatch reviews
- **Reviews**: 15 detailed reviews (2-5 star ratings)
- **Content**: Covers health monitoring, battery life, accuracy, design, and features
- **Use Case**: Perfect for wearable technology analysis

## How to Use

1. **Start the backend server**:
   ```bash
   cd backend
   ./venv/bin/python3 main.py
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm install  # if not already done
   npm run dev
   ```

3. **Upload a CSV file**:
   - Open the web interface
   - Click "Or Upload CSV"
   - Select one of the sample files above
   - Click "Upload"

4. **Start analyzing**:
   - Click "✨ Start Q&A Analysis"
   - Ask questions like:
     - "What are the main strengths of this product?"
     - "What are common complaints?"
     - "What's the overall sentiment?"
     - "What features do customers love most?"

## CSV Format

All files follow this format:
```csv
rating,text,date,title
5,"Review text here",2026-03-10,"Review Title"
```

**Columns**:
- `rating`: 1-5 star rating (integer)
- `text`: Full review text (string)
- `date`: Review date in YYYY-MM-DD format (optional)
- `title`: Review title/summary (optional)

## Real Scraping APIs (Future Enhancement)

If you want to implement real scraping that doesn't get blocked, consider these approaches:

### 1. **Official APIs** (Recommended)
- **Google Places API**: For business reviews
- **Yelp Fusion API**: For restaurant reviews
- **Trustpilot API**: For business reviews
- **App Store/Google Play APIs**: For app reviews

### 2. **Data Providers**
- **SimilarWeb API**: For review aggregation
- **BrightLocal API**: For local business reviews
- **ReviewTrackers API**: For multi-platform review management

### 3. **Headless Browsers with Proxies**
- Use Selenium/Playwright with residential proxies
- Rotate user agents and IP addresses
- Implement rate limiting and delays

## Creating Your Own Sample Data

To create custom review data:

1. Use the existing CSV format
2. Include diverse ratings (1-5 stars)
3. Write realistic, detailed reviews
4. Include both positive and negative feedback
5. Add dates and titles for authenticity

## Testing the AI Analysis

Once uploaded, try these analysis questions:

**General Analysis**:
- "What's the overall sentiment?"
- "What are the most common themes?"
- "How has customer satisfaction changed over time?"

**Specific Insights**:
- "What features do customers love most?"
- "What are the biggest complaints?"
- "What improvements would customers suggest?"
- "How does this compare to competitors?"

**Business Intelligence**:
- "What pricing concerns do customers have?"
- "How reliable is the product/service?"
- "What customer service experiences are mentioned?"

The AI will provide structured, markdown-formatted responses with actionable insights based on the review data!
