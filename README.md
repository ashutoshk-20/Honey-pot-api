# Agentic Honey-Pot for Scam Detection & Intelligence Extraction

An AI-powered system that detects scam intent and autonomously engages scammers to extract useful intelligence without revealing detection.

## Features
- **Scam Detection**: Uses Gemini 1.5 Flash to analyze messages for fraudulent intent.
- **Autonomous Engagement**: Adopts believable human personas to keep scammers talking.
- **Intelligence Extraction**: Extracts bank accounts, UPI IDs, links, and keywords.
- **Automated Reporting**: Sends final intelligence reports to the GUVI evaluation endpoint.

## Tech Stack
- Node.js & Express
- Google Gemini AI (Generative AI SDK)
- Axios for API callbacks
- Dotenv for configuration

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   SECRET_API_KEY=YOUR_X_API_KEY_FOR_AUTHENTICATION
   GUVI_CALLBACK_URL=https://hackathon.guvi.in/api/updateHoneyPotFinalResult
   ```

3. **Run the Server**:
   ```bash
   node server.js
   ```

## API Usage

### Endpoint: `POST /message`
**Headers**:
- `x-api-key`: `YOUR_SECRET_API_KEY`
- `Content-Type`: `application/json`

**Request Body**:
```json
{
  "sessionId": "wertyu-dfghj-ertyui",
  "message": {
    "sender": "scammer",
    "text": "Your bank account will be blocked today. Verify immediately.",
    "timestamp": 1770005528731
  },
  "conversationHistory": [],
  "metadata": {
    "channel": "SMS",
    "language": "English",
    "locale": "IN"
  }
}
```

**Response**:
```json
{
  "status": "success",
  "reply": "Why is my account being suspended?"
}
```

## How it works
1. **Detection**: Every incoming message is analyzed by Gemini to check for scam intent.
2. **Engagement**: If a scam is detected, the AI generates a response using a human-like persona.
3. **Session Management**: The system tracks the conversation. Once the AI determines it has enough information or the conversation ends, it triggers the intelligence extraction.
4. **Final Callback**: The system compiles the extracted data and sends it to the GUVI callback endpoint.

## Deployment Recommendations
To make this API public for evaluation, you can deploy it to platforms like:
- **Render**: Free tier available, easy GitHub integration.
- **Railway**: Great for Node.js apps.
- **Vercel**: Can be used if converted to Serverless Functions (though standard Express works on Render/Railway better).
- **ngrok**: For local testing and temporary public access.
  ```bash
  ngrok http 3000
  ```

## Ethical Constraints
- No impersonation of real individuals.
- No illegal instructions or harassment.
- Responsible handling of data.

