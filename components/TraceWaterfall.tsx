"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { logsApi } from "../lib/api";
import { cn } from "../utils/cn";
import { Loader2, Zap, AlertCircle, Clock } from "lucide-react";

interface TraceWaterfallProps {
  traceId: string;
  projectId: string;
  anchorLogId: string;
}

// Deterministic pastel-ish color per service
const PALETTE = [
  { bg: "bg-blue-500/80",    border: "border-blue-500",    dot: "bg-blue-400",    text: "text-blue-400",    bar: "#3b82f6" },
  { bg: "bg-violet-500/80",  border: "border-violet-500",  dot: "bg-violet-400",  text: "text-violet-400",  bar: "#8b5cf6" },
  { bg: "bg-emerald-500/80", border: "border-emerald-500", dot: "bg-emerald-400", text: "text-emerald-400", bar: "#10b981" },
  { bg: "bg-amber-500/80",   border: "border-amber-500",   dot: "bg-amber-400",   text: "text-amber-400",   bar: "#f59e0b" },
  { bg: "bg-pink-500/80",    border: "border-pink-500",    dot: "bg-pink-400",    text: "text-pink-400",    bar: "#ec4899" },
  { bg: "bg-cyan-500/80",    border: "border-cyan-500",    dot: "bg-cyan-400",    text: "text-cyan-400",    bar: "#06b6d4" },
  { bg: "bg-orange-500/80",  border: "border-orange-500",  dot: "bg-orange-400",  text: "text-orange-400",  bar: "#f97316" },
  { bg: "bg-teal-500/80",    border: "border-teal-500",    dot: "bg-teal-400",    text: "text-teal-400",    bar: "#14b8a6" },
];

