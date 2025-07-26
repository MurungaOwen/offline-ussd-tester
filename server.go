package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
)

type USSDRequest struct {
	Endpoint    string `json:"endpoint"`
	SessionID   string `json:"sessionId"`
	PhoneNumber string `json:"phoneNumber"`
	Text        string `json:"text"`
}

type USSDResponse struct {
	Response  string `json:"response"`
	SessionID string `json:"sessionId"`
}

type HealthResponse struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Timestamp string `json:"timestamp"`
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		next(w, r)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	response := HealthResponse{
		Status:    "ok",
		Service:   "FlowSim USSD Proxy Server",
		Timestamp: time.Now().Format(time.RFC3339),
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func ussdHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var req USSDRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	log.Printf("[USSD] Request - Session: %s, Phone: %s, Text: %s, Endpoint: %s",
		req.SessionID, req.PhoneNumber, req.Text, req.Endpoint)
	
	// Get or create session with context
	session := sessionManager.GetOrCreateSession(req.SessionID, req.PhoneNumber)
	
	// Check if session has timed out
	select {
	case <-session.Context.Done():
		log.Printf("[USSD] Session %s has timed out", req.SessionID)
		response := USSDResponse{
			Response:  "END Your session has timed out. Please dial again.",
			SessionID: req.SessionID,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	default:
		// Session is still active
	}
	
	if req.Endpoint == "" {
		simulatedResponse := handleSimulation(req)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(simulatedResponse)
		return
	}
	
	// Forward request with session context
	response, err := forwardUSSDRequestWithContext(session.Context, req)
	if err != nil {
		log.Printf("[USSD] Error forwarding request: %v", err)
		http.Error(w, fmt.Sprintf("Failed to forward request: %v", err), http.StatusBadGateway)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func clearSessionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	var req struct {
		SessionID string `json:"sessionId"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	clearSession(req.SessionID)
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

func handleSimulation(req USSDRequest) USSDResponse {
	session := getOrCreateSession(req.SessionID)
	session.PhoneNumber = req.PhoneNumber
	session.LastActivity = time.Now()
	
	response := USSDResponse{
		SessionID: req.SessionID,
	}
	
	log.Printf("[Simulation] Processing USSD text: %s", req.Text)
	
	// Parse USSD string to understand the flow
	parts := strings.Split(strings.Trim(req.Text, "#"), "*")
	log.Printf("[Simulation] USSD parts: %v", parts)
	
	if req.Text == "*123#" {
		response.Response = "CON Welcome to FlowSim Demo Bank\n1. Check Balance\n2. Transfer Money\n3. Buy Airtime\n4. Account Info"
	} else if req.Text == "*123*1#" {
		response.Response = "END Your current balance is:\n\nMain Account: $1,234.56\nSavings: $5,678.90\n\nThank you for banking with us!"
	} else if req.Text == "*123*2#" {
		response.Response = "CON Transfer Money\n\nEnter recipient phone number:\n(Format: +1234567890)"
	} else if strings.HasPrefix(req.Text, "*123*2*") && len(parts) == 4 {
		// Transfer flow: *123*2*phone#
		phoneNumber := parts[3]
		response.Response = fmt.Sprintf("CON Transfer to %s\n\nEnter amount to transfer:\n(Minimum: $1.00)", phoneNumber)
	} else if strings.HasPrefix(req.Text, "*123*2*") && len(parts) == 5 {
		// Transfer confirmation: *123*2*phone*amount#
		phoneNumber := parts[3]
		amount := parts[4]
		response.Response = fmt.Sprintf("CON Confirm Transfer\n\nTo: %s\nAmount: $%s\n\n1. Confirm\n2. Cancel", phoneNumber, amount)
	} else if strings.HasPrefix(req.Text, "*123*2*") && strings.HasSuffix(req.Text, "*1#") {
		// Transfer confirmed
		response.Response = "END Transfer successful!\n\nTransaction ID: TXN123456\nFee: $0.50\n\nThank you!"
	} else if req.Text == "*123*3#" {
		response.Response = "CON Buy Airtime\n\nSelect amount:\n1. $5\n2. $10\n3. $20\n4. $50\n5. Custom amount"
	} else if req.Text == "*123*3*1#" {
		response.Response = "END Airtime Purchase\n\n$5 airtime added to your account\n\nTransaction ID: AIR789\nNew balance: $1,229.56"
	} else if req.Text == "*123*3*2#" {
		response.Response = "END Airtime Purchase\n\n$10 airtime added to your account\n\nTransaction ID: AIR790\nNew balance: $1,224.56"
	} else if req.Text == "*123*3*5#" {
		response.Response = "CON Custom Airtime\n\nEnter amount ($1-$100):"
	} else if strings.HasPrefix(req.Text, "*123*3*5*") && len(parts) == 5 {
		// Custom airtime amount entered
		amount := parts[4]
		response.Response = fmt.Sprintf("CON Confirm Purchase\n\n$%s airtime\n\n1. Confirm\n2. Cancel", amount)
	} else if req.Text == "*123*4#" {
		response.Response = "END Account Information\n\nName: John Doe\nAccount: ****1234\nType: Checking\nStatus: Active\n\nFor support call: 1-800-FLOWSIM"
	} else {
		response.Response = "END Thank you for using FlowSim Demo Bank!\n\nFor assistance, call 1-800-FLOWSIM\n\nSession ended."
	}
	
	log.Printf("[Simulation] Response: %s", response.Response)
	return response
}