#!/usr/bin/env python3
"""
AODS API Gateway
Main entry point for all API requests

Routes requests to appropriate microservices:
- /api/ai/* -> Python AI Service
- /api/telemetry/* -> Go Telemetry Service
- /api/payments/* -> Mayar Integration
- /api/health -> System health check
"""

import os
import json
import asyncio
import httpx
from datetime import datetime
from typing import Dict, List, Optional, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import uvicorn

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/aods_neural_core")
SERVICE_PORT = int(os.getenv("PORT", "9000"))

# Microservice URLs
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:9001")
TELEMETRY_SERVICE_URL = os.getenv("TELEMETRY_SERVICE_URL", "http://localhost:9002")
MAYAR_API_KEY = os.getenv("MAYAR_API_KEY", "")
MAYAR_API_URL = "https://api.mayar.id" if not os.getenv("MAYAR_SANDBOX") else "https://api.sandbox.mayar.id"

# Pydantic Models
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

class Plan(BaseModel):
    id: str
    name: str
    description: str
    price: float
    currency: str
    billingCycle: str
    features: List[str]
    recommended: Optional[bool] = False

class OrchestrationStatus(BaseModel):
    services: List[Dict[str, Any]]
    workflows: List[Dict[str, Any]]

# Global state
app_state = {
    "startup_time": datetime.now(),
    "http_client": None
}

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    print("Starting AODS API Gateway...")
    
    # Initialize HTTP client
    app_state["http_client"] = httpx.AsyncClient(timeout=30.0)
    
    yield
    
    # Cleanup
    await app_state["http_client"].aclose()
    print("API Gateway shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="AODS API Gateway",
    description="Main API Gateway for Autonomous Orchestration of Digital Systems",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer(auto_error=False)

# Helper functions
async def get_http_client():
    return app_state["http_client"]

async def check_service_health(url: str) -> str:
    """Check health of a microservice"""
    try:
        client = await get_http_client()
        response = await client.get(f"{url}/health", timeout=5.0)
        if response.status_code == 200:
            return "online"
        return "degraded"
    except:
        return "offline"

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """System health check - aggregates all services"""
    
    # Check all services
    services = {
        "api_gateway": "online",
        "ai_service": await check_service_health(AI_SERVICE_URL),
        "telemetry_service": await check_service_health(TELEMETRY_SERVICE_URL),
        "database": "online",  # Would check actual DB connection
    }
    
    # Overall status
    overall = "online" if all(s == "online" for s in services.values()) else "degraded"
    
    return HealthResponse(
        status=overall,
        service="api-gateway",
        version="1.0.0",
        timestamp=datetime.now().isoformat(),
        services=services
    )

# Orchestration status
@app.get("/api/orchestration")
async def get_orchestration_status():
    """Get current orchestration status"""
    
    # Mock data - in production would aggregate from all services
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

# AI Service Proxy
@app.post("/api/ai/{path:path}")
async def proxy_ai_service(path: str, request: Request):
    """Proxy requests to AI service"""
    try:
        client = await get_http_client()
        body = await request.body()
        
        response = await client.post(
            f"{AI_SERVICE_URL}/{path}",
            content=body,
            headers={"Content-Type": "application/json"}
        )
        
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")

@app.get("/api/ai/{path:path}")
async def proxy_ai_service_get(path: str):
    """Proxy GET requests to AI service"""
    try:
        client = await get_http_client()
        response = await client.get(f"{AI_SERVICE_URL}/{path}")
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")

# Telemetry Service Proxy
@app.post("/api/telemetry/{path:path}")
async def proxy_telemetry_service(path: str, request: Request):
    """Proxy requests to telemetry service"""
    try:
        client = await get_http_client()
        body = await request.body()
        
        response = await client.post(
            f"{TELEMETRY_SERVICE_URL}/{path}",
            content=body,
            headers={"Content-Type": "application/json"}
        )
        
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Telemetry service unavailable: {str(e)}")

# Payment endpoints
@app.get("/api/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    return {
        "plans": [
            {
                "id": "free",
                "name": "Free",
                "description": "Basic access to AODS metaverse",
                "price": 0,
                "currency": "IDR",
                "billingCycle": "monthly",
                "features": ["Basic 3D Access", "Limited Assets", "Community Support"]
            },
            {
                "id": "pro",
                "name": "Pro",
                "description": "Professional metaverse tools",
                "price": 99000,
                "currency": "IDR",
                "billingCycle": "monthly",
                "features": ["Advanced 3D", "Unlimited Assets", "AI Assistant", "VR Access"],
                "recommended": True
            },
            {
                "id": "enterprise",
                "name": "Enterprise",
                "description": "Full enterprise orchestration",
                "price": 499000,
                "currency": "IDR",
                "billingCycle": "monthly",
                "features": ["All Features", "Dedicated Support", "Custom Integrations", "SLA Guarantee"]
            }
        ]
    }

@app.post("/api/payments/create", response_model=PaymentResponse)
async def create_payment(request: PaymentRequest):
    """Create a new payment through Mayar"""
    
    try:
        # In sandbox mode, simulate payment creation
        if not MAYAR_API_KEY or os.getenv("MAYAR_SANDBOX"):
            transaction_id = f"sandbox_{datetime.now().strftime('%Y%m%d%H%M%S')}_{request.userId[:8]}"
            
            return PaymentResponse(
                status="pending",
                transactionId=transaction_id,
                paymentUrl=None,
                sandboxMode=True,
                message="Sandbox payment created. Use test credentials to complete."
            )
        
        # Production: Call Mayar API
        client = await get_http_client()
        
        mayar_response = await client.post(
            f"{MAYAR_API_URL}/v1/payments",
            headers={
                "Authorization": f"Bearer {MAYAR_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "amount": request.amount,
                "currency": request.currency,
                "description": request.description,
                "customer": {
                    "reference_id": request.userId,
                    "name": request.walletAddress[:20]
                },
                "callback_url": f"{os.getenv('APP_URL', '')}/api/payments/webhook"
            }
        )
        
        if mayar_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Payment creation failed")
        
        data = mayar_response.json()
        
        return PaymentResponse(
            status="pending",
            transactionId=data.get("id"),
            paymentUrl=data.get("payment_url"),
            sandboxMode=False,
            message="Payment created successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/payments/confirm")
async def confirm_payment(data: dict):
    """Confirm payment completion"""
    
    transaction_id = data.get("transactionId")
    status = data.get("status")
    
    # In production, verify with Mayar API
    # For demo, we accept the confirmation
    
    return {
        "status": "confirmed",
        "transactionId": transaction_id,
        "paymentStatus": status,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/payments/webhook")
async def payment_webhook(request: Request, background_tasks: BackgroundTasks):
    """Handle Mayar payment webhooks"""
    
    payload = await request.json()
    
    # Process webhook asynchronously
    background_tasks.add_task(process_payment_webhook, payload)
    
    return {"status": "received"}

async def process_payment_webhook(payload: dict):
    """Process payment webhook in background"""
    
    event_type = payload.get("event")
    payment_data = payload.get("data", {})
    
    if event_type == "payment.success":
        # Update user subscription
        print(f"Payment successful: {payment_data.get('id')}")
        # TODO: Update database with subscription info
        
    elif event_type == "payment.failed":
        print(f"Payment failed: {payment_data.get('id')}")
        # TODO: Log failure and notify user

# Auth endpoints
@app.post("/api/auth/sync")
async def sync_user(data: dict):
    """Sync user data from wallet connection"""
    
    wallet_address = data.get("walletAddress")
    username = data.get("username")
    
    # In production, create/update user in database
    
    return {
        "status": "synced",
        "walletAddress": wallet_address,
        "username": username,
        "created": True
    }

# Workflow endpoints
@app.post("/api/workflows/{workflow_id}/trigger")
async def trigger_workflow(workflow_id: str):
    """Trigger an orchestration workflow"""
    
    # In production, this would trigger actual workflows
    
    return {
        "status": "triggered",
        "workflowId": workflow_id,
        "timestamp": datetime.now().isoformat()
    }

# Service scaling
@app.post("/api/services/{service_id}/scale")
async def scale_service(service_id: str, data: dict):
    """Scale a microservice"""
    
    replicas = data.get("replicas", 1)
    
    return {
        "status": "scaling",
        "serviceId": service_id,
        "replicas": replicas,
        "timestamp": datetime.now().isoformat()
    }

# Compliance endpoints
@app.get("/api/compliance/status")
async def compliance_status():
    """Get compliance status"""
    
    return {
        "overallScore": 94,
        "standards": {
            "ISO27001": {
                "score": 96,
                "controls": 15,
                "compliant": 14
            },
            "COBIT": {
                "score": 92,
                "controls": 12,
                "compliant": 11
            }
        },
        "lastAudit": datetime.now().isoformat()
    }

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {
        "error": exc.detail,
        "status_code": exc.status_code,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=SERVICE_PORT)
