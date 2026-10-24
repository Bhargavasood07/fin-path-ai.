export interface AmortizationRow {
  month: number;
  opening_balance: number;
  emi: number;
  principal_component: number;
  interest_component: number;
  prepayment: number;
  closing_balance: number;
}

export interface AnnualAmortizationRow {
  year: number;
  opening_balance: number;
  total_emi_paid: number;
  principal_paid: number;
  interest_paid: number;
  closing_balance: number;
}

export interface LoanCalculationResponse {
  principal: number;
  nominal_rate_pa: number;
  tenure_months: number;
  monthly_emi: number;
  total_interest: number;
  total_payment: number;
  net_disbursed_amount: number;
  total_upfront_fees: number;
  effective_apr: number;
  monthly_breakdown: AmortizationRow[];
  annual_breakdown: AnnualAmortizationRow[];
  prepayment_savings?: {
    months_saved: number;
    actual_tenure_months: number;
    interest_saved: number;
    original_total_interest: number;
    new_total_interest: number;
  } | null;
}

export interface ComplianceFinding {
  category: string;
  title: string;
  status: "PASS" | "FAIL" | "WARNING";
  description: string;
  rbi_reference: string;
  citation_id: string;
  recommendation: string;
}

export interface KFSCheckResponse {
  audit_id: string;
  score: number;
  status: string;
  effective_apr: number;
  findings: ComplianceFinding[];
  violations_count: number;
  kfs_summary_sheet: Record<string, any>;
}

export interface Journey {
  id: string;
  title: string;
  borrower_name: string;
  principal: number;
  tenure_months: number;
  interest_rate: number;
  monthly_emi: number;
  total_interest: number;
  total_payment: number;
  apr: number;
  processing_fee: number;
  other_charges: number;
  kfs_score: number;
  kfs_status: string;
  notes: string;
  created_at: string;
}

export interface Citation {
  title: string;
  circular_id: string;
  clause_id: string;
  section: string;
  relevance_snippet: string;
  url?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode_used?: string;
  citations?: Citation[];
  timestamp: string;
}

export interface SampleLoanOffer {
  id: string;
  lender_name: string;
  loan_type: string;
  principal: number;
  tenure_months: number;
  nominal_rate_pa: number;
  processing_fee: number;
  insurance_charges: number;
  documentation_charges: number;
  cooling_off_days: number;
  penal_charge_type: string;
  recovery_agent_disclosed: boolean;
  nodal_officer_disclosed: boolean;
  unbundled_insurance: boolean;
  description: string;
}
