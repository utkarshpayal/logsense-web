"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logsApi, dashboardApi } from "../../../lib/api";
import { useProjectStore } from "../../../store/project.store";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Terminal,
  Search,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  FolderOpen,
  Info,
  X,
  Copy,
  Check,
  Cpu,
  Trash2,
  Download,
  Keyboard,
  Filter,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import ConfirmModal from "../../../components/ConfirmModal";
import { JsonViewer } from "../../../components/JsonViewer";
import { AiLogAnalyzer } from "../../../components/AiLogAnalyzer";
import { LogMinimap } from "../../../components/LogMinimap";
import { TraceWaterfall } from "../../../components/TraceWaterfall";
import { LogPatternIntelligence } from "../../../components/LogPatternIntelligence";

export default function LogsPage() {
  const queryClient = useQueryClient();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { selectedProjectId, projects } = useProjectStore();

  // Filter States
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [service, setService] = useState("");
  const [environment, setEnvironment] = useState("");
  const [timeRange, setTimeRange] = useState("24h");
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [logToDeleteId, setLogToDeleteId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<"details" | "trace">("details");
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const limit = 50;
  const offset = (page - 1) * limit;

  let startDate: string | undefined = undefined;
  if (timeRange !== "all") {
    const now = new Date();
    if (timeRange === "15m") now.setMinutes(now.getMinutes() - 15);
    else if (timeRange === "1h") now.setHours(now.getHours() - 1);
    else if (timeRange === "24h") now.setHours(now.getHours() - 24);
    else if (timeRange === "7d") now.setDate(now.getDate() - 7);
    else if (timeRange === "30d") now.setDate(now.getDate() - 30);
    startDate = now.toISOString();
  }

  // Fetch Services for Dropdown
  const { data: servicesResponse } = useQuery({
    queryKey: ["services", selectedProjectId],
    queryFn: () => dashboardApi.getServices(selectedProjectId!),
    enabled: !!selectedProjectId,
  });
  const availableServices = servicesResponse?.data || [];

  // Build query params
  const queryParams: any = {
    projectId: selectedProjectId || undefined,
    level: level !== "all" ? level : undefined,
    service: service || undefined,
    environment: environment || undefined,
    search: [search, category !== "all" ? category : ""].filter(Boolean).join(" ") || undefined,
    startDate,
    limit,
    offset,
  };

  // Fetch Logs
  const { data: logsResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["logs", selectedProjectId, level, category, service, environment, search, timeRange, page],
    queryFn: () => logsApi.getLogs(queryParams),
    enabled: !!selectedProjectId,
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const logs = logsResponse?.data || [];
  const totalLogs = logsResponse?.pagination?.total || 0;
  const totalPages = Math.ceil(totalLogs / limit);

  // Fetch Single Log details if selected
  const { data: logDetailsResponse, isLoading: detailsLoading } = useQuery({
    queryKey: ["logDetails", selectedLogId],
    queryFn: () => logsApi.getLog(selectedLogId!),
    enabled: !!selectedLogId,
  });

  const selectedLog = logDetailsResponse?.data;

  // Delete Mutation
  const createMutation = useMutation({
    mutationFn: logsApi.deleteLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      toast.success("Log deleted successfully");
      setSelectedLogId(null);
      setLogToDeleteId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete log");
      setLogToDeleteId(null);
    },
  });

  const deleteMutation = createMutation;

  const handleDeleteLog = (id: string) => {
    setLogToDeleteId(id);
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [level, category, service, environment, search, timeRange, selectedProjectId]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Export logs as CSV or JSON
  const exportLogs = (format: "csv" | "json") => {
    if (logs.length === 0) { toast.error("No logs to export."); return; }
    if (format === "json") {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `logsense-export-${Date.now()}.json`;
      a.click(); URL.revokeObjectURL(url);
    } else {
      const headers = ["id","level","message","service","environment","created_at","trace_id"];
      const rows = logs.map(l => headers.map(h => JSON.stringify((l as any)[h] ?? "")).join(","));
      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `logsense-export-${Date.now()}.csv`;
      a.click(); URL.revokeObjectURL(url);
    }
    toast.success(`Exported ${logs.length} logs as ${format.toUpperCase()}`);
  };

  // Keyboard shortcuts: j/k to navigate, Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "Escape") { setSelectedLogId(null); return; }
      if (!logs.length) return;
      const currentIdx = logs.findIndex(l => l.id === selectedLogId);
      if (e.key === "j") { // next
        const next = currentIdx < logs.length - 1 ? logs[currentIdx + 1] : logs[0];
        setSelectedLogId(next.id);
      } else if (e.key === "k") { // prev
        const prev = currentIdx > 0 ? logs[currentIdx - 1] : logs[logs.length - 1];
        setSelectedLogId(prev.id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [logs, selectedLogId]);

  // Active filters
  const activeFilters = [
    service && { key: "service", label: `Service: ${service}`, clear: () => setService("") },
    environment && { key: "env", label: `Env: ${environment}`, clear: () => setEnvironment("") },
    level !== "all" && { key: "level", label: `Level: ${level}`, clear: () => setLevel("all") },
    category !== "all" && { key: "cat", label: `Category: ${category}`, clear: () => setCategory("all") },
    timeRange !== "24h" && { key: "time", label: `Time: ${timeRange}`, clear: () => setTimeRange("24h") },
    search && { key: "search", label: `"${search}"`, clear: () => setSearch("") },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  // Quick trace navigation
  const searchTrace = (traceId: string) => {
    setSearch(traceId);
    setLevel("all");
    setCategory("all");
    setService("");
    setEnvironment("");
    setTimeRange("all");
    setSelectedLogId(null);
    toast.info(`Filtering logs by trace ID: ${traceId}`);
  };

  // Guard: No projects exist
  if (projects.length === 0) {
    return (
      <div className="border border-slate-800 bg-slate-955/20 rounded-2xl p-12 text-center max-w-xl mx-auto mt-8 relative overflow-hidden font-mono">
        <FolderOpen className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">No active projects</h3>
        <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider">
          You must create a project workspace before you can ingest or view logs.
        </p>
      </div>
    );
  }

  // Guard: No project selected
  if (!selectedProjectId) {
    return (
      <div className="border border-slate-800 bg-slate-955/20 rounded-2xl p-12 text-center max-w-xl mx-auto mt-8 relative overflow-hidden font-mono">
        <Info className="h-10 w-10 text-cyan-400 mx-auto mb-4" />
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Select a project</h3>
        <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider">
          Please select a project from the top navbar project switcher to scope the Logs Explorer feed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative text-xs">

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-4 py-4 border-b border-slate-900 relative">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Message */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search log messages, trace IDs, user_ids..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            {/* Service Filter */}
            <div className="relative w-full sm:w-44">
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="block w-full pl-3.5 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-sans appearance-none cursor-pointer"
              >
                <option value="">All Services</option>
                {availableServices.map((s) => (
                  <option key={s.service} value={s.service}>{s.service}</option>
                ))}
              </select>
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                <ChevronDown className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* Environment Filter */}
            <div className="relative w-full sm:w-36">
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="block w-full pl-3.5 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-sans appearance-none cursor-pointer"
              >
                <option value="">All Envs</option>
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                <ChevronDown className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* Time Range Filter */}
            <div className="relative w-full sm:w-36">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="block w-full pl-3.5 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all cursor-pointer font-sans appearance-none"
              >
                <option value="15m">Last 15m</option>
                <option value="1h">Last 1h</option>
                <option value="24h">Last 24h</option>
                <option value="7d">Last 7d</option>
                <option value="30d">Last 30d</option>
                <option value="all">All Time</option>
              </select>
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                <ChevronDown className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Level Tabs & Auto-refresh Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-900 pt-4 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {/* Level selection */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg overflow-x-auto w-full sm:w-auto">
              {["all", "debug", "info", "warn", "error"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap cursor-pointer border",
                    level === lvl
                      ? lvl === "error"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : lvl === "warn"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : lvl === "info"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : lvl === "debug"
                        ? "bg-slate-850 text-slate-300 border-slate-700"
                        : "bg-slate-800 text-slate-200 border-slate-700"
                      : "bg-transparent text-slate-400 border-transparent hover:text-slate-200"
                  )}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Category selection */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg overflow-x-auto w-full sm:w-auto">
              {[
                { id: "all", label: "All Types" },
                { id: "database", label: "DB Logs" },
                { id: "http", label: "Req/Res" },
                { id: "third_party", label: "3rd Party" }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap cursor-pointer border",
                    category === cat.id
                      ? "bg-slate-800 text-slate-200 border-slate-700"
                      : "bg-transparent text-slate-400 border-transparent hover:text-slate-200"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-9 h-5 bg-zinc-800 border border-zinc-700 rounded-full transition-colors peer-checked:bg-cyan-500">
                  <div className={cn(
                    "absolute top-[2px] left-[2px] h-3.5 w-3.5 rounded-full transition-all duration-200 shadow ring-0",
                    autoRefresh ? "translate-x-4 bg-zinc-950" : "translate-x-0 bg-zinc-400"
                  )} />
                </div>
              </label>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 select-none">
                <Clock className="h-3.5 w-3.5" />
                Live Tail
              </span>
            </div>

            <button
              onClick={() => refetch()}
              className="flex items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              disabled={isFetching}
              title="Refresh"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            </button>

            {/* Export Dropdown */}
            <div ref={exportMenuRef} className="relative">
              <button
                onClick={() => setShowExportMenu(v => !v)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer",
                  showExportMenu
                    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                    : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white hover:bg-slate-900"
                )}
                title="Export logs"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
              {showExportMenu && (
                <div className="absolute bg-black right-0 top-full mt-1.5 z-50 flex flex-col bg-card border border-border rounded-xl shadow-2xl overflow-hidden min-w-[130px] scale-in">
                  <button
                    onClick={() => { exportLogs("csv"); setShowExportMenu(false); }}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-left text-muted-foreground hover:text-foreground hover:bg-gray-800 transition-colors cursor-pointer font-medium"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => { exportLogs("json"); setShowExportMenu(false); }}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-left text-muted-foreground hover:text-foreground hover:bg-gray-800 transition-colors cursor-pointer font-medium"
                  >
                    Export as JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Chips + Result Count Bar */}
      {(activeFilters.length > 0 || totalLogs > 0) && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {activeFilters.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                Active:
              </span>
            )}
            {activeFilters.map(f => (
              <span key={f.key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                {f.label}
                <button onClick={f.clear} className="ml-0.5 hover:text-foreground transition-colors cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {activeFilters.length > 1 && (
              <button
                onClick={() => { setLevel("all"); setCategory("all"); setService(""); setEnvironment(""); setSearch(""); setTimeRange("24h"); }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer underline underline-offset-2"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            {totalLogs > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {totalLogs.toLocaleString()} events · page {page}/{totalPages}
              </span>
            )}
            {selectedLogId && (
              <div className="hidden lg:flex items-center gap-2 text-[11px] text-muted-foreground/50">
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-card font-mono text-[10px]">j</kbd>
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-card font-mono text-[10px]">k</kbd>
                <span>navigate</span>
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-card font-mono text-[10px]">Esc</kbd>
                <span>close</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pattern Intelligence — above the logs table */}
      {logs.length > 0 && (
        <LogPatternIntelligence
          logs={logs}
          onSelectPattern={(ids) => {
            // Highlight the first matching log in this page
            const first = logs.find(l => ids.includes(l.id));
            if (first) setSelectedLogId(first.id);
            toast.info(`Pattern group: ${ids.length} matching events`);
          }}
        />
      )}

      {/* Main Viewport: Grid/Flex with inspector drawer */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch relative z-10">
        {/* Logs Feed List */}
        <div className="flex-1 w-full border border-slate-900 bg-slate-950/20 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-250px)]">
          {isLoading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                <span className="text-xs text-slate-400 uppercase tracking-widest">Scanning clickhouse index...</span>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 p-8 text-center">
              <Terminal className="h-10 w-10 text-slate-700 mb-4" />
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">No Logs Found</h4>
              <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed uppercase tracking-wider">
                Zero events matched filter criteria. Ensure SDK credentials are dispatching data packages correctly.
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full divide-y divide-border">
              <div className="relative flex flex-1 overflow-hidden">
                {/* Table of logs */}
                <div 
                  ref={scrollContainerRef}
                  className="flex-grow w-full overflow-x-auto overflow-y-auto custom-scrollbar"
                >
                  <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold text-[11px] uppercase tracking-widest">
                       <th className="p-3 pl-4">Level</th>
                       <th className="p-3">Timestamp</th>
                       <th className="p-3">Service</th>
                       <th className="p-3">Message</th>
                       <th className="p-3">Environment</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {logs.map((log) => {
                      const isSelected = selectedLogId === log.id;
                      return (
                        <tr
                          key={log.id}
                          id={`log-row-${log.id}`}
                          onClick={() => setSelectedLogId(log.id)}
                          className={cn(
                            "cursor-pointer transition-colors duration-100 border-l-[3px] group",
                            isSelected
                              ? "bg-primary/[0.08] border-primary"
                              : log.level === "error"
                              ? "border-destructive hover:bg-destructive/10 hover:border-destructive"
                              : log.level === "warn"
                              ? "border-amber-500/70 hover:bg-amber-500/10"
                              : log.level === "info"
                              ? "border-primary/50 hover:bg-primary/[0.06]"
                              : "border-zinc-800 hover:bg-zinc-800/40"
                          )}
                        >
                          <td className="p-3 pl-4 whitespace-nowrap">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border",
                                log.level === "error"
                                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                  : log.level === "warn"
                                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                  : log.level === "info"
                                  ? "bg-blue-500/15 text-blue-400 border-blue-500/25"
                                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
                              )}
                            >
                              {log.level}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap text-zinc-500 tabular-nums text-[11px]">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </td>
                          <td className="p-3 whitespace-nowrap text-[11px] font-semibold text-zinc-300 group-hover:text-zinc-100 transition-colors">{log.service}</td>
                          <td className="p-3 font-mono break-all max-w-lg truncate text-zinc-300 group-hover:text-zinc-100 transition-colors text-[11px]">
                            <span className="block mb-1">{log.message}</span>
                            {/* Inline Metadata Tags */}
                            {log.metadata && typeof log.metadata === 'object' && Object.keys(log.metadata).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {['action', 'status', 'method', 'latency_ms', 'latency'].map(key => {
                                  if (log?.metadata?.[key] !== undefined) {
                                    const val = log.metadata[key];
                                    const isErrorStatus = key === 'status' && Number(val) >= 400;
                                    return (
                                      <span key={key} className={cn(
                                        "inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] border font-bold uppercase tracking-wider",
                                        isErrorStatus ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-slate-900 border-slate-700 text-slate-400"
                                      )}>
                                        <span className="text-slate-400 mr-1">{key}:</span> {val}
                                      </span>
                                    );
                                  }
                                  return null;
                                })}
                              </div>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap text-slate-400 uppercase tracking-wider">{log.environment}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 bg-slate-950/40 text-xs text-slate-400 font-bold uppercase tracking-widest border-t border-slate-900">
                  <span>
                    Records: {(page - 1) * limit + 1}-{Math.min(page * limit, totalLogs)} of {totalLogs}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-950 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-slate-300 font-bold tracking-wider font-mono text-xs">
                      Page {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-950 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Inspector Drawer */}
        {selectedLogId && (
          <div className="w-full lg:w-[420px] bg-slate-950/20 border border-slate-900 rounded-2xl divide-y divide-slate-900 shrink-0 scale-in relative overflow-hidden flex flex-col h-[calc(100vh-250px)]">
            {/* Drawer Header with tabs */}
            <div className="p-4 bg-slate-950 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal className="h-4.5 w-4.5 text-cyan-400" />
                  Log Inspector
                </h3>
                <button
                  onClick={() => setSelectedLogId(null)}
                  className="p-1 rounded-lg hover:bg-slate-900 text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
              {/* Tabs */}
              <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setInspectorTab("details")}
                  className={cn(
                    "flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all cursor-pointer border",
                    inspectorTab === "details"
                      ? "bg-slate-800 text-slate-100 border-slate-700 shadow-sm"
                      : "bg-transparent text-slate-400 border-transparent hover:text-slate-200"
                  )}
                >
                  Details
                </button>
                <button
                  onClick={() => setInspectorTab("trace")}
                  className={cn(
                    "flex-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all cursor-pointer border",
                    inspectorTab === "trace"
                      ? "bg-slate-800 text-slate-100 border-slate-700 shadow-sm"
                      : "bg-transparent text-slate-400 border-transparent hover:text-slate-200"
                  )}
                >
                  ⚡ Trace Timeline
                </button>
              </div>
            </div>

            {detailsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
              </div>
            ) : selectedLog ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* TRACE TIMELINE TAB */}
                {inspectorTab === "trace" ? (
                  <div className="p-4">
                    {selectedLog.trace_id ? (
                      <TraceWaterfall
                        traceId={selectedLog.trace_id}
                        projectId={selectedProjectId}
                        anchorLogId={selectedLog.id}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                        <span className="text-2xl">🔍</span>
                        <p className="text-xs text-muted-foreground">This log has no trace_id.</p>
                        <p className="text-[10px] text-muted-foreground/50">Trace correlation requires a trace_id in the log payload.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* DETAILS TAB */
                  <div className="p-4 space-y-4">

                    {/* Level + timestamp row */}
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                        selectedLog.level === "error" ? "bg-rose-500/15 text-rose-400 border-rose-500/25" :
                        selectedLog.level === "warn"  ? "bg-amber-500/15 text-amber-400 border-amber-500/25" :
                        selectedLog.level === "info"  ? "bg-blue-500/15 text-blue-400 border-blue-500/25" :
                        "bg-zinc-800 text-zinc-400 border-zinc-700"
                      )}>
                        {selectedLog.level}
                      </span>
                      <span className="text-[11px] text-zinc-500 tabular-nums">
                        {new Date(selectedLog.created_at).toLocaleString()}
                      </span>
                    </div>

                    {/* Message */}
                    <div>
                      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">Message</p>
                      <p className="px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg font-mono text-[12px] text-zinc-200 leading-relaxed break-all whitespace-pre-wrap select-text">
                        {selectedLog.message}
                      </p>
                    </div>

                    {/* AI Analyzer */}
                    <AiLogAnalyzer log={selectedLog} projectId={selectedProjectId} />

                    {/* Service + Environment */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium mb-1">Service</p>
                        <p className="text-[12px] font-semibold text-zinc-200 truncate">{selectedLog.service}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium mb-1">Environment</p>
                        <p className="text-[12px] font-semibold text-zinc-200 truncate">{selectedLog.environment}</p>
                      </div>
                    </div>

                    {/* Trace ID */}
                    {selectedLog.trace_id && (
                      <div>
                        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">Trace ID</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] text-sky-400 font-mono truncate select-all">
                            {selectedLog.trace_id}
                          </code>
                          <button
                            onClick={() => setInspectorTab("trace")}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/25 text-violet-300 text-[11px] font-medium hover:bg-violet-500/20 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            ⚡ Timeline
                          </button>
                        </div>
                      </div>
                    )}

                    {/* JSON Metadata */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Metadata</p>
                        <button
                          onClick={() => handleCopy(JSON.stringify(selectedLog.metadata, null, 2), "Metadata")}
                          className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
                        >
                          {copiedText === "Metadata" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          {copiedText === "Metadata" ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-x-auto select-text max-h-64 custom-scrollbar">
                        <JsonViewer data={selectedLog.metadata || {}} />
                      </div>
                    </div>

                    {/* Delete */}
                    <div className="pt-2 border-t border-zinc-800">
                      <button
                        onClick={() => handleDeleteLog(selectedLog.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-zinc-600 hover:text-rose-400 hover:bg-rose-500/8 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer font-medium"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete this log
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-slate-400 italic uppercase text-xs tracking-widest">
                Failed to parse details.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Deletion Modal */}
      <ConfirmModal
        isOpen={!!logToDeleteId}
        onClose={() => setLogToDeleteId(null)}
        onConfirm={() => {
          if (logToDeleteId) {
            deleteMutation.mutate(logToDeleteId);
          }
        }}
        title="Purge Telemetry Record"
        message="Confirm deletion. The database event row will be permanently purged from the Clickhouse engine. This action is irreversible."
        confirmText="Confirm Purge"
        type="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
