const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();
const { processMessage, extractIntelligence } = require('./llmService');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const SECRET_API_KEY = process.env.SECRET_API_KEY;

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
        console.log('LLM Result:', JSON.stringify(result, null, 2));

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
            console.log(`Triggering finishSession for ${sessionId}`);
            finishSession(sessionId).catch(console.error);
        }

        // 4. Return response to the platform
        const responseBody = {
            status: "success",
            reply: result.reply
        };
        console.log('Response Body:', JSON.stringify(responseBody, null, 2));
        return res.json(responseBody);

    } catch (error) {
        console.error("Error processing message:", error);
        return res.status(500).json({ status: "error", message: "Internal server error" });
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