function getPalette(service: string) {
  let hash = 0;
  for (let i = 0; i < service.length; i++) hash = service.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function fmtMs(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function TraceWaterfall({ traceId, projectId, anchorLogId }: TraceWaterfallProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["trace", traceId, projectId],
    queryFn: () => logsApi.getLogs({ search: traceId, limit: 100 } as any),
    enabled: !!traceId && !!projectId,
  });

  const events = useMemo(() => {
    const raw = (data?.data || []).filter((l: any) => l.trace_id === traceId);
    return raw.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [data, traceId]);

  const services = useMemo(() => [...new Set(events.map((e: any) => e.service as string))], [events]);

  const { originMs, totalDurationMs } = useMemo(() => {
    if (events.length === 0) return { originMs: 0, totalDurationMs: 0 };
    const times = events.map((e: any) => new Date(e.created_at).getTime());
    const originMs = Math.min(...times);
    const totalDurationMs = Math.max(...times) - originMs;
    return { originMs, totalDurationMs: totalDurationMs || 1 };
  }, [events]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Reconstructing trace…</span>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <Zap className="h-7 w-7 text-muted-foreground/20" />
        <p className="text-sm font-medium text-muted-foreground">No correlated events</p>
        <p className="text-xs text-muted-foreground/50 max-w-[200px]">No logs share this trace ID in the current project scope.</p>
      </div>
    );
  }

  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="space-y-4">

      {/* Legend */}
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {services.map(svc => {
            const p = getPalette(svc);
            return (
              <span key={svc} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className={cn("h-2 w-2 rounded-full shrink-0", p.dot)} />
                {svc}
              </span>
            );
          })}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50 shrink-0">
          <Clock className="h-3 w-3" />
          {fmtMs(totalDurationMs)}
        </div>
      </div>

      {/* Time ruler */}
      <div className="relative h-5 mx-1 border-b border-border/30">
        {ticks.map(t => (
          <span
            key={t}
            className="absolute bottom-1 text-[9px] font-mono text-muted-foreground/40 -translate-x-1/2"
            style={{ left: `${t * 100}%` }}
          >
            {fmtMs(Math.round(totalDurationMs * t))}
          </span>
        ))}
        {/* tick marks */}
        {ticks.map(t => (
          <div
            key={`tick-${t}`}
            className="absolute bottom-0 w-px h-2 bg-border/40"
            style={{ left: `${t * 100}%` }}
          />
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-px">
        {events.map((event: any, idx) => {
          const eventMs = new Date(event.created_at).getTime();
          const offsetMs = eventMs - originMs;
          const offsetPct = (offsetMs / totalDurationMs) * 100;
          const latency: number | null = event.metadata?.latency_ms ?? event.metadata?.latency ?? null;
          const barWidthPct = latency
            ? Math.max(1, Math.min(100 - offsetPct, (Number(latency) / totalDurationMs) * 100))
            : Math.max(1.5, Math.min(6, 100 - offsetPct));

          const isAnchor = event.id === anchorLogId;
          const isError = event.level === "error" || event.level === "fatal";
          const isWarn = event.level === "warn";
          const p = getPalette(event.service);
          const isHovered = hoveredId === event.id;

          return (
            <div
              key={event.id}
              onMouseEnter={() => setHoveredId(event.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                "group relative flex items-center gap-2 rounded-lg px-2 py-2 transition-colors cursor-default",
                isAnchor
                  ? "bg-primary/10 border border-primary/20"
                  : isHovered
                  ? "bg-secondary/50"
                  : "hover:bg-secondary/20"
              )}
              style={{ minHeight: 36 }}
            >
              {/* Row number */}
              <span className="text-[9px] font-mono text-muted-foreground/30 w-5 shrink-0 text-right select-none">
                {idx + 1}
              </span>

              {/* Service dot */}
              <span className={cn("h-2 w-2 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-background", p.dot, isAnchor ? "ring-primary/40" : "ring-transparent")} />

              {/* Waterfall canvas */}
              <div className="relative flex-1 h-6 flex items-center">
                {/* Grid lines */}
                {ticks.slice(1, -1).map(t => (
                  <div
                    key={t}
                    className="absolute inset-y-0 w-px bg-border/15"
                    style={{ left: `${t * 100}%` }}
                  />
                ))}

                {/* The bar */}
                <div
                  className={cn(
                    "absolute h-4 rounded-sm transition-all",
                    isError
                      ? "bg-destructive/70 border border-destructive/50"
                      : isWarn
                      ? "bg-amber-500/60 border border-amber-500/40"
                      : `border border-opacity-30`,
                    isHovered || isAnchor ? "opacity-100" : "opacity-70"
                  )}
                  style={{
                    left: `${offsetPct}%`,
                    width: `${barWidthPct}%`,
                    backgroundColor: isError ? undefined : isWarn ? undefined : `${p.bar}99`,
                    borderColor: isError ? undefined : isWarn ? undefined : `${p.bar}66`,
                  }}
                >
                  {/* Inner latency label if bar is wide enough */}
                  {barWidthPct > 12 && latency && (
                    <span className="absolute inset-0 flex items-center px-1 text-[8px] font-mono text-white/80 overflow-hidden">
                      {fmtMs(Number(latency))}
                    </span>
                  )}
                </div>

                {/* Error icon */}
                {isError && (
                  <AlertCircle
                    className="absolute h-3.5 w-3.5 text-destructive drop-shadow"
                    style={{ left: `calc(${offsetPct}% - 6px)` }}
                  />
                )}
              </div>

              {/* Offset timestamp */}
              <span className={cn(
                "text-[9px] font-mono shrink-0 w-12 text-right",
                isError ? "text-destructive" : isWarn ? "text-amber-400" : "text-muted-foreground/50"
              )}>
                +{fmtMs(offsetMs)}
              </span>

              {/* Hover tooltip — rendered inline below the row */}
              {isHovered && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-2xl pointer-events-none scale-in">
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-[11px] font-semibold", p.text)}>{event.service}</span>
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border",
                      isError ? "bg-destructive/20 text-destructive border-destructive/30" :
                      isWarn  ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                      "bg-zinc-800 text-zinc-400 border-zinc-700"
                    )}>{event.level}</span>
                  </div>
                  <p className="text-[11px] text-zinc-200 leading-relaxed break-words mb-2 font-sans">{event.message.substring(0, 160)}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-zinc-800 pt-1.5">
                    <span>{new Date(event.created_at).toLocaleTimeString()}</span>
                    {latency && <span className="text-amber-400">{fmtMs(Number(latency))} latency</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer summary */}
      <div className="flex items-center justify-between px-1 pt-2 border-t border-border/30 text-[10px] text-muted-foreground/40">
        <span>{events.length} spans · {services.length} service{services.length !== 1 ? "s" : ""}</span>
        <span className="font-mono">total: {fmtMs(totalDurationMs)}</span>
      </div>
    </div>
  );
}
