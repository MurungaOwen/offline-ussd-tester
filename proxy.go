package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

func forwardUSSDRequestWithContext(ctx context.Context, req USSDRequest) (*USSDResponse, error) {
	fmt.Printf("[PROXY] Forwarding to: %s\n", req.Endpoint)
	fmt.Printf("[PROXY] Request fields - SessionID: '%s', PhoneNumber: '%s', Text: '%s', ServiceCode: '%s'\n", 
		req.SessionID, req.PhoneNumber, req.Text, req.ServiceCode)
	
	// Try form data first (Africa's Talking standard)
	fmt.Printf("[PROXY] Attempting form data request (Africa's Talking format)...\n")
	response, err := tryFormDataRequest(ctx, req)
	if err == nil {
		return response, nil
	}
	
	fmt.Printf("[PROXY] Form data request failed: %v\n", err)
	fmt.Printf("[PROXY] Attempting JSON request as fallback...\n")
	
	// Fallback to JSON if form data fails
	response, err = tryJSONRequest(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("both form data and JSON requests failed - Form: %v, JSON: %v", err, err)
	}
	
	return response, nil
}

// tryFormDataRequest sends request as form data (Africa's Talking standard)
func tryFormDataRequest(ctx context.Context, req USSDRequest) (*USSDResponse, error) {
	// Create form data exactly like Africa's Talking
	formData := url.Values{}
	formData.Set("sessionId", req.SessionID)
	formData.Set("phoneNumber", req.PhoneNumber)
	formData.Set("text", req.Text)
	formData.Set("serviceCode", req.ServiceCode)
	// Add networkCode for full compatibility
	formData.Set("networkCode", "63902") // Default network code
	
	fmt.Printf("[PROXY] Form data payload: %s\n", formData.Encode())
	
	return sendRequest(ctx, req.Endpoint, "application/x-www-form-urlencoded", strings.NewReader(formData.Encode()), req.SessionID)
}

// tryJSONRequest sends request as JSON (modern API standard)
func tryJSONRequest(ctx context.Context, req USSDRequest) (*USSDResponse, error) {
	// Create JSON payload with multiple field name formats for compatibility
	payload := map[string]string{
		// Africa's Talking standard (camelCase)
		"sessionId":    req.SessionID,
		"phoneNumber":  req.PhoneNumber,
		"text":         req.Text,
		"serviceCode":  req.ServiceCode,
		"networkCode":  "63902",
		// Alternative naming conventions (snake_case)
		"session_id":   req.SessionID,
		"phone_number": req.PhoneNumber,
		"service_code": req.ServiceCode,
		// Additional common field names
		"msisdn":       req.PhoneNumber,
	}
	
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal JSON: %w", err)
	}
	
	fmt.Printf("[PROXY] JSON payload: %s\n", string(jsonData))
	
	return sendRequest(ctx, req.Endpoint, "application/json", bytes.NewReader(jsonData), req.SessionID)
}

// sendRequest handles the actual HTTP request sending
func sendRequest(ctx context.Context, endpoint, contentType string, body io.Reader, sessionID string) (*USSDResponse, error) {
	client := &http.Client{
		Timeout: 15 * time.Second,
	}
	
	// Create a separate context for the HTTP request with its own timeout
	httpCtx, httpCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer httpCancel()
	
	httpReq, err := http.NewRequestWithContext(httpCtx, "POST", endpoint, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	
	httpReq.Header.Set("Content-Type", contentType)
	httpReq.Header.Set("Accept", "*/*") // Accept any response format
	httpReq.Header.Set("User-Agent", "FlowSim/1.0")
	
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()
	
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}
	
	fmt.Printf("[PROXY] Response status: %d\n", resp.StatusCode)
	fmt.Printf("[PROXY] Response body: %s\n", string(responseBody))
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("server returned status %d: %s", resp.StatusCode, string(responseBody))
	}
	
	// Parse response (handles both JSON and plain text)
	return parseUSSDResponse(responseBody, sessionID)
}

// parseUSSDResponse handles different response formats
func parseUSSDResponse(body []byte, sessionID string) (*USSDResponse, error) {
	var response USSDResponse
	
	// Try to parse as JSON first
	if err := json.Unmarshal(body, &response); err != nil {
		// Try alternative JSON format
		var altResponse struct {
			Response string `json:"response"`
		}
		if altErr := json.Unmarshal(body, &altResponse); altErr == nil {
			response.Response = altResponse.Response
			response.SessionID = sessionID
		} else {
			// Handle plain text response (common with real USSD servers)
			textResponse := strings.TrimSpace(string(body))
			if textResponse != "" {
				response.Response = textResponse
				response.SessionID = sessionID
			} else {
				return nil, fmt.Errorf("failed to parse response: %w", err)
			}
		}
	}
	
	// Ensure session ID is set
	if response.SessionID == "" {
		response.SessionID = sessionID
	}
	
	return &response, nil
}

// Legacy function for backward compatibility
func forwardUSSDRequest(req USSDRequest) (*USSDResponse, error) {
	ctx := context.Background()
	return forwardUSSDRequestWithContext(ctx, req)
}