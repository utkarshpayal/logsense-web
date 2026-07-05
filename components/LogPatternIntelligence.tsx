"use client";

import React, { useMemo, useState } from "react";
import { cn } from "../utils/cn";
import { Layers, ChevronDown, X, AlertTriangle } from "lucide-react";

interface Log {
  id: string;
  level: string;
  message: string;
  service: string;
}

interface PatternGroup {
  pattern: string;
  count: number;
  logs: Log[];
  level: string;
}

function templateize(message: string): string {
  return message
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "{uuid}")
    .replace(/\b\d{10,}\b/g, "{id}")
    .replace(/\b\d+\.\d+ms\b/gi, "{duration}")
    .replace(/\b\d+ms\b/gi, "{duration}")
    .replace(/https?:\/\/[^\s,'"]+/gi, "{url}")
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "{email}")
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "{ip}")
    .replace(/\b\d+\b/g, "{n}")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 120);
}

const LEVEL_ORDER: Record<string, number> = { error: 4, warn: 3, info: 2, debug: 1 };

function highestLevel(logs: Log[]): string {
  return logs.reduce(
    (best, l) => (LEVEL_ORDER[l.level] || 0) > (LEVEL_ORDER[best] || 0) ? l.level : best,
    "debug"
  );
}

interface LogPatternIntelligenceProps {
  logs: Log[];
  onSelectPattern: (ids: string[]) => void;
}

export function LogPatternIntelligence({ logs, onSelectPattern }: LogPatternIntelligenceProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const patterns = useMemo<PatternGroup[]>(() => {
    const map = new Map<string, Log[]>();
    for (const log of logs) {
      const key = templateize(log.message);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(log);
    }
    return Array.from(map.entries())
      .filter(([, g]) => g.length >= 2)
      .map(([pattern, groupLogs]) => ({
        pattern,
        count: groupLogs.length,
        logs: groupLogs,
        level: highestLevel(groupLogs),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [logs]);

  if (patterns.length === 0 || dismissed) return null;

  const errorCount = patterns.filter(p => p.level === "error").length;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/40">
        <div className="flex items-center gap-2.5">
          <Layers className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-[12px] font-semibold text-zinc-200">Pattern Intelligence</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
              {patterns.length} patterns
            </span>
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-2.5 w-2.5" />
                {errorCount} error
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="h-5 w-5 flex items-center justify-center rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Pattern rows */}
      <div className="divide-y divide-zinc-800/50">
        {patterns.map((p, i) => (
          <div key={i}>
            <div
              onClick={() => setExpanded(expanded === p.pattern ? null : p.pattern)}
              className="group flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-zinc-900/60 transition-colors"
            >
              {/* Severity indicator */}
              <div className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0",
                p.level === "error" ? "bg-rose-500" :
                p.level === "warn"  ? "bg-amber-400" :
                "bg-zinc-600"
              )} />

              {/* Count */}
              <span className={cn(
                "shrink-0 text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded border min-w-[2.2rem] text-center",
                p.level === "error"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : p.level === "warn"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              )}>
                ×{p.count}
              </span>

              {/* Template */}
              <span className="flex-1 text-[11px] text-zinc-400 font-mono truncate group-hover:text-zinc-200 transition-colors">
                {p.pattern}
              </span>

              {/* Isolate button — shows on hover */}
              <button
                onClick={(e) => { e.stopPropagation(); onSelectPattern(p.logs.map(l => l.id)); }}
                className="shrink-0 opacity-0 group-hover:opacity-100 text-[10px] text-zinc-500 hover:text-zinc-200 px-2 py-1 rounded hover:bg-zinc-700 transition-all cursor-pointer font-medium"
              >
                Isolate
              </button>

              <ChevronDown className={cn(
                "h-3.5 w-3.5 text-zinc-600 shrink-0 transition-transform duration-200",
                expanded === p.pattern && "-rotate-180"
              )} />
            </div>

            {/* Expanded examples */}
            {expanded === p.pattern && (
              <div className="px-4 pb-3 pt-1 space-y-1.5 bg-zinc-900/30">
                <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider mb-2">Sample events</p>
                {p.logs.slice(0, 3).map(l => (
                  <div key={l.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className={cn(
                      "shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border mt-0.5",
                      l.level === "error" ? "bg-rose-500/15 text-rose-400 border-rose-500/25" :
                      l.level === "warn"  ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-zinc-800 text-zinc-500 border-zinc-700"
                    )}>{l.level}</span>
                    <p className="text-[11px] text-zinc-400 font-mono break-all leading-relaxed">{l.message.substring(0, 120)}</p>
                  </div>
                ))}
                {p.logs.length > 3 && (
                  <p className="text-[10px] text-zinc-700 pl-1">+{p.logs.length - 3} more events</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
