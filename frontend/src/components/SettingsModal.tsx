"use client";

import React, { useState } from "react";
import {
  Settings,
  X,
  Key,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Sparkles
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiConnected: boolean;
}

export default function SettingsModal({ isOpen, onClose, apiConnected }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("gpt-4o-mini");
  const [vectorStoreId, setVectorStoreId] = useState<string>("");
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (typeof window !== "undefined") {
      if (apiKey) localStorage.setItem("finpath_openai_key", apiKey);
      else localStorage.removeItem("finpath_openai_key");

      localStorage.setItem("finpath_model", model);
      if (vectorStoreId) localStorage.setItem("finpath_vector_store", vectorStoreId);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">AI Engine & API Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Backend Status Notification */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            {apiConnected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
            )}
            <span className="text-slate-300 font-medium">
              Backend Status: {apiConnected ? "Connected (http://127.0.0.1:8000)" : "Connecting / Offline"}
            </span>
          </div>
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline flex items-center space-x-1"
          >
            <span>/docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* OpenAI Optional Configuration */}
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-900/40 text-blue-200 leading-relaxed">
            <span className="font-semibold block mb-0.5 text-blue-300">💡 Free Demo vs Paid AI Mode</span>
            By default, FinPath AI runs in <strong>Local Grounded Demo Mode</strong> with 100% free offline RBI circular retrieval.
            To connect live OpenAI models or vector store file search, provide your OpenAI API key below.
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1 flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>OpenAI API Key (Optional)</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-... (Leave blank for Local Grounded Mode)"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Reference: <a href="https://developers.openai.com/api/docs/quickstart" target="_blank" className="text-blue-400 underline">OpenAI API quickstart</a>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1 flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>OpenAI Model</span>
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="gpt-4o-mini">gpt-4o-mini (Recommended)</option>
                <option value="gpt-4o">gpt-4o (High Intelligence)</option>
                <option value="gpt-3.5-turbo">gpt-3.5-turbo (Legacy)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Vector Store ID (File Search)</span>
              </label>
              <input
                type="text"
                value={vectorStoreId}
                onChange={(e) => setVectorStoreId(e.target.value)}
                placeholder="vs_... (Optional)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/30"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Settings Saved!</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
