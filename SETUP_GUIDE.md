# AODS - Setup & Deployment Guide

## Autonomous Orchestration of Digital Systems

---

## 📋 Daftar Port (Sudah Diganti!)

| Service | Port Lama | Port Baru | Keterangan |
| ------- | --------- | --------- | ---------- |
| API Gateway | 8000 | **9000** | Entry point utama |
| Python AI | 8001 | **9001** | Machine Learning |
| Go Telemetry | 8002 | **9002** | Monitoring |
| C++ HPC | 8003 | **9003** | Compute |
| C# Enterprise | 8004 | **9004** | Enterprise Integration |
| Java Bridge | 8005 | **9005** | Legacy Systems |
| PHP Connector | 8006 | **9006** | Third-party APIs |
| Ruby Automation | 8007 | **9007** | Task Automation |
| Nginx | 80 | **9080** | Reverse Proxy |
| Redis | 6379 | **6380** | Cache/Queue |

---

## 🚀 Langkah 1: Setup Database (Neon.tech)

### 1.1 Buat Akun Neon.tech

1. Buka <https://neon.tech>
2. Sign up dengan GitHub atau email
3. Buat project baru: `aods-neural-core`

### 1.2 Jalankan SQL Initialization

```powershell
# Copy connection string dari Neon dashboard
$env:DATABASE_URL = "postgresql://username:password@hostname.neon.tech/aods_neural_core?sslmode=require"

# Jalankan script inisialisasi (butuh psql)
psql $env:DATABASE_URL -f database/neon_init.sql
```

**Atau** copy-paste isi `database/neon_init.sql` ke SQL Editor di Neon dashboard.

---

## 🖥️ Langkah 2: Setup Frontend (Local Development)

### 2.1 Install Dependencies

```powershell
cd frontend

# Install dengan pnpm (recommended)
pnpm install

# Atau dengan npm
npm install
```

### 2.2 Environment Variables

Buat file `.env` di folder `frontend`:

```env
VITE_API_URL=http://localhost:9000
```

### 2.3 Jalankan Development Server

```powershell
# Development mode (hot reload)
pnpm run dev

# Buka browser: http://localhost:5173
```

### 2.4 Build untuk Production

```powershell
pnpm run build

# Output ada di folder frontend/dist
```

---

## 🔧 Langkah 3: Setup Backend (Docker - Recommended)

### 3.1 Install Docker Desktop

Download dari: <https://www.docker.com/products/docker-desktop>

### 3.2 Environment Variables

Buat file `.env` di root project:

```env
DATABASE_URL=postgresql://username:password@hostname.neon.tech/aods_neural_core?sslmode=require
MAYAR_API_KEY=your_mayar_sandbox_key
MAYAR_SANDBOX=true
```

### 3.3 Jalankan Semua Services

```powershell
# Di root project
docker-compose -f docker/docker-compose.yml up -d

# Tunggu 1-2 menit untuk semua service ready
```

### 3.4 Cek Status Services

```powershell
# Lihat container yang berjalan
docker ps

# Cek log service
docker logs aods-api-gateway
docker logs aods-python-ai
```

### 3.5 Test Services

```powershell
# Test API Gateway
curl http://localhost:9000/health

# Test AI Service
curl http://localhost:9001/health

# Test semua services
.\scripts\test-all.ps1
```

---

## 🧪 Langkah 4: Testing

### 4.1 Test dengan PowerShell Script

```powershell
cd scripts
.\test-all.ps1
```

### 4.2 Test Manual (Browser/Postman)

```http
GET http://localhost:9000/health
GET http://localhost:9000/api/orchestration
GET http://localhost:9000/api/plans
```

### 4.3 Test Payment (Mayar Sandbox)

```powershell
# Create test payment
$body = @{
    planId = "pro"
    userId = "test_user"
    walletAddress = "0x1234567890"
    amount = 99000
    currency = "IDR"
    description = "AODS Pro Subscription"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:9000/api/payments/create" -Method POST -Body $body -ContentType "application/json"
```

---

## 🌐 Langkah 5: Deployment ke Production

### 5.1 Frontend (Vercel)

#### Setup

1. Buka <https://vercel.com>
2. Import GitHub repository
3. Configure:
   - Framework: `Vite`
   - Root Directory: `frontend`
   - Build Command: `pnpm run build` (atau `npm run build`)
   - Output Directory: `dist`

4. Environment Variables:

   ```env
   VITE_API_URL=https://aods-api-gateway.onrender.com
   ```

5. Deploy!

#### Atau Deploy via CLI

```powershell
cd frontend
npm i -g vercel
vercel --prod
```

---

### 5.2 Backend (Render)

#### Konfigurasi Render

1. Buka <https://render.com>
2. Connect GitHub repository
3. Pilih "Blueprint"
4. Pilih file `config/render.yaml`

#### Environment Variables di Render

