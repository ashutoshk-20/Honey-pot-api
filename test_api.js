const axios = require('axios');

async function testScamDetection() {
    const url = 'http://localhost:3000/message';
    const apiKey = 'honey-pot-secret-2024-hackathon'; // Matches the value in .env

    const payload = {
        sessionId: "test-session-123",
        message: {
            sender: "scammer",
            text: "DEAR CUSTOMER, YOUR SBI BANK ACCOUNT IS LOCKED. PLEASE UPDATE YOUR KYC AT http://sbi-kyc-update.com TO AVOID PERMANENT BLOCK.",
            timestamp: Date.now()
        },
        conversationHistory: [],
        metadata: {
            channel: "SMS",
            language: "English",
            locale: "IN"
        }
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testScamDetection();