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
  Cpu,
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
    <div className="flex flex-col h-full min-h-screen border-r border-slate-800/80 bg-[#070b16] relative overflow-hidden">
      {/* Brand Header */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-650">
          <Cpu className="w-4.5 h-4.5 text-slate-900" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-sm tracking-widest text-white uppercase flex items-center gap-1">
            LogSense
          </span>
          <span className="text-[10px] font-extrabold text-cyan-400 tracking-widest uppercase leading-none mt-0.5">
            Telemetry.System
          </span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2.5 overflow-y-auto relative z-10">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-200 group relative border",
                isActive
                  ? "bg-cyan-500/5 text-cyan-400 border-cyan-500/20"
                  : "text-slate-400 border-transparent hover:text-white hover:bg-slate-900/30 hover:border-slate-800/50"
              )}
            >
              {/* Left active indicator */}
              {isActive && (
                <span className="absolute left-1.5 h-3 w-0.5 rounded-full bg-cyan-400" />
              )}
              <item.icon
                className={cn(
                  "w-4 h-4 transition-transform duration-200 group-hover:scale-105",
                  isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-350"
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section / Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-[#050810]/80 relative z-10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-800/80 bg-slate-950/45 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 font-extrabold text-xs text-slate-900 border border-cyan-400/30">
            {user?.name ? user.name.substring(0, 2) : "US"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-200 truncate uppercase tracking-wider">{user?.name || "User"}</p>
            <p className="text-[10px] text-slate-500 truncate leading-none mt-0.5">{user?.email || "user@logsense.com"}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            handleNavClick();
          }}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-rose-455 rounded-xl hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-slate-500 group-hover:text-rose-455" />
          Disconnect
        </button>
      </div>
    </div>
  );
}
