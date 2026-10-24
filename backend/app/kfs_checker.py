import uuid
from typing import List, Dict, Any
from app.models import KFSCheckRequest, KFSCheckResponse, ComplianceFinding
from app.calculator import calculate_reducing_emi, calculate_internal_rate_of_return

def audit_kfs_compliance(req: KFSCheckRequest) -> KFSCheckResponse:
    findings: List[ComplianceFinding] = []
    base_score = 100
    violations_count = 0

    emi = calculate_reducing_emi(req.principal, req.nominal_rate_pa, req.tenure_months)
    upfront_fees = req.processing_fee + req.insurance_charges + req.documentation_charges
    net_disbursed = round(req.principal - upfront_fees, 2)
    apr = calculate_internal_rate_of_return(net_disbursed, emi, req.tenure_months)

    # 1. Check Cooling-off / Look-up period
    # RBI Rule: Min 3 days for tenure >= 7 days
    min_required_days = 3 if req.tenure_months >= 1 else 1
    if req.cooling_off_days < min_required_days:
        base_score -= 25
        violations_count += 1
        findings.append(ComplianceFinding(
            category="Cooling-off Period",
            title="Non-compliant Cooling-off / Look-up Window",
            status="FAIL",
            description=f"Offered {req.cooling_off_days} days cooling-off. RBI mandates at least {min_required_days} days for loans with tenure >= 7 days, allowing exit without penalty.",
            rbi_reference="RBI Circular DOR.MCS.REC.21/01.01.001/2024-25, Clause 5",
            citation_id="KFS-05",
            recommendation="Insist on a minimum 3-day look-up period in writing before signing the agreement."
        ))
    else:
        findings.append(ComplianceFinding(
            category="Cooling-off Period",
            title="Mandatory Look-up Window Provided",
            status="PASS",
            description=f"Complies with RBI requirement. Provides {req.cooling_off_days} days to exit with only principal and pro-rata interest.",
            rbi_reference="RBI Circular DOR.MCS.REC.21/01.01.001/2024-25, Clause 5",
            citation_id="KFS-05",
            recommendation="Retain notice of cooling-off start date upon disbursement."
        ))

    # 2. Check Penal Charges vs Penal Interest
    penal_desc_lower = req.penal_charge_description.lower()
    has_compounding = req.is_penal_compounded or "compound" in penal_desc_lower or "capitaliz" in penal_desc_lower
    
    if has_compounding:
        base_score -= 30
        violations_count += 1
        findings.append(ComplianceFinding(
            category="Penal Charges",
            title="Illegal Compounding of Penal Interest",
            status="FAIL",
            description="The loan terms state that overdue penalties are compounded or capitalized into principal. RBI explicitly prohibits compounding of penal charges.",
            rbi_reference="RBI Circular DOR.MCS.REC.21/01.01.001/2024-25, Clause 6 & Master Direction on Penal Charges",
            citation_id="KFS-06",
            recommendation="Reject any terms that compound late payment fees. Lenders can only levy reasonable, flat or simple non-capitalized penal charges."
        ))
    else:
        findings.append(ComplianceFinding(
            category="Penal Charges",
            title="Penal Structure Non-Compounded",
            status="PASS",
            description="Penal charges are levied separately without compounding or capitalization into the loan balance.",
            rbi_reference="RBI Circular DOR.MCS.REC.21/01.01.001/2024-25, Clause 6",
            citation_id="KFS-06",
            recommendation="Verify that penal charge schedule is explicitly itemized in the sanctioned KFS sheet."
        ))

    # 3. Check APR Disparity & Upfront Fees
    apr_gap = round(apr - req.nominal_rate_pa, 2)
    fee_percentage = round((upfront_fees / req.principal) * 100, 2) if req.principal > 0 else 0.0

    if fee_percentage > 4.0 or apr_gap > 4.0:
        base_score -= 15
        findings.append(ComplianceFinding(
            category="Cost Transparency (APR)",
            title="Elevated Upfront Fees Causing Significant APR Disparity",
            status="WARNING",
            description=f"Nominal rate is {req.nominal_rate_pa}%, but the true APR is {apr}% (+{apr_gap}% spread) due to upfront deductions of ₹{upfront_fees:,.2f} ({fee_percentage}% of principal).",
            rbi_reference="RBI Circular DOR.MCS.REC.21/01.01.001/2024-25, Clause 3",
            citation_id="KFS-03",
            recommendation="Request a fee waiver or compare with lenders offering lower processing charges to reduce your effective borrowing cost."
        ))
    else:
        findings.append(ComplianceFinding(
            category="Cost Transparency (APR)",
            title="Transparent APR with Reasonable Upfront Deductions",
            status="PASS",
            description=f"Effective APR is {apr}% vs {req.nominal_rate_pa}% nominal rate. Upfront fees comprise {fee_percentage}% of loan principal.",
            rbi_reference="RBI Circular DOR.MCS.REC.21/01.01.001/2024-25, Clause 3",
            citation_id="KFS-03",
            recommendation="Confirm that all listed fees match the KFS and no post-disbursement fees are added."
        ))

    # 4. Check Bundled Insurance
    if not req.unbundled_insurance and req.insurance_charges > 0:
        base_score -= 15
        violations_count += 1
        findings.append(ComplianceFinding(
            category="Third-Party Products",
            title="Coercive / Mandatory Bundled Insurance Detected",
            status="FAIL",
            description="Credit life or asset insurance is bundled without an unbundled, voluntary opt-in option.",
            rbi_reference="RBI Guidelines on Fair Practices Code & KFS Circular Clause 3",
            citation_id="KFS-04",
            recommendation="Borrowers have the right to purchase insurance independently from any IRDAI-registered insurer or decline optional credit insurance."
        ))
    else:
        findings.append(ComplianceFinding(
            category="Third-Party Products",
            title="Unbundled Third-Party Charges",
            status="PASS",
            description="Third-party insurance and ancillary services are transparently disclosed and not coercively bundled.",
            rbi_reference="RBI Guidelines on Fair Practices Code",
            citation_id="KFS-04",
            recommendation="Ensure policy terms and claim procedures are received upon disbursement."
        ))

    # 5. Check Grievance Redressal / Principal Nodal Officer
    if not req.nodal_officer_disclosed:
        base_score -= 10
        violations_count += 1
        findings.append(ComplianceFinding(
            category="Grievance Redressal",
            title="Missing Principal Nodal Officer Disclosure",
            status="FAIL",
            description="The loan offer omits contact information for the lender's Grievance Redressal Officer and escalation link to RBI Ombudsman (cms.rbi.org.in).",
            rbi_reference="RBI Circular DOR.MCS.REC.21/01.01.001/2024-25, Clause 7",
            citation_id="KFS-07",
            recommendation="Ensure the lender provides designated Grievance Officer details (name, email, phone) before disbursement."
        ))
    else:
        findings.append(ComplianceFinding(
            category="Grievance Redressal",
            title="Grievance Redressal Mechanism Disclosed",
            status="PASS",
            description="Discloses designated Nodal Officer and 30-day turnaround time with RBI Ombudsman escalation path.",
            rbi_reference="RBI Circular DOR.MCS.REC.21/01.01.001/2024-25, Clause 7",
            citation_id="KFS-07",
            recommendation="Save the lender's grievance reference number and escalation email for future reference."
        ))

    # 6. Check Recovery Agent Disclosure
    if not req.recovery_agent_disclosed:
        base_score -= 10
        findings.append(ComplianceFinding(
            category="Recovery Mechanism",
            title="Undisclosed Recovery Agent Protocol",
            status="WARNING",
            description="Offer does not specify third-party recovery agency engagement protocols or advance notification before assignment.",
            rbi_reference="RBI Fair Practices Code & Digital Lending Circular",
            citation_id="KFS-07",
            recommendation="Demand written confirmation that only RBI-registered code-compliant recovery agents will be engaged with prior notice."
        ))
    else:
        findings.append(ComplianceFinding(
            category="Recovery Mechanism",
            title="Recovery Agent Protocol Formally Disclosed",
            status="PASS",
            description="Complies with RBI fair debt recovery framework.",
            rbi_reference="RBI Fair Practices Code",
            citation_id="KFS-07",
            recommendation="Verify that communication channels strictly adhere to permitted 8:00 AM to 7:00 PM calling windows."
        ))

    score = max(0, min(100, base_score))
    if score >= 85 and violations_count == 0:
        status = "Fully Compliant"
    elif score >= 60 and violations_count <= 1:
        status = "Advisory Required"
    else:
        status = "High Risk / Non-Compliant"

    kfs_summary_sheet = {
        "lender_name": req.lender_name,
        "loan_type": req.loan_type,
        "sanctioned_amount": req.principal,
        "tenure_months": req.tenure_months,
        "nominal_rate_pa": f"{req.nominal_rate_pa}%",
        "monthly_emi": emi,
        "total_amount_payable": round(emi * req.tenure_months, 2),
        "total_interest_payable": round((emi * req.tenure_months) - req.principal, 2),
        "upfront_processing_fee": req.processing_fee,
        "insurance_and_third_party": req.insurance_charges,
        "documentation_and_legal": req.documentation_charges,
        "net_disbursed_amount": net_disbursed,
        "effective_apr": f"{apr}%",
        "cooling_off_days": f"{req.cooling_off_days} days",
        "penal_charges_terms": req.penal_charge_description or "As per RBI circular (simple flat charges)",
        "ombudsman_accessible": req.nodal_officer_disclosed,
        "compliance_score": f"{score}/100",
        "compliance_verdict": status
    }

    audit_id = f"kfs-audit-{uuid.uuid4().hex[:8]}"

    return KFSCheckResponse(
        audit_id=audit_id,
        score=score,
        status=status,
        effective_apr=apr,
        findings=findings,
        violations_count=violations_count,
        kfs_summary_sheet=kfs_summary_sheet
    )