```env
DATABASE_URL=<your-neon-connection-string>
MAYAR_API_KEY=<your-mayar-key>
MAYAR_SANDBOX=true
```

#### Deploy

Klik "Apply" dan Render akan deploy semua 8 services otomatis!

---

### 5.3 Database (Sudah di Neon.tech)

Database sudah jalan di Neon.tech sejak Langkah 1.

---

## 📊 Monitoring Services

### Cek Port yang Digunakan

```powershell
# Cek port 9000-9007
Get-NetTCPConnection -LocalPort 9000,9001,9002,9003,9004,9005,9006,9007

# Cek semua port AODS
9000..9007 | ForEach-Object {
    $port = $_
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) { "Port $port : ACTIVE" } else { "Port $port : FREE" }
}
```

### Health Check Semua Services

```powershell
$ports = 9000..9007
$ports | ForEach-Object {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$_/health" -TimeoutSec 2
        "Port $_ : ✓ $($response.status)"
    } catch {
        "Port $_ : ✗ Offline"
    }
}
```

---

## 🔄 Development Workflow

### Edit Kode → Test → Deploy

```powershell
# 1. Edit kode di VS Code

# 2. Test lokal
cd frontend
pnpm run dev

# 3. Test backend (di terminal lain)
docker-compose -f docker/docker-compose.yml up -d

# 4. Run tests
.\scripts\test-all.ps1

# 5. Build & Deploy
git add .
git commit -m "Update feature"
git push origin main

# Vercel & Render akan auto-deploy!
```

---

## 🐛 Troubleshooting

### Port Sudah Digunakan

```powershell
# Cek apa yang pakai port 9000
Get-Process -Id (Get-NetTCPConnection -LocalPort 9000).OwningProcess

# Kill process (hati-hati!)
Stop-Process -Id <PID>
```

### Docker Container Error

```powershell
# Restart semua services
docker-compose -f docker/docker-compose.yml down
docker-compose -f docker/docker-compose.yml up -d

# Rebuild tanpa cache
docker-compose -f docker/docker-compose.yml build --no-cache
docker-compose -f docker/docker-compose.yml up -d
```

### Database Connection Failed

```powershell
# Test koneksi
psql $env:DATABASE_URL -c "SELECT 1"

# Cek format connection string
# Harus: postgresql://user:pass@host.neon.tech/db?sslmode=require
```

### Frontend Build Error

```powershell
cd frontend

# Hapus node_modules & reinstall
rm -rf node_modules
pnpm install

# Clear cache
pnpm store prune
```

---

## 📁 Struktur Folder (Setelah Pindah ke Root)

```text
/mnt/okcomputer/output/
├── frontend/              # React + Three.js + AFrame.js
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/               # 8 Microservices
│   ├── api-gateway/       # Python (Port 9000)
│   ├── python-ai/         # Python (Port 9001)
│   ├── go-telemetry/      # Go (Port 9002)
│   ├── cpp-hpc/           # C++ (Port 9003)
│   ├── csharp-enterprise/ # C# (Port 9004)
│   ├── java-bridge/       # Java (Port 9005)
│   ├── php-connector/     # PHP (Port 9006)
│   └── ruby-automation/   # Ruby (Port 9007)
├── database/
│   └── neon_init.sql      # Schema lengkap
├── docker/
│   ├── docker-compose.yml
│   └── Dockerfile.*
├── config/
│   ├── vercel.json
│   └── render.yaml
├── scripts/
│   ├── test-all.sh
│   └── test-all.ps1
└── docs/
    └── README.md
```

---

## ✅ Pre-Deployment Checklist

- [ ] Database Neon.tech sudah setup
- [ ] Environment variables sudah diisi
- [ ] `pnpm install` berhasil di frontend
- [ ] `docker-compose up` berhasil
- [ ] Semua services health check ✓
- [ ] Test script passed
- [ ] Frontend build berhasil
- [ ] GitHub repo sudah push

---

## 🎯 Quick Commands Reference

```powershell
# Setup awal
pnpm install                    # Install frontend deps
docker-compose up -d           # Start backend

# Development
pnpm run dev                   # Frontend dev server
docker logs -f aods-api-gateway # Monitor API logs

# Testing
.\scripts\test-all.ps1        # Test semua services

# Deployment
git push origin main           # Auto deploy ke Vercel/Render

# Monitoring
Get-NetTCPConnection -LocalPort 9000,9001,9002
docker ps
```

---

## 📞 Butuh Bantuan?

1. Cek log: `docker logs <container-name>`
2. Test manual: `curl http://localhost:9000/health`
3. Lihat README: `docs/README.md`

---

## 📝 Catatan

1. Jangan lupa untuk mengatur environment variable di file `.env`
2. Jangan lupa untuk mengatur port di file `docker-compose.yml`
3. Jangan lupa untuk mengatur port di file `.env`
