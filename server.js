const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();
const { processMessage, extractIntelligence } = require('./llmService');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;
const SECRET_API_KEY = process.env.SECRET_API_KEY;

if (!process.env.GEMINI_API_KEY || !process.env.SECRET_API_KEY) {
    console.warn("WARNING: Missing essential environment variables (GEMINI_API_KEY or SECRET_API_KEY).");
}

// Simple in-memory storage for session tracking (for this hackathon)
// In production, use Redis or a Database
const sessions = {};

app.post('/message', async (req, res) => {
    const apiKey = req.headers['x-api-key'];

    if (apiKey !== SECRET_API_KEY) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const { sessionId, message, conversationHistory, metadata } = req.body;
    console.log(`[${new Date().toISOString()}] Incoming Request for session: ${sessionId}`);
    console.log('Payload:', JSON.stringify(req.body, null, 2));

    if (!sessionId || !message) {
        console.log('Error: Missing sessionId or message');
        return res.status(400).json({ status: "error", message: "Missing required fields" });
    }

    try {
        // 1. Process Message with LLM
        const result = await processMessage(message, conversationHistory || [], metadata || {});

        const botReply = result.reply || "I'm sorry, I'm a bit confused. Can you explain that again?";

        // 2. Track session state
        if (!sessions[sessionId]) {
            sessions[sessionId] = {
                scamDetected: false,
                messageCount: 0,
                fullHistory: []
            };
        }

        sessions[sessionId].messageCount = (conversationHistory ? conversationHistory.length : 0) + 1;
        sessions[sessionId].fullHistory = [...(conversationHistory || []), message];

        if (result.isScam) {
            sessions[sessionId].scamDetected = true;
        }

        // 3. Decision logic: When to send the final callback?
        if (sessions[sessionId].scamDetected && (result.isFinished || sessions[sessionId].messageCount >= 10)) {
            finishSession(sessionId).catch(err => console.error("Callback Error:", err.message));
        }

        // 4. Return response to the platform - Strictly following schema
        return res.status(200).json({
            status: "success",
            reply: botReply
        });

    } catch (error) {
        console.error("Error processing message:", error);
        return res.status(200).json({
            status: "success",
            reply: "I'm not sure I understand. Could you please clarify?"
        });
    }
});

/**
 * Finalizes the session, extracts intelligence, and sends callback to GUVI.
 */
async function finishSession(sessionId) {
    const session = sessions[sessionId];
    if (!session || session.callbackSent) return;

    session.callbackSent = true; // Avoid double sends

    try {
        console.log(`Extracting intelligence for session ${sessionId}...`);
        const intelligence = await extractIntelligence(sessionId, session.fullHistory);

        if (intelligence) {
            const payload = {
                sessionId: sessionId,
                scamDetected: session.scamDetected,
                totalMessagesExchanged: session.messageCount,
                extractedIntelligence: {
                    bankAccounts: intelligence.bankAccounts || [],
                    upiIds: intelligence.upiIds || [],
                    phishingLinks: intelligence.phishingLinks || [],
                    phoneNumbers: intelligence.phoneNumbers || [],
                    suspiciousKeywords: intelligence.suspiciousKeywords || []
                },
                agentNotes: intelligence.agentNotes || "Conversation completed."
            };

            console.log(`Sending final callback to GUVI for session ${sessionId}`);
            await axios.post(process.env.GUVI_CALLBACK_URL, payload);
            console.log(`Callback successful for ${sessionId}`);
        }
    } catch (error) {
        console.error(`Error finishing session ${sessionId}:`, error.message);
    }
}

app.listen(PORT, () => {
    console.log(`Honey-Pot API running on port ${PORT}`);
});