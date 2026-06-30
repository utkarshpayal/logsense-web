"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, aiApi } from "../../../lib/api";
import { useProjectStore } from "../../../store/project.store";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Clock,
  Key,
  FolderOpen,
  Info,
  Loader2,
  Cpu,
  ArrowUpRight,
  Bot,
  Sparkles,
  ArrowRight,
  Terminal,
} from "lucide-react";
import { cn } from "../../../utils/cn";

export default function DashboardPage() {
  const router = useRouter();
  const { selectedProjectId, projects } = useProjectStore();

  // Chatbot simulator state
  const [chatInput, setChatInput] = useState("");
  const [chatResponse, setChatResponse] = useState<any>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStep, setChatStep] = useState(0);

  // Queries
  const { data: overviewRes, isLoading: overviewLoading } = useQuery({
    queryKey: ["dashboardOverview", selectedProjectId],
    queryFn: () => dashboardApi.getOverview(selectedProjectId!),
    enabled: !!selectedProjectId,
  });

  const { data: timelineRes, isLoading: timelineLoading } = useQuery({
    queryKey: ["dashboardTimeline", selectedProjectId],
    queryFn: () => dashboardApi.getTimeline(selectedProjectId!),
    enabled: !!selectedProjectId,
  });

  const { data: logLevelsRes, isLoading: levelsLoading } = useQuery({
    queryKey: ["dashboardLogLevels", selectedProjectId],
    queryFn: () => dashboardApi.getLogLevels(selectedProjectId!),
    enabled: !!selectedProjectId,
  });

  const { data: servicesRes, isLoading: servicesLoading } = useQuery({
    queryKey: ["dashboardServices", selectedProjectId],
    queryFn: () => dashboardApi.getServices(selectedProjectId!),
    enabled: !!selectedProjectId,
  });

  const { data: errorsRes, isLoading: errorsLoading } = useQuery({
    queryKey: ["dashboardRecentErrors", selectedProjectId],
    queryFn: () => dashboardApi.getRecentErrors(selectedProjectId!),
    enabled: !!selectedProjectId,
  });

  const overview = overviewRes?.data;
  const timeline = timelineRes?.data || [];
  const logLevels = logLevelsRes?.data || [];
  const services = servicesRes?.data || [];
  const recentErrors = errorsRes?.data || [];

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
      // Step 1: Parsing
      await new Promise((resolve) => setTimeout(resolve, 600));
      setChatStep(2); // Generating SQL & Scoping

      const apiPromise = aiApi.chat(selectedProjectId, input);

      // Step 2: Safe Scoping validation
      await new Promise((resolve) => setTimeout(resolve, 700));
      setChatStep(3); // Querying storage engine

      // Step 3: Execute query
      await new Promise((resolve) => setTimeout(resolve, 650));
      setChatStep(4); // Translating result to natural language

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

  // Helper for drawing SVG Chart
  const getTimelinePoints = () => {
    if (timeline.length === 0) return "";
    const counts = timeline.map((t) => t.total_count);
    const max = Math.max(...counts, 10);
    const height = 150;
    const width = 600;
    const padding = 10;

    const denominator = timeline.length > 1 ? timeline.length - 1 : 1;
    const points = timeline.map((item, index) => {
      const x = padding + (index / denominator) * (width - padding * 2);
      const y = height - padding - (item.total_count / max) * (height - padding * 2);
      return `${x},${y}`;
    });

    return points.join(" ");
  };

  const getTimelinePointsError = () => {
    if (timeline.length === 0) return "";
    const counts = timeline.map((t) => t.total_count);
    const max = Math.max(...counts, 10);
    const height = 150;
    const width = 600;
    const padding = 10;

    const denominator = timeline.length > 1 ? timeline.length - 1 : 1;
    const points = timeline.map((item, index) => {
      const x = padding + (index / denominator) * (width - padding * 2);
      const y = height - padding - (item.error_count / max) * (height - padding * 2);
      return `${x},${y}`;
    });

    return points.join(" ");
  };

  // Guard: No projects exist
  if (projects.length === 0) {
    return (
      <div className="glass-panel rounded-xl border border-zinc-800 p-12 text-center max-w-xl mx-auto mt-8">
        <FolderOpen className="h-10 w-10 text-zinc-550 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-zinc-200">No active projects</h3>
        <p className="text-sm text-zinc-400 mt-2">
          Create an observability project workspace to start ingesting logs and visualizing dashboard metrics.
        </p>
        <button
          onClick={() => router.push("/projects")}
          className="mt-6 px-4 py-2 bg-indigo-650 hover:bg-indigo-600 rounded-lg text-white font-semibold text-xs transition-colors"
        >
          Create Project
        </button>
      </div>
    );
  }

  // Guard: No project selected
  if (!selectedProjectId) {
    return (
      <div className="glass-panel rounded-xl border border-zinc-800 p-12 text-center max-w-xl mx-auto mt-8">
        <Info className="h-10 w-10 text-indigo-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-zinc-200">Select a project workspace</h3>
        <p className="text-sm text-zinc-400 mt-2">
          Please select a project from the top navbar project switcher to view its observability metrics.
        </p>
      </div>
    );
  }

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  const isOverviewLoading = overviewLoading || timelineLoading || levelsLoading || servicesLoading || errorsLoading;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight sm:text-2xl">
            {activeProject?.name} Overview
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            System status: <span className="text-green-400 font-semibold">Stable</span> • Ingesting
            active metrics.
          </p>
        </div>
      </div>

      {isOverviewLoading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Logs */}
            <div className="glass-card p-5 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-450 uppercase tracking-wider block">
                  Total Log Lines
                </span>
                <span className="text-2xl font-bold text-zinc-150 block">
                  {overview?.totalLogs.toLocaleString() || 0}
                </span>
              </div>
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-indigo-450">
                <Activity className="h-5 w-5" />
              </div>
            </div>

            {/* Total Errors */}
            <div className="glass-card p-5 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-450 uppercase tracking-wider block">
                  Error Events
                </span>
                <span className={cn("text-2xl font-bold block", (overview?.errorCount || 0) > 0 ? "text-red-400" : "text-zinc-150")}>
                  {overview?.errorCount || 0}
                </span>
              </div>
              <div className={cn("p-3 bg-zinc-900 border border-zinc-800 rounded-xl", (overview?.errorCount || 0) > 0 ? "text-red-400" : "text-zinc-500")}>
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>

            {/* Error Rate */}
            <div className="glass-card p-5 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-450 uppercase tracking-wider block">
                  Error Rate
                </span>
                <span className="text-2xl font-bold text-zinc-150 block">
                  {(overview?.errorRate || 0).toFixed(2)}%
                </span>
              </div>
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-yellow-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>

            {/* Avg Latency */}
            <div className="glass-card p-5 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-zinc-450 uppercase tracking-wider block">
                  Avg Latency
                </span>
                <span className="text-2xl font-bold text-zinc-150 block">
                  {overview?.averageLatencyMs || 0} ms
                </span>
              </div>
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-green-450">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* SVG Log Timeline Chart & Log Level breakdown */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Timeline Area Chart */}
            <div className="lg:col-span-2 glass-card p-6 rounded-xl border border-zinc-800 flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Terminal className="h-4.5 w-4.5 text-indigo-400" />
                    Log Volume Timeline
                  </h3>
                  <div className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      Total Logs
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Errors
                    </span>
                  </div>
                </div>

                {timeline.length > 0 ? (
                  <div className="relative mt-2">
                    <svg viewBox="0 0 600 150" className="w-full h-44 overflow-visible">
                      <defs>
                        <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="errorGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Grids */}
                      <line x1="10" y1="10" x2="590" y2="10" stroke="#27272a" strokeWidth="0.5" strokeDasharray="3" />
                      <line x1="10" y1="75" x2="590" y2="75" stroke="#27272a" strokeWidth="0.5" strokeDasharray="3" />
                      <line x1="10" y1="140" x2="590" y2="140" stroke="#27272a" strokeWidth="0.5" />

                      {/* Total area */}
                      {getTimelinePoints() && (
                        <>
                          <path
                            d={`M 10,140 L ${getTimelinePoints()} L 590,140 Z`}
                            fill="url(#totalGrad)"
                          />
                          <polyline
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="2.5"
                            points={getTimelinePoints()}
                          />
                        </>
                      )}

                      {/* Error area */}
                      {getTimelinePointsError() && (
                        <>
                          <path
                            d={`M 10,140 L ${getTimelinePointsError()} L 590,140 Z`}
                            fill="url(#errorGrad)"
                          />
                          <polyline
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="1.5"
                            points={getTimelinePointsError()}
                          />
                        </>
                      )}
                    </svg>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-44 text-zinc-550 text-xs italic">
                    No time-series logs ingested.
                  </div>
                )}
              </div>

              {timeline.length > 0 && (
                <div className="flex justify-between items-center border-t border-zinc-850 pt-3 text-[10px] text-zinc-500 font-mono">
                  <span>{new Date(timeline[0].time_bucket).toLocaleTimeString()}</span>
                  <span>{new Date(timeline[timeline.length - 1].time_bucket).toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            {/* Severity Distribution */}
            <div className="glass-card p-6 rounded-xl border border-zinc-800 flex flex-col justify-between min-h-[300px]">
              <div>
                <h3 className="text-sm font-bold text-white mb-6">Severity Breakdown</h3>
                {logLevels.length > 0 ? (
                  <div className="space-y-4">
                    {logLevels.map((item) => {
                      const percentage =
                        overview?.totalLogs && overview.totalLogs > 0
                          ? (item.count / overview.totalLogs) * 100
                          : 0;

                      return (
                        <div key={item.level} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                                item.level === "error"
                                  ? "bg-red-500/15 text-red-400 border-red-500/20"
                                  : item.level === "warn"
                                  ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/20"
                                  : item.level === "info"
                                  ? "bg-blue-500/15 text-blue-400 border-blue-500/20"
                                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
                              )}
                            >
                              {item.level}
                            </span>
                            <span className="font-mono text-zinc-400">
                              {item.count.toLocaleString()}{" "}
                              <span className="text-[10px] text-zinc-555 font-sans">
                                ({percentage.toFixed(1)}%)
                              </span>
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                item.level === "error"
                                  ? "bg-red-500"
                                  : item.level === "warn"
                                  ? "bg-yellow-500"
                                  : item.level === "info"
                                  ? "bg-blue-500"
                                  : "bg-zinc-500"
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-36 items-center justify-center text-zinc-550 text-xs italic">
                    No log distributions available.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Service performance list & Recent errors */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Service performance list */}
            <div className="glass-card p-6 rounded-xl border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Cpu className="h-4.5 w-4.5 text-indigo-400" />
                Service Health Performance
              </h3>
              {services.length > 0 ? (
                <div className="space-y-4">
                  {services.map((svc) => (
                    <div
                      key={svc.service}
                      className="p-3 border border-zinc-850 bg-zinc-950/20 rounded-lg flex items-center justify-between gap-4 hover:border-zinc-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="block text-xs font-semibold text-zinc-200 truncate font-mono">
                          {svc.service || "unknown-service"}
                        </span>
                        <span className="text-[10px] text-zinc-500 block mt-1">
                          Requests: <span className="font-semibold text-zinc-400">{svc.total_count}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="text-right">
                          <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                            Latency
                          </span>
                          <span className="text-xs font-semibold text-zinc-300 font-mono">
                            {svc.avg_latency ? svc.avg_latency.toFixed(0) : 0}ms
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                            Errors
                          </span>
                          <span
                            className={cn(
                              "text-xs font-semibold font-mono",
                              svc.error_count > 0 ? "text-red-400" : "text-green-400"
                            )}
                          >
                            {svc.error_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-36 items-center justify-center text-zinc-550 text-xs italic">
                  No active services logging data.
                </div>
              )}
            </div>

            {/* Recent errors log card */}
            <div className="glass-card p-6 rounded-xl border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Recent Error Stack Events</span>
                {recentErrors.length > 0 && (
                  <button
                    onClick={() => router.push("/logs?level=error")}
                    className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider flex items-center gap-0.5"
                  >
                    View All
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </h3>
              {recentErrors.length > 0 ? (
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  {recentErrors.map((err) => (
                    <div
                      key={err.id}
                      onClick={() => {
                        if (err.trace_id) {
                          router.push(`/logs?search=${err.trace_id}`);
                        } else {
                          router.push("/logs");
                        }
                      }}
                      className="p-3 border border-red-500/10 hover:border-red-500/30 bg-red-500/5 rounded-lg cursor-pointer hover:bg-red-500/[0.08] transition-all flex items-start gap-3"
                    >
                      <div className="h-2 w-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-200 line-clamp-2 leading-relaxed break-all font-mono">
                          {err.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500">
                          <span className="font-mono">{err.service || "unknown"}</span>
                          <span>•</span>
                          <span>{new Date(err.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-36 items-center justify-center text-zinc-555 text-xs italic">
                  Nice! 0 errors captured recently.
                </div>
              )}
            </div>
          </div>

          {/* Premium Chatbot observability panel */}
          <div className="glass-panel p-6 rounded-xl border border-zinc-800 glow-indigo space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  LogSense Observability AI
                  <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-900/40 text-indigo-400 border border-indigo-500/20">
                    <Sparkles className="h-2.5 w-2.5" />
                    BETA
                  </span>
                </h3>
                <p className="text-xs text-zinc-450 mt-0.5">
                  Query your system logs in plain English — no SQL or manual grep required.
                </p>
              </div>
            </div>

            <div className="border border-zinc-850 bg-zinc-950/40 rounded-xl overflow-hidden divide-y divide-zinc-900">
              {/* Chat history */}
              <div className="p-4 min-h-[140px] space-y-4 text-xs">
                {chatStep === 0 && !chatResponse && (
                  <div className="text-zinc-500 italic flex items-center justify-center h-28">
                    Ask a question about database, errors, spikes or average latencies...
                  </div>
                )}

                {chatStep > 0 && (
                  <div className="space-y-4">
                    {/* User Prompt */}
                    <div className="flex justify-end">
                      <div className="bg-indigo-650 text-white px-3 py-2 rounded-lg max-w-[80%] font-medium">
                        {chatInput}
                      </div>
                    </div>

                    {/* AI Thinking Steps */}
                    {chatLoading && (
                      <div className="flex items-start gap-3 text-zinc-400 bg-zinc-900/30 p-3 rounded-lg border border-zinc-850 animate-pulse">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-400 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          <p className="font-semibold text-zinc-200">Processing NL Query...</p>
                          <p className="text-[10px] text-zinc-500 font-mono">
                            {chatStep === 1 && "Step 1/4: Parsing NL phrase syntax trees..."}
                            {chatStep === 2 && "Step 2/4: Mapping properties to Clickhouse schema..."}
                            {chatStep === 3 && "Step 3/4: Executing safe scoped query SELECT..."}
                            {chatStep === 4 && "Step 4/4: Translating result to response..."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* AI Response Output */}
                    {chatResponse && (
                      <div className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border",
                        chatResponse.error
                          ? "bg-red-500/5 border-red-500/10"
                          : "bg-zinc-900/50 border-zinc-800"
                      )}>
                        <div className={cn(
                          "flex items-center justify-center w-7 h-7 rounded shrink-0",
                          chatResponse.error
                            ? "bg-red-500/10 border border-red-500/20 text-red-400"
                            : "bg-indigo-600/10 border border-indigo-500/20 text-indigo-400"
                        )}>
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="space-y-3 flex-1 min-w-0">
                          {chatResponse.error && chatResponse.errorType === "CONFIG_ERROR" ? (
                            <div className="space-y-3">
                              <p className="text-zinc-300 font-semibold leading-relaxed">
                                {chatResponse.text}
                              </p>
                              <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg space-y-2 text-[11px]">
                                <span className="block text-[10px] font-sans font-bold text-yellow-500 uppercase tracking-wider">
                                  How to configure Gemini API:
                                </span>
                                <ol className="list-decimal list-inside text-zinc-450 space-y-1 font-mono">
                                  <li>Open <code className="text-zinc-200">/home/fiftyfive/Videos/logsense-server/.env</code></li>
                                  <li>Add <code className="text-indigo-400">GEMINI_API_KEY=your_gemini_api_key_here</code></li>
                                  <li>Restart your dev server.</li>
                                </ol>
                              </div>
                            </div>
                          ) : (
                            <div className="text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">
                              {chatResponse.text}
                            </div>
                          )}

                          {!chatResponse.error && chatResponse.sql && (
                            <div className="space-y-2">
                              {/* Generated SQL block */}
                              <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg space-y-1.5 text-[11px] font-mono">
                                <span className="block text-[10px] font-sans font-bold text-indigo-400 uppercase tracking-wider">
                                  Generated Scoped SQL query ({chatResponse.explanation})
                                </span>
                                <pre className="text-zinc-350 overflow-x-auto whitespace-pre-wrap p-2 bg-zinc-900/60 rounded border border-zinc-900 max-h-36">
                                  {chatResponse.sql}
                                </pre>
                              </div>

                               {/* Database results table */}
                               {chatResponse.data && chatResponse.data.length > 0 && (() => {
                                 const columns = Object.keys(chatResponse.data[0] || {});
                                 if (columns.length === 0) return null;
                                 return (
                                   <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg space-y-2 text-[11px]">
                                     <span className="block text-[10px] font-sans font-bold text-green-400 uppercase tracking-wider">
                                       Database Query Results ({chatResponse.data.length} rows returned)
                                     </span>
                                     <div className="overflow-x-auto max-h-48 border border-zinc-900 rounded">
                                       <table className="w-full text-left border-collapse">
                                         <thead>
                                           <tr className="bg-zinc-900 border-b border-zinc-850 text-zinc-450 text-[10px] font-sans">
                                             {columns.map((col) => (
                                               <th key={col} className="p-1.5 font-semibold capitalize">{col}</th>
                                             ))}
                                           </tr>
                                         </thead>
                                         <tbody className="divide-y divide-zinc-900 font-mono text-zinc-300 text-[10px]">
                                           {chatResponse.data.slice(0, 5).map((row: any, idx: number) => (
                                             <tr key={idx} className="hover:bg-zinc-900/30">
                                               {columns.map((col) => {
                                                 const val = row[col];
                                                 if (col === "level") {
                                                   return (
                                                     <td key={col} className="p-1.5 whitespace-nowrap">
                                                       <span className={cn(
                                                         "px-1 py-0.5 rounded text-[8px] font-bold uppercase",
                                                         val === "error" ? "bg-red-950/40 text-red-400" :
                                                         val === "warn" ? "bg-yellow-950/40 text-yellow-400" :
                                                         "bg-zinc-900 text-zinc-400"
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
                                                     <td key={col} className="p-1.5 whitespace-nowrap text-zinc-500">
                                                       {formattedTime}
                                                     </td>
                                                   );
                                                 }
                                                 const stringVal = typeof val === "object" && val !== null ? JSON.stringify(val) : String(val ?? "");
                                                 return (
                                                   <td key={col} className="p-1.5 truncate max-w-xs text-zinc-400" title={stringVal}>
                                                     {stringVal || "n/a"}
                                                   </td>
                                                 );
                                               })}
                                             </tr>
                                           ))}
                                         </tbody>
                                       </table>
                                       {chatResponse.data.length > 5 && (
                                         <div className="p-1 bg-zinc-900 text-center text-zinc-500 text-[9px]">
                                           And {chatResponse.data.length - 5} more rows...
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

              {/* Chat inputs */}
              <div className="p-3 bg-zinc-950 flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Which service has the most errors today?"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChatSubmit("")}
                  disabled={chatLoading}
                  className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => handleChatSubmit("")}
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-850 text-white disabled:text-zinc-550 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  Ask AI
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider py-1">
                Suggested Queries:
              </span>
              {[
                "Which service is slowest?",
                "Analyze errors today",
                "Status of DB systems",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestClick(suggestion)}
                  disabled={chatLoading}
                  className="px-2.5 py-1 text-[10px] font-medium bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-zinc-400 hover:text-zinc-200 rounded-md transition-colors"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
