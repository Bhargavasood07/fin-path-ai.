"use client";

import React, { useState, useEffect } from "react";
import {
  Calculator,
  TrendingDown,
  Info,
  Save,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Percent,
  Coins,
  Calendar,
  Sparkles,
  Copy,
  LineChart
} from "lucide-react";
import { LoanCalculationResponse } from "@/types";

interface LoanCalculatorProps {
  onSaveJourneySuccess?: () => void;
  apiBaseUrl: string;
}

export default function LoanCalculator({ onSaveJourneySuccess, apiBaseUrl }: LoanCalculatorProps) {
  // Input states
  const [principal, setPrincipal] = useState<number>(500000);
  const [interestRate, setInterestRate] = useState<number>(11.5);
  const [tenureMonths, setTenureMonths] = useState<number>(36);
  const [processingFee, setProcessingFee] = useState<number>(5000);
  const [insuranceCharges, setInsuranceCharges] = useState<number>(1500);
  const [docCharges, setDocCharges] = useState<number>(500);
  const [extraPrepayment, setExtraPrepayment] = useState<number>(0);

  // UI state
  const [isAnnualView, setIsAnnualView] = useState<boolean>(true);
  const [showAdvancedFees, setShowAdvancedFees] = useState<boolean>(true);
  const [showAmortization, setShowAmortization] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<LoanCalculationResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Journey Saving state
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [journeyTitle, setJourneyTitle] = useState<string>("My New Loan Scenario");
  const [borrowerName, setBorrowerName] = useState<string>("Applicant");
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [savingLoading, setSavingLoading] = useState<boolean>(false);

  // Trigger calculation
  useEffect(() => {
    const fetchCalculation = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBaseUrl}/api/calculator/calculate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            principal,
            interest_rate_pa: interestRate,
            tenure_months: tenureMonths,
            processing_fee: processingFee,
            insurance_charges: insuranceCharges,
            documentation_charges: docCharges,
            extra_monthly_prepayment: extraPrepayment,
          }),
        });
        if (res.ok) {
          const data: LoanCalculationResponse = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Calculation fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchCalculation, 150);
    return () => clearTimeout(timeout);
  }, [principal, interestRate, tenureMonths, processingFee, insuranceCharges, docCharges, extraPrepayment, apiBaseUrl]);

  // Format currency in Indian Numbering (Lakhs / Crores / Thousands)
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const copySummaryToClipboard = () => {
    if (!results) return;
    const text = `FinPath AI — Loan Calculation Summary:
• Principal Amount: ${formatINR(results.principal)}
• Nominal Interest Rate: ${interestRate.toFixed(2)}% p.a.
• Tenure: ${tenureMonths} Months (${(tenureMonths / 12).toFixed(1)} yrs)
• Monthly EMI: ${formatINR(results.monthly_emi)}
• Effective APR (RBI IRR): ${results.effective_apr.toFixed(2)}%
• Net Disbursed: ${formatINR(results.net_disbursed_amount)}
• Upfront Deductions: ${formatINR(results.total_upfront_fees)}
• Total Interest: ${formatINR(results.total_interest)}
• Total Outflow: ${formatINR(results.total_payment + results.total_upfront_fees)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveJourney = async () => {
    if (!results) return;
    setSavingLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/journeys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: journeyTitle,
          borrower_name: borrowerName,
          principal: results.principal,
          tenure_months: results.tenure_months,
          interest_rate: results.nominal_rate_pa,
          monthly_emi: results.monthly_emi,
          total_interest: results.total_interest,
          total_payment: results.total_payment,
          apr: results.effective_apr,
          processing_fee: processingFee,
          other_charges: insuranceCharges + docCharges,
          kfs_score: 90.0,
          kfs_status: "Calculated",
          notes: `Simulated with upfront deductions of ${formatINR(results.total_upfront_fees)} resulting in true APR ${results.effective_apr}%`,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setSaveModalOpen(false);
          if (onSaveJourneySuccess) onSaveJourneySuccess();
        }, 1200);
      }
    } catch (e) {
      console.error("Save journey failed:", e);
    } finally {
      setSavingLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!results) return;
    const rows = isAnnualView ? results.annual_breakdown : results.monthly_breakdown;
    let csvContent = "data:text/csv;charset=utf-8,";
    if (isAnnualView) {
      csvContent += "Year,Opening Balance,Total Payment,Principal Paid,Interest Paid,Closing Balance\n";
      (rows as any[]).forEach((r) => {
        csvContent += `${r.year},${r.opening_balance},${r.total_emi_paid},${r.principal_paid},${r.interest_paid},${r.closing_balance}\n`;
      });
    } else {
      csvContent += "Month,Opening Balance,EMI,Principal,Interest,Prepayment,Closing Balance\n";
      (rows as any[]).forEach((r) => {
        csvContent += `${r.month},${r.opening_balance},${r.emi},${r.principal_component},${r.interest_component},${r.prepayment},${r.closing_balance}\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FinPath_Amortization_${isAnnualView ? "Annual" : "Monthly"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pie chart geometry
  const totalPie = results ? results.principal + results.total_interest + results.total_upfront_fees : 1;
  const principalPct = results ? (results.principal / totalPie) * 100 : 70;
  const interestPct = results ? (results.total_interest / totalPie) * 100 : 28;
  const feePct = results ? (results.total_upfront_fees / totalPie) * 100 : 2;

  // SVG Payoff chart coordinates
  const annualData = results?.annual_breakdown || [];
  const svgWidth = 500;
  const svgHeight = 110;
  const padding = 15;

  let balancePoints = "";
  if (annualData.length > 0) {
    balancePoints = annualData
      .map((d, i) => {
        const x = padding + (i / (annualData.length - 1 || 1)) * (svgWidth - padding * 2);
        const y = padding + (1 - d.closing_balance / principal) * (svgHeight - padding * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RBI Key Facts Statement Schedule Formula</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Loan EMI & True APR Calculator
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Calculate reducing balance EMIs, factor in upfront processing & third-party fees,
              and discover your real Annual Percentage Rate (APR) before signing.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={copySummaryToClipboard}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium transition-all"
              title="Copy loan calculation summary"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>
            <button
              onClick={() => setSaveModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Scenario</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs vs Real-Time Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Coins className="w-5 h-5 text-blue-400" />
              <span>Loan Parameters</span>
            </h2>

            {/* Principal Input */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300">Principal Amount</label>
                <span className="text-lg font-bold text-blue-400 font-mono">
                  {formatINR(principal)}
                </span>
              </div>
              <input
                type="range"
                min={20000}
                max={10000000}
                step={10000}
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[100000, 500000, 1500000, 3000000, 5000000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setPrincipal(preset)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                      principal === preset
                        ? "bg-blue-600 text-white border-blue-500"
                        : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {formatINR(preset)}
                  </button>
                ))}
              </div>
            </div>

            {/* Interest Rate Input */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300">Nominal Interest Rate (% p.a.)</label>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {interestRate.toFixed(2)}%
                </span>
              </div>
              <input
                type="range"
                min={6.0}
                max={48.0}
                step={0.25}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              {/* Rate Presets */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: "Home (8.5%)", val: 8.5 },
                  { label: "Car (9.5%)", val: 9.5 },
                  { label: "Personal (11.5%)", val: 11.5 },
                  { label: "NBFC (15%)", val: 15.0 },
                  { label: "Fintech (36%)", val: 36.0 },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setInterestRate(item.val)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                      interestRate === item.val
                        ? "bg-emerald-600 text-white border-emerald-500"
                        : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tenure Input */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300">Loan Tenure</label>
                <span className="text-lg font-bold text-indigo-400 font-mono">
                  {tenureMonths} Months ({Math.floor(tenureMonths / 12)} yrs {tenureMonths % 12 ? `${tenureMonths % 12}m` : ""})
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={360}
                step={1}
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {[12, 24, 36, 60, 120, 240].map((m) => (
                  <button
                    key={m}
                    onClick={() => setTenureMonths(m)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                      tenureMonths === m
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {m < 12 ? `${m}m` : `${m / 12} Years`}
                  </button>
                ))}
              </div>
            </div>

            {/* Upfront Fees Accordion (Required for RBI APR Disclosure) */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
              <button
                type="button"
                onClick={() => setShowAdvancedFees(!showAdvancedFees)}
                className="w-full px-4 py-3 flex items-center justify-between text-left text-sm font-medium text-slate-200 hover:bg-slate-800/40"
              >
                <div className="flex items-center space-x-2">
                  <Percent className="w-4 h-4 text-amber-400" />
                  <span>Upfront Fees & Deductions (RBI Mandatory)</span>
                  <span className="text-xs text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Total: {formatINR(processingFee + insuranceCharges + docCharges)}
                  </span>
                </div>
                {showAdvancedFees ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvancedFees && (
                <div className="p-4 border-t border-slate-800 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Processing Fee (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={processingFee}
                        onChange={(e) => setProcessingFee(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Insurance / Bundled Fee (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={insuranceCharges}
                        onChange={(e) => setInsuranceCharges(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Legal & Doc Charges (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={docCharges}
                        onChange={(e) => setDocCharges(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                    <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>
                      Under RBI Circular DOR.MCS.REC.21/01.01.001/2024-25, any charges deducted from the principal must be incorporated into the APR.
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Prepayment Simulator */}
            <div className="p-4 rounded-xl border border-blue-900/40 bg-blue-950/20 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-blue-300 flex items-center space-x-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Optional Extra Monthly Prepayment (₹)</span>
                </label>
                <span className="text-xs font-mono font-bold text-blue-200">
                  {formatINR(extraPrepayment)} / month
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={25000}
                step={500}
                value={extraPrepayment}
                onChange={(e) => setExtraPrepayment(Number(e.target.value))}
                className="w-full h-1.5 bg-blue-950 rounded-lg appearance-none cursor-pointer"
              />
              {results?.prepayment_savings && results.prepayment_savings.months_saved > 0 && (
                <div className="pt-2 text-xs text-emerald-400 font-medium">
                  🎉 Prepayment Benefit: Closes {results.prepayment_savings.months_saved} months earlier and saves {formatINR(results.prepayment_savings.interest_saved)} in total interest!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Computation & APR Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main EMI & APR Display */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5 relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Monthly Repayment (EMI)
              </span>
              <div className="text-4xl font-extrabold text-white tracking-tight font-mono">
                {results ? formatINR(results.monthly_emi) : "₹--"}
              </div>
              <p className="text-xs text-slate-400">
                Calculated via reducing balance method for {tenureMonths} installments
              </p>
            </div>

            {/* True APR Callout Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Percent className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                    Official Effective APR
                  </span>
                </div>
                <span className="text-xl font-bold font-mono text-amber-300">
                  {results ? `${results.effective_apr.toFixed(2)}%` : "--"}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Advertised Nominal Rate:</span>
                <span className="font-mono">{interestRate.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Net Disbursed to Bank:</span>
                <span className="font-mono text-emerald-400">
                  {results ? formatINR(results.net_disbursed_amount) : "--"}
                </span>
              </div>
              <div className="text-[11px] text-amber-200/80 pt-1 border-t border-amber-500/20">
                {results && results.effective_apr > interestRate ? (
                  <span>
                    ⚠️ Upfront deductions of {formatINR(results.total_upfront_fees)} increase your true borrowing cost by +{(results.effective_apr - interestRate).toFixed(2)}% p.a.
                  </span>
                ) : (
                  <span>✅ Zero upfront deductions; APR matches nominal rate.</span>
                )}
              </div>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Total Principal:</span>
                <span className="font-mono font-medium text-white">{formatINR(principal)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total Interest Payable:</span>
                <span className="font-mono font-medium text-indigo-300">
                  {results ? formatINR(results.total_interest) : "--"}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total Upfront Deductions:</span>
                <span className="font-mono font-medium text-amber-300">
                  {results ? formatINR(results.total_upfront_fees) : "--"}
                </span>
              </div>
              <div className="flex justify-between text-slate-100 font-semibold pt-2 border-t border-slate-800/80 text-base">
                <span>Total Amount Outflow:</span>
                <span className="font-mono text-emerald-400">
                  {results ? formatINR(results.total_payment + results.total_upfront_fees) : "--"}
                </span>
              </div>
            </div>

            {/* Visual Split Ratio Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Principal ({principalPct.toFixed(0)}%)</span>
                <span>Interest ({interestPct.toFixed(0)}%)</span>
                <span>Fees ({feePct.toFixed(0)}%)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 flex overflow-hidden">
                <div
                  style={{ width: `${principalPct}%` }}
                  className="h-full bg-blue-500 transition-all duration-300"
                  title={`Principal: ${principalPct.toFixed(1)}%`}
                ></div>
                <div
                  style={{ width: `${interestPct}%` }}
                  className="h-full bg-indigo-500 transition-all duration-300"
                  title={`Interest: ${interestPct.toFixed(1)}%`}
                ></div>
                <div
                  style={{ width: `${feePct}%` }}
                  className="h-full bg-amber-500 transition-all duration-300"
                  title={`Fees: ${feePct.toFixed(1)}%`}
                ></div>
              </div>
            </div>

            {/* Interactive Amortization Trajectory Graph */}
            {annualData.length > 1 && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium flex items-center space-x-1">
                    <LineChart className="w-3.5 h-3.5 text-blue-400" />
                    <span>Amortization Trajectory</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Year 1 → Year {annualData.length}
                  </span>
                </div>
                <div className="w-full h-24 bg-slate-950/60 rounded-xl p-2 border border-slate-800/80 relative flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                    {/* Grid lines */}
                    <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#1e293b" strokeWidth="1" />
                    <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                    {/* Payoff line */}
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={balancePoints}
                    />
                  </svg>
                  <div className="absolute bottom-1 left-3 text-[9px] text-slate-500 font-mono">
                    Remaining: {formatINR(principal)}
                  </div>
                  <div className="absolute top-1 right-3 text-[9px] text-emerald-400 font-mono">
                    ₹0 (Paid Off)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Amortization Schedule Accordion */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <span>Full Amortization Schedule</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Detailed repayment timeline showing monthly or annual principal vs interest trajectory
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setIsAnnualView(true)}
                className={`px-3 py-1 rounded-md transition-all ${
                  isAnnualView ? "bg-blue-600 text-white font-medium shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Annual Summary
              </button>
              <button
                onClick={() => setIsAnnualView(false)}
                className={`px-3 py-1 rounded-md transition-all ${
                  !isAnnualView ? "bg-blue-600 text-white font-medium shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Monthly Schedule
              </button>
            </div>
            <button
              onClick={downloadCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setShowAmortization(!showAmortization)}
              className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white"
            >
              {showAmortization ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showAmortization && (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">{isAnnualView ? "Year" : "Month"}</th>
                  <th className="py-3 px-4">Opening Balance</th>
                  <th className="py-3 px-4">{isAnnualView ? "Total Paid" : "EMI Paid"}</th>
                  <th className="py-3 px-4 text-emerald-400">Principal</th>
                  <th className="py-3 px-4 text-indigo-400">Interest</th>
                  {!isAnnualView && <th className="py-3 px-4 text-blue-400">Prepayment</th>}
                  <th className="py-3 px-4 text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {isAnnualView ? (
                  results?.annual_breakdown.map((row) => (
                    <tr key={row.year} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-bold text-white">Year {row.year}</td>
                      <td className="py-2.5 px-4">{formatINR(row.opening_balance)}</td>
                      <td className="py-2.5 px-4 text-slate-200">{formatINR(row.total_emi_paid)}</td>
                      <td className="py-2.5 px-4 text-emerald-400">{formatINR(row.principal_paid)}</td>
                      <td className="py-2.5 px-4 text-indigo-400">{formatINR(row.interest_paid)}</td>
                      <td className="py-2.5 px-4 text-right font-medium text-white">{formatINR(row.closing_balance)}</td>
                    </tr>
                  ))
                ) : (
                  results?.monthly_breakdown.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-800/40">
                      <td className="py-2 px-4 font-medium text-white">#{row.month}</td>
                      <td className="py-2 px-4">{formatINR(row.opening_balance)}</td>
                      <td className="py-2 px-4 text-slate-200">{formatINR(row.emi)}</td>
                      <td className="py-2 px-4 text-emerald-400">{formatINR(row.principal_component)}</td>
                      <td className="py-2 px-4 text-indigo-400">{formatINR(row.interest_component)}</td>
                      <td className="py-2 px-4 text-blue-400">{formatINR(row.prepayment)}</td>
                      <td className="py-2 px-4 text-right font-medium text-white">{formatINR(row.closing_balance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save Journey Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Save className="w-5 h-5 text-blue-400" />
              <span>Save Scenario to Loan Journey</span>
            </h3>
            <p className="text-xs text-slate-400">
              Save this calculated scenario directly to your local SQLite database for future side-by-side comparison.
            </p>

            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Scenario / Journey Title</label>
                <input
                  type="text"
                  value={journeyTitle}
                  onChange={(e) => setJourneyTitle(e.target.value)}
                  placeholder="e.g. HDFC 30L Home Loan 8.75%"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Applicant Name</label>
                <input
                  type="text"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {results && (
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Principal:</span>
                    <span className="text-white">{formatINR(results.principal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly EMI:</span>
                    <span className="text-emerald-400">{formatINR(results.monthly_emi)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">True APR:</span>
                    <span className="text-amber-400">{results.effective_apr}%</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveJourney}
                disabled={savingLoading || saveSuccess}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Saved to Database!</span>
                  </>
                ) : savingLoading ? (
                  <span>Saving...</span>
                ) : (
                  <span>Confirm Save</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
