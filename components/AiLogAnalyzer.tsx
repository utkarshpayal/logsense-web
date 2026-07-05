import React, { useState } from 'react';
import { aiApi } from '../lib/api';
import { Sparkles, Loader2, RotateCcw } from 'lucide-react';
import { cn } from '../utils/cn';
import ReactMarkdown from 'react-markdown';

interface AiLogAnalyzerProps {
  log: any;
  projectId: string;
}

export function AiLogAnalyzer({ log, projectId }: AiLogAnalyzerProps) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeLog = async () => {
    setLoading(true);
    setError(null);
    try {
      const prompt = `Analyze this log event and explain what happened, and potential steps to resolve if it's an error.
      Message: ${log.message}
      Level: ${log.level}
      Service: ${log.service}
      Metadata: ${JSON.stringify(log.metadata)}
      Be concise and technical. Use markdown for formatting.`;

      const res = await aiApi.chat(projectId, prompt);
      if (res.success && (res.answer || res.explanation)) {
        setExplanation(res.answer || res.explanation || '');
      } else {
        setError(res.message || 'Analysis failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Result view ── */
  if (explanation) {
    return (
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.05] overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-violet-500/15">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-[11px] font-semibold text-violet-300 tracking-wide">AI Insight</span>
          </div>
          <button
            onClick={() => { setExplanation(null); setError(null); }}
            className="flex items-center gap-1 text-[10px] text-violet-400/60 hover:text-violet-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Re-analyze
          </button>
        </div>
        {/* Content */}
        <div className="px-3 py-2.5 text-[12px] text-zinc-300 leading-relaxed prose prose-invert prose-p:my-1 prose-pre:my-1 prose-pre:text-[11px] prose-headings:text-[12px] prose-li:my-0 max-w-none">
          <ReactMarkdown>{explanation}</ReactMarkdown>
        </div>
      </div>
    );
  }

  /* ── Trigger view ── */
  return (
    <div className="space-y-2">
      <button
        onClick={analyzeLog}
        disabled={loading}
        className={cn(
          "group w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-medium transition-all duration-200 border cursor-pointer",
          loading
            ? "bg-zinc-900/60 text-zinc-500 border-zinc-800 cursor-not-allowed"
            : "bg-violet-600/10 hover:bg-violet-600/20 text-violet-300 border-violet-500/25 hover:border-violet-500/40 hover:text-violet-200"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
            <span>Analyzing…</span>
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
            <span>Analyze with AI</span>
          </>
        )}
      </button>

      {error && (
        <p className="text-[11px] text-rose-400/80 px-1">{error}</p>
      )}
    </div>
  );
}
