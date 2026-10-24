"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  X,
  ClipboardPaste,
  Wand2
} from "lucide-react";
import { KFSCheckResponse, SampleLoanOffer } from "@/types";

interface KFSCheckerProps {
  apiBaseUrl: string;
}

export default function KFSChecker({ apiBaseUrl }: KFSCheckerProps) {
  const [sampleOffers, setSampleOffers] = useState<SampleLoanOffer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string>("custom");

  // Form Fields
  const [lenderName, setLenderName] = useState<string>("SpeedCash Instant Nano-Credit App");
  const [loanType, setLoanType] = useState<string>("Digital Microloan");
  const [principal, setPrincipal] = useState<number>(60000);
  const [tenureMonths, setTenureMonths] = useState<number>(6);
  const [nominalRate, setNominalRate] = useState<number>(36.0);
  const [processingFee, setProcessingFee] = useState<number>(7200);
  const [insuranceCharges, setInsuranceCharges] = useState<number>(2500);
  const [docCharges, setDocCharges] = useState<number>(1800);
  const [coolingOffDays, setCoolingOffDays] = useState<number>(0);
  const [penalDesc, setPenalDesc] = useState<string>("3% per month compounded penal interest added to base rate");
  const [isPenalCompounded, setIsPenalCompounded] = useState<boolean>(true);
  const [recoveryAgentDisclosed, setRecoveryAgentDisclosed] = useState<boolean>(false);
  const [nodalOfficerDisclosed, setNodalOfficerDisclosed] = useState<boolean>(false);
  const [unbundledInsurance, setUnbundledInsurance] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<KFSCheckResponse | null>(null);

  // Parser & KFS Sheet Modal States
  const [showParser, setShowParser] = useState<boolean>(false);
  const [pastedText, setPastedText] = useState<string>("");
  const [showKFSModal, setShowKFSModal] = useState<boolean>(false);

  // Fetch sample offers
  useEffect(() => {
    fetch(`${apiBaseUrl}/api/official/sample-offers`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSampleOffers(data);
      })
      .catch((e) => console.error("Error fetching sample offers:", e));
  }, [apiBaseUrl]);

  // Run audit function
  const runAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/kfs/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lender_name: lenderName,
          loan_type: loanType,
          principal,
          tenure_months: tenureMonths,
          nominal_rate_pa: nominalRate,
          processing_fee: processingFee,
          insurance_charges: insuranceCharges,
          documentation_charges: docCharges,
          cooling_off_days: coolingOffDays,
          penal_charge_description: penalDesc,
          is_penal_compounded: isPenalCompounded,
          recovery_agent_disclosed: recoveryAgentDisclosed,
          nodal_officer_disclosed: nodalOfficerDisclosed,
          unbundled_insurance: unbundledInsurance,
        }),
      });
      if (res.ok) {
        const data: KFSCheckResponse = await res.json();
        setAuditResult(data);
      }
    } catch (e) {
      console.error("Audit error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Initial audit run
  useEffect(() => {
    runAudit();
  }, [apiBaseUrl]);

  const loadPresetOffer = (offer: SampleLoanOffer) => {
    setSelectedOfferId(offer.id);
    setLenderName(offer.lender_name);
    setLoanType(offer.loan_type);
    setPrincipal(offer.principal);
    setTenureMonths(offer.tenure_months);
    setNominalRate(offer.nominal_rate_pa);
    setProcessingFee(offer.processing_fee);
    setInsuranceCharges(offer.insurance_charges);
    setDocCharges(offer.documentation_charges);
    setCoolingOffDays(offer.cooling_off_days);
    setPenalDesc(offer.penal_charge_type);
    setIsPenalCompounded(offer.penal_charge_type.toLowerCase().includes("compound"));
    setRecoveryAgentDisclosed(offer.recovery_agent_disclosed);
    setNodalOfficerDisclosed(offer.nodal_officer_disclosed);
    setUnbundledInsurance(offer.unbundled_insurance);
  };

  // Smart Parser for pasted sanction letter clauses
  const parseSanctionLetter = () => {
    if (!pastedText.trim()) return;
    const text = pastedText.toLowerCase();

    // Extract principal (e.g. ₹5,00,000 or 500000 or 50,000)
    const amountMatch = text.match(/(?:loan amount|principal|sanction(?:ed)? amount|rs\.?|inr|₹)\s*[:=-]?\s*([0-9,]+)/i);
    if (amountMatch) {
      const val = Number(amountMatch[1].replace(/,/g, ""));
      if (!isNaN(val) && val > 0) setPrincipal(val);
    }

    // Extract interest rate (e.g. 11.5% or 36% p.a.)
    const rateMatch = text.match(/(?:interest rate|rate of interest|roi|interest)\s*[:=-]?\s*([0-9.]+)\s*%/i);
    if (rateMatch) {
      const val = parseFloat(rateMatch[1]);
      if (!isNaN(val) && val > 0) setNominalRate(val);
    }

    // Extract tenure (e.g. 36 months or 3 years)
    const tenureMatch = text.match(/(?:tenure|duration|period)\s*[:=-]?\s*([0-9]+)\s*(months?|yrs?|years?)/i);
    if (tenureMatch) {
      const num = parseInt(tenureMatch[1], 10);
      const unit = tenureMatch[2];
      if (unit.startsWith("y")) setTenureMonths(num * 12);
      else setTenureMonths(num);
    }

    // Extract processing fee
    const feeMatch = text.match(/(?:processing fee|pf)\s*[:=-]?\s*(?:rs\.?|inr|₹)?\s*([0-9,]+)/i);
    if (feeMatch) {
      const val = Number(feeMatch[1].replace(/,/g, ""));
      if (!isNaN(val)) setProcessingFee(val);
    }

    // Check cooling off mentions
    const coolingMatch = text.match(/(?:cooling[- ]off|look[- ]up)\s*(?:period|window)?\s*[:=-]?\s*([0-9]+)\s*days?/i);
    if (coolingMatch) {
      setCoolingOffDays(parseInt(coolingMatch[1], 10));
    } else if (text.includes("cooling") || text.includes("look-up")) {
      setCoolingOffDays(3);
    } else {
      setCoolingOffDays(0);
    }

    // Check compound penal interest
    if (text.includes("compound") && (text.includes("penal") || text.includes("overdue") || text.includes("penalty"))) {
      setIsPenalCompounded(true);
      setPenalDesc("Compounded penal interest applied to overdue installments");
    } else {
      setIsPenalCompounded(false);
      setPenalDesc("Non-compounded simple penal charge");
    }

    // Check nodal officer
    setNodalOfficerDisclosed(text.includes("nodal") || text.includes("ombudsman") || text.includes("grievance"));
    setRecoveryAgentDisclosed(text.includes("recovery agent") || text.includes("collection agency"));

    // Trigger fresh audit with extracted terms
    setTimeout(() => {
      runAudit();
      setShowParser(false);
    }, 150);
  };

  const sampleSanctionTexts = {
    bank: "SANCTION LETTER — Axis/HDFC Bank. Sanctioned Amount: Rs. 500,000. Interest Rate: 11.5% p.a. reducing. Tenure: 36 months. Processing Fee: Rs. 5,000. Documentation Charges: Rs. 500. Cooling-off period: 3 days as per RBI guidelines. Penal charges: Rs. 500 flat fee per month of default (non-compounded). Principal Nodal Officer: nodalofficer@bank.com. Grievance redressal TAT: 30 days.",
    predatory: "SpeedCash Instant Approval Notification! Loan Amount: Rs. 60,000 disbursed immediately. Interest Rate: 36% p.a. Tenure: 6 months. Platform & Processing Fee: Rs. 7,200. Insurance Fee: Rs. 2,500. Documentation: Rs. 1,800. Penal interest: 3% per month compounded on outstanding balance. No cooling-off cancellation allowed once disbursed.",
    nbfc: "Tata/Bajaj FinServ Sanction Notice. Loan Amount: Rs. 250,000. Tenure: 24 months. Rate: 14% p.a. Processing fee: Rs. 3,500. Insurance charges: Rs. 1,200 (optional). Look-up window: 3 days. Penal charges: 2% simple penal charge on overdue amount. Principal Nodal Officer details provided."
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RBI Circular DOR.MCS.REC.21/01.01.001/2024-25</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              RBI Key Facts Statement (KFS) Document Checker
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Audit loan offers, sanction letters, and contracts against the mandatory RBI KFS transparency framework.
              Detect predatory hidden fees, illegal compound penal interest, and missing cooling-off rights.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowKFSModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-semibold transition-all shadow-md shadow-emerald-500/10"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>View RBI KFS Sheet</span>
            </button>
            <a
              href="https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=12827"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs text-slate-300 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>Official Circular</span>
            </a>
          </div>
        </div>
      </div>

      {/* Smart Sanction Letter Parser Accordion */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <button
          onClick={() => setShowParser(!showParser)}
          className="w-full p-4 flex items-center justify-between text-left text-xs font-medium text-slate-200 hover:bg-slate-900/60 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <ClipboardPaste className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-white">Smart Sanction Letter Parser (Paste & Auto-Audit)</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px]">
              Fast Auto-Extraction
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">{showParser ? "Hide Parser" : "Open Parser"}</span>
        </button>

        {showParser && (
          <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">
                Paste the text from your loan sanction email, WhatsApp offer, or loan agreement:
              </span>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-500">Insert Sample:</span>
                <button
                  onClick={() => setPastedText(sampleSanctionTexts.bank)}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:text-white text-[10px]"
                >
                  Bank Loan
                </button>
                <button
                  onClick={() => setPastedText(sampleSanctionTexts.predatory)}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:text-white text-[10px]"
                >
                  Predatory App
                </button>
                <button
                  onClick={() => setPastedText(sampleSanctionTexts.nbfc)}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:text-white text-[10px]"
                >
                  NBFC
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="e.g. Sanctioned Amount: Rs. 500,000 at 11.5% for 36 months. Processing fee: Rs. 5,000..."
              className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono text-xs"
            ></textarea>

            <div className="flex justify-end">
              <button
                onClick={parseSanctionLetter}
                disabled={!pastedText.trim()}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-xs transition-all shadow-md shadow-blue-600/20"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Auto-Extract & Audit Compliance</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preset Offer Quick Buttons */}
      <div className="glass-panel rounded-xl p-4 border border-slate-800 space-y-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
          Load Pre-configured Test Offers:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sampleOffers.map((offer) => (
            <button
              key={offer.id}
              onClick={() => loadPresetOffer(offer)}
              className={`p-3 rounded-lg border text-left transition-all text-xs ${
                selectedOfferId === offer.id
                  ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10"
                  : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700"
              }`}
            >
              <div className="font-semibold text-white truncate">{offer.lender_name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">{offer.loan_type}</div>
              <div className="text-[10px] text-blue-400 mt-1">₹{offer.principal.toLocaleString("en-IN")} • {offer.nominal_rate_pa}% p.a.</div>
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Loan Terms Form vs Compliance Verdict */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Loan Offer Form (6 cols) */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <span>Loan Disclosure Terms</span>
            </span>
            <button
              onClick={runAudit}
              disabled={loading}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-md shadow-emerald-600/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Re-Audit</span>
            </button>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Lender / App Name</label>
                <input
                  type="text"
                  value={lenderName}
                  onChange={(e) => {
                    setLenderName(e.target.value);
                    setSelectedOfferId("custom");
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Loan Category</label>
                <input
                  type="text"
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Principal (₹)</label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Rate (% p.a.)</label>
                <input
                  type="number"
                  step={0.1}
                  value={nominalRate}
                  onChange={(e) => setNominalRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Tenure (Months)</label>
                <input
                  type="number"
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>
            </div>

            {/* Deductions */}
            <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 space-y-2">
              <span className="text-[11px] font-semibold text-slate-300">Upfront Deductions</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 text-[11px]">Processing Fee (₹)</label>
                  <input
                    type="number"
                    value={processingFee}
                    onChange={(e) => setProcessingFee(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 text-[11px]">Insurance Fee (₹)</label>
                  <input
                    type="number"
                    value={insuranceCharges}
                    onChange={(e) => setInsuranceCharges(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 text-[11px]">Doc Charges (₹)</label>
                  <input
                    type="number"
                    value={docCharges}
                    onChange={(e) => setDocCharges(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Regulatory Compliance Toggles */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                <div>
                  <div className="font-medium text-slate-200">Cooling-Off / Look-Up Period</div>
                  <div className="text-[11px] text-slate-500">RBI mandates min 3 days exit option without penalty</div>
                </div>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={coolingOffDays}
                    onChange={(e) => setCoolingOffDays(Number(e.target.value))}
                    className="w-16 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-center text-white font-mono"
                  />
                  <span className="text-slate-400">days</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                <div>
                  <div className="font-medium text-slate-200">Compounding Overdue Penalties</div>
                  <div className="text-[11px] text-slate-500">RBI strictly prohibits capitalizing penal interest</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPenalCompounded}
                    onChange={(e) => setIsPenalCompounded(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                <div>
                  <div className="font-medium text-slate-200">Unbundled & Voluntary Insurance</div>
                  <div className="text-[11px] text-slate-500">Insurance cannot be a mandatory tied prerequisite</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={unbundledInsurance}
                    onChange={(e) => setUnbundledInsurance(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                <div>
                  <div className="font-medium text-slate-200">Designated Nodal Officer & Ombudsman Details</div>
                  <div className="text-[11px] text-slate-500">Lender contact for complaints with 30-day escalation</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nodalOfficerDisclosed}
                    onChange={(e) => setNodalOfficerDisclosed(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                <div>
                  <div className="font-medium text-slate-200">Recovery Agent Advance Disclosure</div>
                  <div className="text-[11px] text-slate-500">Must disclose third-party agencies and code of conduct</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recoveryAgentDisclosed}
                    onChange={(e) => setRecoveryAgentDisclosed(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Results & Findings (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Compliance Gauge Card */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  KFS Compliance Verdict
                </span>
                <h3 className="text-2xl font-extrabold text-white">
                  {auditResult ? auditResult.status : "Analyzing..."}
                </h3>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-3xl font-extrabold font-mono text-white">
                  {auditResult ? `${auditResult.score}/100` : "--"}
                </span>
                <span className="text-[11px] text-slate-400">
                  {auditResult?.violations_count || 0} Critical Violations
                </span>
              </div>
            </div>

            {/* Score progress bar */}
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${auditResult?.score || 0}%` }}
                className={`h-full transition-all duration-500 ${
                  (auditResult?.score || 0) >= 80
                    ? "bg-emerald-500"
                    : (auditResult?.score || 0) >= 55
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
              ></div>
            </div>

            {/* Computed APR highlight */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block">Computed True APR:</span>
                <span className="text-base font-bold font-mono text-amber-400">
                  {auditResult?.effective_apr}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Nominal Interest Rate:</span>
                <span className="text-base font-bold font-mono text-slate-300">
                  {nominalRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Regulatory Findings List */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Clause-by-Clause Findings</span>
            </h4>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {auditResult?.findings.map((item, index) => {
                const isPass = item.status === "PASS";
                const isFail = item.status === "FAIL";
                const isWarning = item.status === "WARNING";

                return (
                  <div
                    key={index}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                      isFail
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
                        : isWarning
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {isFail && <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
                        {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                        {isPass && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                        <span className="font-semibold text-white">{item.title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900/80 text-slate-300 border border-slate-800">
                        {item.citation_id}
                      </span>
                    </div>

                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {item.description}
                    </p>

                    <div className="pt-1 flex items-start space-x-1.5 text-[10px] text-slate-400">
                      <Info className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span><strong>Borrower Advice:</strong> {item.recommendation}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Official Standardized RBI KFS Sheet Modal */}
      {showKFSModal && auditResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-950 w-full max-w-3xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Top Controls */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white text-sm">
                  Standardised Key Facts Statement (RBI KFS Annex 1)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setShowKFSModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Content Sheet */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-200 font-sans print:bg-white print:text-black">
              {/* Document Header */}
              <div className="text-center pb-4 border-b border-slate-800 print:border-black space-y-1">
                <div className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold">
                  RESERVE BANK OF INDIA — REGULATED ENTITY DISCLOSURE
                </div>
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">
                  STANDARDISED KEY FACTS STATEMENT (KFS)
                </h2>
                <p className="text-[11px] text-slate-400">
                  Issued under Circular DOR.MCS.REC.21/01.01.001/2024-25 for Retail and MSME Term Loans
                </p>
              </div>

              {/* Part A: Key Facts */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                  Part A: Key Loan Parameters
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Lender Name:</span>
                    <span className="font-bold text-white">{lenderName}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Loan Category:</span>
                    <span className="font-bold text-white">{loanType}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Sanction Amount:</span>
                    <span className="font-bold text-white">₹{principal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Nominal Interest Rate:</span>
                    <span className="font-bold text-white">{nominalRate}% p.a. (Reducing)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Effective APR (All-Inclusive):</span>
                    <span className="font-bold text-amber-400">{auditResult.effective_apr}%</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Loan Tenure:</span>
                    <span className="font-bold text-white">{tenureMonths} Months</span>
                  </div>
                </div>
              </div>

              {/* Part B: Fee Breakdown & Net Disbursement */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                  Part B: Fee Deductions & Net Disbursement
                </h3>
                <table className="w-full text-left font-mono text-[11px] border border-slate-800">
                  <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                    <tr>
                      <th className="p-2">Cost Element</th>
                      <th className="p-2 text-right">Amount (₹)</th>
                      <th className="p-2">Payable To</th>
                      <th className="p-2">Included in APR?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    <tr>
                      <td className="p-2">Loan Principal Sanctioned</td>
                      <td className="p-2 text-right text-emerald-400 font-bold">₹{principal.toLocaleString("en-IN")}</td>
                      <td className="p-2">Borrower Bank Account</td>
                      <td className="p-2">Base Amount</td>
                    </tr>
                    <tr>
                      <td className="p-2">Processing Fee (Upfront)</td>
                      <td className="p-2 text-right text-amber-400">-₹{processingFee.toLocaleString("en-IN")}</td>
                      <td className="p-2">Regulated Entity (Lender)</td>
                      <td className="p-2">Yes (Factored)</td>
                    </tr>
                    <tr>
                      <td className="p-2">Insurance / Bundled Third-Party</td>
                      <td className="p-2 text-right text-amber-400">-₹{insuranceCharges.toLocaleString("en-IN")}</td>
                      <td className="p-2">Third-Party Insurer</td>
                      <td className="p-2">Yes (Factored)</td>
                    </tr>
                    <tr>
                      <td className="p-2">Documentation & Verification</td>
                      <td className="p-2 text-right text-amber-400">-₹{docCharges.toLocaleString("en-IN")}</td>
                      <td className="p-2">Legal & Admin</td>
                      <td className="p-2">Yes (Factored)</td>
                    </tr>
                    <tr className="bg-slate-900/80 font-bold">
                      <td className="p-2 text-white">Net Disbursed to Borrower</td>
                      <td className="p-2 text-right text-emerald-400">
                        ₹{(principal - (processingFee + insuranceCharges + docCharges)).toLocaleString("en-IN")}
                      </td>
                      <td className="p-2" colSpan={2}>
                        Direct Bank-to-Bank Transfer
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Part C: Qualitative Disclosures & Statutory Consumer Rights */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                  Part C: Qualitative Disclosures & Statutory Rights
                </h3>
                <div className="space-y-2 text-[11px] leading-relaxed">
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                    <strong className="text-white block">1. Cooling-Off / Look-Up Period:</strong>
                    The borrower is entitled to a cooling-off window of <strong>{coolingOffDays} days</strong>. During this window, the borrower can exit the agreement by repaying the principal plus proportionate interest, with zero prepayment penalty.
                  </div>
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                    <strong className="text-white block">2. Penal Charges Specification:</strong>
                    {penalDesc}. Penal charges are levied strictly without compounding or capitalization into the principal loan balance.
                  </div>
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                    <strong className="text-white block">3. Grievance Redressal & Ombudsman Escalation:</strong>
                    Designated Grievance Redressal Officer turnaround time is 30 days. If unsatisfied, the borrower may lodge a complaint with the Reserve Bank Ombudsman at <span className="text-blue-400">cms.rbi.org.in</span>.
                  </div>
                </div>
              </div>

              {/* Acknowledgement Footer */}
              <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-end">
                <div>
                  <p>Certified in compliance with RBI Circular DOR.MCS.REC.21/01.01.001/2024-25</p>
                  <p className="mt-0.5">Audit Reference: {auditResult.audit_id}</p>
                </div>
                <div className="text-right">
                  <div className="w-32 border-b border-slate-600 mb-1"></div>
                  <span>Borrower Acknowledgement</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
