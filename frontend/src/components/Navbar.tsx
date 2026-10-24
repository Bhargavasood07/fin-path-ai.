"use client";

import React from "react";
import {
  Compass,
  ShieldCheck,
  Calculator,
  Bot,
  FolderOpen,
  BookOpen,
  Settings
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  journeyCount: number;
  onOpenSettings: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  journeyCount,
  onOpenSettings,
}: NavbarProps) {
  const tabs = [
    { id: "calculator", label: "EMI & APR", icon: Calculator },
    { id: "checker", label: "KFS Auditor", icon: ShieldCheck },
    { id: "assistant", label: "AI Advisor", icon: Bot },
    { id: "journeys", label: "Journeys", icon: FolderOpen, count: journeyCount },
    { id: "official", label: "RBI Library", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Brand Logo & Title (Never wraps) */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer flex-shrink-0 select-none"
            onClick={() => setActiveTab("calculator")}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-white leading-none whitespace-nowrap">
                  FinPath <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">AI</span>
                </span>
                <span className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60 rounded-full leading-none whitespace-nowrap">
                  RBI 2024
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden xl:block leading-tight mt-0.5 whitespace-nowrap">
                Source-Grounded Financial Intelligence
              </p>
            </div>
          </div>

          {/* Navigation Links - Single Row, No Wrapping */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-600 text-white leading-none">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800 flex-shrink-0"
              title="AI & API Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
