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
  Folder,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { cn } from "../../../../utils/cn";

// Form validation schema for project updates
const updateProjectSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100).trim(),
  description: z.string().max(500).optional(),
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

  // Fetch project details
  const { data: projectResponse, isLoading, error } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectApi.getProject(projectId),
    enabled: !!projectId,
  });

  const project = projectResponse?.data;

  // Form for updates
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateFormValues>({
    resolver: zodResolver(updateProjectSchema),
    values: project ? { name: project.name, description: project.description || "" } : undefined,
  });

  // Mutator for updating project details
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
    updateMutation.mutate(values);
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

app.listen(3000);`;
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
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="glass-panel p-8 text-center rounded-xl border border-zinc-800">
        <h3 className="text-lg font-bold text-white">Workspace not found</h3>
        <p className="text-zinc-400 text-sm mt-2">
          The project workspace you are trying to view does not exist or you lack permission.
        </p>
        <button
          onClick={() => router.push("/projects")}
          className="mt-4 px-4 py-2 bg-indigo-650 hover:bg-indigo-600 rounded-lg text-white font-semibold text-xs"
        >
          Back to Workspaces
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb back */}
      <button
        onClick={() => router.push("/projects")}
        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-550 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Workspaces
      </button>

      {/* Workspace Header Summary */}
      <div className="flex items-center gap-4 bg-zinc-900/30 p-6 rounded-xl border border-zinc-850">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/25 text-indigo-400">
          <Folder className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{project.name}</h2>
          <p className="text-xs text-zinc-450 mt-1">UUID: {project.id}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-850">
        <button
          onClick={() => setActiveTab("integration")}
          className={cn(
            "flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all border-b-2",
            activeTab === "integration"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-zinc-450 hover:text-zinc-300"
          )}
        >
          <Code className="h-4.5 w-4.5" />
          SDK Integration Guide
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={cn(
            "flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all border-b-2",
            activeTab === "settings"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-zinc-450 hover:text-zinc-300"
          )}
        >
          <Settings className="h-4.5 w-4.5" />
          Workspace Settings
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "integration" ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="h-4.5 w-4.5 text-indigo-400" />
              Auto-Instrumentation SDK Setup
            </h3>
            <p className="text-xs text-zinc-450 leading-relaxed max-w-2xl">
              Integrate LogSense into your backend service. It will automatically capture all incoming requests, response statuses, query latencies, and errors, sending them asynchronously to our secure collectors.
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-lg w-fit">
            <button
              onClick={() => setSdkLang("node")}
              className={cn(
                "px-3.5 py-1.5 rounded text-xs font-semibold transition-colors",
                sdkLang === "node"
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-450 hover:text-zinc-200"
              )}
            >
              Node.js / Express
            </button>
            <button
              onClick={() => setSdkLang("python")}
              className={cn(
                "px-3.5 py-1.5 rounded text-xs font-semibold transition-colors",
                sdkLang === "python"
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-450 hover:text-zinc-200"
              )}
            >
              Python / FastAPI
            </button>
            <button
              onClick={() => setSdkLang("curl")}
              className={cn(
                "px-3.5 py-1.5 rounded text-xs font-semibold transition-colors",
                sdkLang === "curl"
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-450 hover:text-zinc-200"
              )}
            >
              cURL / Raw API
            </button>
          </div>

          {/* Code display block */}
          <div className="relative rounded-xl border border-zinc-800 bg-zinc-950/70 overflow-hidden group">
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-850 bg-zinc-900/40 text-xs text-zinc-450">
              <span className="flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-zinc-500" />
                {sdkLang === "node" && "app.js"}
                {sdkLang === "python" && "main.py"}
                {sdkLang === "curl" && "ingest.sh"}
              </span>
              <button
                onClick={() => handleCopy(getCodeSnippet())}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
              >
                {copiedText ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                Copy
              </button>
            </div>
            <pre className="p-5 overflow-x-auto font-mono text-xs text-zinc-350 leading-relaxed">
              <code>{getCodeSnippet()}</code>
            </pre>
          </div>
        </div>
      ) : (
        <div className="max-w-xl space-y-6">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-base font-bold text-white">Modify Details</h3>
            <p className="text-xs text-zinc-450">
              Change the friendly name and description of this project workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Project Name
              </label>
              <input
                type="text"
                className="block w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                {...register("name")}
                disabled={updateMutation.isPending}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                rows={4}
                className="block w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                {...register("description")}
                disabled={updateMutation.isPending}
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.description.message}</p>
              )}
            </div>

            <div className="flex justify-start">
              <button
                type="submit"
                disabled={!isDirty || updateMutation.isPending}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-650 hover:bg-indigo-600 disabled:bg-zinc-850 text-white disabled:text-zinc-500 text-xs font-semibold transition-all shadow-md"
              >
                {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
