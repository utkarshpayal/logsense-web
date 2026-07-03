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
      <div className="flex h-screen w-screen items-center justify-center bg-[#05070a] font-mono">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 bg-[#05070a] overflow-hidden dotted-tech">
      {/* Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px] animate-cyber-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[120px] animate-cyber-pulse" style={{ animationDelay: "-3s" }} />
      <div className="scanline opacity-10" />

      <div className="w-full max-w-md z-10 scale-in">
        {children}
      </div>
    </div>
  );
}
