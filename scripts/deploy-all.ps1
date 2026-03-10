# ==============================================================================
# AODS - Deploy Script (PowerShell)
# Jalankan dari root folder project: AODS-Neural-Core\
# ==============================================================================

param(
    [switch]$SkipGit,
    [switch]$FrontendOnly,
    [switch]$BackendOnly,
    [string]$CommitMessage = "deploy: update AODS project"
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-OK($msg)   { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  [!!] $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "  [XX] $msg" -ForegroundColor Red }

# ── LANGKAH 0: Pastikan berada di root project ─────────────────────────────────
Write-Step "Cek lokasi project"
if (-not (Test-Path "frontend\package.json")) {
    Write-Fail "Jalankan script ini dari root folder project (yang berisi folder 'frontend\')"
    exit 1
}
Write-OK "Lokasi project benar"

# ── LANGKAH 1: Push ke GitHub ─────────────────────────────────────────────────
if (-not $SkipGit) {
    Write-Step "Push kode ke GitHub"

    # Cek apakah git repo sudah ada
    if (-not (Test-Path ".git")) {
        Write-Warn "Git repo belum ada, inisialisasi dulu..."
        git init
        Write-Host "  Masukkan URL GitHub repo kamu (contoh: https://github.com/username/AODS-Neural-Core.git):"
        $repoUrl = Read-Host "  URL"
        git remote add origin $repoUrl
    }

    git add .
    git commit -m $CommitMessage 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Tidak ada perubahan baru untuk di-commit, lanjut..."
    }
    git branch -M main
    git push -u origin main

    Write-OK "Kode berhasil di-push ke GitHub"
} else {
    Write-Warn "Skip git push (flag -SkipGit aktif)"
}

# ── LANGKAH 2: Deploy Frontend ke Vercel ──────────────────────────────────────
if (-not $BackendOnly) {
    Write-Step "Deploy Frontend ke Vercel"

    # Cek apakah Vercel CLI sudah terinstall
    $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
    if (-not $vercelInstalled) {
        Write-Warn "Vercel CLI belum ada, install sekarang..."
        npm install -g vercel
    }

    Set-Location frontend

    # Login jika belum
    Write-Host "  Jika diminta login, pilih 'Continue with GitHub'" -ForegroundColor Yellow
    vercel whoami 2>$null
    if ($LASTEXITCODE -ne 0) {
        vercel login
    }

    # Deploy ke production
    # --yes: skip semua pertanyaan interaktif (pakai setting yang sudah ada)
    # --prod: deploy ke production URL (bukan preview)
    Write-Host "  Deploying ke Vercel production..." -ForegroundColor Yellow
    vercel --prod --yes `
        --build-env VITE_API_URL=https://aods-api-gateway.onrender.com

    Write-OK "Frontend berhasil di-deploy ke Vercel!"
    Write-Host "  Cek dashboard: https://vercel.com/dashboard" -ForegroundColor Gray

    Set-Location ..
}

# ── LANGKAH 3: Info Backend (Render) ──────────────────────────────────────────
if (-not $FrontendOnly) {
    Write-Step "Info Deploy Backend ke Render"
    Write-Host @"

  Backend (Render) deploy otomatis lewat GitHub push yang tadi.
  Tapi kalau belum connect, lakukan ini SEKALI di browser:

  1. Buka: https://render.com
  2. New > Blueprint
  3. Pilih repo GitHub kamu
  4. Render akan baca file: config\render.yaml
  5. Isi environment variables:
       DATABASE_URL  = (dari Neon.tech dashboard)
       MAYAR_API_KEY = (dari file .env kamu)
       MAYAR_SANDBOX = true
  6. Klik Apply

  Setelah itu setiap git push ke main = auto deploy backend juga!

"@ -ForegroundColor Gray
}

# ── LANGKAH 4: Verifikasi URLs ─────────────────────────────────────────────────
Write-Step "Test endpoint setelah deploy"
Write-Host "  Tunggu 1-2 menit dulu setelah deploy selesai, lalu jalankan:" -ForegroundColor Yellow
Write-Host @"

  # Test API Gateway (Render)
  curl https://aods-api-gateway.onrender.com/health

  # Test orchestration data
  curl https://aods-api-gateway.onrender.com/api/orchestration

  # Atau pakai PowerShell:
  Invoke-RestMethod https://aods-api-gateway.onrender.com/health

"@ -ForegroundColor Gray

Write-Host "`n==> SELESAI! Cek URL Vercel di output di atas." -ForegroundColor Green
