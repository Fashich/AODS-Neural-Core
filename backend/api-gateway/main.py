#!/usr/bin/env python3
"""
AODS API Gateway
Main entry point for all API requests

Routes:
- /health                    -> Health check
- /api/auth/register         -> Daftar akun baru (email + password)
- /api/auth/login            -> Login (email + password)
- /api/auth/logout           -> Logout (hapus session)
- /api/auth/me               -> Cek token & ambil data user
- /api/auth/sync             -> Sync wallet address (Web3)
- /api/orchestration         -> Status semua service
- /api/ai/*                  -> Proxy ke Python AI Service
- /api/telemetry/*           -> Proxy ke Go Telemetry Service
- /api/payments/*            -> Mayar payment integration
- /api/plans                 -> Daftar subscription plans
- /api/compliance/status     -> Status compliance
- /api/workflows/*/trigger   -> Trigger workflow
- /api/services/*/scale      -> Scale service
"""

import os
import re
import secrets
import hashlib
import httpx
import asyncpg
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, field_validator
import uvicorn

# ══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════════

DATABASE_URL     = os.getenv("DATABASE_URL", "")
SERVICE_PORT     = int(os.getenv("PORT", "9000"))
AI_SERVICE_URL   = os.getenv("AI_SERVICE_URL", "http://localhost:9001")
TELEMETRY_URL    = os.getenv("TELEMETRY_SERVICE_URL", "http://localhost:9002")
MAYAR_API_KEY    = os.getenv("MAYAR_API_KEY", "")
MAYAR_SANDBOX    = os.getenv("MAYAR_SANDBOX", "true").lower() == "true"
MAYAR_API_URL    = "https://api.sandbox.mayar.id" if MAYAR_SANDBOX else "https://api.mayar.id"
PASSWORD_SALT    = os.getenv("PASSWORD_SALT", "aods_neural_core_salt_2026")
SESSION_DURATION = timedelta(days=30)

