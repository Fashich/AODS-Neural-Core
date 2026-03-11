#!/usr/bin/env python3
"""
AODS API Gateway
Main entry point for all API requests
"""

import os
import json
import asyncio
import httpx
from datetime import datetime
from typing import Dict, List, Optional, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import uvicorn

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/aods_neural_core")
SERVICE_PORT = int(os.getenv("PORT", "9000"))

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:9001")
TELEMETRY_SERVICE_URL = os.getenv("TELEMETRY_SERVICE_URL", "http://localhost:9002")
MAYAR_API_KEY = os.getenv("MAYAR_API_KEY", "")
MAYAR_API_URL = "https://api.mayar.id" if not os.getenv("MAYAR_SANDBOX") else "https://api.sandbox.mayar.id"

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str
    services: Dict[str, str]

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

app_state = {"startup_time": datetime.now(), "http_client": None}

@asynccontextmanager
async def lifespan(app: FastAPI):
    app_state["http_client"] = httpx.AsyncClient(timeout=30.0)
    yield
    await app_state["http_client"].aclose()

app = FastAPI(
    title="AODS API Gateway",
    description="Main API Gateway for Autonomous Orchestration of Digital Systems",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)

async def get_http_client():
    return app_state["http_client"]

async def check_service_health(url: str) -> str:
    try:
        client = await get_http_client()
        response = await client.get(f"{url}/health", timeout=5.0)
        return "online" if response.status_code == 200 else "degraded"
    except:
        return "offline"

@app.get("/health", response_model=HealthResponse)
@app.head("/health")
async def health_check():
    services = {
        "api_gateway": "online",
        "ai_service": await check_service_health(AI_SERVICE_URL),
        "telemetry_service": await check_service_health(TELEMETRY_SERVICE_URL),
        "database": "online",
    }
    overall = "online" if all(s == "online" for s in services.values()) else "degraded"
    return HealthResponse(
        status=overall, service="api-gateway", version="1.0.0",
        timestamp=datetime.now().isoformat(), services=services
    )

@app.get("/api/orchestration")
async def get_orchestration_status():
    return {
        "services": [
            {"id": "1", "name": "python-ai", "language": "python", "status": "healthy", "health": 98},
            {"id": "2", "name": "go-telemetry", "language": "go", "status": "healthy", "health": 99},
            {"id": "3", "name": "cpp-hpc", "language": "cpp", "status": "healthy", "health": 97},
            {"id": "4", "name": "csharp-enterprise", "language": "csharp", "status": "healthy", "health": 95},
            {"id": "5", "name": "java-bridge", "language": "java", "status": "healthy", "health": 96},
            {"id": "6", "name": "php-connector", "language": "php", "status": "healthy", "health": 94},
            {"id": "7", "name": "ruby-automation", "language": "ruby", "status": "healthy", "health": 93}
        ],
        "workflows": [
            {"id": "1", "name": "Auto-Scaling", "status": "running", "progress": 75},
            {"id": "2", "name": "Security Scan", "status": "running", "progress": 45},
            {"id": "3", "name": "Data Backup", "status": "pending", "progress": 0},
            {"id": "4", "name": "AI Training", "status": "running", "progress": 82},
            {"id": "5", "name": "Compliance Check", "status": "completed", "progress": 100}
        ]
    }

@app.post("/api/ai/{path:path}")
async def proxy_ai_service(path: str, request: Request):
    try:
        client = await get_http_client()
        body = await request.body()
        response = await client.post(f"{AI_SERVICE_URL}/{path}", content=body, headers={"Content-Type": "application/json"})
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")

@app.get("/api/ai/{path:path}")
async def proxy_ai_service_get(path: str):
    try:
        client = await get_http_client()
        response = await client.get(f"{AI_SERVICE_URL}/{path}")
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")

@app.post("/api/telemetry/{path:path}")
async def proxy_telemetry_service(path: str, request: Request):
    try:
        client = await get_http_client()
        body = await request.body()
        response = await client.post(f"{TELEMETRY_SERVICE_URL}/{path}", content=body, headers={"Content-Type": "application/json"})
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Telemetry service unavailable: {str(e)}")

@app.get("/api/plans")
async def get_subscription_plans():
    return {"plans": [
        {"id": "free", "name": "Free", "price": 0, "currency": "IDR", "billingCycle": "monthly", "features": ["Basic 3D Access"]},
        {"id": "pro", "name": "Pro", "price": 99000, "currency": "IDR", "billingCycle": "monthly", "features": ["Advanced 3D", "AI Assistant"], "recommended": True},
        {"id": "enterprise", "name": "Enterprise", "price": 499000, "currency": "IDR", "billingCycle": "monthly", "features": ["All Features", "SLA Guarantee"]}
    ]}

@app.post("/api/payments/create", response_model=PaymentResponse)
async def create_payment(request: PaymentRequest):
    transaction_id = f"sandbox_{datetime.now().strftime('%Y%m%d%H%M%S')}_{request.userId[:8]}"
    return PaymentResponse(status="pending", transactionId=transaction_id, paymentUrl=None, sandboxMode=True, message="Sandbox payment created.")

@app.post("/api/payments/confirm")
async def confirm_payment(data: dict):
    return {"status": "confirmed", "transactionId": data.get("transactionId"), "timestamp": datetime.now().isoformat()}

@app.post("/api/payments/webhook")
async def payment_webhook(request: Request, background_tasks: BackgroundTasks):
    payload = await request.json()
    return {"status": "received"}

@app.post("/api/auth/sync")
async def sync_user(data: dict):
    return {"status": "synced", "walletAddress": data.get("walletAddress"), "created": True}

@app.post("/api/workflows/{workflow_id}/trigger")
async def trigger_workflow(workflow_id: str):
    return {"status": "triggered", "workflowId": workflow_id, "timestamp": datetime.now().isoformat()}

@app.post("/api/services/{service_id}/scale")
async def scale_service(service_id: str, data: dict):
    return {"status": "scaling", "serviceId": service_id, "replicas": data.get("replicas", 1)}

@app.get("/api/compliance/status")
async def compliance_status():
    return {"overallScore": 94, "standards": {"ISO27001": {"score": 96}, "COBIT": {"score": 92}}, "lastAudit": datetime.now().isoformat()}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=SERVICE_PORT)
