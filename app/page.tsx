"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "../hooks/use-auth";
import { Cpu, ArrowRight, Bot, Code, Terminal, Sparkles, Zap } from "lucide-react";

export default function Home() {
  const { user } = useAuth(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#05070a] flex flex-col justify-between overflow-hidden dotted-tech">
      {/* Aurora glow circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none animate-cyber-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none animate-cyber-pulse" style={{ animationDelay: "-2.5s" }} />
      <div className="scanline opacity-10" />

      {/* Navbar header */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/80 bg-[#05070a]/80 px-6 backdrop-blur-md max-w-7xl w-full mx-auto font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-650 shadow-md shadow-cyan-500/20">
            <Cpu className="w-4.5 h-4.5 text-slate-900 animate-spin" style={{ animationDuration: "12s" }} />
          </div>
          <span className="font-bold text-sm tracking-widest text-white uppercase flex items-center gap-1.5">
            Tri-Netra
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 uppercase tracking-widest">
              v1.0
            </span>
          </span>
        </div>

        <div>
          {!mounted ? (
            <div className="h-8 w-20 bg-slate-900 rounded-lg animate-pulse" />
          ) : user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 hover:from-cyan-400 hover:to-indigo-600 text-slate-900 text-xs font-bold uppercase tracking-widest transition-all shadow-md cursor-pointer"
            >
              Console
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/30 text-slate-350 hover:text-white text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
            >
              Sign In
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </header>

      {/* Hero Body */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 flex flex-col justify-center items-center py-20 text-center gap-8 z-10 relative">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest font-mono select-none">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          Autonomous Log Ingest & Intelligence
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl font-mono uppercase">
          Observability scaled with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-200">
  Conversational AI
</span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed font-sans">
          LogSense is an advanced telemetry platform built for modern engineering teams. Ingest backend events via simple middleware SDKs and query structured aggregates instantly using conversational English.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full justify-center max-w-md font-mono">
          {!mounted ? (
            <div className="h-12 w-44 bg-slate-900 rounded-lg animate-pulse" />
          ) : (
            <Link
              href={user ? "/dashboard" : "/login"}
              className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 hover:from-cyan-400 hover:to-indigo-600 text-slate-900 font-bold text-xs uppercase tracking-widest transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] group cursor-pointer"
            >
              {user ? "Access Console" : "Launch Project"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-955/60 hover:bg-slate-900 border border-slate-800 text-slate-450 hover:text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
          >
            <Code className="h-4 w-4" />
            Github Source
          </a>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-6 sm:grid-cols-3 w-full mt-16 text-left">
          <div className="cyber-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Terminal className="h-4.5 w-4.5" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">Telemetry SDK</h4>
            <p className="text-[11px] text-slate-450 leading-relaxed font-sans">
              Auto-instruments route execution latency, DB query counts, HTTP response codes, and trace context propagation.
            </p>
          </div>

          <div className="cyber-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">AI Command Engine</h4>
            <p className="text-[11px] text-slate-450 leading-relaxed font-sans">
              Interrogate log indices using natural English queries. LogSense translates questions to secure structured datasets.
            </p>
          </div>

          <div className="cyber-card p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-455">
              <Zap className="h-4.5 w-4.5" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">Clickhouse Speed</h4>
            <p className="text-[11px] text-slate-450 leading-relaxed font-sans">
              Engineered with modern high-speed Clickhouse database collectors, delivering sub-millisecond query returns across millions of events.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-[10px] text-slate-500 font-mono tracking-widest uppercase">
        © {new Date().getFullYear()} TRI-NETRA SYSTEMS. TELEMETRY STACK INGESTION.
      </footer>
    </div>
  );
}
