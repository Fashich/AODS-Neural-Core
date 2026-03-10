/*
AODS Go Telemetry Microservice
High-Performance Monitoring & Metrics Collection

Handles:
- Real-time metrics ingestion
- High-throughput event streaming
- Performance monitoring
- Alert generation
*/

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Configuration
var (
	databaseURL = getEnv("DATABASE_URL", "postgresql://user:pass@localhost/aods_neural_core")
	servicePort = getEnv("PORT", "9002")
)

// Metrics collectors
var (
	httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "aods_http_requests_total",
			Help: "Total HTTP requests",
		},
		[]string{"method", "endpoint", "status"},
	)
	
	metricsIngested = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "aods_metrics_ingested_total",
			Help: "Total metrics ingested",
		},
	)
	
	activeConnections = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "aods_active_connections",
			Help: "Number of active connections",
		},
	)
)

func init() {
	prometheus.MustRegister(httpRequestsTotal)
	prometheus.MustRegister(metricsIngested)
	prometheus.MustRegister(activeConnections)
}

// Models
type TelemetryEvent struct {
	EventType string                 `json:"event_type" binding:"required"`
	Data      map[string]interface{} `json:"data"`
	Timestamp int64                  `json:"timestamp"`
	SessionID string                 `json:"session_id"`
	UserID    *string                `json:"user_id,omitempty"`
}

type MetricData struct {
	ServiceName   string            `json:"service_name" binding:"required"`
	MetricName    string            `json:"metric_name" binding:"required"`
	MetricValue   float64           `json:"metric_value"`
	Unit          string            `json:"unit,omitempty"`
	Tags          map[string]string `json:"tags,omitempty"`
	RecordedAt    time.Time         `json:"recorded_at"`
}

type SystemEvent struct {
	EventType string                 `json:"event_type" binding:"required"`
	ServiceName string               `json:"service_name"`
	Severity  string                 `json:"severity"`
	Message   string                 `json:"message"`
	Context   map[string]interface{} `json:"context,omitempty"`
	RecordedAt time.Time             `json:"recorded_at"`
}

type PerformanceMetric struct {
	Operation    string                 `json:"operation" binding:"required"`
	DurationMs   int                    `json:"duration_ms"`
	Success      bool                   `json:"success"`
	ErrorMessage *string                `json:"error_message,omitempty"`
	Context      map[string]interface{} `json:"context,omitempty"`
	RecordedAt   time.Time              `json:"recorded_at"`
}

type HealthResponse struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Version   string `json:"version"`
	Uptime    string `json:"uptime"`
	GoVersion string `json:"go_version"`
	Goroutines int   `json:"goroutines"`
}

// Global state
type ServerState struct {
	DB          *pgxpool.Pool
	StartTime   time.Time
	EventBuffer chan TelemetryEvent
	mu          sync.RWMutex
}

var state *ServerState

// Helper functions
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func connectDB() (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database URL: %v", err)
	}
	
	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnLifetime = time.Hour
	
	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %v", err)
	}
	
	// Test connection
	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("unable to ping database: %v", err)
	}
	
	return pool, nil
}

// Batch insert events
func batchInsertEvents(events []TelemetryEvent) error {
	if len(events) == 0 {
		return nil
	}
	
	ctx := context.Background()
	
	// Use COPY for efficient bulk insert
	copyCount, err := state.DB.CopyFrom(
		ctx,
		pgx.Identifier{"telemetry_stream", "events"},
		[]string{"event_type", "service_name", "severity", "message", "context", "recorded_at"},
		pgx.CopyFromSlice(len(events), func(i int) ([]interface{}, error) {
			event := events[i]
			contextJSON, _ := json.Marshal(event.Data)
			
			return []interface{}{
				event.EventType,
				event.SessionID,
				"info",
				event.EventType,
				contextJSON,
				time.Unix(event.Timestamp/1000, 0),
			}, nil
		}),
	)
	
	if err != nil {
		return fmt.Errorf("batch insert failed: %v", err)
	}
	
	log.Printf("Batch inserted %d events", copyCount)
	return nil
}

