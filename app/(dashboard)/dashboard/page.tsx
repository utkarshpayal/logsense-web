"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../../../lib/api";
import { useProjectStore } from "../../../store/project.store";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Clock,
  FolderOpen,
  Info,
  Loader2,
  Server,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  UserCheck,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
} from "../../../components/ui/map";

export default function DashboardPage() {
  const router = useRouter();
  const { selectedProjectId, projects } = useProjectStore();

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

  const { data: onboardingRes, isLoading: onboardingLoading } = useQuery({
    queryKey: ["dashboardOnboarding", selectedProjectId],
    queryFn: () => dashboardApi.getOnboarding(selectedProjectId!),
    enabled: !!selectedProjectId,
  });

  const overview = overviewRes?.data;
  const timeline = timelineRes?.data || [];
  const logLevels = logLevelsRes?.data || [];
  const services = servicesRes?.data || [];
  const recentErrors = errorsRes?.data || [];
  const onboardingLogs = onboardingRes?.data || [];

  const onboardingMarkers = onboardingLogs
    .filter((log) => {
      const onboarding = log.metadata?.onboarding;
      return onboarding && onboarding.location && typeof onboarding.location.latitude === "number" && typeof onboarding.location.longitude === "number";
    })
    .map((log) => {
      const onboarding = log.metadata!.onboarding;
      const loc = onboarding.location;
      return {
        id: log.id,
        userId: onboarding.userId,
        step: onboarding.step || "onboarded",
        city: loc.city || "Unknown City",
        country: loc.country || "Unknown Country",
        ip: loc.ip || "Unknown IP",
        lat: loc.latitude,
        lng: loc.longitude,
        createdAt: log.created_at,
        metadata: onboarding.metadata || {},
      };
    });

  const mapCenter = onboardingMarkers.length > 0
    ? [onboardingMarkers[0].lng, onboardingMarkers[0].lat] as [number, number]
    : [77.2090, 28.6139] as [number, number]; // New Delhi default center

  // Bezier spline path helper
  const getTimelinePath = (isError = false) => {
    if (timeline.length === 0) return "";
    const counts = timeline.map((t) => isError ? t.error_count : t.total_count);
    const max = Math.max(...counts, 10);
    const height = 160;
    const width = 600;
    const padding = 12;
    const denom = timeline.length > 1 ? timeline.length - 1 : 1;
    const points = timeline.map((item, i) => ({
      x: padding + (i / denom) * (width - padding * 2),
      y: height - padding - ((isError ? item.error_count : item.total_count) / max) * (height - padding * 2),
    }));
    if (points.length === 0) return "";
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const c = points[i], n = points[i + 1];
      d += ` C ${c.x + (n.x - c.x) / 3},${c.y} ${c.x + (2 * (n.x - c.x)) / 3},${n.y} ${n.x},${n.y}`;
    }
    return d;
  };

  const getAreaPath = (isError = false) => {
    const p = getTimelinePath(isError);
    return p ? `${p} L 588,148 L 12,148 Z` : "";
  };

  // — Empty states —
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6">
          <FolderOpen className="h-8 w-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
        <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
          Create a project workspace to start ingesting logs, monitoring services, and querying telemetry with AI.
        </p>
        <button
          onClick={() => router.push("/projects")}
          className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
        >
          Create Project
        </button>
      </div>
    );
  }

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6">
          <Info className="h-8 w-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Select a project</h3>
        <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
          Choose a project from the dropdown in the top navigation to view its observability data.
        </p>
      </div>
    );
  }

  const activeProject = projects.find((p) => p.id === selectedProjectId);
  const isLoading = overviewLoading || timelineLoading || levelsLoading || servicesLoading || errorsLoading || onboardingLoading;
  const hasErrors = (overview?.errorCount || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Live</span>
          </div>
          <h1 className="text-xl font-bold text-white">{activeProject?.name}</h1>
          <p className="text-sm text-slate-400 mt-0.5">Real-time observability overview</p>
        </div>
        <button
          onClick={() => router.push("/logs")}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-xl transition-all cursor-pointer self-start sm:self-center"
        >
          View Logs
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-500" />
            <span className="text-sm text-slate-500">Loading metrics…</span>
          </div>
        </div>
      ) : (
        <>
          {/* ── Stat Cards ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Logs */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">Total Logs</span>
                <div className="p-1.5 bg-cyan-500/10 rounded-lg">
                  <Activity className="h-4 w-4 text-cyan-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white font-mono tabular-nums">
                {(overview?.totalLogs || 0).toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">ingested events</p>
            </div>

            {/* Error Events */}
            <div className={cn(
              "border rounded-2xl p-5 transition-colors",
              hasErrors
                ? "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/30"
                : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80"
            )}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">Errors</span>
                <div className={cn("p-1.5 rounded-lg", hasErrors ? "bg-rose-500/10" : "bg-slate-800")}>
                  <AlertTriangle className={cn("h-4 w-4", hasErrors ? "text-rose-400" : "text-slate-500")} />
                </div>
              </div>
              <div className={cn("text-3xl font-bold font-mono tabular-nums", hasErrors ? "text-rose-400" : "text-white")}>
                {overview?.errorCount || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">error events captured</p>
            </div>

            {/* Error Rate */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">Error Rate</span>
                <div className="p-1.5 bg-amber-500/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white font-mono tabular-nums">
                {(overview?.errorRate || 0).toFixed(2)}
                <span className="text-lg text-slate-400 font-normal">%</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">of all log events</p>
            </div>

            {/* Avg Latency */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">Avg Latency</span>
                <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                  <Clock className="h-4 w-4 text-indigo-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white font-mono tabular-nums">
                {overview?.averageLatencyMs || 0}
                <span className="text-lg text-slate-400 font-normal ml-1">ms</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">average response time</p>
            </div>
          </div>

          {/* ── Charts Row ── */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Timeline Chart */}
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-semibold text-white">Log Volume</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Ingestion timeline over time</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                    Logs
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    Errors
                  </span>
                </div>
              </div>

              {timeline.length > 0 ? (
                <div>
                  <svg viewBox="0 0 600 160" className="w-full h-44">
                    <defs>
                      <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="errorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Grid */}
                    {[20, 60, 100, 140].map(y => (
                      <line key={y} x1="12" y1={y} x2="588" y2={y} stroke="rgba(51,65,85,0.4)" strokeWidth="1" strokeDasharray="4,4" />
                    ))}
                    {/* Total */}
                    {getAreaPath() && (
                      <>
                        <path d={getAreaPath()} fill="url(#totalGrad)" />
                        <path fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" d={getTimelinePath()} />
                      </>
                    )}
                    {/* Errors */}
                    {getAreaPath(true) && (
                      <>
                        <path d={getAreaPath(true)} fill="url(#errorGrad)" />
                        <path fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" d={getTimelinePath(true)} />
                      </>
                    )}
                  </svg>
                  <div className="flex justify-between text-xs text-slate-600 font-mono mt-2 border-t border-slate-800/60 pt-3">
                    <span>{new Date(timeline[0].time_bucket).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>{new Date(timeline[timeline.length - 1].time_bucket).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-44 text-slate-600 text-sm">
                  No timeline data yet
                </div>
              )}
            </div>

            {/* Severity Breakdown */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-white">Severity</h2>
                <p className="text-xs text-slate-500 mt-0.5">Log level distribution</p>
              </div>

              {logLevels.length > 0 ? (
                <div className="space-y-4">
                  {logLevels.map((item) => {
                    const pct = overview?.totalLogs && overview.totalLogs > 0
                      ? (item.count / overview.totalLogs) * 100 : 0;
                    const color =
                      item.level === "error" ? { bar: "bg-rose-500", text: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" } :
                      item.level === "warn"  ? { bar: "bg-amber-500", text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" } :
                      item.level === "info"  ? { bar: "bg-blue-500",  text: "text-blue-400",  bg: "bg-blue-500/10 border-blue-500/20" } :
                                               { bar: "bg-slate-500", text: "text-slate-400", bg: "bg-slate-800 border-slate-700" };
                    return (
                      <div key={item.level}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-md border capitalize", color.bg, color.text)}>
                            {item.level}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {item.count.toLocaleString()}
                            <span className="text-slate-600 ml-1">({pct.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-700", color.bar)} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
                  No data yet
                </div>
              )}
            </div>
          </div>

          {/* Active User Onboarding Map */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                  <h2 className="text-sm font-semibold text-white">Active User Onboarding Map</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Real-time user onboarding coordinates and telemetry</p>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {onboardingMarkers.length} active marker(s)
              </div>
            </div>

            <div className="h-[400px] w-full rounded-xl overflow-hidden border border-slate-800">
              <Map center={mapCenter} zoom={onboardingMarkers.length > 0 ? 5 : 2}>
                {onboardingMarkers.map((marker) => (
                  <MapMarker key={marker.id} longitude={marker.lng} latitude={marker.lat}>
                    <MarkerContent>
                      <div className="size-5 flex items-center justify-center cursor-pointer rounded-full border border-cyan-400 bg-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:scale-125">
                        <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
                      </div>
                      <MarkerLabel position="bottom">
                        {marker.userId} ({marker.city})
                      </MarkerLabel>
                    </MarkerContent>
                    <MarkerPopup className="w-72 p-0 bg-slate-900 border border-slate-850">
                      {/* Popup Header with map theme colors */}
                      <div className="relative h-20 bg-gradient-to-r from-cyan-950 to-slate-900 px-4 py-3 flex items-center gap-3 border-b border-slate-800/60">
                        <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                          <UserCheck className="size-5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase">User Onboarding</p>
                          <h3 className="text-sm text-white font-bold leading-none mt-1 font-mono">{marker.userId}</h3>
                        </div>
                      </div>

                      {/* Popup Body */}
                      <div className="p-4 space-y-3.5 text-xs">
                        {/* Location & IP Details */}
                        <div className="grid grid-cols-2 gap-3.5">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">City</span>
                            <span className="text-slate-200 font-medium mt-0.5 block">{marker.city}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Country</span>
                            <span className="text-slate-200 font-medium mt-0.5 block">{marker.country}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">IP Address</span>
                            <span className="text-slate-350 font-mono mt-0.5 block">{marker.ip}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Current Step</span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
                              {marker.step}
                            </span>
                          </div>
                        </div>

                        {/* Completed sections (if present) */}
                        {marker.metadata && Object.keys(marker.metadata).length > 0 && (
                          <div className="pt-2.5 border-t border-slate-850">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Metadata</span>
                            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pr-1">
                              {Object.entries(marker.metadata).map(([key, val]) => (
                                <span key={key} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-800 text-slate-400 font-mono">
                                  {key}: {Array.isArray(val) ? val.join(", ") : String(val)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Footer with date */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-850 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {new Date(marker.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span>{new Date(marker.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </MarkerPopup>
                  </MapMarker>
                ))}
              </Map>
            </div>
          </div>

          {/* ── Bottom Row ── */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Service Health */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Server className="h-4 w-4 text-slate-500" />
                <div>
                  <h2 className="text-sm font-semibold text-white">Services</h2>
                  <p className="text-xs text-slate-500">Request throughput & error rates</p>
                </div>
              </div>

              {services.length > 0 ? (
                <div className="space-y-2">
                  {services.map((svc) => (
                    <div
                      key={svc.service}
                      className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl hover:border-slate-700/60 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="block text-sm font-medium text-slate-200 truncate font-mono">
                          {svc.service || "unknown"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {svc.total_count} requests
                        </span>
                      </div>
                      <div className="flex items-center gap-5 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Latency</p>
                          <p className="text-sm font-semibold text-slate-300 font-mono">
                            {svc.avg_latency ? svc.avg_latency.toFixed(0) : 0}ms
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Errors</p>
                          <p className={cn(
                            "text-sm font-semibold font-mono",
                            svc.error_count > 0 ? "text-rose-400" : "text-emerald-400"
                          )}>
                            {svc.error_count}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-36 gap-2">
                  <CheckCircle2 className="h-8 w-8 text-slate-700" />
                  <p className="text-sm text-slate-600">No service data yet</p>
                </div>
              )}
            </div>

            {/* Recent Errors */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn("h-4 w-4", hasErrors ? "text-rose-400" : "text-slate-500")} />
                  <div>
                    <h2 className="text-sm font-semibold text-white">Recent Errors</h2>
                    <p className="text-xs text-slate-500">Click to inspect request traces</p>
                  </div>
                </div>
                {recentErrors.length > 0 && (
                  <button
                    onClick={() => router.push("/logs?level=error")}
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    View all
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {recentErrors.length > 0 ? (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-0.5">
                  {recentErrors.map((err) => (
                    <div
                      key={err.id}
                      onClick={() => router.push(err.trace_id ? `/logs?search=${err.trace_id}` : "/logs")}
                      className="p-3 bg-slate-950/40 border border-slate-800/60 hover:border-rose-500/20 hover:bg-rose-500/[0.03] rounded-xl cursor-pointer transition-all group"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-300 line-clamp-2 leading-relaxed font-mono break-all">
                            {err.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
                            <span className="text-slate-500 font-medium">{err.service || "unknown"}</span>
                            <span>·</span>
                            <span>{new Date(err.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-36 gap-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-700" />
                  <p className="text-sm text-slate-500">No errors — all clear!</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
