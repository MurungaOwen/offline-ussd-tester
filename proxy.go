package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

func forwardUSSDRequestWithContext(ctx context.Context, req USSDRequest) (*USSDResponse, error) {
	payload := map[string]string{
		"sessionId":   req.SessionID,
		"phoneNumber": req.PhoneNumber,
		"text":        req.Text,
	}
	
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}
	
	client := &http.Client{
		Timeout: 15 * time.Second,
	}
	
	httpReq, err := http.NewRequestWithContext(ctx, "POST", req.Endpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")
	httpReq.Header.Set("User-Agent", "FlowSim/1.0")
	
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("server returned status %d: %s", resp.StatusCode, string(body))
	}
	
	var response USSDResponse
	if err := json.Unmarshal(body, &response); err != nil {
		var altResponse struct {
			Response string `json:"response"`
		}
		if altErr := json.Unmarshal(body, &altResponse); altErr == nil {
			response.Response = altResponse.Response
			response.SessionID = req.SessionID
		} else {
			return nil, fmt.Errorf("failed to parse response: %w", err)
		}
	}
	
	if response.SessionID == "" {
		response.SessionID = req.SessionID
	}
	
	return &response, nil
}

// Legacy function for backward compatibility
func forwardUSSDRequest(req USSDRequest) (*USSDResponse, error) {
	ctx := context.Background()
	return forwardUSSDRequestWithContext(ctx, req)
}