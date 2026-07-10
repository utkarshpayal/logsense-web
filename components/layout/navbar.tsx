"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useProjectStore } from "../../store/project.store";
import {
  Menu,
  ChevronDown,
  Folder,
  Plus,
  Check,
  ChevronRight,
  Bot,
} from "lucide-react";
import { cn } from "../../utils/cn";

interface NavbarProps {
  onMenuClick?: () => void;
  onChatClick?: () => void;
}

export default function Navbar({ onMenuClick, onChatClick }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { projects, selectedProjectId, setSelectedProjectId } = useProjectStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Overview";
    if (pathname.startsWith("/logs")) return "Logs Explorer";
    if (pathname.startsWith("/api-keys")) return "API Keys";
    if (pathname.startsWith("/projects/")) {
      const projId = pathname.split("/").pop();
      const proj = projects.find((p) => p.id === projId);
      return proj ? `Project: ${proj.name}` : "Project Details";
    }
    if (pathname === "/projects") return "Projects";
    if (pathname === "/settings") return "Settings";
    return "LogSense";
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-900 bg-slate-950/80 px-4 backdrop-blur-md sm:px-6 lg:px-8 font-mono">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 text-slate-450 hover:text-white md:hidden transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Separator line on mobile */}
        <div className="h-5 w-px bg-slate-800 md:hidden" />

        {/* Current page title breadcrumb */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase hidden sm:inline-block">
            Dashboard
          </span>
          <ChevronRight className="h-4 w-4 text-slate-600 hidden sm:inline-block" />
          <h1 className="text-xs font-bold text-white tracking-widest uppercase">{getPageTitle()}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Chatbot toggle button */}
        {selectedProjectId && (
          <button
            onClick={onChatClick}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all cursor-pointer relative"
            title="Toggle AI Observability Drawer"
          >
            <Bot className="h-4.5 w-4.5" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </button>
        )}

        {/* Project Switcher Selector */}
        {projects.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-350 hover:text-white hover:border-cyan-500/30 transition-all text-xs font-bold uppercase tracking-widest focus:outline-none cursor-pointer"
            >
              <Folder className="h-4 w-4 text-cyan-400" />
              <span className="max-w-[120px] truncate">
                {selectedProject ? selectedProject.name : "Select Project"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-56 origin-top-right rounded-lg border border-slate-800 bg-slate-950/95 backdrop-blur-xl shadow-2xl p-1.5 divide-y divide-slate-800/50 scale-in">
                <div className="py-1">
                  <span className="block px-3 py-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                    Scope Project
                  </span>
                  {projects.map((project) => {
                    const isSelected = project.id === selectedProjectId;
                    return (
                      <button
                        key={project.id}
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setDropdownOpen(false);
                          if (pathname === "/dashboard" || pathname === "/logs" || pathname === "/api-keys") {
                            router.refresh();
                          }
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-2 text-xs rounded-md transition-colors text-left font-bold uppercase tracking-wider cursor-pointer border border-transparent",
                          isSelected
                            ? "bg-slate-800 text-slate-200 border-slate-700"
                            : "text-slate-400 hover:text-white hover:bg-slate-900/30"
                        )}
                      >
                        <span className="truncate">{project.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-cyan-400" />}
                      </button>
                    );
                  })}
                </div>
                <div className="py-1 pt-1.5 mt-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      router.push("/projects");
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-md text-slate-400 hover:text-white hover:bg-slate-900/30 cursor-pointer"
                  >
                    <Plus className="h-4 w-4 text-slate-500" />
                    Manage Projects
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick create project button if list is empty */}
        {projects.length === 0 && (
          <button
            onClick={() => router.push("/projects")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            New Project
          </button>
        )}
      </div>
    </header>
  );
}
