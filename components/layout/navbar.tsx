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
} from "lucide-react";
import { cn } from "../../utils/cn";

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
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
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Separator line on mobile */}
        <div className="h-5 w-px bg-zinc-800 md:hidden" />

        {/* Current page title breadcrumb */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-semibold tracking-wider uppercase hidden sm:inline-block">
            Dashboard
          </span>
          <ChevronRight className="h-4 w-4 text-zinc-600 hidden sm:inline-block" />
          <h1 className="text-base font-semibold text-zinc-100">{getPageTitle()}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Project Switcher Selector */}
        {projects.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all text-sm font-medium focus:outline-none"
            >
              <Folder className="h-4 w-4 text-indigo-400" />
              <span className="max-w-[120px] truncate">
                {selectedProject ? selectedProject.name : "Select Project"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-30 p-1.5 divide-y divide-zinc-800">
                <div className="py-1">
                  <span className="block px-3 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
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
                          // Option: redirect to dashboard if switching projects to update data context
                          if (pathname === "/dashboard" || pathname === "/logs" || pathname === "/api-keys") {
                            router.refresh();
                          }
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-2 text-sm rounded-md transition-colors text-left",
                          isSelected
                            ? "bg-indigo-600/10 text-indigo-400 font-medium"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                        )}
                      >
                        <span className="truncate">{project.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-indigo-400" />}
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
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                  >
                    <Plus className="h-4 w-4 text-zinc-400" />
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Project
          </button>
        )}
      </div>
    </header>
  );
}
