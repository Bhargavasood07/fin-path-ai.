"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronRight,
  Info,
  Clock,
  RotateCcw,
  Copy,
  Check
} from "lucide-react";
import { ChatMessage, Citation } from "@/types";

interface SourceGroundedAssistantProps {
  apiBaseUrl: string;
}

export default function SourceGroundedAssistant({ apiBaseUrl }: SourceGroundedAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Hello! I am your **FinPath AI Assistant**, genuinely grounded in official Reserve Bank of India (RBI) circulars, including the **April 2024 Key Facts Statement (KFS)** circular and **Digital Lending Guidelines**.\n\nAsk me about loan disclosure requirements, how your lender must calculate APR, cooling-off exit periods, penal charges, or borrower grievance redressal.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      mode_used: "local_grounded",
      citations: [
        {
          title: "Mandatory Standardised KFS",
          circular_id: "DOR.MCS.REC.21/01.01.001/2024-25",
          clause_id: "KFS-02",
          section: "Disclosure Requirement",
          relevance_snippet: "Regulated Entities (REs) must provide a standardised Key Facts Statement (KFS) before execution of the loan contract...",
          url: "https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=12827",
        },
      ],
    },
  ]);

  const [inputMessage, setInputMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [activeEngineMode, setActiveEngineMode] = useState<string>("auto"); // "auto", "local", "openai"
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const presetQuestions = [
    "What is the mandatory cooling-off period under the 2024 RBI circular?",
    "Can a lender compound penal charges into principal for missed EMIs?",
    "How does upfront fee deduction affect the true APR?",
    "Can a bank force me to buy credit insurance with my loan?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${apiBaseUrl}/api/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversation_history: historyPayload,
          force_mode: activeEngineMode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          mode_used: data.mode_used,
          citations: data.citations,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (data.citations && data.citations.length > 0) {
          setSelectedCitation(data.citations[0]);
        }
      } else {
        throw new Error("Server error");
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an error communicating with the financial advisory backend. Please verify that FastAPI is running on port 8000.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-2">
              <Bot className="w-3.5 h-3.5" />
              <span>Source-Grounded Retrieval Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              RBI Grounded Financial Assistant
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Trained and grounded exclusively in approved Reserve Bank of India lending circulars.
              Every answer cites verified paragraphs, clause IDs, and statutory consumer protections.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Mode:</span>
            <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setActiveEngineMode("auto")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeEngineMode === "auto"
                    ? "bg-indigo-600 text-white font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Automatically uses OpenAI API if key provided, otherwise high-fidelity local grounded engine"
              >
                Auto (Smart)
              </button>
              <button
                onClick={() => setActiveEngineMode("local")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeEngineMode === "local"
                    ? "bg-indigo-600 text-white font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Runs 100% locally with zero external API calls"
              >
                Local Free
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chat Stream (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[650px] glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {messages.map((msg) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 ${isAssistant ? "" : "flex-row-reverse space-x-reverse"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isAssistant
                        ? "bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-500/20"
                        : "bg-slate-700 text-slate-200"
                    }`}
                  >
                    {isAssistant ? <Bot className="w-4 h-4" /> : <span className="text-xs font-bold">You</span>}
                  </div>

                  <div className={`space-y-2 max-w-[85%] sm:max-w-[78%]`}>
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isAssistant
                          ? "bg-slate-900/90 border border-slate-800 text-slate-200"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                      {/* Mode Badge, Copy & Timestamp */}
                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center space-x-1.5">
                          {isAssistant && msg.mode_used && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                              {msg.mode_used === "openai_api" ? "OpenAI Grounded" : "Local RBI Engine"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {isAssistant && (
                            <button
                              onClick={() => navigator.clipboard.writeText(msg.content)}
                              className="hover:text-white transition-colors"
                              title="Copy answer"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                          <span className="flex items-center space-x-1 font-mono">
                            <Clock className="w-3 h-3" />
                            <span>{msg.timestamp}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Citations Badges */}
                    {isAssistant && msg.citations && msg.citations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 flex items-center mr-1">
                          <BookOpen className="w-3 h-3 mr-1 text-indigo-400" />
                          Sources:
                        </span>
                        {msg.citations.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedCitation(c)}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-indigo-950/60 border border-indigo-800 text-indigo-300 hover:bg-indigo-900 transition-colors"
                          >
                            <span>[{c.clause_id}]</span>
                            <span className="max-w-[120px] truncate">{c.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/80 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></div>
                  <span>Cross-referencing RBI official circular library...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Preset Prompts */}
          <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/60 flex items-center space-x-2 overflow-x-auto">
            <span className="text-[11px] text-slate-400 flex items-center flex-shrink-0">
              <Sparkles className="w-3 h-3 mr-1 text-amber-400" />
              Suggested:
            </span>
            {presetQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all flex-shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/40">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about RBI loan guidelines, cooling-off exit, APR transparency..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-40 text-white transition-all shadow-md shadow-indigo-600/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Regulatory Citation Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 h-[650px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Official Citation Inspector</span>
                </h3>
                <span className="text-[10px] text-slate-500">Live Grounding</span>
              </div>

              {selectedCitation ? (
                <div className="mt-4 space-y-4 text-xs">
                  <div>
                    <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-semibold">
                      {selectedCitation.circular_id}
                    </span>
                    <h4 className="text-base font-bold text-white mt-0.5">
                      {selectedCitation.title}
                    </h4>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      Clause Ref: {selectedCitation.clause_id}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Official Provision Text
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed italic">
                      "{selectedCitation.relevance_snippet}"
                    </p>
                  </div>

                  <div className="space-y-1.5 text-slate-400 text-[11px]">
                    <div className="flex justify-between">
                      <span>Regulatory Domain:</span>
                      <span className="text-slate-200">{selectedCitation.section}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Issuing Authority:</span>
                      <span className="text-slate-200">Reserve Bank of India</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-16 text-center text-slate-500 space-y-2">
                  <BookOpen className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs">Click on any source badge in the assistant chat to inspect the full statutory circular provision.</p>
                </div>
              )}
            </div>

            {selectedCitation?.url && (
              <a
                href={selectedCitation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-indigo-300 font-medium transition-all"
              >
                <span>Read Full Circular on RBI.org.in</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
