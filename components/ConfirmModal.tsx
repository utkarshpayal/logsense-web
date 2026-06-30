"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle, Info, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "../utils/cn";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
  isLoading = false,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Icon and theme config based on type
  const themeConfig = {
    danger: {
      icon: <Trash2 className="h-6 w-6 text-red-500" />,
      iconBg: "bg-red-500/10 border border-red-500/20",
      buttonBg: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/15 focus:ring-red-500",
      glow: "glow-error border-red-950/20",
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
      iconBg: "bg-amber-500/10 border border-amber-500/20",
      buttonBg: "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/15 focus:ring-amber-500",
      glow: "box-shadow: 0 0 40px -10px rgba(245, 158, 11, 0.15)",
    },
    info: {
      icon: <Info className="h-6 w-6 text-indigo-500" />,
      iconBg: "bg-indigo-500/10 border border-indigo-500/20",
      buttonBg: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/15 focus:ring-indigo-500",
      glow: "glow-indigo border-indigo-950/20",
    },
  };

  const currentTheme = themeConfig[type] || themeConfig.warning;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-sm transition-all duration-300 ease-out fade-in">
      {/* Backdrop Click */}
      <div 
        className="absolute inset-0 cursor-default" 
        onClick={() => {
          if (!isLoading) onClose();
        }}
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800/80 p-6 text-zinc-100 shadow-2xl scale-in",
          type === "danger" ? "glow-error" : "glow-indigo"
        )}
      >

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-700 disabled:opacity-40 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex gap-4 items-start pr-8">
          <div className={cn("flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl", currentTheme.iconBg)}>
            {currentTheme.icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-zinc-850 hover:border-zinc-800 bg-zinc-950 hover:bg-zinc-850 text-zinc-300 hover:text-zinc-100 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
              currentTheme.buttonBg
            )}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-white" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