// Event buffer processor
func processEventBuffer() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	
	var batch []TelemetryEvent
	
	for {
		select {
		case event := <-state.EventBuffer:
			batch = append(batch, event)
			
			// Flush if batch is large enough
			if len(batch) >= 100 {
				if err := batchInsertEvents(batch); err != nil {
					log.Printf("Error inserting batch: %v", err)
				}
				batch = batch[:0]
			}
			
		case <-ticker.C:
			// Periodic flush
			if len(batch) > 0 {
				if err := batchInsertEvents(batch); err != nil {
					log.Printf("Error inserting batch: %v", err)
				}
				batch = batch[:0]
			}
		}
	}
}

// HTTP Handlers
func healthHandler(c *gin.Context) {
	uptime := time.Since(state.StartTime)
	
	c.JSON(http.StatusOK, HealthResponse{
		Status:     "healthy",
		Service:    "go-telemetry",
		Version:    "1.0.0",
		Uptime:     uptime.String(),
		GoVersion:  runtime.Version(),
		Goroutines: runtime.NumGoroutine(),
	})
}

func ingestTelemetryHandler(c *gin.Context) {
	var events []TelemetryEvent
	
	if err := c.ShouldBindJSON(&events); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Add to buffer for batch processing
	for _, event := range events {
		select {
		case state.EventBuffer <- event:
			metricsIngested.Inc()
		default:
			// Buffer full, drop event (in production, use persistent queue)
			log.Printf("Event buffer full, dropping event")
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"status":  "accepted",
		"count":   len(events),
		"message": "Events queued for processing",
	})
}

func ingestMetricsHandler(c *gin.Context) {
	var metrics []MetricData
	
	if err := c.ShouldBindJSON(&metrics); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	ctx := context.Background()
	
	// Insert metrics
	for _, metric := range metrics {
		tagsJSON, _ := json.Marshal(metric.Tags)
		
		_, err := state.DB.Exec(ctx, `
			INSERT INTO telemetry_stream.metrics 
			(service_name, metric_name, metric_value, unit, tags, recorded_at)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, metric.ServiceName, metric.MetricName, metric.MetricValue, 
			metric.Unit, tagsJSON, metric.RecordedAt)
		
		if err != nil {
			log.Printf("Error inserting metric: %v", err)
		}
	}
	
	metricsIngested.Add(float64(len(metrics)))
	
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"count":  len(metrics),
	})
}

func ingestEventsHandler(c *gin.Context) {
	var events []SystemEvent
	
	if err := c.ShouldBindJSON(&events); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	ctx := context.Background()
	
	for _, event := range events {
		contextJSON, _ := json.Marshal(event.Context)
		
		_, err := state.DB.Exec(ctx, `
			INSERT INTO telemetry_stream.events 
			(event_type, service_name, severity, message, context, recorded_at)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, event.EventType, event.ServiceName, event.Severity, 
			event.Message, contextJSON, event.RecordedAt)
		
		if err != nil {
			log.Printf("Error inserting event: %v", err)
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"count":  len(events),
	})
}

