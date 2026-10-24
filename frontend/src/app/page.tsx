"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import LoanCalculator from "@/components/LoanCalculator";
import KFSChecker from "@/components/KFSChecker";
import SourceGroundedAssistant from "@/components/SourceGroundedAssistant";
import SavedJourneys from "@/components/SavedJourneys";
import OfficialLibrary from "@/components/OfficialLibrary";
import MobileAppShell from "@/components/MobileAppShell";
import SettingsModal from "@/components/SettingsModal";
import { ExternalLink, ShieldCheck, Heart } from "lucide-react";

const API_BASE_URL = typeof window !== "undefined" ? "" : "http://127.0.0.1:8000";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("calculator");
  const [isAppMode, setIsAppMode] = useState<boolean>(false);
  const [journeyCount, setJourneyCount] = useState<number>(3);
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Check backend health & journey count
  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      if (res.ok) {
        setApiConnected(true);
      } else {
        setApiConnected(false);
      }
    } catch {
      setApiConnected(false);
    }

    try {
      const resJourneys = await fetch(`${API_BASE_URL}/api/journeys`);
      if (resJourneys.ok) {
        const data = await resJourneys.json();
        if (Array.isArray(data)) setJourneyCount(data.length);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        journeyCount={journeyCount}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div>
          {activeTab === "calculator" && (
            <LoanCalculator
              apiBaseUrl={API_BASE_URL}
              onSaveJourneySuccess={checkHealth}
            />
          )}
          {activeTab === "checker" && <KFSChecker apiBaseUrl={API_BASE_URL} />}
          {activeTab === "assistant" && <SourceGroundedAssistant apiBaseUrl={API_BASE_URL} />}
          {activeTab === "journeys" && (
            <SavedJourneys
              apiBaseUrl={API_BASE_URL}
              onNavigateToCalculator={() => setActiveTab("calculator")}
            />
          )}
          {activeTab === "official" && <OfficialLibrary apiBaseUrl={API_BASE_URL} />}
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiConnected={apiConnected}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>FinPath AI • Grounded in RBI Circular DOR.MCS.REC.21/01.01.001/2024-25</span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://www.rbi.org.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-400 transition-colors flex items-center space-x-1"
            >
              <span>RBI Official</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-400 transition-colors flex items-center space-x-1"
            >
              <span>FastAPI Swagger Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
