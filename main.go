package main

import (
	"context"
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

//go:embed frontend/*
var frontendFS embed.FS

const defaultPort = "8080"

func main() {
	port := flag.String("port", defaultPort, "Port to run the server on")
	flag.Parse()

	if envPort := os.Getenv("PORT"); envPort != "" {
		*port = envPort
	}

	mux := http.NewServeMux()

	setupRoutes(mux)

	server := &http.Server{
		Addr:         ":" + *port,
		Handler:      mux,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Channel to listen for interrupt signals
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	fmt.Printf("🚀 FlowSim Server Starting...\n")
	fmt.Printf("📍 Server running at: http://localhost:%s\n", *port)
	fmt.Printf("🔗 API Endpoint: http://localhost:%s/api/ussd\n", *port)
	fmt.Printf("🌐 Frontend: http://localhost:%s\n", *port)
	fmt.Printf("⏱️  Session timeout: %v\n", defaultSessionTimeout)
	fmt.Printf("\nReady for USSD testing! 🎯\n")

	// Start server in a goroutine
	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server failed to start:", err)
		}
	}()

	// Wait for interrupt signal
	<-stop
	fmt.Println("\n🛑 Shutting down server...")

	// Create a deadline for shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Shutdown session manager
	sessionManager.Shutdown()

	// Attempt graceful shutdown
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	fmt.Println("✅ Server gracefully stopped")
}

func setupRoutes(mux *http.ServeMux) {
	// Create sub-filesystem from embedded files
	frontendFiles, err := fs.Sub(frontendFS, "frontend")
	if err != nil {
		log.Fatal("Failed to create frontend sub-filesystem:", err)
	}
	
	// Serve embedded frontend files
	fileServer := http.FileServer(http.FS(frontendFiles))
	mux.Handle("/", fileServer)

	// API endpoints
	mux.HandleFunc("/api/health", healthHandler)
	mux.HandleFunc("/api/ussd", corsMiddleware(ussdHandler))
	mux.HandleFunc("/api/session/clear", corsMiddleware(clearSessionHandler))
}

