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

  const handleCopy = (text: string) => {
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
      <div className="glass-panel rounded-xl border border-zinc-800 p-12 text-center max-w-xl mx-auto mt-8">
        <FolderOpen className="h-10 w-10 text-zinc-550 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-zinc-200">No active projects</h3>
        <p className="text-sm text-zinc-400 mt-2">
          You must create a project workspace before you can generate API Keys.
        </p>
      </div>
    );
  }

  // Guard: Projects exist, but none is selected
  if (!selectedProjectId) {
    return (
      <div className="glass-panel rounded-xl border border-zinc-800 p-12 text-center max-w-xl mx-auto mt-8">
        <Info className="h-10 w-10 text-indigo-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-zinc-200">Select a project</h3>
        <p className="text-sm text-zinc-400 mt-2">
          Please select a project from the top navbar project switcher to view and manage its API keys.
        </p>
      </div>
    );
  }

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight sm:text-2xl">API Keys</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Access keys for scoping logs ingested from your SDKs into{" "}
            <span className="font-semibold text-zinc-200">{activeProject?.name}</span>.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white text-sm font-semibold transition-all shadow-md"
        >
          <Plus className="h-4 w-4" />
          Generate Key
        </button>
      </div>

      {/* Keys List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : keys.length === 0 ? (
        <div className="glass-panel rounded-xl border border-zinc-850 p-12 text-center max-w-md mx-auto">
          <Key className="h-10 w-10 text-zinc-550 mx-auto mb-4" />
          <h4 className="text-base font-semibold text-zinc-300">No keys generated</h4>
          <p className="text-xs text-zinc-450 mt-2">
            Generate an API key for your SDK to authenticate and ingest logs securely.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-6 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            Generate First Key
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/30 text-xs font-semibold text-zinc-450 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Environment</th>
                  <th className="px-6 py-4">Key Status</th>
                  <th className="px-6 py-4">Secret Value</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 bg-transparent text-zinc-350">
                {keys.map((key) => {
                  const isVisible = visibleKeyId === key.id;
                  return (
                    <tr key={key.id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="px-6 py-4 font-medium text-zinc-200">{key.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border capitalize",
                            key.environment === "production"
                              ? "bg-red-500/5 text-red-400 border-red-500/15"
                              : key.environment === "staging"
                              ? "bg-yellow-500/5 text-yellow-400 border-yellow-500/15"
                              : "bg-indigo-500/5 text-indigo-400 border-indigo-500/15"
                          )}
                        >
                          {key.environment}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleStatusToggle(key.id, key.is_active)}
                          className={cn(
                            "flex items-center gap-1.5 text-xs font-semibold focus:outline-none transition-colors",
                            key.is_active ? "text-green-400 hover:text-green-300" : "text-zinc-500 hover:text-zinc-400"
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", key.is_active ? "bg-green-400" : "bg-zinc-650")} />
                          {key.is_active ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">
                            {isVisible ? key.key : `ls_live_${"•".repeat(24)}`}
                          </span>
                          <button
                            onClick={() => setVisibleKeyId(isVisible ? null : key.id)}
                            className="p-1 rounded text-zinc-500 hover:text-zinc-350 hover:bg-zinc-800"
                          >
                            {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopy(key.key)}
                            className="p-1 rounded text-zinc-500 hover:text-zinc-350 hover:bg-zinc-800"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">
                        {new Date(key.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRotate(key.id, key.name)}
                            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-indigo-400 transition-colors"
                            title="Rotate API Key"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(key.id, key.name)}
                            className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                            title="Revoke API Key"
                          >
                            <Trash2 className="h-4 w-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-xl border border-zinc-800 p-6 shadow-2xl animate-fade-in relative z-50">
            <h3 className="text-lg font-bold text-white mb-2">Generate API Key</h3>
            <p className="text-xs text-zinc-450 mb-6">
              Give your API key a descriptive name and scope it to an environment.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Server SDK production"
                  className="block w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  {...register("name")}
                  disabled={createMutation.isPending}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Environment Scope
                </label>
                <select
                  className="block w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                  {...register("environment")}
                  disabled={createMutation.isPending}
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
                {errors.environment && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">
                    {errors.environment.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white text-xs font-semibold transition-colors"
                  disabled={createMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors shadow-lg"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Plain Key Modal (Shown immediately after creation/rotation) */}
      {generatedKeyData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-xl border border-zinc-800 p-6 shadow-2xl animate-fade-in relative z-50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-550/20">
                <BadgeAlert className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Copy API Key Secrets</h3>
            </div>
            <p className="text-xs text-zinc-450 leading-relaxed">
              Copy this API Key secret now. For security purposes, this value is only displayed in plain-text once. It will be hidden permanently afterwards.
            </p>

            <div className="flex items-center gap-2 p-3 bg-zinc-950 border border-zinc-850 rounded-lg font-mono text-xs text-yellow-400/90 overflow-hidden">
              <span className="truncate flex-1 select-all">{generatedKeyData.key}</span>
              <button
                onClick={() => handleCopy(generatedKeyData.key)}
                className="p-1.5 rounded hover:bg-zinc-900 text-zinc-450 hover:text-white transition-colors"
                title="Copy API Key"
              >
                {copiedKey ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setGeneratedKeyData(null)}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Deletion (Revoke) Modal */}
      <ConfirmModal
        isOpen={!!keyToDelete}
        onClose={() => setKeyToDelete(null)}
        onConfirm={() => {
          if (keyToDelete) {
            deleteMutation.mutate(keyToDelete.id);
          }
        }}
        title="Revoke API Key"
        message={`Are you sure you want to delete "${keyToDelete?.name}"? All logging endpoints using this key will be rejected immediately.`}
        confirmText="Revoke Key"
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
        message={`Are you sure you want to rotate "${keyToRotate?.name}"? The existing key will stop working immediately, breaking any client application using it.`}
        confirmText="Rotate Key"
        type="warning"
        isLoading={rotateMutation.isPending}
      />
    </div>
  );
}