func ingestPerformanceHandler(c *gin.Context) {
	var metrics []PerformanceMetric
	
	if err := c.ShouldBindJSON(&metrics); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	ctx := context.Background()
	
	for _, metric := range metrics {
		contextJSON, _ := json.Marshal(metric.Context)
		
		_, err := state.DB.Exec(ctx, `
			INSERT INTO telemetry_stream.performance 
			(operation, duration_ms, success, error_message, context, recorded_at)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, metric.Operation, metric.DurationMs, metric.Success, 
			metric.ErrorMessage, contextJSON, metric.RecordedAt)
		
		if err != nil {
			log.Printf("Error inserting performance metric: %v", err)
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"count":  len(metrics),
	})
}

func getMetricsHandler(c *gin.Context) {
	serviceName := c.Query("service")
	metricName := c.Query("metric")
	duration := c.DefaultQuery("duration", "1h")
	
	durationParsed, err := time.ParseDuration(duration)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid duration"})
		return
	}
	
	ctx := context.Background()
	
	query := `
		SELECT service_name, metric_name, metric_value, unit, recorded_at
		FROM telemetry_stream.metrics
		WHERE recorded_at > $1
	`
	args := []interface{}{time.Now().Add(-durationParsed)}
	
	if serviceName != "" {
		query += " AND service_name = $2"
		args = append(args, serviceName)
	}
	
	if metricName != "" {
		query += " AND metric_name = $3"
		args = append(args, metricName)
	}
	
	query += " ORDER BY recorded_at DESC LIMIT 100"
	
	rows, err := state.DB.Query(ctx, query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	
	var results []map[string]interface{}
	
	for rows.Next() {
		var service, name, unit string
		var value float64
		var recordedAt time.Time
		
		if err := rows.Scan(&service, &name, &value, &unit, &recordedAt); err != nil {
			continue
		}
		
		results = append(results, map[string]interface{}{
			"service_name": service,
			"metric_name":  name,
			"value":        value,
			"unit":         unit,
			"recorded_at":  recordedAt,
		})
	}
	
	c.JSON(http.StatusOK, gin.H{
		"metrics": results,
		"count":   len(results),
	})
}

func getDashboardMetricsHandler(c *gin.Context) {
	ctx := context.Background()
	
	// Get aggregated metrics for dashboard
	query := `
		SELECT 
			metric_name,
			AVG(metric_value) as avg_value,
			MAX(metric_value) as max_value,
			MIN(metric_value) as min_value,
			COUNT(*) as count
		FROM telemetry_stream.metrics
		WHERE recorded_at > NOW() - INTERVAL '1 hour'
		GROUP BY metric_name
		ORDER BY count DESC
		LIMIT 20
	`
	
	rows, err := state.DB.Query(ctx, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	
	var results []map[string]interface{}
	
	for rows.Next() {
		var name string
		var avg, max, min float64
		var count int64
		
		if err := rows.Scan(&name, &avg, &max, &min, &count); err != nil {
			continue
		}
		
		results = append(results, map[string]interface{}{
			"metric_name": name,
			"avg_value":   avg,
			"max_value":   max,
			"min_value":   min,
			"count":       count,
		})
	}
	
	c.JSON(http.StatusOK, gin.H{
		"aggregated_metrics": results,
	})
}

func main() {
	// Initialize state
	state = &ServerState{
		StartTime:   time.Now(),
		EventBuffer: make(chan TelemetryEvent, 10000),
	}
	
	// Connect to database
	db, err := connectDB()
	if err != nil {
		log.Printf("Warning: Database connection failed: %v", err)
		log.Printf("Running in mock mode")
	} else {
		state.DB = db
		defer db.Close()
		log.Printf("Database connected successfully")
	}
	
	// Start event processor
	go processEventBuffer()
	
	// Setup Gin router
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(cors.Default())
	
	// Metrics middleware
	router.Use(func(c *gin.Context) {
		start := time.Now()
		c.Next()
		
		duration := time.Since(start)
		httpRequestsTotal.WithLabelValues(
			c.Request.Method,
			c.FullPath(),
			fmt.Sprintf("%d", c.Writer.Status()),
		).Inc()
		
		_ = duration
	})
	
	// Routes
	router.GET("/health", healthHandler)
	router.POST("/telemetry", ingestTelemetryHandler)
	router.POST("/metrics", ingestMetricsHandler)
	router.POST("/events", ingestEventsHandler)
	router.POST("/performance", ingestPerformanceHandler)
	router.GET("/metrics/query", getMetricsHandler)
	router.GET("/metrics/dashboard", getDashboardMetricsHandler)
	router.GET("/metrics/prometheus", gin.WrapH(promhttp.Handler()))
	
	// Start server
	addr := fmt.Sprintf("0.0.0.0:%s", servicePort)
	log.Printf("AODS Telemetry Service starting on %s", addr)
	
	if err := router.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
