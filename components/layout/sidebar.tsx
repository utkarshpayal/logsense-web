"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "../../store/auth.store";
import {
  LayoutDashboard,
  Terminal,
  Key,
  FolderGit2,
  Settings,
  LogOut,
  Activity,
  Layers,
} from "lucide-react";
import { cn } from "../../utils/cn";

interface SidebarProps {
  closeMobileMenu?: () => void;
}

export default function Sidebar({ closeMobileMenu }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Logs Explorer", href: "/logs", icon: Terminal },
    { name: "API Keys", href: "/api-keys", icon: Key },
    { name: "Projects", href: "/projects", icon: FolderGit2 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleNavClick = () => {
    if (closeMobileMenu) {
      closeMobileMenu();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen border-r border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
      {/* Brand Header */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-zinc-850">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 shadow-lg shadow-indigo-600/30">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-lg tracking-tight text-white flex items-center gap-1.5">
          LogSense
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-indigo-400 border border-zinc-700">
            v1.0
          </span>
        </span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 font-semibold shadow-inner"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 hover:border-l-2 hover:border-zinc-700"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 transition-transform duration-200 group-hover:scale-105",
                  isActive ? "text-indigo-400" : "text-zinc-400 group-hover:text-zinc-200"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Section / Footer */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/20">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 font-semibold text-xs text-white uppercase shadow-md">
            {user?.name ? user.name.substring(0, 2) : "US"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">{user?.name || "User"}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email || "user@logsense.com"}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            handleNavClick();
          }}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-red-400 rounded-lg hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 text-zinc-400 group-hover:text-red-400" />
          Logout
        </button>
      </div>
    </div>
  );
}
