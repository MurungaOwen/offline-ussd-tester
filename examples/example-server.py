#!/usr/bin/env python3
"""
FlowSim Example USSD Server - Python Flask Implementation
Simple Flask server for testing USSD flows with proper string parsing

To run:
1. pip install flask flask-cors
2. python example-server.py
3. Use http://localhost:5000/ussd in FlowSim
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(message)s')
logger = logging.getLogger(__name__)

@app.route('/ussd', methods=['POST'])
def ussd_handler():
    """Handle USSD requests with proper string parsing"""
    data = request.get_json()
    
    session_id = data.get('sessionId')
    phone_number = data.get('phoneNumber')
    text = data.get('text', '')
    
    logger.info(f"USSD Request - Session: {session_id}, Phone: {phone_number}, Text: {text}")
    
    # Parse USSD string
    parts = text.replace('#', '').split('*') if text else []
    logger.info(f"USSD parts: {parts}")
    
    response = ""
    
    try:
        # Main menu
        if text == '*123#':
            response = "CON Welcome to FlowSim Demo Bank (Python)\n"
            response += "1. Check Balance\n"
            response += "2. Transfer Money\n"
            response += "3. Buy Airtime\n"
            response += "4. Account Info"
        
        # Balance check
        elif text == '*123*1#':
            response = "END Your current balance is:\n\n"
            response += "Main Account: KES 15,234.50\n"
            response += "Savings: KES 45,678.90\n\n"
            response += "Thank you for banking with us!"
        
        # Transfer money flow
        elif text == '*123*2#':
            response = "CON Transfer Money\n\n"
            response += "Enter recipient phone number:\n"
            response += "(Format: 0712345678)"
        
        elif text.startswith('*123*2*') and len(parts) == 4:
            phone = parts[3]
            response = f"CON Transfer to {phone}\n\n"
            response += "Enter amount to transfer:\n"
            response += "(Minimum: KES 10)"
        
        elif text.startswith('*123*2*') and len(parts) == 5:
            phone = parts[3]
            amount = parts[4]
            response = f"CON Confirm Transfer\n\n"
            response += f"To: {phone}\n"
            response += f"Amount: KES {amount}\n\n"
            response += "1. Confirm\n"
            response += "2. Cancel"
        
        elif text.startswith('*123*2*') and text.endswith('*1#'):
            phone = parts[3]
            amount = parts[4]
            response = "END Transfer successful!\n\n"
            response += f"To: {phone}\n"
            response += f"Amount: KES {amount}\n"
            response += "Transaction ID: TXN789456\n"
            response += "Fee: KES 25\n\n"
            response += "Thank you!"
        
        elif text.startswith('*123*2*') and text.endswith('*2#'):
            response = "END Transfer cancelled.\n\n"
            response += "Thank you for using FlowSim Demo Bank!"
        
        # Buy airtime flow
        elif text == '*123*3#':
            response = "CON Buy Airtime\n\n"
            response += "Select amount:\n"
            response += "1. KES 50\n"
            response += "2. KES 100\n"
            response += "3. KES 250\n"
            response += "4. KES 500\n"
            response += "5. Custom amount"
        
        elif text == '*123*3*1#':
            response = "END Airtime Purchase\n\n"
            response += "KES 50 airtime added to your account\n\n"
            response += "Transaction ID: AIR123\n"
            response += "New balance: KES 15,184.50"
        
        elif text == '*123*3*2#':
            response = "END Airtime Purchase\n\n"
            response += "KES 100 airtime added to your account\n\n"
            response += "Transaction ID: AIR124\n"
            response += "New balance: KES 15,134.50"
        
        elif text == '*123*3*5#':
            response = "CON Custom Airtime\n\n"
            response += "Enter amount (KES 10-5000):"
        
        elif text.startswith('*123*3*5*') and len(parts) == 5:
            amount = parts[4]
            response = f"CON Confirm Purchase\n\n"
            response += f"KES {amount} airtime\n\n"
            response += "1. Confirm\n"
            response += "2. Cancel"
        
        elif text.startswith('*123*3*5*') and text.endswith('*1#'):
            amount = parts[4]
            new_balance = 15234.50 - float(amount)
            response = "END Airtime Purchase\n\n"
            response += f"KES {amount} airtime added to your account\n\n"
            response += "Transaction ID: AIR999\n"
            response += f"New balance: KES {new_balance:.2f}"
        
        # Account info
        elif text == '*123*4#':
            response = "END Account Information\n\n"
            response += "Name: Jane Doe\n"
            response += "Account: ****5678\n"
            response += "Type: Checking\n"
            response += "Status: Active\n\n"
            response += "For support call: 0800-FLOWSIM"
        
        # Default/fallback
        else:
            response = "END Thank you for using FlowSim Demo Bank!\n\n"
            response += "For assistance, call 0800-FLOWSIM\n\n"
            response += "Session ended."
            
    except Exception as e:
        logger.error(f"Error processing USSD request: {e}")
        response = "END Service temporarily unavailable.\n"
        response += "Please try again later."
    
    # Prepare response
    result = {
        'response': response,
        'sessionId': session_id
    }
    
    logger.info(f"USSD Response: {result}")
    return jsonify(result)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'FlowSim Example USSD Server (Python)',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/')
def index():
    """Root endpoint with instructions"""
    html = """
    <html>
    <head><title>FlowSim Python USSD Server</title></head>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1>FlowSim Python USSD Server</h1>
        <p><strong>Status:</strong> Running ✅</p>
        <p><strong>USSD Endpoint:</strong> <code>http://localhost:5000/ussd</code></p>
        
        <h2>Test USSD Codes</h2>
        <ul>
            <li><code>*123#</code> - Main menu</li>
            <li><code>*123*1#</code> - Check balance</li>
            <li><code>*123*2#</code> - Transfer money</li>
            <li><code>*123*3#</code> - Buy airtime</li>
            <li><code>*123*4#</code> - Account info</li>
        </ul>
        
        <h2>Example Flow</h2>
        <ol>
            <li>Dial: <code>*123#</code></li>
            <li>Select transfer: <code>2</code> → <code>*123*2#</code></li>
            <li>Enter phone: <code>0712345678</code> → <code>*123*2*0712345678#</code></li>
            <li>Enter amount: <code>500</code> → <code>*123*2*0712345678*500#</code></li>
            <li>Confirm: <code>1</code> → <code>*123*2*0712345678*500*1#</code></li>
        </ol>
        
        <h2>How to Use</h2>
        <ol>
            <li>Open FlowSim in your browser</li>
            <li>Enter <code>http://localhost:5000/ussd</code> as the endpoint URL</li>
            <li>Click "Test Connection" to verify</li>
            <li>Use any of the test USSD codes above</li>
        </ol>
        
        <p><small>FlowSim - Offline USSD Testing Environment</small></p>
    </body>
    </html>
    """
    return html

if __name__ == '__main__':
    print('🚀 FlowSim Python USSD Server')
    print('📍 Server running at: http://localhost:5000')
    print('🔗 USSD Endpoint: http://localhost:5000/ussd')
    print('❤️  Health Check: http://localhost:5000/health')
    print('')
    print('📱 Test USSD codes:')
    print('   *123#     - Main menu')
    print('   *123*1#   - Check balance')
    print('   *123*2#   - Transfer money')
    print('   *123*3#   - Buy airtime')
    print('   *123*4#   - Account info')
    print('')
    print('🔍 USSD String Flow Example:')
    print('   *123# → *123*2# → *123*2*0712345678# → *123*2*0712345678*500# → *123*2*0712345678*500*1#')
    print('')
    print('Ready for FlowSim connections! 🎯')
    
    app.run(host='0.0.0.0', port=5000, debug=True)