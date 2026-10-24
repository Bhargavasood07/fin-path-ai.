from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class LoanCalculationRequest(BaseModel):
    principal: float = Field(..., gt=0, description="Loan principal amount in INR")
    interest_rate_pa: float = Field(..., gt=0, description="Annual nominal interest rate percentage")
    tenure_months: int = Field(..., gt=0, le=480, description="Tenure in months")
    processing_fee: float = Field(0.0, ge=0, description="Upfront processing fee in INR")
    insurance_charges: float = Field(0.0, ge=0, description="Insurance or bundled third-party charges")
    documentation_charges: float = Field(0.0, ge=0, description="Legal, stamp duty and documentation costs")
    extra_monthly_prepayment: float = Field(0.0, ge=0, description="Optional extra EMI reduction prepayment")

class AmortizationRow(BaseModel):
    month: int
    opening_balance: float
    emi: float
    principal_component: float
    interest_component: float
    prepayment: float
    closing_balance: float

class AnnualAmortizationRow(BaseModel):
    year: int
    opening_balance: float
    total_emi_paid: float
    principal_paid: float
    interest_paid: float
    closing_balance: float

class LoanCalculationResponse(BaseModel):
    principal: float
    nominal_rate_pa: float
    tenure_months: int
    monthly_emi: float
    total_interest: float
    total_payment: float
    net_disbursed_amount: float
    total_upfront_fees: float
    effective_apr: float
    monthly_breakdown: List[AmortizationRow]
    annual_breakdown: List[AnnualAmortizationRow]
    prepayment_savings: Optional[Dict[str, Any]] = None

class KFSCheckRequest(BaseModel):
    lender_name: str
    loan_type: str
    principal: float
    tenure_months: int
    nominal_rate_pa: float
    processing_fee: float = 0.0
    insurance_charges: float = 0.0
    documentation_charges: float = 0.0
    cooling_off_days: int = 0
    penal_charge_description: str = ""
    is_penal_compounded: bool = False
    recovery_agent_disclosed: bool = True
    nodal_officer_disclosed: bool = True
    unbundled_insurance: bool = True

class ComplianceFinding(BaseModel):
    category: str
    title: str
    status: str # "PASS", "FAIL", "WARNING"
    description: str
    rbi_reference: str
    citation_id: str
    recommendation: str

class KFSCheckResponse(BaseModel):
    audit_id: str
    score: int # 0 to 100
    status: str # "Compliant", "Advisory Required", "High Risk Non-Compliant"
    effective_apr: float
    findings: List[ComplianceFinding]
    violations_count: int
    kfs_summary_sheet: Dict[str, Any]

class JourneyCreateRequest(BaseModel):
    title: str
    borrower_name: Optional[str] = "Applicant"
    principal: float
    tenure_months: int
    interest_rate: float
    monthly_emi: float
    total_interest: float
    total_payment: float
    apr: float
    processing_fee: float = 0.0
    other_charges: float = 0.0
    kfs_score: float = 0.0
    kfs_status: str = "Pending"
    notes: Optional[str] = ""

class ChatMessageRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []
    force_mode: Optional[str] = "auto" # "auto", "local", "openai"

class ChatSourceCitation(BaseModel):
    title: str
    circular_id: str
    clause_id: str
    section: str
    relevance_snippet: str
    url: Optional[str] = None

class ChatMessageResponse(BaseModel):
    reply: str
    mode_used: str # "local_grounded" or "openai_api"
    citations: List[ChatSourceCitation]
    latency_ms: float
