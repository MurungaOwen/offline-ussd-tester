
# FlowSim: Universal USSD Simulator

FlowSim is a powerful and intuitive tool designed for developers to test, debug, and simulate USSD (Unstructured Supplementary Service Data) applications in a local environment. It provides a web-based interface that mimics both feature phones and smartphones, allowing you to interact with your USSD service as if you were a real user.

![Home](assets/home.jpg)

## 🚀 Key Features

- **Universal Compatibility:** Works with any USSD server (Africa's Talking format, custom APIs, etc.)
- **Dual Format Support:** Automatically tries form data first, then JSON fallback for maximum compatibility
- **Visual USSD Simulation:** User-friendly phone interfaces (feature phone & smartphone modes)
- **Real-time Interaction:** Enter USSD codes and see responses from your application instantly
- **Smart Request Handling:** Follows Africa's Talking protocol standards with automatic fallback
- **Session Management:** Simulates real-world USSD sessions with configurable timeouts (30s default)
- **Built-in Demo Codes:** Test the simulator with `*123#`, `*101#`, `*199#` without any server
- **Connection Testing:** Built-in endpoint testing to verify your server compatibility
- **Cross-Platform:** Single Go binary that runs on Windows, macOS, and Linux
- **Developer-Friendly:** Comprehensive logging and debugging information

## 🛠️ How It Works

FlowSim acts as a smart proxy between a web-based phone simulator and your USSD server:

1. **Frontend Interface:** Provides feature phone and smartphone simulators in your browser
2. **Smart Proxy:** Automatically detects your server's expected format and sends requests accordingly
3. **Universal Protocol Support:** Tries Africa's Talking format first, falls back to JSON for modern APIs
4. **Session Management:** Maintains USSD sessions with proper timeout handling
5. **Response Processing:** Handles both JSON and plain text responses from your server

![Response](assets/response.jpg)

### Request Flow

```
User Input → FlowSim Frontend → FlowSim Backend → Your USSD Server
    ↓                ↓                ↓               ↓
*123*1#         Session Mgmt    Try Form Data    Process Request
                   ↓                ↓               ↓
                Track Input    If fails, try JSON  Return Response
                   ↓                ↓               ↓
             Display Response ← Parse Response ← Plain Text/JSON
```

## 🏁 Getting Started

### Prerequisites

- Go (1.18 or later) installed on your system.

### Installation & Running

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/flowsim.git
   cd flowsim
   ```

2. **Run the application:**
   ```bash
   go run .
   ```

3. **Open your browser:**
   Navigate to `http://localhost:8080` to start using the simulator.

## 🐳 Docker Usage

You can also run FlowSim using Docker. The official image is available on Docker Hub.

1.  **Pull the image:**
    ```bash
    docker pull murunga/ussd-tester:latest
    ```

2.  **Run the container:**
    ```bash
    docker run -p 8080:8080 murunga/ussd-tester:latest
    ```

3.  **Open your browser:**
    Navigate to `http://localhost:8080` to start using the simulator.


## 📖 Quick Start Usage

1. **Start FlowSim:** Run `go run .` and open http://localhost:8080
2. **Test Demo Codes:** Try `*123#`, `*101#`, or `*199#` (no server needed)
3. **Connect Your Server:** Enter your endpoint URL in the configuration panel
4. **Test Connection:** Click "Test Connection" to verify compatibility
5. **Start Testing:** Dial your USSD codes and interact with your application

![Help](assets/help.jpg)

## 🔧 Developer Guide

### Request Format Compatibility

FlowSim automatically handles different server expectations by trying multiple formats:

#### 1. Africa's Talking Format (Tried First)
**Content-Type:** `application/x-www-form-urlencoded`

```http
POST /ussd HTTP/1.1
Content-Type: application/x-www-form-urlencoded

sessionId=ATUid_123&phoneNumber=%2B254712345678&text=1*2&serviceCode=*123%23&networkCode=63902
```

**Python Flask Example:**
```python
@app.route('/ussd', methods=['POST'])
def ussd_callback():
    session_id = request.form.get('sessionId')
    phone_number = request.form.get('phoneNumber') 
    text = request.form.get('text', "").strip()
    service_code = request.form.get('serviceCode')
    
    if text == "":
        response = "CON Welcome\n1. Option 1\n2. Option 2"
    elif text == "1":
        response = "END You selected option 1"
    else:
        response = "END Invalid choice"
    
    return Response(response, mimetype="text/plain")
```

#### 2. JSON Format (Fallback)
**Content-Type:** `application/json`

```json
{
  "sessionId": "session-123",
  "phoneNumber": "+254712345678",
  "text": "1*2",
  "serviceCode": "*123#",
  "networkCode": "63902",
  "session_id": "session-123",
  "phone_number": "+254712345678",
  "service_code": "*123#",
  "msisdn": "+254712345678"
}
```

**Python Flask JSON Example:**
```python
@app.route('/ussd', methods=['POST'])
def ussd_callback():
    data = request.get_json()
    session_id = data.get('sessionId') or data.get('session_id')
    phone_number = data.get('phoneNumber') or data.get('phone_number')
    text = data.get('text', "").strip()
    service_code = data.get('serviceCode') or data.get('service_code')
    
    # Your USSD logic here
    response = {"response": "CON Welcome", "sessionId": session_id}
    return jsonify(response)
```

**Node.js Express Example:**
```javascript
app.post('/ussd', (req, res) => {
    const { sessionId, phoneNumber, text, serviceCode } = req.body;
    
    let response;
    if (text === '') {
        response = 'CON Welcome\n1. Option 1\n2. Option 2';
    } else if (text === '1') {
        response = 'END You selected option 1';
    } else {
        response = 'END Invalid choice';
    }
    
    res.set('Content-Type', 'text/plain');
    res.send(response);
});
```

### Understanding the Text Parameter

FlowSim follows Africa's Talking standards for the `text` parameter:

- **Initial Request:** `text=""` (empty string)
- **User enters 1:** `text="1"`  
- **User enters 1, then 2:** `text="1*2"`
- **User enters 1, then 2, then 3:** `text="1*2*3"`

### Response Formats

FlowSim accepts multiple response formats:

#### 1. Plain Text (Recommended)
```
CON Choose option:
1. Balance
2. Transfer
```

#### 2. JSON Response
```json
{
  "response": "CON Choose option:\n1. Balance\n2. Transfer",
  "sessionId": "session-123"
}
```

#### 3. Alternative JSON
```json
{
  "text": "CON Choose option:\n1. Balance\n2. Transfer"
}
```

### Response Prefixes

- **CON:** Continue - shows menu and waits for user input
- **END:** End - terminates the session

### Session Management

- **Session Timeout:** 30 seconds (configurable)
- **Session ID Format:** `session-{timestamp}-{random}`
- **Phone Number:** Default `+254712345678` (configurable in UI)

### Built-in Test Codes

FlowSim includes demo USSD codes that work without any server:

- **`*123#`** - Demo Banking (Balance, Transfer, Airtime, Account Info)
- **`*101#`** - Mobile Money (Send Money, Withdraw, Pay Bills)  
- **`*199#`** - Customer Service (Support, Complaints, FAQ)

### Debugging and Logging

FlowSim provides detailed logging for debugging:

```bash
[PROXY] Forwarding to: http://localhost:5000/ussd
[PROXY] Request fields - SessionID: 'session-123', PhoneNumber: '+254712345678', Text: '1', ServiceCode: '*123#'
[PROXY] Attempting form data request (Africa's Talking format)...
[PROXY] Form data payload: sessionId=session-123&phoneNumber=%2B254712345678&text=1&serviceCode=*123%23&networkCode=63902
[PROXY] Response status: 200
[PROXY] Response body: CON Welcome to our service
```

### Connection Testing

Use the "Test Connection" button to verify your server:

- Tests both form data and JSON formats
- Validates response format
- Shows detailed error messages
- Confirms USSD protocol compatibility

### Common Integration Patterns

#### PHP Example
```php
<?php
$sessionId = $_POST['sessionId'];
$phoneNumber = $_POST['phoneNumber'];
$text = trim($_POST['text']);
$serviceCode = $_POST['serviceCode'];

if (empty($text)) {
    $response = "CON Welcome\n1. Option 1\n2. Option 2";
} elseif ($text == "1") {
    $response = "END You selected option 1";
} else {
    $response = "END Invalid choice";
}

header('Content-Type: text/plain');
echo $response;
?>
```

#### Go Example  
```go
func ussdHandler(w http.ResponseWriter, r *http.Request) {
    r.ParseForm()
    sessionID := r.FormValue("sessionId")
    phoneNumber := r.FormValue("phoneNumber")
    text := strings.TrimSpace(r.FormValue("text"))
    serviceCode := r.FormValue("serviceCode")
    
    var response string
    if text == "" {
        response = "CON Welcome\n1. Option 1\n2. Option 2"
    } else if text == "1" {
        response = "END You selected option 1"
    } else {
        response = "END Invalid choice"
    }
    
    w.Header().Set("Content-Type", "text/plain")
    w.Write([]byte(response))
}
```

### Error Handling

FlowSim handles various error scenarios:

- **Server Unreachable:** Shows connection error with troubleshooting tips
- **Invalid Response:** Attempts to parse different formats automatically  
- **Timeout:** 15-second request timeout with retry suggestions
- **Session Timeout:** 30-second session timeout with automatic cleanup

## Example USSD Server

Don't have a USSD application to test with? We've included example servers in Python and Node.js in the `/examples` directory to get you started.

### Python Example

```bash
cd examples
pip install -r requirements.txt # If there's a requirements file
python example-server.py
```

### Node.js Example

```bash
cd examples
npm install
node example-server.js
```

Now you can use the FlowSim simulator to send requests to `http://localhost:5000` (for Python) or `http://localhost:3000` (for Node.js).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs, feature requests, or improvements.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
