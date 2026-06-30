import { create } from "zustand";

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;
  setProjects: (projects: Project[]) => void;
  setSelectedProjectId: (id: string | null) => void;
  initialize: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  selectedProjectId: null,
  setProjects: (projects) => {
    set((state) => {
      let nextSelectedId = state.selectedProjectId;
      if (projects.length > 0) {
        const exists = projects.some((p) => p.id === nextSelectedId);
        if (!exists) {
          nextSelectedId = projects[0].id;
          if (typeof window !== "undefined") {
            localStorage.setItem("selectedProjectId", nextSelectedId);
          }
        }
      } else {
        nextSelectedId = null;
        if (typeof window !== "undefined") {
          localStorage.removeItem("selectedProjectId");
        }
      }
      return { projects, selectedProjectId: nextSelectedId };
    });
  },
  setSelectedProjectId: (id) => {
    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem("selectedProjectId", id);
      } else {
        localStorage.removeItem("selectedProjectId");
      }
    }
    set({ selectedProjectId: id });
  },
  initialize: () => {
    if (typeof window !== "undefined") {
      const savedId = localStorage.getItem("selectedProjectId");
      set({ selectedProjectId: savedId });
    }
  }
}));
