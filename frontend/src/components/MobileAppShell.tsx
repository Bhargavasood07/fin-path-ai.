"use client";

import React, { useState } from "react";
import {
  Calculator,
  ShieldCheck,
  Bot,
  FolderOpen,
  Wifi,
  BatteryMedium,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import LoanCalculator from "./LoanCalculator";
import KFSChecker from "./KFSChecker";
import SourceGroundedAssistant from "./SourceGroundedAssistant";
import SavedJourneys from "./SavedJourneys";

interface MobileAppShellProps {
  apiBaseUrl: string;
  onExitAppMode: () => void;
  journeyCount: number;
}

export default function MobileAppShell({ apiBaseUrl, onExitAppMode, journeyCount }: MobileAppShellProps) {
  const [mobileTab, setMobileTab] = useState<"calc" | "check" | "assistant" | "saved">("calc");

  return (
    <div className="flex flex-col items-center justify-center py-6 px-2 min-h-screen">
      {/* Top Banner indicating Mobile App simulation */}
      <div className="mb-4 flex items-center justify-between w-full max-w-sm px-2 text-xs text-slate-400">
        <div className="flex items-center space-x-1.5 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium">FinPath Mobile App Mode</span>
        </div>
        <button
          onClick={onExitAppMode}
          className="text-blue-400 hover:text-blue-300 font-medium underline text-[11px]"
        >
          Exit to Full Web Portal
        </button>
      </div>

      {/* iPhone / Android Device Container */}
      <div className="w-full max-w-[414px] bg-slate-950 rounded-[44px] border-[8px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col h-[844px] relative">
        {/* Device Notch & Status Bar */}
        <div className="bg-slate-950 pt-3 pb-2 px-6 flex items-center justify-between text-white text-[11px] font-medium select-none z-30">
          <span>9:41</span>
          {/* Dynamic Island / Speaker */}
          <div className="w-24 h-4 bg-slate-900 rounded-full flex items-center justify-center space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
          </div>
          <div className="flex items-center space-x-1.5">
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <BatteryMedium className="w-4 h-4 text-slate-300" />
          </div>
        </div>

        {/* Mobile App Header */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between z-20">
          <div>
            <span className="text-[10px] uppercase font-mono text-blue-400 font-semibold tracking-wider block">
              FinPath Mobile
            </span>
            <div className="text-sm font-bold text-white leading-tight">
              {mobileTab === "calc" && "⚡ Smart EMI & APR"}
              {mobileTab === "check" && "🛡️ KFS Compliance Scan"}
              {mobileTab === "assistant" && "🤖 Grounded AI Chat"}
              {mobileTab === "saved" && "📁 My Loan Portfolio"}
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            RBI 2024
          </span>
        </div>

        {/* Mobile Viewport Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {mobileTab === "calc" && (
            <div className="space-y-4">
              <LoanCalculator apiBaseUrl={apiBaseUrl} />
            </div>
          )}

          {mobileTab === "check" && (
            <div className="space-y-4">
              <KFSChecker apiBaseUrl={apiBaseUrl} />
            </div>
          )}

          {mobileTab === "assistant" && (
            <div className="h-full">
              <SourceGroundedAssistant apiBaseUrl={apiBaseUrl} />
            </div>
          )}

          {mobileTab === "saved" && (
            <div className="space-y-4">
              <SavedJourneys
                apiBaseUrl={apiBaseUrl}
                onNavigateToCalculator={() => setMobileTab("calc")}
              />
            </div>
          )}
        </div>

        {/* Bottom App Navigation Bar */}
        <div className="bg-slate-950/95 border-t border-slate-800/80 px-4 py-2 flex items-center justify-around z-30 backdrop-blur-lg">
          <button
            onClick={() => setMobileTab("calc")}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
              mobileTab === "calc" ? "text-blue-400 font-semibold scale-105" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Calculator className="w-5 h-5" />
            <span className="text-[10px] mt-1">Calculator</span>
          </button>

          <button
            onClick={() => setMobileTab("check")}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
              mobileTab === "check" ? "text-emerald-400 font-semibold scale-105" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] mt-1">KFS Audit</span>
          </button>

          <button
            onClick={() => setMobileTab("assistant")}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
              mobileTab === "assistant" ? "text-indigo-400 font-semibold scale-105" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Bot className="w-5 h-5" />
            <span className="text-[10px] mt-1">AI Consult</span>
          </button>

          <button
            onClick={() => setMobileTab("saved")}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl relative transition-all ${
              mobileTab === "saved" ? "text-amber-400 font-semibold scale-105" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <FolderOpen className="w-5 h-5" />
            <span className="text-[10px] mt-1">Journeys</span>
            {journeyCount > 0 && (
              <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-blue-600 text-[9px] font-bold text-white flex items-center justify-center">
                {journeyCount}
              </span>
            )}
          </button>
        </div>

        {/* Home Indicator bar */}
        <div className="bg-slate-950 pb-2 flex justify-center">
          <div className="w-32 h-1 bg-slate-700 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
