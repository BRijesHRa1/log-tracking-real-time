# 🔍 Real-Time Log Tracking System

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Prometheus](https://img.shields.io/badge/Prometheus-Latest-orange.svg)](https://prometheus.io/)
[![Grafana](https://img.shields.io/badge/Grafana-Latest-yellow.svg)](https://grafana.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-ISC-red.svg)](LICENSE)

A production-ready, scalable log aggregation and monitoring system built with modern observability practices. This system provides real-time log ingestion, persistent storage, metrics collection, and visualization capabilities for distributed applications.

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        API[API Clients]
        CURL[cURL/Postman]
    end
    
    subgraph "Application Layer"
        APP[Node.js Application<br/>Express Server<br/>Port: 3000]
        APP --> |Generates| LOGS[Synthetic Logs]
        APP --> |Exposes| METRICS[Prometheus Metrics]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL Database<br/>Port: 5432<br/>- logs table<br/>- indexes<br/>- views)]
        APP --> |INSERT/SELECT| PG
    end
    
    subgraph "Monitoring Layer"
        PROM[Prometheus<br/>Port: 9090<br/>- Metrics scraping<br/>- Time series storage]
        GRAF[Grafana<br/>Port: 3001<br/>- Dashboards<br/>- Visualizations]
        
        PROM --> |Scrapes /metrics| APP
        GRAF --> |Queries| PROM
        GRAF --> |Direct queries| PG
    end
    
    subgraph "Infrastructure Layer"
        DOCKER[Docker Compose<br/>- Container orchestration<br/>- Service discovery<br/>- Volume management]
        HEALTH[Health Checks<br/>- Database connectivity<br/>- Service availability]
    end
    
    WEB --> APP
    API --> APP
    CURL --> APP
    
    DOCKER -.-> APP
    DOCKER -.-> PG
    DOCKER -.-> PROM
    DOCKER -.-> GRAF
    
    APP --> HEALTH
    PG --> HEALTH
```

## ⚡ Technology Stack

### Core Technologies
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Node.js | 18.x | JavaScript runtime environment |
| **Web Framework** | Express.js | 5.1.0 | REST API and HTTP server |
| **Database** | PostgreSQL | 15 | Persistent log storage and analytics |
| **Metrics** | Prometheus | Latest | Time-series metrics collection |
| **Monitoring** | prom-client | 15.1.3 | Node.js Prometheus integration |
| **Visualization** | Grafana | Latest | Dashboards and alerting |
| **Containerization** | Docker Compose | 3.8 | Multi-service orchestration |

### Database Client
| Library | Version | Purpose |
|---------|---------|---------|
| **pg** | 8.11.3 | PostgreSQL client with connection pooling |

## 📊 Data Flow Architecture

```mermaid
sequenceDiagram
    participant Client
    participant Express
    participant Database
    participant Metrics
    participant Prometheus
    
    Note over Client,Prometheus: Log Generation Flow
    Client->>Express: GET / (Generate Log)
    Express->>Express: generateLogEntry()
    Express->>Database: INSERT log entry
    Database-->>Express: Return saved log with ID
    Express->>Metrics: Update counters & gauges
    Express-->>Client: JSON response with log data
    
    Note over Client,Prometheus: Metrics Scraping Flow
    Prometheus->>Express: GET /metrics
    Express->>Database: Get connection info
    Express->>Metrics: Update DB metrics
    Express-->>Prometheus: Prometheus format metrics
    
    Note over Client,Prometheus: Log Retrieval Flow
    Client->>Express: GET /logs?limit=50
    Express->>Database: SELECT recent logs
    Database-->>Express: Return log records
    Express-->>Client: JSON array of logs
```

## 🗄️ Database Schema

### Tables

#### `logs` Table
```sql
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level VARCHAR(10) NOT NULL,           -- INFO, WARN, ERROR, DEBUG
    service VARCHAR(50) NOT NULL,         -- api, auth, database, frontend, cache
    message TEXT NOT NULL,
    request_id VARCHAR(20) NOT NULL,
    response_time INTEGER,                -- Response time in milliseconds
    cpu_usage DECIMAL(5,2),              -- CPU usage percentage
    memory_usage INTEGER,                 -- Memory usage in MB
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Indexes
```sql
CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_service ON logs(service);
CREATE INDEX idx_logs_created_at ON logs(created_at);
```

#### Views
```sql
-- Recent logs (last 24 hours)
CREATE VIEW recent_logs AS
SELECT * FROM logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Aggregated statistics
CREATE VIEW log_stats AS
SELECT service, level, COUNT(*) as count,
       AVG(response_time) as avg_response_time,
       AVG(cpu_usage) as avg_cpu_usage,
       AVG(memory_usage) as avg_memory_usage
FROM logs GROUP BY service, level;
```

## 🔧 API Documentation

### Endpoints Overview

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/` | Generate and save new log entry | Log object with DB ID |
| `GET` | `/logs` | Retrieve recent logs | Array of log objects |
| `GET` | `/stats` | Get aggregated statistics | Statistics summary |
| `GET` | `/health` | System health check | Health status |
| `GET` | `/metrics` | Prometheus metrics | Metrics in Prometheus format |
| `POST` | `/generate` | Bulk generate logs | Array of generated logs |

### Detailed API Specifications

#### `GET /logs`
**Query Parameters:**
- `limit` (optional): Number of logs to retrieve (default: 50, max: 1000)

**Response Format:**
```json
{
  "message": "Recent logs retrieved",
  "count": 25,
  "logs": [
    {
      "id": 123,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "level": "INFO",
      "service": "api",
      "message": "Request processed successfully",
      "request_id": "abc123",
      "response_time": 150,
      "cpu_usage": 45.2,
      "memory_usage": 512,
      "created_at": "2024-01-15T10:30:00.123Z"
    }
  ]
}
```

#### `POST /generate`
**Request Body:**
```json
{
  "count": 100
}
```

**Response Format:**
```json
{
  "message": "100 log entries generated and saved",
  "logs": [...]
}
```

#### `GET /health`
**Response Format:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": {
    "status": "connected",
    "currentTime": "2024-01-15T10:30:00.000Z",
    "version": "PostgreSQL 15.x",
    "totalConnections": 5,
    "idleConnections": 3,
    "waitingConnections": 0
  }
}
```

## 📈 Metrics & Monitoring

### Application Metrics

#### Counters
- `log_count_total` - Total logs generated (labels: level, service)
- `db_operations_total` - Database operations count (labels: operation, status)
- `db_logs_saved_total` - Logs saved to database (labels: level, service)

#### Gauges
- `response_time_ms` - Response time in milliseconds (labels: service)
- `cpu_usage_percent` - CPU usage percentage (labels: service)
- `memory_usage_mb` - Memory usage in MB (labels: service)
- `db_connections_total` - Database connections (labels: status)

#### Histograms
- `db_query_duration_seconds` - Database query duration (labels: operation)

### Default Node.js Metrics
- Process CPU usage
- Memory usage (heap/external)
- Event loop lag
- Active handles and requests

## 🚀 Getting Started

### Prerequisites

| Requirement | Minimum Version | Recommended |
|-------------|----------------|-------------|
| **Node.js** | 16.x | 18.x+ |
| **npm** | 8.x | 9.x+ |
| **Docker** | 20.x | Latest |
| **Docker Compose** | 2.x | Latest |

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/your-username/real-time-log-tracking.git
cd real-time-log-tracking
```

2. **Start the complete stack**
```bash
docker-compose up -d
```

3. **Verify services are running**
```bash
docker-compose ps
```

### Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Application API** | http://localhost:3000 | N/A |
| **Prometheus** | http://localhost:9090 | N/A |
| **Grafana** | http://localhost:3001 | admin/admin |
| **PostgreSQL** | localhost:5432 | loguser/logpass |

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | postgres | Database host |
| `DB_PORT` | 5432 | Database port |
| `DB_NAME` | log_tracking | Database name |
| `DB_USER` | loguser | Database username |
| `DB_PASSWORD` | logpass | Database password |
| `PORT` | 3000 | Application port |

### Docker Compose Services

```yaml
services:
  postgres:    # Database service
  app:         # Node.js application
  prometheus:  # Metrics collection
  grafana:     # Visualization
```

## 📝 Usage Examples

### Generate Single Log Entry
```bash
curl http://localhost:3000/
```

### Bulk Generate Logs
```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{"count": 1000}'
```

### Retrieve Recent Logs
```bash
curl "http://localhost:3000/logs?limit=10"
```

### Check System Health
```bash
curl http://localhost:3000/health
```

### View Prometheus Metrics
```bash
curl http://localhost:3000/metrics
```

## 🏗️ Project Structure

```
real-time-log-tracking/
├── 📁 src/
│   ├── 📄 index.js          # Main Express application & API routes
│   ├── 📄 database.js       # PostgreSQL connection pool & queries
│   ├── 📄 metrics.js        # Prometheus metrics definitions
│   └── 📄 util.js           # Synthetic log data generation
├── 📄 docker-compose.yaml   # Multi-service orchestration
├── 📄 Dockerfile           # Node.js application container
├── 📄 init.sql             # PostgreSQL schema & sample data
├── 📄 prometheus-config.yaml # Prometheus scraping configuration
├── 📄 package.json         # Node.js dependencies & scripts
└── 📄 README.md            # This documentation
```

## 🔍 Development & Debugging

### Local Development Setup

1. **Install dependencies**
```bash
npm install
```

2. **Start PostgreSQL** (using Docker)
```bash
docker run --name postgres-dev \
  -e POSTGRES_DB=log_tracking \
  -e POSTGRES_USER=loguser \
  -e POSTGRES_PASSWORD=logpass \
  -p 5432:5432 -d postgres:15
```

3. **Initialize database**
```bash
psql -h localhost -U loguser -d log_tracking -f init.sql
```

4. **Start application**
```bash
npm start
```

### Debugging & Troubleshooting

#### Check Container Logs
```bash
docker-compose logs app
docker-compose logs postgres
```

#### Database Connection Test
```bash
docker-compose exec postgres psql -U loguser -d log_tracking -c "SELECT COUNT(*) FROM logs;"
```

#### Metrics Verification
```bash
curl -s http://localhost:3000/metrics | grep log_count_total
```

## 📊 Performance Characteristics

### Throughput Benchmarks
- **Single log generation**: ~500 req/sec
- **Bulk log generation (100 logs)**: ~50 req/sec
- **Log retrieval (50 logs)**: ~1000 req/sec
- **Database connections**: 20 max concurrent

### Resource Requirements
- **Memory**: 128MB - 512MB (depending on load)
- **CPU**: 0.1 - 1.0 cores
- **Storage**: Depends on log retention (approx. 1KB per log entry)
- **Network**: Minimal (REST API calls)

## 🔒 Security Considerations

- Database credentials are configurable via environment variables
- No authentication implemented (suitable for internal/development use)
- Container-to-container communication over internal networks
- Grafana admin credentials should be changed in production

## 🚀 Production Deployment

### Scaling Considerations
- Use external PostgreSQL cluster for high availability
- Implement Redis for session storage and caching
- Add load balancer for multiple application instances
- Configure log rotation and retention policies

### Monitoring in Production
- Set up Grafana alerts for error rates and response times
- Monitor database performance and connection pool usage
- Implement structured logging with correlation IDs
- Add distributed tracing for complex operations

---

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Built with ❤️ for modern observability and monitoring practices**

