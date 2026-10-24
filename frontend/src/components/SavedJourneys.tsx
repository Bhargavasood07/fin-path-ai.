"use client";

import React, { useState, useEffect } from "react";
import {
  FolderOpen,
  Trash2,
  GitCompare,
  ArrowRight,
  TrendingUp,
  Percent,
  Calendar,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plus
} from "lucide-react";
import { Journey } from "@/types";

interface SavedJourneysProps {
  apiBaseUrl: string;
  onNavigateToCalculator: () => void;
}

export default function SavedJourneys({ apiBaseUrl, onNavigateToCalculator }: SavedJourneysProps) {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  const fetchJourneys = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/journeys`);
      if (res.ok) {
        const data = await res.json();
        setJourneys(data);
      }
    } catch (e) {
      console.error("Failed to load journeys:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourneys();
  }, [apiBaseUrl]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/journeys/${id}`, { method: "DELETE" });
      if (res.ok) {
        setJourneys((prev) => prev.filter((j) => j.id !== id));
        setSelectedForCompare((prev) => prev.filter((x) => x !== id));
      }
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  const toggleCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((x) => x !== id));
    } else {
      if (selectedForCompare.length >= 3) return; // max 3
      setSelectedForCompare([...selectedForCompare, id]);
    }
  };

  const comparedJourneys = journeys.filter((j) => selectedForCompare.includes(j.id));

  const getOutflow = (item: Journey) => item.total_payment + item.processing_fee + item.other_charges;

  // Determine best deal metrics among compared journeys
  const bestAprId =
    comparedJourneys.length > 1
      ? comparedJourneys.reduce((min, cur) => (cur.apr < min.apr ? cur : min)).id
      : null;
  const bestOutflowId =
    comparedJourneys.length > 1
      ? comparedJourneys.reduce((min, cur) => (getOutflow(cur) < getOutflow(min) ? cur : min)).id
      : null;

  const maxOutflow =
    comparedJourneys.length > 1
      ? Math.max(...comparedJourneys.map(getOutflow))
      : 0;
  const minOutflow =
    comparedJourneys.length > 1
      ? Math.min(...comparedJourneys.map(getOutflow))
      : 0;
  const potentialSavings = maxOutflow - minOutflow;

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-2">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>SQLite Persistent Storage</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Saved Loan Journeys & Comparison
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Track and benchmark your loan simulations. Compare effective APR, upfront fees,
              and monthly repayments side-by-side to make confident financial decisions.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchJourneys}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-all"
              title="Refresh SQLite Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onNavigateToCalculator}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-blue-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Loan Scenario</span>
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Box (if 2 or 3 selected) */}
      {comparedJourneys.length >= 2 && (
        <div className="glass-panel rounded-2xl p-6 border border-blue-500/40 shadow-2xl space-y-4 bg-slate-900/90">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <GitCompare className="w-5 h-5 text-blue-400" />
              <span>Side-by-Side Scenario Comparison ({comparedJourneys.length} Offers)</span>
            </h3>
            <button
              onClick={() => setSelectedForCompare([])}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear Comparison
            </button>
          </div>

          {potentialSavings > 0 && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
              <span className="flex items-center space-x-1.5 font-medium">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Financial Benchmark: Choosing the optimal scenario saves you <strong>{formatINR(potentialSavings)}</strong> in total repayment costs!</span>
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            {comparedJourneys.map((j) => {
              const isBestApr = j.id === bestAprId;
              const isBestOutflow = j.id === bestOutflowId;
              return (
                <div
                  key={j.id}
                  className={`p-4 rounded-xl bg-slate-950 border space-y-3 relative ${
                    isBestOutflow
                      ? "border-emerald-500/60 shadow-lg shadow-emerald-500/10"
                      : "border-slate-800"
                  }`}
                >
                  {isBestOutflow && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow">
                      🏆 Lowest Total Cost
                    </span>
                  )}
                  {isBestApr && !isBestOutflow && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow">
                      ⚡ Lowest APR
                    </span>
                  )}

                  <div className="font-bold text-sm text-white font-sans truncate">{j.title}</div>
                  <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Principal:</span>
                    <span>{formatINR(j.principal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tenure:</span>
                    <span>{j.tenure_months} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nominal Rate:</span>
                    <span>{j.interest_rate}%</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1 text-emerald-400 font-bold">
                    <span>Monthly EMI:</span>
                    <span>{formatINR(j.monthly_emi)}</span>
                  </div>
                  <div className="flex justify-between text-amber-400 font-bold">
                    <span>True APR:</span>
                    <span>{j.apr}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Upfront Deductions:</span>
                    <span>{formatINR(j.processing_fee + j.other_charges)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1 text-white">
                    <span>Total Outflow:</span>
                    <span>{formatINR(j.total_payment + j.processing_fee + j.other_charges)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Journeys List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {journeys.map((journey) => {
          const isSelected = selectedForCompare.includes(journey.id);
          const isCompliant = journey.kfs_score >= 80;

          return (
            <div
              key={journey.id}
              className={`glass-panel rounded-2xl p-5 border transition-all space-y-4 flex flex-col justify-between ${
                isSelected
                  ? "border-blue-500 shadow-lg shadow-blue-500/10 bg-slate-900/90"
                  : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-white text-base leading-snug line-clamp-1">
                      {journey.title}
                    </h3>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {journey.borrower_name} • {new Date(journey.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0 ${
                      isCompliant
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {journey.kfs_status || "Evaluated"}
                  </span>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Monthly EMI</span>
                    <span className="text-sm font-bold text-emerald-400 font-sans">
                      {formatINR(journey.monthly_emi)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">True APR</span>
                    <span className="text-sm font-bold text-amber-400">
                      {journey.apr}%
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="text-[10px] text-slate-500 uppercase block">Principal</span>
                    <span className="text-slate-300">{formatINR(journey.principal)}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-[10px] text-slate-500 uppercase block">Tenure</span>
                    <span className="text-slate-300">{journey.tenure_months} months</span>
                  </div>
                </div>

                {journey.notes && (
                  <p className="text-xs text-slate-400 line-clamp-2 italic">
                    "{journey.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => toggleCompare(journey.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-blue-600 border-blue-500 text-white font-medium"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>{isSelected ? "Comparing" : "Compare"}</span>
                </button>

                <button
                  onClick={() => handleDelete(journey.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Delete from database"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {journeys.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center text-slate-500 glass-panel rounded-2xl border border-slate-800 space-y-3">
            <FolderOpen className="w-10 h-10 mx-auto text-slate-600" />
            <div className="text-sm">No saved journeys found in SQLite database.</div>
            <button
              onClick={onNavigateToCalculator}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              Create Your First Scenario
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
