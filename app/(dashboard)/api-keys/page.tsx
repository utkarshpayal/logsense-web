"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiKeyApi } from "../../../lib/api";
import { useProjectStore } from "../../../store/project.store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Key,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Loader2,
  FolderOpen,
  Info,
  BadgeAlert,
  X,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import ConfirmModal from "../../../components/ConfirmModal";

// Form validation schema
const keySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50).trim(),
  environment: z.enum(["development", "staging", "production"], {
    message: "Select environment",
  }),
});

type KeyFormValues = z.infer<typeof keySchema>;

export default function ApiKeysPage() {
  const queryClient = useQueryClient();
  const { selectedProjectId, projects } = useProjectStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [generatedKeyData, setGeneratedKeyData] = useState<{ name: string; key: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [visibleKeyId, setVisibleKeyId] = useState<string | null>(null);
  const [keyToRotate, setKeyToRotate] = useState<{ id: string; name: string } | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<{ id: string; name: string } | null>(null);
  const [sessionKeys, setSessionKeys] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<KeyFormValues>({
    resolver: zodResolver(keySchema),
    defaultValues: {
      environment: "development",
    },
  });

  // Fetch API Keys
  const { data: keysData, isLoading } = useQuery({
    queryKey: ["apiKeys", selectedProjectId],
    queryFn: () => apiKeyApi.getApiKeys(selectedProjectId!),
    enabled: !!selectedProjectId,
  });

  const keys = keysData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (values: KeyFormValues) => apiKeyApi.createApiKey(selectedProjectId!, values),
    onSuccess: (response) => {
      if (response.success && response.data) {
        queryClient.invalidateQueries({ queryKey: ["apiKeys", selectedProjectId] });
        setGeneratedKeyData({ name: response.data.name, key: response.data.key });
        setSessionKeys((prev) => ({ ...prev, [response.data.id]: response.data.key }));
        reset();
        setModalOpen(false);
      } else {
        toast.error(response.message || "Failed to create API key");
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to generate API Key");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: apiKeyApi.deleteApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys", selectedProjectId] });
      toast.success("API Key revoked successfully");
      setKeyToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to revoke API key");
      setKeyToDelete(null);
    },
  });

  const rotateMutation = useMutation({
    mutationFn: apiKeyApi.rotateApiKey,
    onSuccess: (response) => {
      if (response.success && response.data) {
        queryClient.invalidateQueries({ queryKey: ["apiKeys", selectedProjectId] });
        setGeneratedKeyData({ name: response.data.name, key: response.data.key });
        setSessionKeys((prev) => ({ ...prev, [response.data.id]: response.data.key }));
        toast.success("API Key rotated successfully!");
      }
      setKeyToRotate(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to rotate API Key");
      setKeyToRotate(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiKeyApi.updateApiKeyStatus(id, isActive),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ["apiKeys", selectedProjectId] });
        toast.success(`API Key ${response.data.is_active ? "enabled" : "disabled"} successfully`);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update API key status");
    },
  });

  const onSubmit = (values: KeyFormValues) => {
    createMutation.mutate(values);
  };

  const handleCopy = (text: string | undefined | null) => {
    if (!text) {
      toast.error("For security, the full API key can only be copied when first generated or rotated. Please rotate it if lost.");
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    toast.success("API Key copied to clipboard!");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleStatusToggle = (id: string, currentStatus: boolean) => {
    statusMutation.mutate({ id, isActive: !currentStatus });
  };

  const handleRotate = (id: string, name: string) => {
    setKeyToRotate({ id, name });
  };

  const handleDelete = (id: string, name: string) => {
    setKeyToDelete({ id, name });
  };

  // Guard: No projects exist in store
  if (projects.length === 0) {
    return (
      <div className="cyber-panel rounded-2xl border border-slate-800 p-12 text-center max-w-xl mx-auto mt-8 font-mono">
        <FolderOpen className="h-10 w-10 text-slate-550 mx-auto mb-4" />
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">No active projects</h3>
        <p className="text-xs text-slate-500 mt-2 uppercase tracking-wider">
          You must create a project workspace before you can generate API Keys.
        </p>
      </div>
    );
  }

  // Guard: Projects exist, but none is selected
  if (!selectedProjectId) {
    return (
      <div className="cyber-panel rounded-2xl border border-slate-800 p-12 text-center max-w-xl mx-auto mt-8 font-mono">
        <Info className="h-10 w-10 text-cyan-400 mx-auto mb-4" />
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Select a project</h3>
        <p className="text-xs text-slate-500 mt-2 uppercase tracking-wider">
          Please select a project from the top navbar project switcher to view and manage its API keys.
        </p>
      </div>
    );
  }

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6 font-mono relative">
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 blur-[80px] pointer-events-none" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-base font-extrabold text-white tracking-widest uppercase">API Credentials</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
            Access keys for scoping logs ingested from your SDKs into{" "}
            <span className="font-semibold text-slate-200">{activeProject?.name}</span>.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 hover:from-cyan-400 hover:to-indigo-600 text-slate-900 text-xs font-bold uppercase tracking-widest transition-all shadow-md cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Generate Key
        </button>
      </div>

      {/* Keys List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : keys.length === 0 ? (
        <div className="cyber-panel rounded-2xl border border-slate-800 p-12 text-center max-w-md mx-auto relative overflow-hidden">
          <Key className="h-10 w-10 text-slate-655 mx-auto mb-4" />
          <h4 className="text-xs font-bold text-white uppercase tracking-widest">No keys generated</h4>
          <p className="text-xs text-slate-550 mt-2 uppercase tracking-wider leading-relaxed">
            Generate an API key for your SDK to authenticate and ingest logs securely.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-6 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-805 hover:border-cyan-500/30 text-cyan-455 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
          >
            Generate First Key
          </button>
        </div>
      ) : (
        <div className="cyber-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-slate-900 bg-slate-955/40 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Environment</th>
                  <th className="px-6 py-4">Key Status</th>
                  <th className="px-6 py-4">Secret Value</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 bg-transparent text-slate-350">
                {keys.map((key) => {
                  const isVisible = visibleKeyId === key.id;
                  return (
                    <tr key={key.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-200 uppercase tracking-wide">{key.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-extrabold border capitalize tracking-widest",
                            key.environment === "production"
                              ? "bg-rose-500/5 text-rose-455 border-rose-500/15"
                              : key.environment === "staging"
                              ? "bg-amber-500/5 text-amber-400 border-amber-500/15"
                              : "bg-cyan-500/5 text-cyan-400 border-cyan-500/15"
                          )}
                        >
                          {key.environment}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleStatusToggle(key.id, key.is_active)}
                            disabled={statusMutation.isPending}
                            className={cn(
                              "relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                              key.is_active ? "bg-cyan-500" : "bg-slate-900 border-slate-800"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-slate-955 shadow ring-0 transition duration-200 ease-in-out mt-[2px]",
                                key.is_active ? "translate-x-3.5" : "translate-x-0.5"
                              )}
                            />
                          </button>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {key.is_active ? "ACTIVE" : "DISABLED"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-bold select-all bg-slate-950 px-2 py-1.5 border border-slate-900 rounded-lg">
                            {isVisible
                              ? (sessionKeys[key.id] || `${key.prefix}••••••••••••••••••••`)
                              : "••••••••••••••••••••••••••••••••"}
                          </span>
                          <button
                            onClick={() => setVisibleKeyId(isVisible ? null : key.id)}
                            className="p-1.5 hover:bg-slate-950 border border-transparent hover:border-slate-850 rounded-lg text-slate-500 hover:text-white transition-colors"
                          >
                            {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopy(sessionKeys[key.id])}
                            className="p-1.5 hover:bg-slate-955 border border-transparent hover:border-slate-855 rounded-lg text-slate-500 hover:text-white transition-colors"
                            title="Copy API Key"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(key.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRotate(key.id, key.name)}
                            className="p-1.5 rounded-lg hover:bg-slate-950 border border-transparent hover:border-slate-850 text-slate-500 hover:text-white transition-colors"
                            title="Rotate Key"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(key.id, key.name)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 border border-transparent hover:border-rose-500/25 text-slate-550 hover:text-rose-455 transition-colors"
                            title="Revoke Key"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate API Key Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm scale-in">
          <div className="cyber-panel w-full max-w-md rounded-2xl border border-slate-800 p-6 shadow-2xl relative z-50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Generate Credential</h3>
              <button
                onClick={() => {
                  reset();
                  setModalOpen(false);
                }}
                className="p-1 rounded-lg hover:bg-slate-905 text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed uppercase tracking-wider">
              Generate a unique access key token to start instrumenting log feeds.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                  Key Name / Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g. Production Ingestion"
                  className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-800 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
                  {...register("name")}
                  disabled={createMutation.isPending}
                />
                {errors.name && (
                  <p className="text-[10px] text-rose-500 mt-1 font-bold uppercase tracking-wider">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                  Environment Scope
                </label>
                <select
                  className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-350 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono cursor-pointer"
                  {...register("environment")}
                  disabled={createMutation.isPending}
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
                {errors.environment && (
                  <p className="text-[10px] text-rose-500 mt-1 font-bold uppercase tracking-wider">{errors.environment.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setModalOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-850 hover:bg-slate-950 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                  disabled={createMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/30 text-cyan-455 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    "Generate Key"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ephemeral Generated Key Display */}
      {generatedKeyData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md scale-in">
          <div className="cyber-panel w-full max-w-lg rounded-2xl border border-cyan-500/25 p-6 shadow-2xl relative z-50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                SECRET CREDENTIAL DISPLAY
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed uppercase tracking-wider">
              Copy this token key immediately. It is stored using high-grade hashes and cannot be retrieved again.
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-rose-500/5 border border-rose-500/15 rounded-xl flex items-start gap-3">
                <BadgeAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-[10px] text-slate-450 leading-relaxed uppercase tracking-wider font-sans">
                  <span className="font-bold text-slate-200 block mb-0.5">WARNING: ONE-TIME SECURITY EPHEMERAL SHIELD</span>
                  Closing this modal terminates display. Store this key in a secure vault like AWS Secrets or 1Password.
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Key Name
                </label>
                <div className="text-slate-200 text-xs font-bold bg-slate-955 px-3.5 py-2.5 border border-slate-900 rounded-xl">
                  {generatedKeyData.name}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Key Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedKeyData.key}
                    className="block w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-cyan-400 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopy(generatedKeyData.key)}
                    className="px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-cyan-500/30 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-450" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-900 mt-2">
                <button
                  onClick={() => setGeneratedKeyData(null)}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
                >
                  I've Copied the Secret Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Revocation Modal */}
      <ConfirmModal
        isOpen={!!keyToDelete}
        onClose={() => setKeyToDelete(null)}
        onConfirm={() => {
          if (keyToDelete) {
            deleteMutation.mutate(keyToDelete.id);
          }
        }}
        title="Revoke API Key"
        message={`Confirm revocation of API Key "${keyToDelete?.name}". Any middleware or scripts authenticating via this token will instantly raise 401 Unauthorized errors.`}
        confirmText="Confirm Revoke"
        type="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Confirm Rotation Modal */}
      <ConfirmModal
        isOpen={!!keyToRotate}
        onClose={() => setKeyToRotate(null)}
        onConfirm={() => {
          if (keyToRotate) {
            rotateMutation.mutate(keyToRotate.id);
          }
        }}
        title="Rotate API Key"
        message={`Confirm rotation of API Key "${keyToRotate?.name}". The old token will be immediately deactivated and a brand-new credentials key will be generated.`}
        confirmText="Confirm Rotate"
        type="warning"
        isLoading={rotateMutation.isPending}
      />
    </div>
  );
}
