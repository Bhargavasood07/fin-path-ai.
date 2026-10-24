import uuid
import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import HOST, PORT, OPENAI_API_KEY, OPENAI_MODEL
from app.database import init_db, list_journeys, get_journey_by_id, save_journey, delete_journey, save_kfs_audit
from app.models import (
    LoanCalculationRequest, LoanCalculationResponse,
    KFSCheckRequest, KFSCheckResponse,
    JourneyCreateRequest, ChatMessageRequest, ChatMessageResponse
)
from app.calculator import process_loan_calculation
from app.kfs_checker import audit_kfs_compliance
from app.official_sources import get_kfs_circular_data, get_digital_lending_data, get_sample_loan_offers
from app.ai_assistant import process_assistant_chat

from pathlib import Path
from fastapi.staticfiles import StaticFiles

FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "out"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed sample journeys
    init_db()
    print("[FinPath AI] Database initialized with SQLite successfully.")
    yield

app = FastAPI(
    title="FinPath AI — RBI Grounded Financial Engine",
    description="Backend API for loan journey calculation, RBI Key Facts Statement (KFS) compliance verification, and source-grounded advisory.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api")
def api_info():
    return {
        "app": "FinPath AI API",
        "status": "online",
        "documentation": "/docs",
        "rbi_reference": "Circular DOR.MCS.REC.21/01.01.001/2024-25 (Key Facts Statement)",
        "features": [
            "Reducing Balance EMI Calculator",
            "Effective APR Solver",
            "Amortization & Prepayment Simulator",
            "RBI KFS Compliance Auditor",
            "Source-Grounded AI Assistant (Local Demo & OpenAI API ready)"
        ]
    }

@app.get("/api/health")
def health_check():
    has_openai = bool(OPENAI_API_KEY)
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "database": "sqlite_connected",
        "ai_engine": {
            "mode": "openai_api" if has_openai else "local_grounded_demo",
            "model": OPENAI_MODEL if has_openai else "local_rbi_knowledge_base",
            "openai_configured": has_openai
        }
    }

@app.post("/api/calculator/calculate", response_model=LoanCalculationResponse)
def calculate_loan(req: LoanCalculationRequest):
    try:
        return process_loan_calculation(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Calculation error: {str(e)}")

@app.post("/api/kfs/check", response_model=KFSCheckResponse)
def check_kfs_compliance(req: KFSCheckRequest):
    try:
        res = audit_kfs_compliance(req)
        # Record audit in database
        save_kfs_audit({
            "id": res.audit_id,
            "journey_id": None,
            "lender_name": req.lender_name,
            "loan_type": req.loan_type,
            "score": res.score,
            "status": res.status,
            "findings_json": str([f.model_dump() for f in res.findings]),
            "violations_count": res.violations_count,
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        })
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"KFS audit error: {str(e)}")

@app.get("/api/journeys")
def get_all_journeys():
    return list_journeys()

@app.post("/api/journeys")
def create_journey(req: JourneyCreateRequest):
    journey_id = f"journey-{uuid.uuid4().hex[:8]}"
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    record = {
        "id": journey_id,
        "title": req.title,
        "borrower_name": req.borrower_name or "Applicant",
        "principal": req.principal,
        "tenure_months": req.tenure_months,
        "interest_rate": req.interest_rate,
        "monthly_emi": req.monthly_emi,
        "total_interest": req.total_interest,
        "total_payment": req.total_payment,
        "apr": req.apr,
        "processing_fee": req.processing_fee,
        "other_charges": req.other_charges,
        "kfs_score": req.kfs_score,
        "kfs_status": req.kfs_status,
        "notes": req.notes or "",
        "created_at": now
    }
    saved = save_journey(record)
    return {"message": "Journey successfully saved to SQLite database", "journey": saved}

@app.get("/api/journeys/{journey_id}")
def get_journey(journey_id: str):
    journey = get_journey_by_id(journey_id)
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
    return journey

@app.delete("/api/journeys/{journey_id}")
def remove_journey(journey_id: str):
    delete_journey(journey_id)
    return {"message": f"Journey {journey_id} deleted successfully"}

@app.get("/api/official/circulars")
def get_official_circulars():
    kfs = get_kfs_circular_data()
    dl = get_digital_lending_data()
    return {
        "kfs_circular_2024": kfs,
        "digital_lending_2022": dl
    }

@app.get("/api/official/sample-offers")
def get_offers():
    return get_sample_loan_offers()

@app.post("/api/assistant/chat", response_model=ChatMessageResponse)
def assistant_chat(req: ChatMessageRequest, request: Request):
    custom_key = request.headers.get("x-openai-key")
    return process_assistant_chat(
        user_message=req.message,
        conversation_history=req.conversation_history,
        force_mode=req.force_mode,
        custom_api_key=custom_key
    )

# Combine Frontend and Backend: Serve unified Website and App from same host and port
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")

