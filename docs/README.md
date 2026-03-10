# AODS - Autonomous Orchestration of Digital Systems

**The Holographic Enterprise Metaverse**

[![AODS 2026](https://img.shields.io/badge/AODS%202026-blue)](https://mayar.id/vibe2026)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Overview

AODS (Autonomous Orchestration of Digital Systems) is a groundbreaking enterprise metaverse platform that combines 9 programming languages, immersive 3D visualization, AI-driven automation, and Web4 decentralized identity. AODS represents the future of digital infrastructure management.

### Key Features

- **Holographic 3D Interface**: Three.js-powered metaverse visualization
- **VR Support**: AFrame.js integration for immersive experiences
- **Gamification Layer**: Phaser.js 2D games on 3D canvas
- **9-Language Architecture**: Python, Go, C++, C#, Java, PHP, Ruby, React, Preact
- **AI Neural Core**: Predictive analytics and autonomous decision-making
- **Web4 Identity**: Decentralized wallet-based authentication
- **Enterprise Integration**: Connects with SAP, Oracle, Salesforce
- **Mayar Payment**: Sandbox integration for metaverse transactions

---

## Architecture

```mermaid
┌─────────────────────────────────────────────────────────────────┐
│                        AODS NEURAL CORE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Three.js  │  │  AFrame.js  │  │  Phaser.js  │  Frontend   │
│  │   (3D)      │  │   (VR)      │  │   (2D Game) │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         └─────────────────┴─────────────────┘                    │
│                           │                                      │
│                    ┌──────┴──────┐                              │
│                    │  API Gateway │                              │
│                    │   (Python)   │                              │
│                    └──────┬──────┘                              │
│                           │                                      │
│  ┌──────────┬─────────────┼─────────────┬──────────┐            │
│  │          │             │             │          │            │
│  ▼          ▼             ▼             ▼          ▼            │
│ ┌────┐   ┌────┐      ┌────────┐    ┌────┐     ┌────┐          │
│ │AI  │   │Go  │      │  C++   │    │C#  │     │Java│          │
│ │Svc │   │Tel │      │  HPC   │    │Ent │     │Brdg│          │
│ └────┘   └────┘      └────────┘    └────┘     └────┘          │
│                                          │                      │
│                                     ┌────┴────┐                 │
│                                     │PHP │Ruby│                 │
│                                     │Conn│Auto│                 │
│                                     └────┴────┘                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  Neon.tech   │    │    Redis     │
            │ PostgreSQL   │    │    Cache     │
            └──────────────┘    └──────────────┘
```

---

## Database Schema

AODS uses **Neon.tech PostgreSQL** with 8 logical schemas:

| Schema | Purpose |
|--------|---------|
| `sys_identity` | Authentication & Web4 identity |
| `core_orchestration` | System state & workflows |
| `holo_assets` | 3D assets & metadata |
| `ai_brain_vector` | ML embeddings (pgvector) |
| `fintech_ledger` | Mayar payments & subscriptions |
| `governance_audit` | ISO 27001 & COBIT compliance |
| `telemetry_stream` | Time-series metrics (timescaledb) |
| `blockchain_indexer` | Web4 transaction index |

### Quick Database Setup

```sql
-- Run this in Neon.tech SQL Editor:
\i database/neon_init.sql
```

Or use the one-liner PowerShell:
```powershell
psql $env:DATABASE_URL -f database/neon_init.sql
```

---

## Deployment

### Prerequisites

1. **Neon.tech Account**: Create database `aods_neural_core`
2. **Vercel Account**: For frontend deployment
3. **Render Account**: For backend microservices
4. **Mayar Account**: For payment integration (Sandbox)

### Step 1: Database Setup (Neon.tech)

1. Go to [Neon.tech](https://neon.tech) and create an account
2. Create a new project named `aods-neural-core`
3. Run the initialization script:
   ```bash
   psql <your-neon-connection-string> -f database/neon_init.sql
   ```
4. Copy the connection string for later use

### Step 2: Backend Deployment (Render)

1. Fork this repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Select `config/render.yaml`
6. Add environment variables:
   - `DATABASE_URL`: Your Neon connection string
   - `MAYAR_API_KEY`: Your Mayar sandbox API key
7. Deploy all services

### Step 3: Frontend Deployment (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com)
2. Import your GitHub repository
3. Configure:
   - Framework: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variable:
   - `VITE_API_URL`: Your Render API Gateway URL
5. Deploy

---

## Mayar Integration

### Sandbox Configuration

1. Register at [Mayar Sandbox](https://sandbox.mayar.id)
2. Get your API key from Dashboard
3. Configure webhook URL: `https://your-api.com/api/payments/webhook`

### Testing Payments

Use these test credentials:
- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits

---

## Local Development

### Using Docker Compose

```bash
# Clone repository
git clone https://github.com/your-org/aods.git
cd aods

# Set environment variables
cp .env.example .env
# Edit .env with your credentials

# Start all services
docker-compose -f docker/docker-compose.yml up -d

# Access services:
# - Frontend: http://localhost:3000
# - API Gateway: http://localhost:8000
# - AI Service: http://localhost:8001
# - Telemetry: http://localhost:8002
```

### Individual Service Development

```bash
# Python AI Service
cd backend/python-ai
pip install -r requirements.txt
python main.py

# Go Telemetry Service
cd backend/go-telemetry
go mod download
go run main.go

# API Gateway
cd backend/api-gateway
pip install -r requirements.txt
python main.py
```

---

## API Documentation

### Health Check
```bash
GET /health
```

### AI Predictions
```bash
POST /api/ai/predict/scaling
{
  "service_name": "python-ai",
  "metric_type": "cpu",
  "historical_data": [...]
}
```

### Telemetry
```bash
POST /api/telemetry
[
  {
    "event_type": "page_view",
    "data": {...},
    "timestamp": 1234567890,
    "session_id": "sess_abc123"
  }
]
```

### Payments (Mayar)
```bash
POST /api/payments/create
{
  "planId": "pro",
  "userId": "user_123",
  "walletAddress": "0x...",
  "amount": 99000,
  "currency": "IDR",
  "description": "AODS Pro Subscription"
}
```

## Security & Compliance

### ISO 27001 Controls Implemented

- **A.9.1.1**: Access Control Policy ✓
- **A.9.4.1**: Information Access Restriction ✓
- **A.10.1.1**: Cryptographic Controls ✓
- **A.12.4.1**: Event Logging ✓

### COBIT Controls Implemented

- **APO01.05**: IT Governance Framework ✓
- **DSS05.04**: Data Security ✓
- **DSS06.01**: Identity Management ✓

---

## Testing

### Run Tests

```bash
# Frontend tests
cd frontend
npm test

# Python AI tests
cd backend/python-ai
pytest

# Go telemetry tests
cd backend/go-telemetry
go test ./...
```

### Load Testing

```bash
# Using k6
k6 run --vus 100 --duration 30s tests/load-test.js
```

---

## Monitoring

### Prometheus Metrics

Access metrics at:
- API Gateway: `/metrics`
- Telemetry Service: `/metrics/prometheus`

### Grafana Dashboard

Import `config/grafana-dashboard.json` for visual monitoring.

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Database connection failed | Check `DATABASE_URL` format |
| CORS errors | Verify `CORS_ORIGIN` environment variable |
| VR not working | Enable WebXR in browser flags |
| Payment webhook not received | Check Render service is public |

### Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Email: support@aods.dev

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

## Acknowledgments

- **Mayar** - Payment gateway integration
- **Neon.tech** - Serverless PostgreSQL
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **Three.js Community** - 3D visualization

---

## Team

Built with passion for the Mayar Competition 2026.

**AODS - Orchestrating the Future of Digital Systems**
