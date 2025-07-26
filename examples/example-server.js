#!/usr/bin/env node

/**
 * FlowSim Example USSD Server
 * Simple Node.js server for testing USSD flows
 * 
 * To run:
 * 1. npm install express cors
 * 2. node example-server.js
 * 3. Use http://localhost:8080/ussd in FlowSim
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// USSD endpoint
app.post('/ussd', (req, res) => {
    const { text, sessionId, phoneNumber } = req.body;
    
    console.log(`USSD Request - Session: ${sessionId}, Phone: ${phoneNumber}, Text: ${text}`);
    
    // Parse USSD string to understand the flow
    const parts = text.replace('#', '').split('*');
    console.log('USSD parts:', parts);
    
    let response;
    
    try {
        // Enhanced USSD menu logic with proper parsing
        if (text === '*123#') {
            response = {
                response: 'CON Welcome to FlowSim Demo Bank\n1. Check Balance\n2. Transfer Money\n3. Buy Airtime\n4. Account Info',
                sessionId: sessionId
            };
        } else if (text === '*123*1#') {
            response = {
                response: 'END Your current balance is:\n\nMain Account: $1,234.56\nSavings: $5,678.90\n\nThank you for banking with us!',
                sessionId: sessionId
            };
        } else if (text === '*123*2#') {
            response = {
                response: 'CON Transfer Money\n\nEnter recipient phone number:\n(Format: +1234567890)',
                sessionId: sessionId
            };
        } else if (text === '*123*3#') {
            response = {
                response: 'CON Buy Airtime\n\nSelect amount:\n1. $5\n2. $10\n3. $20\n4. $50\n5. Custom amount',
                sessionId: sessionId
            };
        } else if (text === '*123*4#') {
            response = {
                response: 'END Account Information\n\nName: John Doe\nAccount: ****1234\nType: Checking\nStatus: Active\n\nFor support call: 1-800-BANK',
                sessionId: sessionId
            };
        } 
        // Transfer money flows
        else if (text.startsWith('*123*2*') && parts.length === 4) {
            const phoneNumber = parts[3];
            response = {
                response: `CON Transfer to ${phoneNumber}\n\nEnter amount to transfer:\n(Minimum: $1.00)`,
                sessionId: sessionId
            };
        } else if (text.startsWith('*123*2*') && parts.length === 5) {
            const amount = parts[4];
            const phoneNumber = parts[3];
            response = {
                response: `CON Confirm Transfer\n\nTo: ${phoneNumber}\nAmount: $${amount}\n\n1. Confirm\n2. Cancel`,
                sessionId: sessionId
            };
        } else if (text.startsWith('*123*2*') && text.endsWith('*1#')) {
            const transferParts = parts;
            const phoneNumber = transferParts[3];
            const amount = transferParts[4];
            response = {
                response: `END Transfer successful!\n\nTo: ${phoneNumber}\nAmount: $${amount}\nTransaction ID: TXN123456\nFee: $0.50\n\nThank you!`,
                sessionId: sessionId
            };
        } else if (text.startsWith('*123*2*') && text.endsWith('*2#')) {
            response = {
                response: 'END Transfer cancelled.\n\nThank you for using FlowSim Demo Bank!',
                sessionId: sessionId
            };
        }
        // Airtime flows
        else if (text === '*123*3*1#') {
            response = {
                response: 'END Airtime Purchase\n\n$5 airtime added to your account\n\nTransaction ID: AIR789\nNew balance: $1,229.56',
                sessionId: sessionId
            };
        } else if (text === '*123*3*2#') {
            response = {
                response: 'END Airtime Purchase\n\n$10 airtime added to your account\n\nTransaction ID: AIR790\nNew balance: $1,224.56',
                sessionId: sessionId
            };
        } else if (text === '*123*3*5#') {
            response = {
                response: 'CON Custom Airtime\n\nEnter amount ($1-$100):',
                sessionId: sessionId
            };
        } else if (text.startsWith('*123*3*5*') && parts.length === 5) {
            const amount = parts[4];
            response = {
                response: `CON Confirm Purchase\n\n$${amount} airtime\n\n1. Confirm\n2. Cancel`,
                sessionId: sessionId
            };
        } else if (text.startsWith('*123*3*5*') && text.endsWith('*1#')) {
            const amount = parts[4];
            response = {
                response: `END Airtime Purchase\n\n$${amount} airtime added to your account\n\nTransaction ID: AIR999\nNew balance: $${1234.56 - parseFloat(amount)}`,
                sessionId: sessionId
            };
        }
        // Default/fallback
        else {
            response = {
                response: 'END Thank you for using FlowSim Demo Bank!\n\nFor assistance, call 1-800-FLOWSIM\n\nSession ended.',
                sessionId: sessionId
            };
        }
    } catch (error) {
        console.error('Error processing USSD request:', error);
        response = {
            response: 'END Service temporarily unavailable.\nPlease try again later.',
            sessionId: sessionId
        };
    }
    
    console.log('USSD Response:', JSON.stringify(response, null, 2));
    res.json(response);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'FlowSim Example USSD Server',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint with instructions
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head><title>FlowSim Example USSD Server</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>FlowSim Example USSD Server</h1>
            <p><strong>Status:</strong> Running ✅</p>
            <p><strong>USSD Endpoint:</strong> <code>http://localhost:${PORT}/ussd</code></p>
            
            <h2>Test USSD Codes</h2>
            <ul>
                <li><code>*123#</code> - Main menu</li>
                <li><code>*123*1#</code> - Check balance</li>
                <li><code>*123*2#</code> - Transfer money</li>
                <li><code>*123*3#</code> - Buy airtime</li>
                <li><code>*123*4#</code> - Account info</li>
            </ul>
            
            <h2>How to Use</h2>
            <ol>
                <li>Open FlowSim in your browser</li>
                <li>Enter <code>http://localhost:${PORT}/ussd</code> as the endpoint URL</li>
                <li>Click "Test Connection" to verify</li>
                <li>Use any of the test USSD codes above</li>
            </ol>
            
            <p><small>FlowSim - Offline USSD Testing Environment</small></p>
        </body>
        </html>
    `);
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 FlowSim Example USSD Server');
    console.log(`📍 Server running at: http://localhost:${PORT}`);
    console.log(`🔗 USSD Endpoint: http://localhost:${PORT}/ussd`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
    console.log('');
    console.log('📱 Test USSD codes:');
    console.log('   *123#     - Main menu');
    console.log('   *123*1#   - Check balance');
    console.log('   *123*2#   - Transfer money');
    console.log('   *123*3#   - Buy airtime');
    console.log('   *123*4#   - Account info');
    console.log('');
    console.log('Ready for FlowSim connections! 🎯');
});

module.exports = app;