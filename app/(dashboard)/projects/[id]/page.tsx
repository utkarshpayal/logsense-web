"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectApi } from "../../../../lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Loader2,
  Terminal,
  Settings,
  Code,
  Copy,
  Check,
  Cpu,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { cn } from "../../../../utils/cn";

const updateProjectSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100).trim(),
  description: z.string().max(500).optional(),
  discord_webhook_url: z.string().url("Must be a valid URL").or(z.literal("")).nullable().optional(),
});

type UpdateFormValues = z.infer<typeof updateProjectSchema>;

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState<"integration" | "settings">("integration");
  const [sdkLang, setSdkLang] = useState<"node" | "python" | "curl">("node");
  const [copiedText, setCopiedText] = useState(false);

  const { data: projectResponse, isLoading, error } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectApi.getProject(projectId),
    enabled: !!projectId,
  });

  const project = projectResponse?.data;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateFormValues>({
    resolver: zodResolver(updateProjectSchema),
    values: project ? {
      name: project.name,
      description: project.description || "",
      discord_webhook_url: project.discord_webhook_url || "",
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (values: UpdateFormValues) => projectApi.updateProject(projectId, values),
    onSuccess: (response) => {
      if (response.success && response.data) {
        queryClient.invalidateQueries({ queryKey: ["project", projectId] });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        toast.success("Workspace details updated successfully!");
        reset(undefined, { keepValues: true });
      } else {
        toast.error(response.message || "Failed to update project");
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to save details. Name might be taken.");
    },
  });

  const onSubmit = (values: UpdateFormValues) => {
    const payload = {
      ...values,
      discord_webhook_url: values.discord_webhook_url === "" ? null : values.discord_webhook_url,
    };
    updateMutation.mutate(payload);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedText(true);
    toast.success("Code snippet copied to clipboard!");
    setTimeout(() => setCopiedText(false), 2000);
  };

  const getNodeCode = () => {
    return `// 1. Install SDK
npm install logsense-node-sdk

// 2. Initialize in your Express / Node application
const express = require('express');
const logsense = require('logsense-node-sdk');

const app = express();

// Enable LogSense auto-instrumentation middleware
app.use(logsense.middleware({
  apiKey: "YOUR_API_KEY", // Get from API Keys page
  environment: "production",
  service: "${project?.name.toLowerCase().replace(/\s+/g, "-") || "api-service"}"
}));

app.get('/api/users', (req, res) => {
  res.json([{ id: 1, name: 'Alice' }]);
});

app.listen(3050);`;
  };

  const getPythonCode = () => {
    return `# 1. Install SDK
pip install logsense-python-sdk

# 2. Integrate in your FastAPI application
from fastapi import FastAPI
from logsense.fastapi import LogSenseMiddleware

app = FastAPI()

app.add_middleware(
    LogSenseMiddleware,
    api_key="YOUR_API_KEY", # Get from API Keys page
    environment="production",
    service_name="${project?.name.toLowerCase().replace(/\s+/g, "-") || "api-service"}"
)

@app.get("/api/users")
def get_users():
    return [{"id": 1, "name": "Alice"}]`;
  };

  const getCurlCode = () => {
    return `# Direct HTTP Log Ingestion API
curl -X POST "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/logs" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "level": "error",
    "message": "Database connection failure to replication cluster",
    "service": "${project?.name.toLowerCase().replace(/\s+/g, "-") || "api-service"}",
    "environment": "production",
    "traceId": "trc_f9328a",
    "metadata": {
      "host": "db-srv-01",
      "db_engine": "postgresql",
      "error_code": "ECONNREFUSED"
    }
  }'`;
  };

  const getCodeSnippet = () => {
    if (sdkLang === "node") return getNodeCode();
    if (sdkLang === "python") return getPythonCode();
    return getCurlCode();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="cyber-panel p-8 text-center rounded-2xl border border-slate-800 max-w-xl mx-auto font-mono">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Workspace Not Found</h3>
        <p className="text-slate-500 text-[10px] mt-2 uppercase tracking-wider">
          The node index requested does not exist or you lack read privileges.
        </p>
        <button
          onClick={() => router.push("/projects")}
          className="mt-6 px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-cyan-500/30 text-cyan-455 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
        >
          Back to Workspaces
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Breadcrumb back */}
      <button
        onClick={() => router.push("/projects")}
        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Node List
      </button>

      {/* Workspace Header Summary */}
      <div className="flex items-center gap-4 py-4 border-b border-slate-900">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/5 border border-cyan-500/25 text-cyan-450">
          <Cpu className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xs font-extrabold text-white tracking-widest uppercase">{project.name}</h2>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">UUID // {project.id}</p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-900">
        <button
          onClick={() => setActiveTab("integration")}
          className={cn(
            "flex items-center gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 cursor-pointer",
            activeTab === "integration"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          )}
        >
          <Code className="h-4.5 w-4.5" />
          Integration
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={cn(
            "flex items-center gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 cursor-pointer",
            activeTab === "settings"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          )}
        >
          <Settings className="h-4.5 w-4.5" />
          Settings
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "integration" ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-widest">
              <BookOpen className="h-4.5 w-4.5 text-cyan-400" />
              SDK AUTO-INSTRUMENTATION SETUP
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed max-w-2xl font-sans normal-case">
              Integrate LogSense into your service container. The SDK will automatically trace execution times, query latency thresholds, and HTTP statuses, broadcasting telemetry asynchronously.
            </p>
          </div>

          {/* Sub-selector tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-955 border border-slate-800 rounded-xl w-fit">
            {[
              { id: "node", label: "NODEJS SDK" },
              { id: "python", label: "FASTAPI SDK" },
              { id: "curl", label: "CURL API" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSdkLang(tab.id as any)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer",
                  sdkLang === tab.id
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-500 hover:text-slate-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Code displays */}
          <div className="relative rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden group">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-900 bg-slate-950/40 text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-slate-655" />
                {sdkLang === "node" && "package.json // app.js"}
                {sdkLang === "python" && "main.py"}
                {sdkLang === "curl" && "ingest.sh"}
              </span>
              <button
                onClick={() => handleCopy(getCodeSnippet())}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {copiedText ? <Check className="h-3.5 w-3.5 text-emerald-450" /> : <Copy className="h-3.5 w-3.5" />}
                Copy Code
              </button>
            </div>
            <pre className="p-5 overflow-x-auto font-mono text-[10px] text-slate-200 leading-relaxed whitespace-pre select-text">
              <code>{getCodeSnippet()}</code>
            </pre>
          </div>
        </div>
      ) : (
        <div className="max-w-xl space-y-6">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Update Node Properties</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">
              Modify display metadata and logging attributes for this node.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-[10px]">
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-400 uppercase tracking-widest">
                Node Name
              </label>
              <input
                type="text"
                className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
                {...register("name")}
                disabled={updateMutation.isPending}
              />
              {errors.name && (
                <p className="text-[10px] text-rose-500 mt-1 font-bold uppercase tracking-wider">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                Description
              </label>
              <textarea
                rows={4}
                className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all resize-none font-mono"
                {...register("description")}
                disabled={updateMutation.isPending}
              />
              {errors.description && (
                <p className="text-[10px] text-rose-500 mt-1 font-bold uppercase tracking-wider">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                Discord Webhook URL
              </label>
              <input
                type="text"
                placeholder="https://discord.com/api/webhooks/..."
                className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
                {...register("discord_webhook_url")}
                disabled={updateMutation.isPending}
              />
              {errors.discord_webhook_url && (
                <p className="text-[10px] text-rose-500 mt-1 font-bold uppercase tracking-wider">{errors.discord_webhook_url.message}</p>
              )}
            </div>

            <div className="flex justify-start">
              <button
                type="submit"
                disabled={!isDirty || updateMutation.isPending}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-cyan-500/50 disabled:to-blue-500/50 disabled:text-slate-400 text-slate-955 text-xs font-extrabold uppercase tracking-widest transition-all shadow-[0_0_15px_-4px_rgba(6,182,212,0.25)] active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
              >
                {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
