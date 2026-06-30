"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectApi } from "../../../lib/api";
import { useProjectStore, Project } from "../../../store/project.store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  FolderGit2,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Calendar,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import ConfirmModal from "../../../components/ConfirmModal";

// Form validation schema
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

  // Query projects again for freshness
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: projectApi.getProjects,
  });

  const createMutation = useMutation({
    mutationFn: projectApi.createProject,
    onSuccess: (response) => {
      if (response.success && response.data) {
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        // Select the newly created project
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
      // If we deleted the active project, deselect it
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
    toast.success("Active project scope switched");
    router.push("/dashboard");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight sm:text-2xl">Workspaces</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Create and manage application projects to scope your observability logs.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/10 hover:scale-[1.01] active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" />
          Create Project
        </button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel rounded-xl border border-zinc-800 p-12 text-center max-w-xl mx-auto mt-8 glow-indigo">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-450 mx-auto mb-5">
            <FolderGit2 className="h-6 w-6 text-zinc-450" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-200">No projects found</h3>
          <p className="text-sm text-zinc-400 mt-2 max-w-sm mx-auto">
            Get started by creating your first project. A project groups your API keys, environments, and logs.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all mx-auto mt-6"
          >
            <Plus className="h-4 w-4" />
            Create First Project
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
                  "glass-card p-6 rounded-xl border flex flex-col justify-between cursor-pointer group relative overflow-hidden",
                  isActive
                    ? "border-indigo-500 bg-indigo-900/5 shadow-md shadow-indigo-950/20"
                    : "border-zinc-800"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-0 right-0 h-2 w-16 bg-indigo-500 rounded-bl-lg" />
                )}

                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/projects/${project.id}`);
                        }}
                        className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white"
                        title="Project Details"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, project.id, project.name)}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-450 hover:text-red-400"
                        title="Delete Project"
                        disabled={isDeleting === project.id}
                      >
                        {isDeleting === project.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <h4 className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors truncate">
                    {project.name}
                  </h4>
                  <p className="text-xs text-zinc-450 mt-1.5 line-clamp-2 h-8 min-h-[32px]">
                    {project.description || "No description provided."}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-850 pt-4 mt-6">
                  <span className="flex items-center gap-1.5 text-[11px] text-zinc-550">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>

                  <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                    Enter Workspace
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-xl border border-zinc-800 p-6 shadow-2xl animate-fade-in relative z-50">
            <h3 className="text-lg font-bold text-white mb-2">Create New Project</h3>
            <p className="text-xs text-zinc-450 mb-6">
              Name your project workspace. This name must be unique.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. My E-commerce API"
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
                  Description <span className="text-zinc-650">(Optional)</span>
                </label>
                <textarea
                  placeholder="Summarize this app's purpose..."
                  rows={3}
                  className="block w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                  {...register("description")}
                  disabled={createMutation.isPending}
                />
                {errors.description && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">
                    {errors.description.message}
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
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
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
        title="Delete Project"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? This deletes all associated API keys and logs permanently.`}
        confirmText="Delete Project"
        type="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
