package main

import (
	"context"
	"log"
	"sync"
	"time"
)

const (
	// Default USSD session timeout (30 seconds like real USSD)
	defaultSessionTimeout = 30 * time.Second
	// Cleanup interval
	cleanupInterval = 10 * time.Second
)

type Session struct {
	ID           string
	PhoneNumber  string
	Data         map[string]interface{}
	LastActivity time.Time
	Context      context.Context
	Cancel       context.CancelFunc
}

type SessionManager struct {
	sessions map[string]*Session
	mu       sync.RWMutex
	timeout  time.Duration
	done     chan struct{}
}

var sessionManager *SessionManager

func NewSessionManager(timeout time.Duration) *SessionManager {
	return &SessionManager{
		sessions: make(map[string]*Session),
		timeout:  timeout,
		done:     make(chan struct{}),
	}
}

func (sm *SessionManager) GetOrCreateSession(sessionID, phoneNumber string) *Session {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	
	// Check if session exists and update activity
	if session, exists := sm.sessions[sessionID]; exists {
		session.LastActivity = time.Now()
		// Reset the timeout
		session.Cancel()
		ctx, cancel := context.WithTimeout(context.Background(), sm.timeout)
		session.Context = ctx
		session.Cancel = cancel
		return session
	}
	
	// Create new session with timeout
	ctx, cancel := context.WithTimeout(context.Background(), sm.timeout)
	session := &Session{
		ID:           sessionID,
		PhoneNumber:  phoneNumber,
		Data:         make(map[string]interface{}),
		LastActivity: time.Now(),
		Context:      ctx,
		Cancel:       cancel,
	}
	
	sm.sessions[sessionID] = session
	
	// Auto-cleanup when session times out
	go func() {
		<-ctx.Done()
		sm.RemoveSession(sessionID)
		log.Printf("Session %s timed out after %v", sessionID, sm.timeout)
	}()
	
	return session
}

func (sm *SessionManager) GetSession(sessionID string) (*Session, bool) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	
	session, exists := sm.sessions[sessionID]
	return session, exists
}

func (sm *SessionManager) RemoveSession(sessionID string) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	
	if session, exists := sm.sessions[sessionID]; exists {
		session.Cancel() // Cancel the context
		delete(sm.sessions, sessionID)
		log.Printf("Session %s removed", sessionID)
	}
}

func (sm *SessionManager) CleanupExpiredSessions() {
	ticker := time.NewTicker(cleanupInterval)
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			sm.mu.Lock()
			now := time.Now()
			for id, session := range sm.sessions {
				if now.Sub(session.LastActivity) > sm.timeout {
					session.Cancel()
					delete(sm.sessions, id)
					log.Printf("Cleaned up expired session: %s", id)
				}
			}
			sm.mu.Unlock()
		case <-sm.done:
			// Cleanup all sessions on shutdown
			sm.mu.Lock()
			for id, session := range sm.sessions {
				session.Cancel()
				delete(sm.sessions, id)
			}
			sm.mu.Unlock()
			log.Println("Session cleanup completed")
			return
		}
	}
}

func (sm *SessionManager) Shutdown() {
	close(sm.done)
}

// Initialize global session manager
func init() {
	sessionManager = NewSessionManager(defaultSessionTimeout)
	go sessionManager.CleanupExpiredSessions()
}

// Legacy compatibility functions
func getOrCreateSession(sessionID string) *Session {
	return sessionManager.GetOrCreateSession(sessionID, "")
}

func getSession(sessionID string) (*Session, bool) {
	return sessionManager.GetSession(sessionID)
}

func clearSession(sessionID string) {
	sessionManager.RemoveSession(sessionID)
}