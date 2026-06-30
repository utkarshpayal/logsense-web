"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "../hooks/use-auth";
import { Activity, ArrowRight, Bot, Code, Terminal, Sparkles } from "lucide-react";

export default function Home() {
  const { user } = useAuth(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col justify-between overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-900/10 blur-[120px] animate-pulse-glow" style={{ animationDelay: "-4s" }} />

      {/* Navbar */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-6 backdrop-blur-md max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-650 shadow-lg shadow-indigo-650/30">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-white flex items-center gap-1.5">
            LogSense
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/20">
              v1.0
            </span>
          </span>
        </div>

        <div>
          {!mounted ? (
            <div className="h-8 w-20 bg-zinc-900 rounded-lg animate-pulse" />
          ) : user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-all"
            >
              Sign In
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 flex flex-col justify-center items-center py-20 text-center gap-8 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/50 border border-indigo-500/20 text-indigo-400 text-xs font-semibold animate-fade-in">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Observability Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-3xl">
          Drop-in Logging SDK with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Natural Language</span> Queries
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed">
          LogSense lets you ingest structured logs using drop-in Node.js/Python SDK middlewares, then interrogate your system metrics using conversational AI chatbot prompts.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full justify-center max-w-md">
          {!mounted ? (
            <div className="h-12 w-44 bg-zinc-900 rounded-lg animate-pulse" />
          ) : (
            <Link
              href={user ? "/dashboard" : "/login"}
              className="flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-indigo-650 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-650/20 hover:scale-[1.01] active:scale-[0.99] group"
            >
              {user ? "Go to Dashboard" : "Start Monitoring Free"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
          <a
            href="https://github.com"
            target="_blank"
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-semibold text-sm transition-colors"
          >
            <Code className="h-4 w-4" />
            View SDK Source
          </a>
        </div>

        {/* Feature Highlights */}
        <div className="grid gap-6 sm:grid-cols-3 w-full mt-16 text-left">
          <div className="glass-card p-5 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-indigo-400">
              <Terminal className="h-4.5 w-4.5" />
            </div>
            <h4 className="text-sm font-bold text-white">SDK Middlewares</h4>
            <p className="text-xs text-zinc-450 leading-relaxed">
              Auto-instruments latency, status codes, query strings, and stack trace frames.
            </p>
          </div>

          <div className="glass-card p-5 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-purple-400">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <h4 className="text-sm font-bold text-white">AI Observability Chat</h4>
            <p className="text-xs text-zinc-450 leading-relaxed">
              Query Clickhouse aggregates directly using conversational natural language inputs.
            </p>
          </div>

          <div className="glass-card p-5 rounded-xl border border-zinc-800 space-y-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-green-400">
              <Activity className="h-4.5 w-4.5" />
            </div>
            <h4 className="text-sm font-bold text-white">Time-Series Trends</h4>
            <p className="text-xs text-zinc-450 leading-relaxed">
              Beautiful interactive charts displaying rates, latencies, and service distributions.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-550 z-10">
        © {new Date().getFullYear()} LogSense Observability Inc. All rights reserved.
      </footer>
    </div>
  );
}
