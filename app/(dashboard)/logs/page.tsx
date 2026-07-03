"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logsApi } from "../../../lib/api";
import { useProjectStore } from "../../../store/project.store";
import { toast } from "sonner";
import {
  Terminal,
  Search,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FolderOpen,
  Info,
  X,
  Copy,
  Check,
  Cpu,
  Trash2,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import ConfirmModal from "../../../components/ConfirmModal";

export default function LogsPage() {
  const queryClient = useQueryClient();
  const { selectedProjectId, projects } = useProjectStore();

  // Filter States
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [service, setService] = useState("");
  const [environment, setEnvironment] = useState("");
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [logToDeleteId, setLogToDeleteId] = useState<string | null>(null);

  const limit = 50;
  const offset = (page - 1) * limit;

  // Build query params
  const queryParams: any = {
    projectId: selectedProjectId || undefined,
    level: level !== "all" ? level : undefined,
    service: service || undefined,
    environment: environment || undefined,
    search: search || undefined,
    limit,
    offset,
  };

  // Fetch Logs
  const { data: logsResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["logs", selectedProjectId, level, service, environment, search, page],
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
  const deleteMutation = useMutation({
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

  const handleDeleteLog = (id: string) => {
    setLogToDeleteId(id);
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [level, service, environment, search, selectedProjectId]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Quick trace navigation
  const searchTrace = (traceId: string) => {
    setSearch(traceId);
    setLevel("all");
    setService("");
    setEnvironment("");
    setSelectedLogId(null);
    toast.info(`Filtering logs by trace ID: ${traceId}`);
  };

  // Guard: No projects exist
  if (projects.length === 0) {
    return (
      <div className="cyber-panel rounded-2xl border border-slate-800 p-12 text-center max-w-xl mx-auto mt-8 relative overflow-hidden font-mono">
        <FolderOpen className="h-10 w-10 text-slate-550 mx-auto mb-4" />
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">No active projects</h3>
        <p className="text-xs text-slate-500 mt-2 uppercase tracking-wider">
          You must create a project workspace before you can ingest or view logs.
        </p>
      </div>
    );
  }

  // Guard: No project selected
  if (!selectedProjectId) {
    return (
      <div className="cyber-panel rounded-2xl border border-slate-800 p-12 text-center max-w-xl mx-auto mt-8 relative overflow-hidden font-mono">
        <Info className="h-10 w-10 text-cyan-405 mx-auto mb-4" />
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Select a project</h3>
        <p className="text-xs text-slate-500 mt-2 uppercase tracking-wider">
          Please select a project from the top navbar project switcher to scope the Logs Explorer feed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative text-xs">

      {/* Search and Filters Bar */}
      <div className="cyber-panel rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col gap-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Message */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-550">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search log messages, trace IDs, user_ids..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-800 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Service Filter */}
          <div className="w-full md:w-44">
            <input
              type="text"
              placeholder="Filter Service"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="block w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-800 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
            />
          </div>

          {/* Environment Filter */}
          <div className="w-full md:w-44">
            <input
              type="text"
              placeholder="Filter Environment"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="block w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-800 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
            />
          </div>
        </div>

        {/* Level Tabs & Auto-refresh Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-900 pt-4 gap-4">
          {/* Level selection */}
          <div className="flex items-center gap-1.5 bg-slate-955 p-1.5 border border-slate-800 rounded-xl overflow-x-auto w-full sm:w-auto">
            {["all", "debug", "info", "warn", "error"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevel(lvl)}
                className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap cursor-pointer",
                  level === lvl
                    ? lvl === "error"
                      ? "bg-rose-500/15 text-rose-455 border border-rose-500/25"
                      : lvl === "warn"
                      ? "bg-amber-500/15 text-amber-450 border border-amber-500/25"
                      : lvl === "info"
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25"
                      : lvl === "debug"
                      ? "bg-slate-900 text-slate-300 border border-slate-800"
                      : "bg-cyan-500 text-slate-950"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                {lvl}
              </button>
            ))}
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
                <div className="w-9 h-5 bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-550 after:border-slate-500 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-slate-950" />
              </label>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5 select-none">
                <Clock className="h-3.5 w-3.5" />
                Live Tail
              </span>
            </div>

            <button
              onClick={() => refetch()}
              className="flex items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-500 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              disabled={isFetching}
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Viewport: Grid/Flex with inspector drawer */}
      <div className="flex flex-col lg:flex-row gap-6 items-start relative z-10">
        {/* Logs Feed List */}
        <div className="flex-1 w-full cyber-panel rounded-2xl border border-slate-800 overflow-hidden">
          {isLoading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                <span className="text-xs text-slate-550 uppercase tracking-widest">Scanning clickhouse index...</span>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 p-8 text-center">
              <Terminal className="h-10 w-10 text-slate-700 mb-4" />
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">No Logs Found</h4>
              <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed uppercase tracking-wider">
                Zero events matched filter criteria. Ensure SDK credentials are dispatching data packages correctly.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-900">
              {/* Table of logs */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-955 border-b border-slate-900 text-slate-550 font-bold uppercase tracking-widest text-xs">
                      <th className="p-3">Level</th>
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
                          onClick={() => setSelectedLogId(log.id)}
                          className={cn(
                            "cursor-pointer transition-all border-l-2",
                            isSelected
                              ? "bg-slate-900/60 border-cyan-400"
                              : log.level === "error"
                              ? "border-rose-500 hover:bg-rose-500/[0.01]"
                              : log.level === "warn"
                              ? "border-amber-500 hover:bg-amber-500/[0.01]"
                              : log.level === "info"
                              ? "border-cyan-500 hover:bg-cyan-500/[0.01]"
                              : "border-slate-800 hover:bg-slate-900/10"
                          )}
                        >
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border",
                                log.level === "error"
                                  ? "bg-rose-500/10 text-rose-455 border-rose-500/20"
                                  : log.level === "warn"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : log.level === "info"
                                  ? "bg-cyan-500/5 text-cyan-400 border-cyan-500/25"
                                  : "bg-slate-950 text-slate-455 border-slate-800"
                              )}
                            >
                              {log.level}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap text-slate-500">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </td>
                          <td className="p-3 whitespace-nowrap font-bold text-slate-350">{log.service}</td>
                          <td className="p-3 font-mono break-all max-w-lg truncate text-slate-200">
                            {log.message}
                          </td>
                          <td className="p-3 whitespace-nowrap text-slate-500 uppercase tracking-wider">{log.environment}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 bg-slate-955/40 text-xs text-slate-500 font-bold uppercase tracking-widest">
                  <span>
                    Records: {(page - 1) * limit + 1}-{Math.min(page * limit, totalLogs)} of {totalLogs}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-slate-855 hover:bg-slate-950 text-slate-550 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-slate-300 font-bold tracking-wider font-mono text-xs">
                      Page {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-slate-855 hover:bg-slate-950 text-slate-550 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
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
          <div className="w-full lg:w-96 cyber-panel rounded-2xl border border-slate-800 divide-y divide-slate-900 shrink-0 scale-in relative overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-955 flex items-center justify-between">
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

            {detailsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-405" />
              </div>
            ) : selectedLog ? (
              <div className="p-5 space-y-5 max-h-[600px] overflow-y-auto">
                {/* Level / Timestamp */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                      selectedLog.level === "error"
                        ? "bg-rose-500/10 text-rose-455 border-rose-500/25"
                        : selectedLog.level === "warn"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : selectedLog.level === "info"
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/25"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    )}
                  >
                    {selectedLog.level}
                  </span>
                  <span className="text-xs text-slate-500">{new Date(selectedLog.created_at).toLocaleString()}</span>
                </div>

                {/* Primary message */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Message payload
                  </label>
                  <p className="p-3 bg-slate-950 border border-slate-850 rounded-xl font-mono text-xs text-slate-200 leading-relaxed break-all whitespace-pre-wrap select-text">
                    {selectedLog.message}
                  </p>
                </div>

                {/* Trace ID Scope */}
                {selectedLog.trace_id && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Trace ID Correlation
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={selectedLog.trace_id}
                        className="block w-full px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-cyan-400 font-mono select-all focus:outline-none"
                      />
                      <button
                        onClick={() => searchTrace(selectedLog.trace_id!)}
                        className="px-2.5 py-1.5 bg-slate-955 border border-slate-800 hover:border-cyan-500/30 text-slate-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Scope ID
                      </button>
                    </div>
                  </div>
                )}

                {/* Metadata Fields */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-slate-555 uppercase tracking-widest">Service</span>
                    <span className="text-xs font-bold text-slate-300 block truncate">{selectedLog.service}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-slate-555 uppercase tracking-widest">Environment</span>
                    <span className="text-xs font-bold text-slate-350 block truncate uppercase tracking-wider">{selectedLog.environment}</span>
                  </div>
                </div>

                {/* Structured JSON Payload */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      JSON Context Attributes
                    </label>
                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedLog.metadata, null, 2), "Metadata")}
                      className="text-slate-500 hover:text-white transition-colors flex items-center gap-1"
                    >
                      {copiedText === "Metadata" ? <Check className="h-3.5 w-3.5 text-emerald-450" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 border border-slate-850 rounded-xl font-mono text-xs text-slate-400 leading-relaxed overflow-x-auto select-text max-h-48">
                    <code>{JSON.stringify(selectedLog.metadata || {}, null, 2)}</code>
                  </pre>
                </div>

                {/* Dangerous revoker */}
                <div className="flex items-center justify-end border-t border-slate-900 pt-4 mt-2">
                  <button
                    onClick={() => handleDeleteLog(selectedLog.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-455 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Purge Record
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-slate-550 italic uppercase text-xs tracking-widest">
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
