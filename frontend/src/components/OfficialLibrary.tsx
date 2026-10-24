"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  ExternalLink,
  Shield,
  Search,
  FileText,
  BookmarkCheck,
  CheckCircle,
  HelpCircle
} from "lucide-react";

interface OfficialLibraryProps {
  apiBaseUrl: string;
}

export default function OfficialLibrary({ apiBaseUrl }: OfficialLibraryProps) {
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"kfs" | "digital">("kfs");

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/official/circulars`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((e) => console.error("Error loading circulars:", e));
  }, [apiBaseUrl]);

  const kfsCircular = data?.kfs_circular_2024;
  const dlCircular = data?.digital_lending_2022;

  const activeDoc = activeTab === "kfs" ? kfsCircular : dlCircular;
  const clauses: any[] = activeDoc?.clauses || [];

  const filteredClauses = clauses.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.text?.toLowerCase().includes(q) ||
      c.section?.toLowerCase().includes(q) ||
      c.clause_id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Approved Financial Document Library</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Official RBI Circulars & References
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Inspect the primary statutory reference documents that ground FinPath AI's calculations,
              audits, and conversational assistant.
            </p>
          </div>
        </div>
      </div>

      {/* Official Setup & Reference Links Quick Hub */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          Official Project Setup References & Documentation
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <a
            href="https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=12827"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 flex items-start space-x-3 transition-all"
          >
            <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white flex items-center space-x-1">
                <span>RBI KFS Circular 2024</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Circular DOR.MCS.REC.21/01.01.001/2024-25</p>
            </div>
          </a>

          <a
            href="https://developers.openai.com/api/docs/quickstart"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 flex items-start space-x-3 transition-all"
          >
            <BookOpen className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white flex items-center space-x-1">
                <span>OpenAI API Quickstart</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Model requests & setup reference</p>
            </div>
          </a>

          <a
            href="https://developers.openai.com/api/docs/guides/tools-file-search"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 flex items-start space-x-3 transition-all"
          >
            <Search className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white flex items-center space-x-1">
                <span>OpenAI File Search Guide</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Retrieval from financial document vector stores</p>
            </div>
          </a>

          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 flex items-start space-x-3 transition-all"
          >
            <FileText className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white flex items-center space-x-1">
                <span>Next.js Documentation</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Frontend setup, App router & components</p>
            </div>
          </a>

          <a
            href="https://fastapi.tiangolo.com/tutorial/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 flex items-start space-x-3 transition-all"
          >
            <BookmarkCheck className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white flex items-center space-x-1">
                <span>FastAPI Tutorial</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Backend APIs, Pydantic & validation</p>
            </div>
          </a>

          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 flex items-start space-x-3 transition-all"
          >
            <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white flex items-center space-x-1">
                <span>Local Swagger API Docs</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Interactive endpoints on http://127.0.0.1:8000/docs</p>
            </div>
          </a>
        </div>
      </div>

      {/* Circular Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("kfs")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "kfs"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Key Facts Statement Circular (2024)
          </button>
          <button
            onClick={() => setActiveTab("digital")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "digital"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Digital Lending Guidelines (2022)
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circular clauses..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Active Circular Overview */}
      {activeDoc && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
          <div className="text-[10px] text-indigo-400 font-mono uppercase font-semibold">
            {activeDoc.circular_id} • Issued: {activeDoc.issue_date}
          </div>
          <div className="text-sm font-bold text-white">{activeDoc.title}</div>
          <p className="text-slate-400 text-xs leading-relaxed">{activeDoc.summary}</p>
        </div>
      )}

      {/* Clauses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClauses.map((clause) => (
          <div
            key={clause.clause_id}
            className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
                  {clause.clause_id}
                </span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  {clause.section}
                </span>
              </div>

              <h3 className="font-bold text-white text-sm">{clause.title}</h3>
              <p className="text-slate-300 text-xs leading-relaxed">"{clause.text}"</p>
            </div>

            {clause.key_takeaways && clause.key_takeaways.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <span className="text-[10px] text-emerald-400 font-semibold block">Key Consumer Protections:</span>
                <ul className="space-y-0.5 text-[11px] text-slate-400">
                  {clause.key_takeaways.map((point: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
