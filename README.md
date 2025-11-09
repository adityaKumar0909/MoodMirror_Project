# Twitter Sentiment Analyzer

AI-powered Chrome extension that analyzes tweets in real-time for emotional sentiment and topic classification.

## Features

- Real-time sentiment analysis (joy, anger, sadness, fear, surprise, disgust, neutral)
- Topic classification across 19 categories
- Visual tags displayed directly on tweets
- Privacy-focused (content analyzed via your local server)

## Setup Instructions

### 1. Backend Server Setup

Install dependencies:

```bash
npm install
```

Start the Node.js server:

```bash
npm start
```

The server will run on `http://localhost:3000`

### 2. Chrome Extension Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. The extension is now installed

### 3. Usage

1. Make sure the Node.js server is running (`npm start`)
2. Visit Twitter/X (https://twitter.com or https://x.com)
3. Scroll through your feed
4. Sentiment and topic tags will automatically appear below each tweet

## How It Works

- **Content Script**: Detects tweets on the page and extracts text content
- **Backend Analysis**: Sends tweet text to your local server
- **AI Models**: Uses Hugging Face models for emotion detection and topic classification
  - Emotion: `j-hartmann/emotion-english-distilroberta-base`
  - Topics: `facebook/bart-large-mnli`
- **Visual Tags**: Displays results as colored tags on each tweet

## API Endpoint

**POST** `/analyze`

Request body:
```json
{
  "text": "Your tweet text here"
}
```

Response:
```json
{
  "emotion": {
    "sentiment": "joy"
  },
  "topic": {
    "labels": ["technology", "humor", "news"]
  }
}
```

## Customization

### Add More Topics

Edit `server.js` and modify the `candidateLabels` array:

```javascript
const candidateLabels = [
  "politics", "technology", "your-custom-topic", ...
];
```

### Change Tag Styles

Edit `extension/styles.css` to customize tag colors and appearance.

## Privacy

All analysis happens locally through your own server. No data is sent to third parties except the Hugging Face API for model inference.

## Requirements

- Node.js 18+
- Chrome/Chromium browser
- Internet connection (for AI model API calls)

## Notes

- The extension works on both twitter.com and x.com
- First analysis may take a few seconds while models load
- Some tweets may not be analyzed if text extraction fails
