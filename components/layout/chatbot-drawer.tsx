"use client";

import React, { useState } from "react";
import { aiApi } from "../../lib/api";
import { useProjectStore } from "../../store/project.store";
import {
  Loader2,
  Bot,
  Sparkles,
  ArrowRight,
  Terminal,
  Database,
  Search,
  Copy,
  Check,
  X,
  Info,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatbotDrawer({ isOpen, onClose }: ChatbotDrawerProps) {
  const { selectedProjectId } = useProjectStore();

  // Chatbot simulator state
  const [chatInput, setChatInput] = useState("");
  const [chatResponse, setChatResponse] = useState<any>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStep, setChatStep] = useState(0);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSuggestClick = (prompt: string) => {
    setChatInput(prompt);
    handleChatSubmit(prompt);
  };

  const handleChatSubmit = async (promptText: string) => {
    const input = promptText || chatInput;
    if (!input.trim() || !selectedProjectId) return;

    setChatLoading(true);
    setChatResponse(null);
    setChatStep(1); // NLP Parsing

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setChatStep(2); // Generating SQL

      const apiPromise = aiApi.chat(selectedProjectId, input);

      await new Promise((resolve) => setTimeout(resolve, 600));
      setChatStep(3); // Querying storage

      await new Promise((resolve) => setTimeout(resolve, 550));
      setChatStep(4); // Translating

      const res = await apiPromise;

      if (res.success) {
        setChatResponse({
          text: res.answer || "No response received.",
          sql: res.sql,
          explanation: res.explanation,
          data: res.data,
        });
      } else {
        setChatResponse({
          text: res.message || "An error occurred while calling the AI assistant.",
          error: true,
          errorType: res.errorType,
          sql: res.sql,
          explanation: res.explanation,
        });
      }
    } catch (err: any) {
      setChatResponse({
        text: err.response?.data?.message || err.message || "Failed to communicate with AI server.",
        error: true,
      });
    } finally {
      setChatLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSql(true);
    toast.success("SQL copied to clipboard!");
    setTimeout(() => setCopiedSql(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed top-16 right-0 bottom-0 z-40 w-full max-w-[420px] border-l border-slate-800 bg-slate-950 flex flex-col font-mono text-xs scale-in">

      {/* Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-900 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-slate-850 text-cyan-400 relative">
            <Bot className="h-4.5 w-4.5" />
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-widest">
              AI Assistant
              <span className="flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 uppercase tracking-widest font-mono">
                OLLAMA
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Telemetry Agent Console</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-500 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Chat scroll content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 z-10 bg-slate-950/20 custom-scrollbar">
        {!selectedProjectId ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
            <Info className="h-6 w-6 text-slate-800 mb-2" />
            <p className="uppercase tracking-wider">Select a project scope first.</p>
          </div>
        ) : chatStep === 0 && !chatResponse ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 pt-16">
            <Search className="h-6 w-6 text-slate-800 mb-2.5" />
            <p className="text-slate-500 text-[10px] uppercase tracking-widest max-w-[220px] leading-relaxed">
              Ask a natural language query to generate clickhouse insights.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs select-text">
            {/* User Prompt */}
            <div className="flex justify-end">
              <div className="bg-slate-900 border border-slate-800 text-slate-200 px-3.5 py-2.5 rounded-lg max-w-[90%] font-medium leading-relaxed">
                {chatInput}
              </div>
            </div>

            {/* AI Thinking Steps */}
            {chatLoading && (
              <div className="flex items-start gap-3 text-slate-400 bg-slate-950 p-4 rounded-lg border border-slate-900 scale-in">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400 mt-0.5 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <p className="font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
                    Processing query...
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-[9px] text-slate-500 font-mono mt-1.5">
                    <span className={cn("px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800", chatStep >= 1 ? "text-cyan-400 border-cyan-500/20" : "")}>
                      {chatStep >= 1 ? "✓ " : "• "}NLP Token
                    </span>
                    <span className={cn("px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800", chatStep >= 2 ? "text-cyan-400 border-cyan-500/20" : "")}>
                      {chatStep >= 2 ? "✓ " : "• "}SQL AST
                    </span>
                    <span className={cn("px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800", chatStep >= 3 ? "text-cyan-400 border-cyan-500/20" : "")}>
                      {chatStep >= 3 ? "✓ " : "• "}Execute
                    </span>
                    <span className={cn("px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800", chatStep >= 4 ? "text-cyan-400 border-cyan-500/20" : "")}>
                      {chatStep >= 4 ? "✓ " : "• "}Summarize
                    </span>
                  </div>
                </div>
              </div>
            )}
            {/* AI Response Output */}
            {chatResponse && (
              <div className={cn(
                "flex items-start gap-3 p-4 rounded-lg border scale-in text-xs",
                chatResponse.error
                  ? "bg-rose-500/[0.01] border-rose-500/15"
                  : "bg-slate-950 border-slate-900"
              )}>
                <div className="space-y-3 flex-1 min-w-0">
                  {chatResponse.error && (chatResponse.errorType === "CONFIG_ERROR" || chatResponse.text.includes("fetch failed") || chatResponse.text.includes("ECONNREFUSED") || chatResponse.text.includes("Ollama")) ? (
                    <div className="space-y-3">
                      <p className="text-slate-300 font-bold leading-relaxed uppercase tracking-wider">
                        {chatResponse.text.includes("fetch") || chatResponse.text.includes("ECONNREFUSED") ? "Ollama server connection failed" : chatResponse.text}
                      </p>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2 text-[10px] uppercase tracking-wider font-mono">
                        <span className="block font-bold text-amber-500">
                          Ollama setup required:
                        </span>
                        <ol className="list-decimal list-inside text-slate-500 space-y-1 normal-case">
                          <li>Ensure Ollama is running: <code className="text-slate-200">ollama serve</code></li>
                          <li>Pull the chat model: <code className="text-cyan-400">ollama pull phi3:mini</code></li>
                          <li>Pull the embedding model: <code className="text-cyan-400">ollama pull nomic-embed-text</code></li>
                          <li>Verify <code className="text-slate-200">logsense-server/.env</code> matches your OLLAMA_BASE_URL.</li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-300 leading-relaxed break-words text-xs">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          strong: ({ node, ...props }) => <span className="font-bold text-white" {...props} />,
                          p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                          li: ({ node, ...props }) => <li className="text-slate-300" {...props} />,
                          code: ({ node, inline, ...props }: any) => 
                            inline 
                              ? <code className="bg-slate-900 text-cyan-400 px-1 py-0.5 rounded font-mono text-[10px]" {...props} />
                              : <code className="block bg-slate-900 p-2 rounded text-[10px] font-mono whitespace-pre-wrap overflow-x-auto border border-slate-800" {...props} />,
                        }}
                      >
                        {chatResponse.text}
                      </ReactMarkdown>
                    </div>
                  )}

                  {!chatResponse.error && chatResponse.sql && (
                    <div className="space-y-3">
                      {/* Generated SQL block */}
                      <div className="p-3 bg-slate-950 border border-slate-900 rounded-lg space-y-1.5 font-mono relative group/sql">
                        <div className="flex justify-between items-center">
                          <span className="block text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                            Generated AST ({chatResponse.explanation})
                          </span>
                          <button
                            onClick={() => copyToClipboard(chatResponse.sql)}
                            className="p-1 text-slate-500 hover:text-slate-350 rounded transition-colors cursor-pointer"
                          >
                            {copiedSql ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                        <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap p-2 bg-slate-900/30 rounded-lg border border-slate-900 max-h-36 font-mono text-[10px] leading-relaxed">
                          {chatResponse.sql}
                        </pre>
                      </div>

                      {/* Database results table */}
                      {chatResponse.data && chatResponse.data.length > 0 && (() => {
                        const columns = Object.keys(chatResponse.data[0] || {});
                        if (columns.length === 0) return null;
                        return (
                          <div className="p-3 bg-slate-950 border border-slate-900 rounded-lg space-y-1.5 text-[10px] uppercase tracking-wider">
                            <span className="block font-bold text-emerald-400">
                              Telemetry Output ({chatResponse.data.length} rows)
                            </span>
                            <div className="overflow-x-auto max-h-48 border border-slate-900 rounded-lg">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-900 border-b border-slate-900 text-slate-400 text-[10px]">
                                    {columns.map((col) => (
                                      <th key={col} className="p-1.5 font-bold capitalize">{col}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-900 font-mono text-slate-300 text-[10px]">
                                  {chatResponse.data.slice(0, 4).map((row: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-900/25">
                                      {columns.map((col) => {
                                        const val = row[col];
                                        if (col === "level") {
                                          return (
                                            <td key={col} className="p-1.5 whitespace-nowrap">
                                              <span className={cn(
                                                "px-1 py-0.2 rounded text-[10px] font-bold uppercase border",
                                                val === "error" ? "bg-rose-500/10 border-rose-500/25 text-rose-400" :
                                                val === "warn" ? "bg-amber-500/10 border-amber-500/25 text-amber-400" :
                                                "bg-slate-950 border-slate-800 text-slate-400"
                                              )}>
                                                {val || "n/a"}
                                              </span>
                                            </td>
                                          );
                                        }
                                        if (col === "created_at" || col.endsWith("_at") || col.endsWith("_time")) {
                                          let formattedTime = "n/a";
                                          if (val) {
                                            const dateVal = new Date(val);
                                            formattedTime = isNaN(dateVal.getTime()) ? String(val) : dateVal.toLocaleTimeString();
                                          }
                                          return (
                                            <td key={col} className="p-1.5 whitespace-nowrap text-slate-500">
                                              {formattedTime}
                                            </td>
                                          );
                                        }
                                        const stringVal = typeof val === "object" && val !== null ? JSON.stringify(val) : String(val ?? "");
                                        return (
                                          <td key={col} className="p-1.5 truncate max-w-[120px] text-slate-400 normal-case" title={stringVal}>
                                            {stringVal || "n/a"}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {chatResponse.data.length > 4 && (
                                <div className="p-1 bg-slate-950 text-center text-slate-500 text-[10px] border-t border-slate-900">
                                  Showing 4 of {chatResponse.data.length} rows...
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Suggested Prompts footer */}
      {selectedProjectId && (
        <div className="p-4 bg-slate-950 border-t border-slate-900 space-y-3 z-10">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              "Which service is slowest?",
              "Analyze errors today",
              "Status of DB systems",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestClick(suggestion)}
                disabled={chatLoading}
                className="px-2 py-1 text-[10px] font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-450 hover:text-white rounded-lg transition-all cursor-pointer"
              >
                "{suggestion}"
              </button>
            ))}
          </div>

          {/* Form input */}
          <div className="flex gap-2">
            <div className="flex-1 relative flex items-center">
              <Database className="absolute left-2.5 h-3.5 w-3.5 text-slate-600" />
              <input
                type="text"
                placeholder="Ask AI about telemetry..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChatSubmit("")}
                disabled={chatLoading}
                className="w-full pl-8 pr-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 disabled:opacity-50 font-mono"
              />
            </div>
            <button
              onClick={() => handleChatSubmit("")}
              disabled={chatLoading || !chatInput.trim()}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all flex items-center justify-center cursor-pointer"
            >
              {chatLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
