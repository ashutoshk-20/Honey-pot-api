const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Detects if a message is a scam and generates a honey-pot response.
 */
async function processMessage(message, history, metadata) {
    const prompt = `
    You are an AI Honey-Pot. A scammer just sent: "${message.text}"
    Previous turns: ${JSON.stringify(history.slice(-3))}

    1. If SCAM: Respond as a believable human (e.g. confused, worried, or technical struggle). Keep it under 2 sentences.
    2. Extract info if possible.
    3. If NOT SCAM: Be brief and polite.

    Respond ONLY in this JSON format:
    {
        "isScam": boolean,
        "reply": "string",
        "isFinished": boolean
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, "").trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("LLM Error:", error.message);
        return { isScam: true, reply: "I'm not sure I understand, can you say that again?", isFinished: false };
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
