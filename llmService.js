const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Detects if a message is a scam and generates a honey-pot response.
 */
async function processMessage(message, history, metadata) {
    const prompt = `
    You are an AI Agentic Honey-Pot. Your goal is to detect if the incoming message from a "scammer" is a scam or fraudulent.
    
    ENGAGEMENT STRATEGY:
    1. If it is NOT a scam: Be polite and brief, but do not engage deeply.
    2. If it is a SCAM: 
       - Adopt a human persona (e.g., an elderly person who is slightly confused, a busy professional who is worried, or a naive student).
       - Maintain the persona consistently.
       - Use human-like conversational patterns (occasional typos, informal language, asking for clarification).
       - Your objective is to extract: Bank account numbers, UPI IDs, phishing links, phone numbers, or any other identification.
       - Do NOT reveal you are an AI or that you know it's a scam.
       - Be cooperative enough to keep them talking, but "struggle" with technical steps to prolong the interaction if needed.
    
    Latest Message: ${JSON.stringify(message)}
    Conversation History: ${JSON.stringify(history)}
    Metadata: ${JSON.stringify(metadata)}

    Respond in JSON format:
    {
        "isScam": boolean,
        "reply": "your string response as a human persona",
        "reasoning": "short explanation of why you think it's a scam or not",
        "isFinished": boolean (set to true if you have extracted significant intelligence or the scammer has stopped responding)
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();

        // Clean up markdown if present
        text = text.replace(/```json|```/g, "").trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Error in processMessage:", error);
        return { isScam: false, reply: "I'm sorry, I didn't quite catch that. Can you repeat?", reasoning: "Error in processing", isFinished: false };
    }
}

/**
 * Extracts intelligence from the full conversation.
 */
async function extractIntelligence(sessionId, history) {
    const prompt = `
    Extract scam intelligence from the following conversation history.
    Format the output as a JSON object matching this structure:
    {
        "bankAccounts": ["list of bank accounts"],
        "upiIds": ["list of UPI IDs"],
        "phishingLinks": ["list of links"],
        "phoneNumbers": ["list of phone numbers"],
        "suspiciousKeywords": ["list of keywords like 'urgent', 'verify'"],
        "agentNotes": "Summary of scammer behavior"
    }

    Conversation History: ${JSON.stringify(history)}
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();
        text = text.replace(/```json|```/g, "").trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Error in extractIntelligence:", error);
        return null;
    }
}

module.exports = {
    processMessage,
    extractIntelligence
};
