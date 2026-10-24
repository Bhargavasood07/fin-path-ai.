import math
from typing import Dict, Any, List, Tuple
from app.models import LoanCalculationRequest, LoanCalculationResponse, AmortizationRow, AnnualAmortizationRow

def calculate_reducing_emi(principal: float, annual_rate: float, tenure_months: int) -> float:
    if annual_rate <= 0:
        return principal / tenure_months
    monthly_r = annual_rate / (12 * 100)
    pow_factor = math.pow(1 + monthly_r, tenure_months)
    emi = principal * monthly_r * pow_factor / (pow_factor - 1)
    return round(emi, 2)

def calculate_internal_rate_of_return(net_disbursed: float, emi: float, tenure_months: int) -> float:
    """
    Computes exact monthly IRR that equates net disbursed amount with stream of EMIs,
    then annualises it (r_monthly * 12 * 100) according to the RBI APR formula.
    """
    if net_disbursed <= 0 or emi <= 0 or tenure_months <= 0:
        return 0.0

    # Binary search for monthly rate r such that sum_{t=1}^n emi / (1+r)^t = net_disbursed
    low = 0.000001
    high = 1.0 # 100% per month upper bound

    def npv(r: float) -> float:
        # Sum of discounted cash flows
        # emi * (1 - (1+r)^(-n)) / r
        if r == 0:
            return emi * tenure_months
        return emi * (1 - math.pow(1 + r, -tenure_months)) / r

    for _ in range(100):
        mid = (low + high) / 2
        val = npv(mid)
        if abs(val - net_disbursed) < 0.001:
            break
        if val > net_disbursed:
            low = mid
        else:
            high = mid

    annual_apr = mid * 12 * 100
    return round(annual_apr, 2)

def generate_amortization_schedule(
    principal: float,
    annual_rate: float,
    tenure_months: int,
    base_emi: float,
    extra_prepayment: float = 0.0
) -> Tuple[List[AmortizationRow], List[AnnualAmortizationRow], Dict[str, Any]]:
    monthly_r = (annual_rate / (12 * 100)) if annual_rate > 0 else 0.0
    balance = principal
    monthly_rows: List[AmortizationRow] = []
    
    total_interest_with_prepay = 0.0
    actual_months = 0

    annual_map: Dict[int, Dict[str, float]] = {}

    for m in range(1, tenure_months + 1):
        if balance <= 0:
            break
        actual_months += 1
        opening = balance
        interest = round(balance * monthly_r, 2)
        total_interest_with_prepay += interest

        scheduled_principal = base_emi - interest
        if scheduled_principal > balance:
            scheduled_principal = balance
            current_emi = scheduled_principal + interest
            prepay_applied = 0.0
        else:
            current_emi = base_emi
            prepay_applied = min(extra_prepayment, max(0.0, balance - scheduled_principal))

        total_reduction = scheduled_principal + prepay_applied
        closing = round(max(0.0, balance - total_reduction), 2)
        balance = closing

        row = AmortizationRow(
            month=m,
            opening_balance=round(opening, 2),
            emi=round(current_emi, 2),
            principal_component=round(scheduled_principal, 2),
            interest_component=round(interest, 2),
            prepayment=round(prepay_applied, 2),
            closing_balance=closing
        )
        monthly_rows.append(row)

        year_num = (m - 1) // 12 + 1
        if year_num not in annual_map:
            annual_map[year_num] = {
                "year": year_num,
                "opening_balance": opening,
                "total_emi_paid": 0.0,
                "principal_paid": 0.0,
                "interest_paid": 0.0,
                "closing_balance": closing
            }
        annual_map[year_num]["total_emi_paid"] += (current_emi + prepay_applied)
        annual_map[year_num]["principal_paid"] += (scheduled_principal + prepay_applied)
        annual_map[year_num]["interest_paid"] += interest
        annual_map[year_num]["closing_balance"] = closing

    annual_rows = [
        AnnualAmortizationRow(
            year=data["year"],
            opening_balance=round(data["opening_balance"], 2),
            total_emi_paid=round(data["total_emi_paid"], 2),
            principal_paid=round(data["principal_paid"], 2),
            interest_paid=round(data["interest_paid"], 2),
            closing_balance=round(data["closing_balance"], 2)
        )
        for data in annual_map.values()
    ]

    base_total_interest = (base_emi * tenure_months) - principal
    prepayment_savings = None
    if extra_prepayment > 0:
        months_saved = tenure_months - actual_months
        interest_saved = round(max(0.0, base_total_interest - total_interest_with_prepay), 2)
        prepayment_savings = {
            "months_saved": months_saved,
            "actual_tenure_months": actual_months,
            "interest_saved": interest_saved,
            "original_total_interest": round(base_total_interest, 2),
            "new_total_interest": round(total_interest_with_prepay, 2)
        }

    return monthly_rows, annual_rows, prepayment_savings

def process_loan_calculation(req: LoanCalculationRequest) -> LoanCalculationResponse:
    emi = calculate_reducing_emi(req.principal, req.interest_rate_pa, req.tenure_months)
    total_payment = round(emi * req.tenure_months, 2)
    total_interest = round(total_payment - req.principal, 2)

    upfront_fees = req.processing_fee + req.insurance_charges + req.documentation_charges
    net_disbursed = round(req.principal - upfront_fees, 2)

    apr = calculate_internal_rate_of_return(net_disbursed, emi, req.tenure_months)

    monthly_rows, annual_rows, prepay_savings = generate_amortization_schedule(
        principal=req.principal,
        annual_rate=req.interest_rate_pa,
        tenure_months=req.tenure_months,
        base_emi=emi,
        extra_prepayment=req.extra_monthly_prepayment
    )

    return LoanCalculationResponse(
        principal=req.principal,
        nominal_rate_pa=req.interest_rate_pa,
        tenure_months=req.tenure_months,
        monthly_emi=emi,
        total_interest=total_interest,
        total_payment=total_payment,
        net_disbursed_amount=net_disbursed,
        total_upfront_fees=upfront_fees,
        effective_apr=apr,
        monthly_breakdown=monthly_rows,
        annual_breakdown=annual_rows,
        prepayment_savings=prepay_savings
    )
