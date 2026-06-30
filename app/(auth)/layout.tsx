"use client";

import React from "react";
import { useAuth } from "../../hooks/use-auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useAuth(false);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 bg-zinc-950 overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/15 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-900/15 blur-[120px] animate-pulse-glow" style={{ animationDelay: "-4s" }} />

      <div className="w-full max-w-md z-10">
        {children}
      </div>
    </div>
  );
}
