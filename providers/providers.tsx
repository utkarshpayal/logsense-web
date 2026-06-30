"use client";

import React, { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/query-client";
import { Toaster } from "sonner";
import { useAuthStore } from "../store/auth.store";
import { useProjectStore } from "../store/project.store";

export function Providers({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const initializeProject = useProjectStore((state) => state.initialize);

  useEffect(() => {
    initializeAuth();
    initializeProject();
  }, [initializeAuth, initializeProject]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" closeButton theme="dark" />
    </QueryClientProvider>
  );
}
