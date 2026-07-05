"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { projectApi } from "../../lib/api";
import { useProjectStore } from "../../store/project.store";
import Sidebar from "@/components/layout/sidebar";
import Navbar from "@/components/layout/navbar";
import ChatbotDrawer from "@/components/layout/chatbot-drawer";
import { cn } from "../../utils/cn";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authLoading } = useAuth(true);
  const setProjects = useProjectStore((state) => state.setProjects);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: projectApi.getProjects,
    enabled: !!user,
  });

  useEffect(() => {
    if (projectsData?.success && projectsData.data) {
      setProjects(projectsData.data);
    }
  }, [projectsData, setProjects]);

  if (authLoading || projectsLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-5">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
          <span className="text-sm text-muted-foreground font-medium">Bootstrapping LogSense...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar (Left-aligned fixed) */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-background/80 backdrop-blur-xl z-30">
        <Sidebar />
      </div>

      {/* Mobile Sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-45 flex md:hidden">
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Menu panel */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-card border-r border-border pt-5 pb-4">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <Sidebar closeMobileMenu={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main viewport area */}
      <div className={cn(
        "flex flex-col flex-1 md:pl-64 min-h-screen transition-all duration-300 ease-in-out",
        chatbotOpen && "lg:pr-[420px]"
      )}>
        <Navbar 
          onMenuClick={() => setMobileSidebarOpen(true)} 
          onChatClick={() => setChatbotOpen(!chatbotOpen)} 
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto fade-in">
          {children}
        </main>
      </div>

      {/* Right Side Chatbot Drawer */}
      <ChatbotDrawer 
        isOpen={chatbotOpen} 
        onClose={() => setChatbotOpen(false)} 
      />
    </div>
  );
}