# ══════════════════════════════════════════════════════════════════════════════
# PYDANTIC MODELS
# ══════════════════════════════════════════════════════════════════════════════

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str
    services: Dict[str, str]

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    display_name: Optional[str] = None

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3 or len(v) > 30:
            raise ValueError("Username harus 3–30 karakter")
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username hanya boleh huruf, angka, dan underscore")
        return v

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Format email tidak valid")
        return v

    @field_validator("password")
    @classmethod
    def password_strong(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password minimal 8 karakter")
        return v

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    status: str
    message: str
    token: Optional[str] = None
    user: Optional[Dict[str, Any]] = None

class LogoutRequest(BaseModel):
    token: Optional[str] = None

class PaymentRequest(BaseModel):
    planId: str
    userId: str
    walletAddress: str
    amount: float
    currency: str = "IDR"
    description: str

class PaymentResponse(BaseModel):
    status: str
    transactionId: Optional[str]
    paymentUrl: Optional[str]
    sandboxMode: bool
    message: str

# ══════════════════════════════════════════════════════════════════════════════
# APP STATE & HELPERS
# ══════════════════════════════════════════════════════════════════════════════

app_state: Dict[str, Any] = {
    "startup_time": datetime.now(),
    "http_client":  None,
    "db_pool":      None,
}

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    return hashlib.sha256(f"{PASSWORD_SALT}{password}".encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_urlsafe(48)

def token_to_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

async def get_db() -> Optional[asyncpg.Pool]:
    return app_state.get("db_pool")

async def check_service_health(url: str) -> str:
    try:
        client: httpx.AsyncClient = app_state["http_client"]
        response = await client.get(f"{url}/health", timeout=5.0)
        return "online" if response.status_code == 200 else "degraded"
    except Exception:
        return "offline"

# ══════════════════════════════════════════════════════════════════════════════
# LIFESPAN
# ══════════════════════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting AODS API Gateway...")
    app_state["http_client"] = httpx.AsyncClient(timeout=30.0)

    if DATABASE_URL:
        try:
            app_state["db_pool"] = await asyncpg.create_pool(
                DATABASE_URL, min_size=2, max_size=10
            )
            print("Database connected ✓")
        except Exception as e:
            print(f"Database connection failed (running without DB): {e}")

    yield

    await app_state["http_client"].aclose()
    if app_state.get("db_pool"):
        await app_state["db_pool"].close()
    print("API Gateway shutdown complete")

# ══════════════════════════════════════════════════════════════════════════════
# FASTAPI APP
# ══════════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="AODS API Gateway",
    description="Main API Gateway for Autonomous Orchestration of Digital Systems",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ══════════════════════════════════════════════════════════════════════════════
# HEALTH CHECK
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/health", response_model=HealthResponse)
@app.head("/health")
async def health_check():
    services = {
        "api_gateway":       "online",
        "ai_service":        await check_service_health(AI_SERVICE_URL),
        "telemetry_service": await check_service_health(TELEMETRY_URL),
        "database":          "online" if app_state.get("db_pool") else "offline",
    }
    overall = "online" if services["api_gateway"] == "online" else "degraded"
    return HealthResponse(
        status=overall, service="api-gateway", version="1.0.0",
        timestamp=datetime.now().isoformat(), services=services,
    )

# ══════════════════════════════════════════════════════════════════════════════
# AUTH — REGISTER
# POST /api/auth/register
# Body: { username, email, password, display_name? }
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/auth/register", response_model=AuthResponse)
async def register(body: RegisterRequest, request: Request):
    db = await get_db()

    # Mode development (tanpa DB)
    if not db:
        return AuthResponse(
            status="success",
            message="Registrasi berhasil (mode development — DB tidak tersambung)",
            token=generate_token(),
            user={
                "id": "dev-user-id",
                "username": body.username,
                "email": body.email,
                "display_name": body.display_name or body.username,
                "auth_provider": "email",
                "email_verified": False,
            },
        )

    async with db.acquire() as conn:
        # Cek duplikat email
        if await conn.fetchval(
            "SELECT 1 FROM sys_identity.users WHERE email = $1", body.email
        ):
            raise HTTPException(status_code=409, detail="Email sudah terdaftar")

        # Cek duplikat username
        if await conn.fetchval(
            "SELECT 1 FROM sys_identity.users WHERE username = $1", body.username
        ):
            raise HTTPException(status_code=409, detail="Username sudah dipakai")

        # Insert user
        user = await conn.fetchrow(
            """
            INSERT INTO sys_identity.users
                (username, email, display_name, password_hash, auth_provider, email_verified)
            VALUES ($1, $2, $3, $4, 'email', FALSE)
            RETURNING id, username, email, display_name
            """,
            body.username,
            body.email,
            body.display_name or body.username,
            hash_password(body.password),
        )

        # Buat session
        token      = generate_token()
        expires_at = datetime.now(timezone.utc) + SESSION_DURATION
        await conn.execute(
            """
            INSERT INTO sys_identity.user_active_sessions
                (user_id, session_token, ip_address, is_current, expires_at)
            VALUES ($1, $2, $3, TRUE, $4)
            """,
            user["id"],
            token_to_hash(token),
            request.client.host if request.client else None,
            expires_at,
        )

        # Audit log
        await conn.execute(
            """
            INSERT INTO governance_audit.audit_logs
                (action, actor_type, actor_id, resource_type, resource_id, ip_address, compliance_tags)
            VALUES ('REGISTER', 'user', $1, 'user', $1, $2, ARRAY['ISO27001','COBIT'])
            """,
            user["id"],
            request.client.host if request.client else None,
        )

    return AuthResponse(
        status="success",
        message="Registrasi berhasil! Selamat datang di AODS.",
        token=token,
        user={
            "id":            str(user["id"]),
            "username":      user["username"],
            "email":         user["email"],
            "display_name":  user["display_name"],
            "auth_provider": "email",
            "email_verified": False,
        },
    )

# ══════════════════════════════════════════════════════════════════════════════
# AUTH — LOGIN
# POST /api/auth/login
# Body: { email, password }
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/auth/login", response_model=AuthResponse)
async def login(body: LoginRequest, request: Request):
    db = await get_db()
    client_ip = request.client.host if request.client else "0.0.0.0"

    # Mode development (tanpa DB)
    if not db:
        if body.password == "demo1234":
            return AuthResponse(
                status="success",
                message="Login berhasil (mode development)",
                token=generate_token(),
                user={
                    "id": "dev-user-id",
                    "username": "demo_user",
                    "email": body.email,
                    "display_name": "Demo User",
                    "auth_provider": "email",
                    "email_verified": True,
                    "subscription_plan": "Free",
                },
            )
        raise HTTPException(status_code=401, detail="Email atau password salah")

    async with db.acquire() as conn:
        # Cek brute force
        is_blocked = await conn.fetchval(
            "SELECT sys_identity.check_brute_force($1, $2::inet)",
            body.email, client_ip,
        )
        if is_blocked:
            raise HTTPException(
                status_code=429,
                detail="Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
            )

        # Ambil user
        user = await conn.fetchrow(
            """
            SELECT id, username, email, display_name, password_hash,
                   email_verified, auth_provider, avatar_url, xp_points, level,
                   is_verified, wallet_address
            FROM sys_identity.users
            WHERE email = $1
            """,
            body.email.strip().lower(),
        )

        # Verifikasi password
        success = bool(user) and (user["password_hash"] == hash_password(body.password))

        # Log attempt
        await conn.execute(
            "INSERT INTO sys_identity.login_attempts (identifier, ip_address, success) VALUES ($1, $2, $3)",
            body.email, client_ip, success,
        )

        if not success:
            raise HTTPException(status_code=401, detail="Email atau password salah")

        # Buat session
        token      = generate_token()
        expires_at = datetime.now(timezone.utc) + SESSION_DURATION
        await conn.execute(
            """
            INSERT INTO sys_identity.user_active_sessions
                (user_id, session_token, ip_address, is_current, expires_at)
            VALUES ($1, $2, $3, TRUE, $4)
            """,
            user["id"], token_to_hash(token), client_ip, expires_at,
        )

        # Update last_login
        await conn.execute(
            "UPDATE sys_identity.users SET last_login_at = NOW() WHERE id = $1",
            user["id"],
        )

        # Ambil data lengkap dari view
        profile = await conn.fetchrow(
            "SELECT subscription_plan, language, dark_mode FROM sys_identity.user_profile_full WHERE id = $1",
            user["id"],
        )

    return AuthResponse(
        status="success",
        message="Login berhasil! Selamat datang kembali.",
        token=token,
        user={
            "id":               str(user["id"]),
            "username":         user["username"],
            "email":            user["email"],
            "display_name":     user["display_name"],
            "avatar_url":       user["avatar_url"],
            "xp_points":        user["xp_points"],
            "level":            user["level"],
            "email_verified":   user["email_verified"],
            "auth_provider":    user["auth_provider"],
            "is_verified":      user["is_verified"],
            "wallet_address":   user["wallet_address"],
            "subscription_plan": profile["subscription_plan"] if profile else "Free",
            "language":         profile["language"]   if profile else "id",
            "dark_mode":        profile["dark_mode"]  if profile else True,
        },
    )

# ══════════════════════════════════════════════════════════════════════════════
# AUTH — LOGOUT
# POST /api/auth/logout
# Header: Authorization: Bearer <token>  ATAU  Body: { token }
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/auth/logout")
async def logout(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    body: Optional[LogoutRequest] = None,
):
    raw_token = None
    if credentials:
        raw_token = credentials.credentials
    elif body and body.token:
        raw_token = body.token

    db = await get_db()
    if db and raw_token:
        async with db.acquire() as conn:
            await conn.execute(
                "DELETE FROM sys_identity.user_active_sessions WHERE session_token = $1",
                token_to_hash(raw_token),
            )

    return {"status": "success", "message": "Logout berhasil. Sampai jumpa!"}

# ══════════════════════════════════════════════════════════════════════════════
# AUTH — GET CURRENT USER
# GET /api/auth/me
# Header: Authorization: Bearer <token>
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/auth/me")
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Token tidak ditemukan. Silakan login.")

    db = await get_db()

    # Mode development
    if not db:
        return {
            "id": "dev-user-id", "username": "demo_user",
            "email": "demo@aods.dev", "display_name": "Demo User",
            "auth_provider": "email", "subscription_plan": "Free",
        }

    token_hash = token_to_hash(credentials.credentials)

    async with db.acquire() as conn:
        session = await conn.fetchrow(
            "SELECT user_id, expires_at FROM sys_identity.user_active_sessions WHERE session_token = $1",
            token_hash,
        )
        if not session:
            raise HTTPException(status_code=401, detail="Token tidak valid. Silakan login ulang.")

        if session["expires_at"] < datetime.now(timezone.utc):
            await conn.execute(
                "DELETE FROM sys_identity.user_active_sessions WHERE session_token = $1",
                token_hash,
            )
            raise HTTPException(status_code=401, detail="Token kadaluarsa. Silakan login ulang.")

        user = await conn.fetchrow(
            "SELECT * FROM sys_identity.user_profile_full WHERE id = $1",
            session["user_id"],
        )
        if not user:
            raise HTTPException(status_code=404, detail="User tidak ditemukan.")

    return dict(user)

# ══════════════════════════════════════════════════════════════════════════════
# AUTH — SYNC WALLET
# POST /api/auth/sync
# Body: { walletAddress, username? }
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/auth/sync")
async def sync_user(data: dict):
    wallet_address = data.get("walletAddress")
    username       = data.get("username")

    db = await get_db()
    if not db:
        return {"status": "synced", "walletAddress": wallet_address, "created": True}

    async with db.acquire() as conn:
        existing = await conn.fetchrow(
            "SELECT id, username FROM sys_identity.users WHERE wallet_address = $1",
            wallet_address,
        )
        if existing:
            return {
                "status": "synced", "walletAddress": wallet_address,
                "userId": str(existing["id"]), "username": existing["username"],
                "created": False,
            }
        user = await conn.fetchrow(
            """
            INSERT INTO sys_identity.users
                (username, wallet_address, auth_provider, email_verified)
            VALUES ($1, $2, 'wallet', TRUE)
            RETURNING id, username
            """,
            username or f"user_{wallet_address[:8]}", wallet_address,
        )

    return {
        "status": "synced", "walletAddress": wallet_address,
        "userId": str(user["id"]), "username": user["username"],
        "created": True,
    }

# ══════════════════════════════════════════════════════════════════════════════
# ORCHESTRATION
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/orchestration")
async def get_orchestration_status():
    return {
        "services": [
            {"id": "1", "name": "python-ai",        "language": "python", "status": "healthy", "health": 98},
            {"id": "2", "name": "go-telemetry",      "language": "go",     "status": "healthy", "health": 99},
            {"id": "3", "name": "cpp-hpc",           "language": "cpp",    "status": "healthy", "health": 97},
            {"id": "4", "name": "csharp-enterprise", "language": "csharp", "status": "healthy", "health": 95},
            {"id": "5", "name": "java-bridge",       "language": "java",   "status": "healthy", "health": 96},
            {"id": "6", "name": "php-connector",     "language": "php",    "status": "healthy", "health": 94},
            {"id": "7", "name": "ruby-automation",   "language": "ruby",   "status": "healthy", "health": 93},
        ],
        "workflows": [
            {"id": "1", "name": "Auto-Scaling",     "status": "running",   "progress": 75},
            {"id": "2", "name": "Security Scan",    "status": "running",   "progress": 45},
            {"id": "3", "name": "Data Backup",      "status": "pending",   "progress":  0},
            {"id": "4", "name": "AI Training",      "status": "running",   "progress": 82},
            {"id": "5", "name": "Compliance Check", "status": "completed", "progress": 100},
        ],
    }

# ══════════════════════════════════════════════════════════════════════════════
# PROXY — AI & TELEMETRY
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/ai/{path:path}")
async def proxy_ai_post(path: str, request: Request):
    try:
        client: httpx.AsyncClient = app_state["http_client"]
        body = await request.body()
        res  = await client.post(f"{AI_SERVICE_URL}/{path}", content=body,
                                 headers={"Content-Type": "application/json"})
        return res.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {e}")

@app.get("/api/ai/{path:path}")
async def proxy_ai_get(path: str):
    try:
        client: httpx.AsyncClient = app_state["http_client"]
        return (await client.get(f"{AI_SERVICE_URL}/{path}")).json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {e}")

@app.post("/api/telemetry/{path:path}")
async def proxy_telemetry(path: str, request: Request):
    try:
        client: httpx.AsyncClient = app_state["http_client"]
        body = await request.body()
        res  = await client.post(f"{TELEMETRY_URL}/{path}", content=body,
                                 headers={"Content-Type": "application/json"})
        return res.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Telemetry service unavailable: {e}")

# ══════════════════════════════════════════════════════════════════════════════
# PAYMENTS
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/plans")
async def get_plans():
    return {"plans": [
        {"id": "free",       "name": "Free",       "price": 0,      "currency": "IDR",
         "billingCycle": "monthly", "features": ["Basic 3D Access", "Community Support"]},
        {"id": "pro",        "name": "Pro",        "price": 99000,  "currency": "IDR",
         "billingCycle": "monthly", "features": ["Advanced 3D", "AI Assistant", "VR Access"],
         "recommended": True},
        {"id": "enterprise", "name": "Enterprise", "price": 499000, "currency": "IDR",
         "billingCycle": "monthly", "features": ["All Features", "Dedicated Support", "SLA"]},
    ]}

@app.post("/api/payments/create", response_model=PaymentResponse)
async def create_payment(req: PaymentRequest):
    txn_id = f"sandbox_{datetime.now().strftime('%Y%m%d%H%M%S')}_{req.userId[:8]}"
    return PaymentResponse(
        status="pending", transactionId=txn_id, paymentUrl=None,
        sandboxMode=True, message="Sandbox payment created.",
    )

@app.post("/api/payments/confirm")
async def confirm_payment(data: dict):
    return {"status": "confirmed", "transactionId": data.get("transactionId"),
            "timestamp": datetime.now().isoformat()}

@app.post("/api/payments/webhook")
async def payment_webhook(request: Request, background_tasks: BackgroundTasks):
    await request.json()
    return {"status": "received"}

# ══════════════════════════════════════════════════════════════════════════════
# MISC
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/compliance/status")
async def compliance_status():
    return {"overallScore": 94,
            "standards": {"ISO27001": {"score": 96}, "COBIT": {"score": 92}},
            "lastAudit": datetime.now().isoformat()}

@app.post("/api/workflows/{workflow_id}/trigger")
async def trigger_workflow(workflow_id: str):
    return {"status": "triggered", "workflowId": workflow_id,
            "timestamp": datetime.now().isoformat()}

@app.post("/api/services/{service_id}/scale")
async def scale_service(service_id: str, data: dict):
    return {"status": "scaling", "serviceId": service_id,
            "replicas": data.get("replicas", 1)}

# ══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=SERVICE_PORT)
