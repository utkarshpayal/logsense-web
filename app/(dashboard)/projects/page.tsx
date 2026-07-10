"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectApi } from "../../../lib/api";
import { useProjectStore } from "../../../store/project.store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Cpu,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  X,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import ConfirmModal from "../../../components/ConfirmModal";

const projectSchema = z.object({
  name: z
    .string()
    .min(3, "Project name must be at least 3 characters")
    .max(100, "Project name cannot exceed 100 characters")
    .trim(),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function ProjectsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { projects, selectedProjectId, setSelectedProjectId } = useProjectStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
  });

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: projectApi.getProjects,
  });

  const createMutation = useMutation({
    mutationFn: projectApi.createProject,
    onSuccess: (response) => {
      if (response.success && response.data) {
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        setSelectedProjectId(response.data.id);
        toast.success(`Project "${response.data.name}" created!`);
        reset();
        setModalOpen(false);
      } else {
        toast.error(response.message || "Failed to create project");
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create project. Check name uniqueness.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: projectApi.deleteProject,
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
      }
      toast.success("Project deleted successfully");
      setIsDeleting(null);
      setProjectToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete project");
      setIsDeleting(null);
      setProjectToDelete(null);
    },
  });

  const onSubmit = (values: ProjectFormValues) => {
    createMutation.mutate(values);
  };

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setProjectToDelete({ id, name });
  };

  const selectProject = (id: string) => {
    setSelectedProjectId(id);
    toast.success("Scope changed successfully");
    router.push("/dashboard");
  };

  return (
    <div className="space-y-6 relative">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-base font-extrabold text-white tracking-widest uppercase">Workspace Nodes</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
            Register and partition system scopes for your applications.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 text-xs font-extrabold uppercase tracking-widest transition-all shadow-md cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Node
        </button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
        </div>
      ) : projects.length === 0 ? (
        <div className="cyber-panel rounded-2xl border border-slate-800 p-12 text-center max-w-xl mx-auto mt-8 relative overflow-hidden">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 mx-auto mb-5">
            <Cpu className="h-6 w-6 animate-pulse" />
          </div>
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">No nodes registered</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed uppercase tracking-wider">
            A node acts as an isolated project grouping your SDK tokens and Clickhouse event tables.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 text-xs font-extrabold uppercase tracking-widest transition-all mx-auto mt-6 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Initialize First Node
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const isActive = project.id === selectedProjectId;
            return (
              <div
                key={project.id}
                onClick={() => selectProject(project.id)}
                className={cn(
                  "cyber-card p-6 rounded-2xl border flex flex-col justify-between cursor-pointer group relative overflow-hidden",
                  isActive
                    ? "border-cyan-500/40 bg-cyan-950/5 shadow-[0_0_15px_-4px_rgba(6,182,212,0.25)]"
                    : "border-slate-800"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-0 right-0 h-1.5 w-16 bg-gradient-to-r from-cyan-400 to-indigo-600 rounded-bl-lg" />
                )}

                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 group-hover:text-cyan-400 group-hover:border-cyan-500/20 transition-all">
                      <Layers className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/projects/${project.id}`);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-500 hover:text-white transition-colors"
                        title="Configuration details"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, project.id, project.name)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 border border-transparent hover:border-rose-500/25 text-slate-550 hover:text-rose-400 transition-colors"
                        title="Delete Workspace"
                        disabled={isDeleting === project.id}
                      >
                        {isDeleting === project.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate uppercase tracking-widest">
                    {project.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 h-8 min-h-[32px] leading-relaxed font-sans normal-case">
                    {project.description || "No description provided."}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-900 pt-4 mt-6">
                  <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>

                  <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-cyan-400 group-hover:translate-x-1 transition-transform">
                    Scope
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm scale-in">
          <div className="cyber-panel w-full max-w-md rounded-2xl border border-slate-800 p-6 shadow-2xl relative z-50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Register Node</h3>
              <button
                onClick={() => {
                  reset();
                  setModalOpen(false);
                }}
                className="p-1 rounded-lg hover:bg-slate-900 text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed uppercase tracking-wider">
              Define the workspace nodes to begin ingesting telemetry.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                  Node Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Authentitas Service"
                  className="block w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
                  {...register("name")}
                  disabled={createMutation.isPending}
                />
                {errors.name && (
                  <p className="text-[10px] text-rose-500 mt-1 font-bold uppercase tracking-wider">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                  Description <span className="text-slate-550">(Optional)</span>
                </label>
                <textarea
                  placeholder="Workspace description / context..."
                  rows={3}
                  className="block w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all resize-none font-mono"
                  {...register("description")}
                  disabled={createMutation.isPending}
                />
                {errors.description && (
                  <p className="text-[10px] text-rose-500 mt-1 font-bold uppercase tracking-wider">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setModalOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-950 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                  disabled={createMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 text-xs font-extrabold uppercase tracking-widest transition-all shadow-[0_0_15px_-4px_rgba(6,182,212,0.25)] cursor-pointer disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-950" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    "Register"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Deletion Modal */}
      <ConfirmModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={() => {
          if (projectToDelete) {
            setIsDeleting(projectToDelete.id);
            deleteMutation.mutate(projectToDelete.id);
          }
        }}
        title="Delete Node"
        message={`Confirm node deletion for "${projectToDelete?.name}". All keys and telemetry records mapped to this node will be purged.`}
        confirmText="Confirm Delete"
        type="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
