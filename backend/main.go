package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"
)

// ResponsePayload standart JSON yanıt yapısıdır.
type ResponsePayload struct {
	Status    string    `json:"status"`
	Message   string    `json:"message"`
	Server    string    `json:"server"`
	Timestamp time.Time `json:"timestamp"`
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()

	// 1. Ana Test Endpoint'i: Sabit ve ultra-hızlı 200 OK döner.
	// Yük testlerinde Gateway'lerin arkasına koyacağımız hedef uç nokta burasıdır.
	mux.HandleFunc("/api/v1/test", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Mock-Backend", "Go-UltraFast-v1")
		w.WriteHeader(http.StatusOK)

		resp := ResponsePayload{
			Status:    "success",
			Message:   "Request successfully processed by backend service",
			Server:    "mock-backend-go",
			Timestamp: time.Now().UTC(),
		}

		_ = json.NewEncoder(w).Encode(resp)
	})

	// 2. Sağlık Kontrolü (Healthcheck) Endpoint'i
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"healthy"}`))
	})

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("🚀 Ultra-Fast Mock Backend başlatıldı. Port: %s", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Sunucu hatası: %v", err)
	}
}
