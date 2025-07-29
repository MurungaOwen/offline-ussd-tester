// FlowSim Frontend Application
class FlowSimApp {
    constructor() {
        this.currentInput = '';
        this.sessionId = null;
        this.isSessionActive = false;
        this.phoneNumber = '+254712345678';
        this.logs = [];
        this.phoneType = 'feature';
        this.serviceCode = ''; // Store the initial USSD code
        this.userInputHistory = []; // Track user inputs for text parameter
        
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        // Phone types
        this.featurePhone = document.getElementById('feature-phone');
        this.smartphone = document.getElementById('smartphone');
        
        // Feature phone elements
        this.screen = document.getElementById('screen');
        this.screenContent = document.getElementById('screen-content');
        this.inputArea = document.getElementById('input-area');
        this.userInput = document.getElementById('user-input');
        
        // Smartphone elements
        this.smartphoneScreen = document.getElementById('smartphone-screen');
        this.ussdPopup = document.getElementById('ussd-popup');
        this.popupContent = document.getElementById('popup-content');
        this.popupInput = document.getElementById('popup-input');
        this.smartphoneUserInput = document.getElementById('smartphone-user-input');
        this.smartphoneDialerInterface = document.getElementById('smartphone-dialer-interface');
        this.smartphoneDialerDisplay = document.getElementById('smartphone-dialer-display');
        this.smartphoneKeypadKeys = document.querySelectorAll('.keypad-key');
        this.smartphoneDelete = document.getElementById('smartphone-delete');
        this.smartphoneDial = document.getElementById('smartphone-dial');
        this.popupClose = document.getElementById('popup-close');
        this.smartphoneCancel = document.getElementById('smartphone-cancel');
        this.smartphoneSend = document.getElementById('smartphone-send');
        
        // Response keypad elements
        this.ussdResponseKeypad = document.getElementById('ussd-response-keypad');
        this.ussdMessage = document.getElementById('ussd-message');
        this.responseDisplay = document.getElementById('response-display');
        this.responseKeys = document.querySelectorAll('.response-key');
        this.responseDelete = document.getElementById('response-delete');
        this.responseSend = document.getElementById('response-send');
        this.currentResponse = '';
        
        // Add direct listeners to response keypad buttons as fallback
        this.responseKeypadListenersSetup = false;
        setTimeout(() => {
            this.setupResponseKeypadListeners();
        }, 100);
        
        // Control panel
        this.endpointUrl = document.getElementById('endpoint-url');
        this.testConnectionBtn = document.getElementById('test-connection');
        this.sessionIdSpan = document.getElementById('session-id');
        this.phoneNumberSpan = document.getElementById('phone-number');
        this.statusSpan = document.getElementById('status');
        this.phoneTypeRadios = document.querySelectorAll('input[name="phone-type"]');
        
        // Keypad
        this.keys = document.querySelectorAll('.key');
        this.sendBtn = document.getElementById('send-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.endBtn = document.getElementById('end-btn');
        
        // Log panel
        this.logContent = document.getElementById('log-content');
        this.copyLogBtn = document.getElementById('copy-log');
        this.clearLogBtn = document.getElementById('clear-log');
        
        // Help modal and test codes
        this.helpModal = document.getElementById('help-modal');
        this.showHelpBtn = document.getElementById('show-help');
        this.closeHelpModal = document.getElementById('close-help-modal');
        this.closeHelpFooter = document.getElementById('close-help-footer');
        this.testCodeBtns = document.querySelectorAll('.test-code-btn');
    }

    setupResponseKeypadListeners() {
        if (this.responseKeypadListenersSetup) {
            console.log('Response keypad listeners already setup, skipping...');
            return;
        }
        
        console.log('Setting up direct response keypad listeners');
        const responseKeys = document.querySelectorAll('.response-key');
        const responseDelete = document.getElementById('response-delete');
        const responseSend = document.getElementById('response-send');
        
        responseKeys.forEach(key => {
            console.log('Adding listener to response key:', key.dataset.value);
            key.addEventListener('click', (e) => {
                console.log('Direct listener - Response key clicked:', key.dataset.value);
                e.stopPropagation();
                e.preventDefault();
                this.handleResponseKeyPress(key.dataset.value);
            });
        });
        
        if (responseDelete) {
            console.log('Adding listener to delete button');
            responseDelete.addEventListener('click', (e) => {
                console.log('Direct listener - Delete clicked');
                e.stopPropagation();
                e.preventDefault();
                this.handleResponseDelete();
            });
        }
        
        if (responseSend) {
            console.log('Adding listener to send button');
            responseSend.addEventListener('click', (e) => {
                console.log('Direct listener - Send clicked');
                e.stopPropagation();
                e.preventDefault();
                this.handleResponseSend();
            });
        }
        
        this.responseKeypadListenersSetup = true;
        console.log('Response keypad listeners setup complete');
    }

    attachEventListeners() {
        // Phone type switcher
        this.phoneTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => this.switchPhoneType(e.target.value));
        });
        
        // Feature phone keypad listeners
        this.keys.forEach(key => {
            key.addEventListener('click', () => this.handleKeyPress(key));
        });
        
        this.sendBtn.addEventListener('click', () => this.handleSend());
        this.clearBtn.addEventListener('click', () => this.handleClear());
        this.endBtn.addEventListener('click', () => this.handleEnd());
        
        // Smartphone listeners
        this.smartphoneKeypadKeys.forEach(key => {
            key.addEventListener('click', () => this.handleSmartphoneKeyPress(key.dataset.value));
        });
        this.smartphoneDelete.addEventListener('click', () => this.handleSmartphoneDelete());
        this.smartphoneDial.addEventListener('click', () => this.handleSmartphoneDial());
        this.popupClose.addEventListener('click', () => this.handleEnd());
        this.smartphoneCancel.addEventListener('click', () => this.handleEnd());
        this.smartphoneSend.addEventListener('click', () => this.handleSmartphoneSend());
        
        // Response keypad listeners using event delegation (disabled - using direct listeners instead)
        // document.addEventListener('click', (e) => {
        //     console.log('Click detected on:', e.target, 'Classes:', e.target.classList, 'ID:', e.target.id);
        //     if (e.target.classList.contains('response-key')) {
        //         console.log('Response key clicked:', e.target.dataset.value);
        //         this.handleResponseKeyPress(e.target.dataset.value);
        //     } else if (e.target.id === 'response-delete') {
        //         console.log('Delete button clicked');
        //         this.handleResponseDelete();
        //     } else if (e.target.id === 'response-send') {
        //         console.log('Send button clicked');
        //         this.handleResponseSend();
        //     }
        // });
        
        // Control panel listeners
        this.testConnectionBtn.addEventListener('click', () => this.testConnection());
        
        // Input field listeners
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserResponse();
            }
        });
        
        this.smartphoneUserInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSmartphoneSend();
            }
        });
        
        
        // Log panel listeners
        this.copyLogBtn.addEventListener('click', () => this.copyLogs());
        this.clearLogBtn.addEventListener('click', () => this.clearLogs());
        
        // Help modal and test codes
        this.showHelpBtn.addEventListener('click', () => this.showHelpModal());
        this.closeHelpModal.addEventListener('click', () => this.hideHelpModal());
        this.closeHelpFooter.addEventListener('click', () => this.hideHelpModal());
        
        // Test code buttons
        this.testCodeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.dataset.code;
                this.dialTestCode(code);
            });
        });
        
        // Close modal when clicking outside
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) {
                this.hideHelpModal();
            }
        });
    }

    switchPhoneType(type) {
        this.phoneType = type;
        if (type === 'feature') {
            this.featurePhone.style.display = 'block';
            this.smartphone.style.display = 'none';
        } else {
            this.featurePhone.style.display = 'none';
            this.smartphone.style.display = 'block';
            // Show dialer interface and hide other interfaces initially
            this.smartphoneDialerInterface.style.display = 'flex';
            this.ussdPopup.style.display = 'none';
            this.ussdResponseKeypad.style.display = 'none';
            this.smartphoneDialerDisplay.textContent = 'Enter USSD code';
            this.responseDisplay.textContent = 'Enter your response';
            this.ussdMessage.textContent = 'USSD Response will appear here';
        }
        this.endSession();
    }

    handleKeyPress(keyElement) {
        const key = keyElement.dataset.key;
        
        if (!this.isSessionActive) {
            this.currentInput += key;
            this.updateScreen(`Dialing: ${this.currentInput}`);
        } else {
            // Always add to input field when in session (feature phone mode)
            if (this.phoneType === 'feature') {
                this.userInput.value += key;
                this.userInput.focus();
            }
        }
    }

    handleClear() {
        if (!this.isSessionActive) {
            this.currentInput = '';
            if (this.phoneType === 'feature') {
                this.updateScreen('Dial USSD code to begin');
            } else {
                this.updateScreen('Dial USSD code to begin');
            }
        } else {
            if (this.phoneType === 'feature') {
                this.userInput.value = '';
                this.userInput.focus();
            } else {
                this.smartphoneUserInput.value = '';
                this.smartphoneUserInput.focus();
            }
        }
    }

    async handleSend() {
        if (this.phoneType === 'feature') {
            if (!this.isSessionActive && this.currentInput) {
                // Start new USSD session
                this.startSession();
            } else if (this.isSessionActive && this.userInput.value) {
                // Send user response
                this.handleUserResponse();
            }
        }
    }
    
    async handleSmartphoneSend() {
        if (!this.isSessionActive) {
            // Show dialer
            this.showDialer();
        } else if (this.smartphoneUserInput.value) {
            this.handleUserResponse();
        }
    }
    
    handleSmartphoneKeyPress(value) {
        if (!this.isSessionActive) {
            this.currentInput += value;
            this.smartphoneDialerDisplay.textContent = this.currentInput;
        }
    }
    
    handleSmartphoneDelete() {
        if (!this.isSessionActive) {
            this.currentInput = this.currentInput.slice(0, -1);
            this.smartphoneDialerDisplay.textContent = this.currentInput || 'Enter USSD code';
        }
    }
    
    handleSmartphoneDial() {
        if (!this.isSessionActive && this.currentInput) {
            if (this.currentInput.startsWith('*') && this.currentInput.endsWith('#')) {
                this.startSession();
            } else {
                this.smartphoneDialerDisplay.textContent = 'Invalid! Use *XXX# format';
                this.smartphoneDialerDisplay.style.color = '#e74c3c';
                setTimeout(() => {
                    this.smartphoneDialerDisplay.style.color = '';
                    this.smartphoneDialerDisplay.textContent = this.currentInput || 'Enter USSD code';
                }, 2000);
            }
        }
    }
    
    handleResponseKeyPress(value) {
        console.log('Response key pressed:', value, 'Current response before:', this.currentResponse); // Debug log
        this.currentResponse += value;
        console.log('Current response after:', this.currentResponse); // Debug log
        this.responseDisplay.textContent = this.currentResponse;
        this.smartphoneUserInput.value = this.currentResponse;
    }
    
    handleResponseDelete() {
        console.log('Delete button pressed'); // Debug log
        this.currentResponse = this.currentResponse.slice(0, -1);
        this.responseDisplay.textContent = this.currentResponse || 'Enter your response';
        this.smartphoneUserInput.value = this.currentResponse;
    }
    
    async handleResponseSend() {
        console.log('Send button pressed, current response:', this.currentResponse); // Debug log
        if (this.currentResponse) {
            // Hide response keypad and show USSD popup
            this.ussdResponseKeypad.style.display = 'none';
            this.ussdPopup.style.display = 'block';
            
            // Send the response
            await this.handleUserResponse();
            
            // Reset response
            this.currentResponse = '';
            this.responseDisplay.textContent = 'Enter your response';
        } else {
            console.log('No response to send'); // Debug log
        }
    }

    handleEnd() {
        this.endSession();
    }

    async startSession() {
        if (!this.currentInput.startsWith('*') || !this.currentInput.endsWith('#')) {
            this.updateScreen('Invalid USSD code format.\nUse format: *XXX#');
            return;
        }

        console.log('Starting USSD session with:', this.currentInput);
        
        // Extract service code for Africa's Talking compatibility
        this.serviceCode = this.currentInput;
        this.userInputHistory = []; // Reset for new session
        
        this.sessionId = this.generateSessionId();
        this.isSessionActive = true;
        this.updateStatus('active');
        this.sessionIdSpan.textContent = this.sessionId;
        
        // Show USSD popup for smartphone and hide dialer
        if (this.phoneType === 'smartphone') {
            this.smartphoneDialerInterface.style.display = 'none';
            this.ussdPopup.style.display = 'block';
        }
        
        // Show loading
        this.updateScreen('Connecting...');
        
        try {
            // For initial request, text should be empty (Africa's Talking standard)
            const response = await this.sendUSSDRequest('');
            console.log('Initial session - About to call handleUSSDResponse with:', response);
            this.handleUSSDResponse(response);
            console.log('Initial session - handleUSSDResponse completed');
        } catch (error) {
            console.error('Error in startSession:', error);
            this.handleError(error);
        }
    }

    async handleUserResponse() {
        const input = this.phoneType === 'feature' ? this.userInput.value : this.smartphoneUserInput.value;
        if (!input) return;
        
        console.log('User response:', input, 'Current USSD string before:', this.currentInput);
        
        if (this.phoneType === 'feature') {
            this.userInput.value = '';
            this.userInput.disabled = true;
        } else {
            this.smartphoneUserInput.value = '';
            this.smartphoneUserInput.disabled = true;
        }
        
        try {
            // Add user input to history and build text parameter (Africa's Talking format)
            this.userInputHistory.push(input);
            const textParam = this.userInputHistory.join('*');
            console.log('Sending USSD request with text parameter:', textParam);
            const response = await this.sendUSSDRequest(textParam);
            console.log('About to call handleUSSDResponse with:', response);
            this.handleUSSDResponse(response);
            console.log('handleUSSDResponse completed');
        } catch (error) {
            console.error('Error in handleUserResponse:', error);
            this.handleError(error);
        } finally {
            if (this.phoneType === 'feature') {
                this.userInput.disabled = false;
                this.userInput.focus();
            } else {
                this.smartphoneUserInput.disabled = false;
                this.smartphoneUserInput.focus();
            }
        }
    }

    async sendUSSDRequest(text) {
        const request = {
            sessionId: this.sessionId,
            phoneNumber: this.phoneNumber,
            text: text,
            endpoint: this.endpointUrl.value.trim(),
            serviceCode: this.serviceCode
        };
        
        this.logRequest(request);
        
        // Check if this is a built-in test code using serviceCode
        const builtInCodes = ['*123#', '*101#', '*199#'];
        const isBuiltInCode = builtInCodes.includes(this.serviceCode);
        
        if (isBuiltInCode) {
            console.log('Using built-in simulator for:', this.serviceCode);
            return this.simulateResponse(this.serviceCode);
        }
        
        const url = this.endpointUrl.value.trim();
        
        // If no URL is provided, show error for custom codes
        if (!url) {
            console.log('No URL configured for custom USSD code');
            return {
                response: 'END No endpoint configured.\n\nPlease set your USSD endpoint URL in the Configuration panel to test custom codes.\n\nBuilt-in codes: *123#, *101#, *199#',
                sessionId: this.sessionId
            };
        }
        
        // Always use Go backend for external endpoints (unless it's a direct API call)
        if (!url.includes('/api/ussd')) {
            console.log('Using Go backend API for external endpoint:', url);
            return this.sendToGoBackend(request);
        }
        
        try {
            console.log('Sending USSD request to:', url);
            console.log('Request payload:', request);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(request),
                signal: AbortSignal.timeout(15000) // 15 second timeout for USSD requests
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('USSD response received:', data);
            
            // Validate response format
            if (!this.isValidUSSDResponse(data)) {
                console.warn('Invalid USSD response format, expected {response/text, sessionId}');
                // Still try to use it but log warning
            }
            
            // Convert different response formats to standard format
            const standardResponse = {
                response: data.response || data.text || 'END No response provided',
                sessionId: data.sessionId || this.sessionId
            };
            
            return standardResponse;
            
        } catch (error) {
            console.error('USSD request failed:', error);
            
            // Log the error but don't break the flow
            this.logError(error);
            
            // More helpful error messages
            if (error.name === 'AbortError') {
                return {
                    response: 'END Request timeout.\n\nYour USSD server took too long to respond.\n\nTry built-in codes: *123#, *101#, *199#',
                    sessionId: this.sessionId
                };
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                return {
                    response: 'END Cannot reach endpoint.\n\nCheck:\n1. Server is running\n2. CORS is enabled\n3. URL is correct\n\nTry built-in codes: *123#, *101#, *199#',
                    sessionId: this.sessionId
                };
            } else {
                return {
                    response: `END Error: ${error.message}\n\nBuilt-in codes work offline:\n*123#, *101#, *199#`,
                    sessionId: this.sessionId
                };
            }
        }
    }

    async sendToGoBackend(request) {
        try {
            console.log('Sending USSD request to Go backend API');
            console.log('Request payload:', request);
            
            const response = await fetch('/api/ussd', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(request),
                signal: AbortSignal.timeout(15000) // 15 second timeout
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Go backend response received:', data);
            
            // Validate response format
            if (!this.isValidUSSDResponse(data)) {
                throw new Error('Invalid USSD response format');
            }
            
            // Update session ID if provided
            if (data.sessionId) {
                this.sessionId = data.sessionId;
            }
            
            this.logResponse(data);
            return data;
            
        } catch (error) {
            console.error('Go backend request failed:', error);
            this.logError(error);
            
            if (error.name === 'AbortError') {
                return {
                    response: 'END Request timeout. Please try again.',
                    sessionId: this.sessionId
                };
            } else {
                return {
                    response: `END Error: ${error.message}`,
                    sessionId: this.sessionId
                };
            }
        }
    }

    getBuiltInResponse(serviceCode) {
        // Build the full USSD string for compatibility with existing logic
        const text = this.userInputHistory.length > 0 ? 
            serviceCode.replace('#', '*' + this.userInputHistory.join('*') + '#') : 
            serviceCode;
        
        console.log('Built-in simulator - ServiceCode:', serviceCode, 'Text:', text, 'History:', this.userInputHistory);
        
        // Demo Banking (*123#)
        if (text === '*123#') {
            return {
                response: 'CON Welcome to FlowSim Demo Bank\n1. Check Balance\n2. Transfer Money\n3. Buy Airtime\n4. Account Info',
                sessionId: this.sessionId
            };
        } else if (text === '*123*1#') {
            return {
                response: 'END Your balance is KES 1,234.56\nAvailable: KES 1,200.00\nThank you!',
                sessionId: this.sessionId
            };
        } else if (text === '*123*2#') {
            return {
                response: 'CON Transfer Money\nEnter phone number:',
                sessionId: this.sessionId
            };
        } else if (text.startsWith('*123*2*') && text.match(/^\*123\*2\*\d{10,}#$/)) {
            return {
                response: 'CON Enter amount to transfer:',
                sessionId: this.sessionId
            };
        } else if (text === '*123*3#') {
            return {
                response: 'CON Buy Airtime\n1. KES 50\n2. KES 100\n3. KES 200\n4. Other amount',
                sessionId: this.sessionId
            };
        } else if (text === '*123*4#') {
            return {
                response: 'END Account Info\nName: John Doe\nAccount: 123456789\nStatus: Active',
                sessionId: this.sessionId
            };
        }
        
        // Mobile Money (*101#)
        else if (text === '*101#') {
            return {
                response: 'CON M-Money Services\n1. Send Money\n2. Withdraw Cash\n3. Buy Goods\n4. Pay Bill\n5. Check Balance',
                sessionId: this.sessionId
            };
        } else if (text === '*101*1#') {
            return {
                response: 'CON Send Money\nEnter recipient number:',
                sessionId: this.sessionId
            };
        } else if (text === '*101*2#') {
            return {
                response: 'CON Withdraw Cash\nEnter agent number:',
                sessionId: this.sessionId
            };
        } else if (text === '*101*5#') {
            return {
                response: 'END Your M-Money balance is KES 2,567.80\nAvailable limit: KES 50,000',
                sessionId: this.sessionId
            };
        }
        
        // Help System (*199#)
        else if (text === '*199#') {
            return {
                response: 'CON FlowSim Help\n1. Available Test Codes\n2. How to Use\n3. Custom Endpoints\n4. About FlowSim',
                sessionId: this.sessionId
            };
        } else if (text === '*199*1#') {
            return {
                response: 'END Built-in Test Codes:\n*123# - Demo Banking\n*101# - Mobile Money\n*199# - This Help\n\nAny other code goes to your configured endpoint URL',
                sessionId: this.sessionId
            };
        } else if (text === '*199*2#') {
            return {
                response: 'END How to Use FlowSim:\n1. Dial any USSD code\n2. Follow menu prompts\n3. Use keypad to respond\n4. # to execute, * for special chars',
                sessionId: this.sessionId
            };
        } else if (text === '*199*3#') {
            return {
                response: 'END Custom Endpoints:\n1. Set endpoint URL in config\n2. Dial ANY code (e.g. *384#)\n3. Ensure CORS is enabled\n4. Server must accept POST requests',
                sessionId: this.sessionId
            };
        } else if (text === '*199*4#') {
            return {
                response: 'END FlowSim v1.0\nOffline USSD Emulator\nFor testing USSD applications\nlocally without telco dependencies',
                sessionId: this.sessionId
            };
        }
        
        // Default fallback for unknown built-in codes
        else {
            return {
                response: 'END Unknown USSD code.\n\nBuilt-in test codes:\n*123# - Demo Banking\n*101# - Mobile Money\n*199# - Help',
                sessionId: this.sessionId
            };
        }
    }

    simulateResponse(text) {
        // Simulate delay
        return new Promise((resolve) => {
            setTimeout(() => {
                let response = this.getBuiltInResponse(this.serviceCode);
                
                this.logResponse(response);
                resolve(response);
            }, 500);
        });
    }

    handleUSSDResponse(response) {
        console.log('Raw USSD response:', JSON.stringify(response.response));
        const isEnd = response.response.startsWith('END ');
        const message = response.response.replace(/^(CON |END )/, '');
        console.log('Processed message:', JSON.stringify(message));
        
        // Check for session timeout
        if (message.includes('session has timed out')) {
            this.isSessionActive = false;
            this.sessionId = null;
            this.updateStatus('Session Timeout', 'status-error');
        }
        
        this.updateScreen(message);
        
        if (this.phoneType === 'feature') {
            if (isEnd) {
                this.inputArea.style.display = 'none';
                // Show "Session ending..." message after delay, then end session
                setTimeout(() => {
                    this.updateScreen(message + '\n\nSession ending...');
                }, 4000);
                setTimeout(() => this.endSession(), 6000);
            } else {
                this.inputArea.style.display = 'block';
                setTimeout(() => this.userInput.focus(), 100);
            }
        } else {
            if (isEnd) {
                this.popupInput.style.display = 'none';
                this.smartphoneSend.textContent = 'OK';
                this.smartphoneSend.style.background = '#95a5a6';
                // Show "Session ending..." message after delay, then end session
                setTimeout(() => {
                    this.updateScreen(message + '\n\nSession ending...');
                }, 5000);
                setTimeout(() => this.endSession(), 6000);
            } else {
                // Show response keypad with the USSD message
                this.ussdPopup.style.display = 'none';
                this.ussdResponseKeypad.style.display = 'flex';
                // Use the original message for the USSD display to preserve formatting
                this.ussdMessage.textContent = message;
                this.responseDisplay.textContent = 'Enter your response';
                this.currentResponse = '';
                
                console.log('Response keypad shown, checking button visibility...');
                
                // Debug: Check if buttons are visible after a short delay
                setTimeout(() => {
                    const deleteBtn = document.getElementById('response-delete');
                    const sendBtn = document.getElementById('response-send');
                    console.log('Delete button visible:', deleteBtn && deleteBtn.offsetHeight > 0);
                    console.log('Send button visible:', sendBtn && sendBtn.offsetHeight > 0);
                }, 50);
            }
        }
    }

    handleError(error) {
        this.updateStatus('error');
        this.updateScreen(`Error: ${error.message || 'Connection failed'}`);
        this.logError(error);
    }

    endSession() {
        this.isSessionActive = false;
        this.sessionId = null;
        this.currentInput = '';
        this.serviceCode = '';
        this.userInputHistory = [];
        this.updateStatus('idle');
        this.sessionIdSpan.textContent = 'Not started';
        
        if (this.phoneType === 'feature') {
            this.updateScreen('Session ended.\n\nDial USSD code to begin');
            this.inputArea.style.display = 'none';
            this.userInput.value = '';
        } else {
            this.updateScreen('Session ended');
            this.popupInput.style.display = 'none';
            this.smartphoneUserInput.value = '';
            this.smartphoneSend.textContent = 'Send';
            this.currentResponse = '';
            // Hide all interfaces and show dialer after a delay
            setTimeout(() => {
                this.ussdPopup.style.display = 'none';
                this.ussdResponseKeypad.style.display = 'none';
                this.smartphoneDialerInterface.style.display = 'flex';
                this.smartphoneDialerDisplay.textContent = 'Enter USSD code';
                this.responseDisplay.textContent = 'Enter your response';
                this.ussdMessage.textContent = 'USSD Response will appear here';
            }, 2000);
        }
    }

    
    updateScreen(content) {
        console.log('updateScreen called with:', JSON.stringify(content));
        // Use textContent to display plain text with proper line breaks
        if (this.phoneType === 'feature') {
            console.log('Setting feature phone screen content');
            this.screenContent.textContent = content;
            this.screenContent.style.whiteSpace = 'pre-line';
        } else {
            console.log('Setting smartphone popup content');
            this.popupContent.textContent = content;
            this.popupContent.style.whiteSpace = 'pre-line';
        }
    }

    updateStatus(status) {
        this.statusSpan.className = `status-${status}`;
        this.statusSpan.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }

    buildFullText(userInput) {
        // USSD string building: *123# -> *123*1# -> *123*1*50# etc.
        console.log('Building USSD string - Current:', this.currentInput, 'User input:', userInput);
        
        // Remove the trailing # from current input, append new input with *, then add # back
        const baseString = this.currentInput.replace(/#$/, '');
        const fullText = `${baseString}*${userInput}#`;
        
        console.log('Built USSD string:', fullText);
        
        // Update currentInput to maintain the full string for next iteration
        this.currentInput = fullText;
        
        return fullText;
    }

    generateSessionId() {
        return 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
    }

    // Logging functions
    logRequest(request) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'request',
            data: request
        };
        this.logs.push(logEntry);
        this.updateLogDisplay();
    }

    logResponse(response) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'response',
            data: response
        };
        this.logs.push(logEntry);
        this.updateLogDisplay();
    }

    logError(error) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'error',
            data: { message: error.message, stack: error.stack }
        };
        this.logs.push(logEntry);
        this.updateLogDisplay();
    }

    updateLogDisplay() {
        if (this.logs.length === 0) {
            this.logContent.innerHTML = '<p class="log-empty">No requests yet...</p>';
            return;
        }

        const logsHtml = this.logs.map(log => {
            const timestamp = new Date(log.timestamp).toLocaleTimeString();
            let content = '';
            
            if (log.type === 'request') {
                content = `
                    <div class="log-entry">
                        <div class="log-timestamp">${timestamp} - REQUEST</div>
                        <div class="log-request">
                            POST ${this.endpointUrl.value}
                            ${JSON.stringify(log.data, null, 2)}
                        </div>
                    </div>
                `;
            } else if (log.type === 'response') {
                content = `
                    <div class="log-entry">
                        <div class="log-timestamp">${timestamp} - RESPONSE</div>
                        <div class="log-response">
                            ${JSON.stringify(log.data, null, 2)}
                        </div>
                    </div>
                `;
            } else if (log.type === 'connection_test') {
                const statusClass = log.status === 'success' ? 'log-response' : 
                                  log.status === 'warning' ? 'log-warning' : 'log-error';
                const statusColor = log.status === 'success' ? '#27ae60' : 
                                  log.status === 'warning' ? '#f39c12' : '#e74c3c';
                content = `
                    <div class="log-entry">
                        <div class="log-timestamp">${timestamp} - CONNECTION TEST</div>
                        <div class="${statusClass}" style="color: ${statusColor};">
                            Status: ${log.status.toUpperCase()}
                            ${log.request ? `\nRequest: ${JSON.stringify(log.request, null, 2)}` : ''}
                            Response: ${JSON.stringify(log.response, null, 2)}
                        </div>
                    </div>
                `;
            } else if (log.type === 'error') {
                content = `
                    <div class="log-entry">
                        <div class="log-timestamp">${timestamp} - ERROR</div>
                        <div class="log-error" style="color: #e74c3c;">
                            ${log.data.message}
                        </div>
                    </div>
                `;
            }
            
            return content;
        }).join('');
        
        this.logContent.innerHTML = logsHtml;
        this.logContent.scrollTop = this.logContent.scrollHeight;
    }

    copyLogs() {
        const logText = this.logs.map(log => {
            return `${log.timestamp} - ${log.type.toUpperCase()}\n${JSON.stringify(log.data, null, 2)}\n`;
        }).join('\n');
        
        navigator.clipboard.writeText(logText).then(() => {
            this.copyLogBtn.textContent = 'Copied!';
            setTimeout(() => {
                this.copyLogBtn.textContent = 'Copy';
            }, 2000);
        });
    }

    clearLogs() {
        this.logs = [];
        this.updateLogDisplay();
    }
    
    // Help modal methods
    showHelpModal() {
        this.helpModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    hideHelpModal() {
        this.helpModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Test code dialing method
    dialTestCode(code) {
        // Clear current input and set the test code
        this.currentInput = code;
        
        // Update displays based on phone type
        if (this.phoneType === 'feature') {
            this.screenContent.innerHTML = `<p class="dialed-text">${code}</p>`;
        } else {
            this.smartphoneDialerDisplay.textContent = code;
        }
        
        // Auto-dial the code after a short delay
        setTimeout(() => {
            if (this.phoneType === 'feature') {
                this.handleSend();
            } else {
                this.handleSmartphoneDial();
            }
        }, 500);
    }

    async testConnection() {
        const url = this.endpointUrl.value.trim();
        
        // If no URL, test Go backend
        if (!url) {
            return this.testGoBackend();
        }
        
        // If URL is localhost:8080 without path, test Go backend
        if (url.includes('localhost:8080') && !url.includes('/ussd')) {
            return this.testGoBackend();
        }
        
        if (!this.isValidUrl(url)) {
            this.showConnectionError('Please enter a valid URL (http:// or https://)');
            return;
        }
        
        this.testConnectionBtn.disabled = true;
        this.testConnectionBtn.textContent = 'Testing...';
        this.testConnectionBtn.style.background = '#f39c12';
        
        try {
            const testPayload = {
                sessionId: 'test-session-' + Date.now(),
                phoneNumber: this.phoneNumber,
                text: '',
                serviceCode: '*TEST#'
            };
            
            console.log('Testing connection to:', url);
            console.log('Test payload:', testPayload);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(testPayload),
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (response.ok) {
                let data;
                const responseText = await response.text();
                console.log('Raw response:', responseText);
                
                // Try to parse as JSON first
                try {
                    data = JSON.parse(responseText);
                    console.log('Parsed JSON response:', data);
                } catch (jsonError) {
                    // If not JSON, treat as plain text (common with real USSD servers)
                    console.log('Response is plain text, not JSON');
                    data = {
                        response: responseText,
                        sessionId: 'test-session'
                    };
                }
                
                // Validate response format
                if (this.isValidUSSDResponse(data)) {
                    this.showConnectionSuccess('Connection OK - Valid USSD endpoint');
                    this.logConnectionTest(testPayload, data, 'success');
                } else {
                    this.showConnectionWarning('Connected but invalid USSD response format');
                    this.logConnectionTest(testPayload, data, 'warning');
                }
            } else {
                const errorText = await response.text();
                console.error('HTTP Error:', response.status, errorText);
                this.showConnectionError(`HTTP ${response.status}: ${response.statusText}`);
                this.logConnectionTest(testPayload, { error: errorText, status: response.status }, 'error');
            }
            
        } catch (error) {
            console.error('Connection test failed:', error);
            
            if (error.name === 'AbortError') {
                this.showConnectionError('Connection timeout (10s)');
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.showConnectionError('Network error - Check URL and CORS settings');
            } else {
                this.showConnectionError(`Connection failed: ${error.message}`);
            }
            
            this.logConnectionTest(null, { error: error.message }, 'error');
        } finally {
            setTimeout(() => {
                this.testConnectionBtn.disabled = false;
                this.testConnectionBtn.textContent = 'Test Connection';
                this.testConnectionBtn.style.background = '#005a9e';
            }, 3000);
        }
    }
    
    async testGoBackend() {
        this.testConnectionBtn.disabled = true;
        this.testConnectionBtn.textContent = 'Testing Go Backend...';
        this.testConnectionBtn.style.background = '#f39c12';
        
        try {
            // First test health endpoint
            const healthResponse = await fetch('/api/health');
            if (!healthResponse.ok) {
                throw new Error('Go backend not running');
            }
            
            const healthData = await healthResponse.json();
            console.log('Go backend health check:', healthData);
            
            // Then test USSD endpoint
            const testPayload = {
                sessionId: 'test-session-' + Date.now(),
                phoneNumber: this.phoneNumber,
                text: '',
                serviceCode: '*TEST#',
                endpoint: ''
            };
            
            const response = await fetch('/api/ussd', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(testPayload),
                signal: AbortSignal.timeout(10000)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Go backend test response:', data);
            
            this.showConnectionSuccess('Go Backend Connected!');
            this.logConnectionTest(testPayload, data, 'success');
            
        } catch (error) {
            console.error('Go backend test failed:', error);
            this.showConnectionError('Go backend not available');
            this.logConnectionTest(null, { error: error.message }, 'error');
        } finally {
            setTimeout(() => {
                this.testConnectionBtn.disabled = false;
                this.testConnectionBtn.textContent = 'Test Connection';
                this.testConnectionBtn.style.background = '#005a9e';
            }, 3000);
        }
    }
    
    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }
    
    isValidUSSDResponse(data) {
        // Check for Africa's Talking format or similar
        return data && 
               (data.response || data.text) && 
               (data.sessionId !== undefined);
    }
    
    showConnectionSuccess(message) {
        this.testConnectionBtn.textContent = message;
        this.testConnectionBtn.style.background = '#27ae60';
        this.testConnectionBtn.style.color = 'white';
    }
    
    showConnectionWarning(message) {
        this.testConnectionBtn.textContent = message;
        this.testConnectionBtn.style.background = '#f39c12';
        this.testConnectionBtn.style.color = 'white';
    }
    
    showConnectionError(message) {
        this.testConnectionBtn.textContent = message;
        this.testConnectionBtn.style.background = '#e74c3c';
        this.testConnectionBtn.style.color = 'white';
    }
    
    logConnectionTest(request, response, status) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'connection_test',
            status: status,
            request: request,
            response: response
        };
        this.logs.push(logEntry);
        this.updateLogDisplay();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.flowsim = new FlowSimApp();
});