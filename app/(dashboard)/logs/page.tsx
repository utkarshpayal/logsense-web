"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logsApi } from "../../../lib/api";
import { useProjectStore } from "../../../store/project.store";
import { toast } from "sonner";
import {
  Terminal,
  Search,
  Filter,
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
    refetchInterval: autoRefresh ? 5000 : false, // Poll every 5s if autoRefresh is active
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
      <div className="glass-panel rounded-xl border border-zinc-800 p-12 text-center max-w-xl mx-auto mt-8">
        <FolderOpen className="h-10 w-10 text-zinc-550 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-zinc-200">No active projects</h3>
        <p className="text-sm text-zinc-400 mt-2">
          You must create a project workspace before you can ingest or view logs.
        </p>
      </div>
    );
  }

  // Guard: No project selected
  if (!selectedProjectId) {
    return (
      <div className="glass-panel rounded-xl border border-zinc-800 p-12 text-center max-w-xl mx-auto mt-8">
        <Info className="h-10 w-10 text-indigo-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-zinc-200">Select a project</h3>
        <p className="text-sm text-zinc-400 mt-2">
          Please select a project from the top navbar project switcher to scope the Logs Explorer feed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="glass-panel rounded-xl border border-zinc-800 p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Message */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search log messages, trace IDs, trace_id, user_ids..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
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
              className="block w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Environment Filter */}
          <div className="w-full md:w-44">
            <input
              type="text"
              placeholder="Filter Environment"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="block w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Level Tabs & Auto-refresh Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-zinc-850 pt-4 gap-4">
          {/* Level selection */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 border border-zinc-850 rounded-lg overflow-x-auto w-full sm:w-auto">
            {["all", "debug", "info", "warn", "error"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevel(lvl)}
                className={cn(
                  "px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap",
                  level === lvl
                    ? lvl === "error"
                      ? "bg-red-500/15 text-red-400 border border-red-500/20"
                      : lvl === "warn"
                      ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                      : lvl === "info"
                      ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                      : lvl === "debug"
                      ? "bg-zinc-800 text-zinc-300 border border-zinc-700"
                      : "bg-indigo-600 text-white"
                    : "text-zinc-450 hover:text-zinc-200"
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
                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-650 peer-checked:after:bg-white" />
              </label>
              <span className="text-xs text-zinc-450 font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Live Tail
              </span>
            </div>

            <button
              onClick={() => refetch()}
              className="flex items-center justify-center p-2 rounded-lg border border-zinc-800 bg-zinc-950/40 text-zinc-450 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
              disabled={isFetching}
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table / List Shell */}
      <div className="flex flex-col lg:flex-row gap-6 relative items-start">
        {/* Main Logs Table */}
        <div className="flex-1 w-full glass-panel rounded-xl border border-zinc-800 overflow-hidden relative min-h-[400px]">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/30">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 p-8 text-center">
              <Terminal className="h-10 w-10 text-zinc-550 mb-3" />
              <h4 className="text-sm font-semibold text-zinc-350">No logs found</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                No logs matching your criteria. Make sure your SDK is using a valid API key for this workspace.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-850 max-h-[600px] overflow-y-auto font-mono text-xs">
              {logs.map((log) => {
                const isSelected = selectedLogId === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={cn(
                      "flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-3 cursor-pointer hover:bg-zinc-900/10 border-l-2 transition-all",
                      isSelected
                        ? "border-indigo-500 bg-indigo-950/5"
                        : log.level === "error"
                        ? "border-red-500/30 hover:border-red-500"
                        : log.level === "warn"
                        ? "border-yellow-500/30 hover:border-yellow-500"
                        : log.level === "info"
                        ? "border-blue-500/20 hover:border-blue-500"
                        : "border-transparent hover:border-zinc-700"
                    )}
                  >
                    {/* Timestamp & Level */}
                    <div className="flex items-center gap-2.5 sm:w-48 shrink-0">
                      <span className="text-zinc-550 text-[10px]">
                        {new Date(log.created_at).toLocaleTimeString(undefined, {
                          hour12: false,
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                        <span className="text-zinc-650 ml-1">
                          .{new Date(log.created_at).getMilliseconds().toString().padStart(3, "0")}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-center w-12 border",
                          log.level === "error"
                            ? "bg-red-500/10 text-red-400 border-red-500/15"
                            : log.level === "warn"
                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/15"
                            : log.level === "info"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/15"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        )}
                      >
                        {log.level}
                      </span>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {log.service && (
                        <span className="px-1.5 py-0.5 rounded-[4px] bg-zinc-900 border border-zinc-800 text-zinc-450 text-[10px] truncate max-w-[100px]" title={`Service: ${log.service}`}>
                          {log.service}
                        </span>
                      )}
                      {log.environment && (
                        <span className="px-1.5 py-0.5 rounded-[4px] bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] truncate max-w-[80px]" title={`Env: ${log.environment}`}>
                          {log.environment}
                        </span>
                      )}
                    </div>

                    {/* Message content */}
                    <div className="flex-1 min-w-0 text-zinc-300 break-all select-text pr-2 line-clamp-1 sm:line-clamp-2">
                      {log.message}
                    </div>

                    {/* Trace indicator */}
                    {log.trace_id && (
                      <span className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider hidden lg:inline-block shrink-0 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900">
                        {log.trace_id.substring(0, 8)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4 bg-zinc-950/20 text-xs">
              <span className="text-zinc-500">
                Showing <span className="font-semibold text-zinc-350">{offset + 1}</span> to{" "}
                <span className="font-semibold text-zinc-350">
                  {Math.min(offset + limit, totalLogs)}
                </span>{" "}
                of <span className="font-semibold text-zinc-350">{totalLogs}</span> logs
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-450 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-450 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-450 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-450 transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Slide-out Sidebar Drawer Inspector */}
        {selectedLogId && (
          <div className="w-full lg:w-96 shrink-0 glass-panel rounded-xl border border-zinc-800 overflow-hidden sticky top-24 animate-fade-in">
            {detailsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            ) : selectedLog ? (
              <div className="p-5 space-y-5">
                {/* Drawer Header */}
                <div className="flex items-start justify-between border-b border-zinc-850 pb-4">
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Cpu className="h-4 w-4 text-indigo-400" />
                      Log Details
                    </h3>
                    <span className="text-[10px] text-zinc-550 font-mono select-all">ID: {selectedLog.id}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDeleteLog(selectedLog.id)}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-550 hover:text-red-400 transition-colors"
                      title="Delete log event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setSelectedLogId(null)}
                      className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-450 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-4 font-mono text-[11px] leading-relaxed">
                  {/* Timestamp */}
                  <div>
                    <span className="block text-[10px] font-semibold text-zinc-550 uppercase tracking-wider font-sans mb-1">
                      Timestamp
                    </span>
                    <span className="text-zinc-350">{new Date(selectedLog.created_at).toLocaleString()}</span>
                  </div>

                  {/* Level & Scopes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] font-semibold text-zinc-550 uppercase tracking-wider font-sans mb-1">
                        Severity
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                          selectedLog.level === "error"
                            ? "bg-red-500/10 text-red-400 border-red-500/15"
                            : selectedLog.level === "warn"
                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/15"
                            : selectedLog.level === "info"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/15"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        )}
                      >
                        {selectedLog.level}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-semibold text-zinc-550 uppercase tracking-wider font-sans mb-1">
                        Host
                      </span>
                      <span className="text-zinc-350 truncate block" title={selectedLog.hostname}>
                        {selectedLog.hostname || "Unknown"}
                      </span>
                    </div>
                  </div>

                  {/* Service & Environment */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] font-semibold text-zinc-550 uppercase tracking-wider font-sans mb-1">
                        Service
                      </span>
                      <span className="text-zinc-300 font-semibold">{selectedLog.service || "N/A"}</span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-semibold text-zinc-550 uppercase tracking-wider font-sans mb-1">
                        Environment
                      </span>
                      <span className="text-zinc-300 font-semibold">{selectedLog.environment || "N/A"}</span>
                    </div>
                  </div>

                  {/* Trace ID */}
                  {selectedLog.trace_id && (
                    <div>
                      <span className="block text-[10px] font-semibold text-zinc-550 uppercase tracking-wider font-sans mb-1">
                        Trace ID
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-400 font-semibold select-all truncate">{selectedLog.trace_id}</span>
                        <button
                          onClick={() => handleCopy(selectedLog.trace_id!, "Trace ID")}
                          className="p-1 rounded text-zinc-500 hover:text-zinc-350"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => searchTrace(selectedLog.trace_id!)}
                          className="text-[10px] px-2 py-0.5 bg-indigo-650 hover:bg-indigo-600 rounded text-white font-sans font-semibold transition-colors"
                        >
                          Find Traces
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Full Log message */}
                  <div>
                    <span className="block text-[10px] font-semibold text-zinc-550 uppercase tracking-wider font-sans mb-1.5">
                      Log Message
                    </span>
                    <pre className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg text-[11px] text-zinc-300 leading-normal max-h-48 overflow-y-auto whitespace-pre-wrap select-text break-all">
                      <code>{selectedLog.message}</code>
                    </pre>
                  </div>

                  {/* Full structured metadata JSON */}
                  <div>
                    <span className="block text-[10px] font-semibold text-zinc-550 uppercase tracking-wider font-sans mb-1.5 flex justify-between items-center">
                      Aggregated Metadata
                      {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                        <button
                          onClick={() => handleCopy(JSON.stringify(selectedLog.metadata, null, 2), "Metadata JSON")}
                          className="text-zinc-500 hover:text-zinc-350 flex items-center gap-1 font-sans"
                        >
                          <Copy className="h-3 w-3" />
                          Copy
                        </button>
                      )}
                    </span>
                    {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 ? (
                      <pre className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg text-[10px] text-indigo-300 overflow-x-auto max-h-56 leading-relaxed select-text">
                        <code>{JSON.stringify(selectedLog.metadata, null, 2)}</code>
                      </pre>
                    ) : (
                      <span className="text-zinc-550 italic">No associated metadata context.</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 italic text-xs">Error displaying details</div>
            )}
          </div>
        )}
      </div>
      {/* Confirm Log Deletion Modal */}
      <ConfirmModal
        isOpen={!!logToDeleteId}
        onClose={() => setLogToDeleteId(null)}
        onConfirm={() => {
          if (logToDeleteId) {
            deleteMutation.mutate(logToDeleteId);
          }
        }}
        title="Delete Log Entry"
        message="Are you sure you want to delete this log? This operation is permanent and cannot be undone."
        confirmText="Delete Log"
        type="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
