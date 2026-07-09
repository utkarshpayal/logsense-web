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
  Map,
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
    { name: "Active Users Map", href: "/active-users", icon: Map },
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
    <div className="flex flex-col h-full min-h-screen border-r border-border/50 bg-background/50 relative overflow-hidden">
      {/* Brand Header */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-border/50 relative z-10">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-650">
          <Cpu className="w-4.5 h-4.5 text-slate-900" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-foreground flex items-center gap-1">
            LogSense
          </span>
          <span className="text-[11px] font-medium text-primary leading-none mt-0.5">
            Observability Platform
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
                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative border",
                isActive
                  ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/50 hover:border-border/50"
              )}
            >
              {/* Left active indicator */}
              {isActive && (
                <span className="absolute left-1.5 h-4 w-1 rounded-full bg-primary" />
              )}
              <item.icon
                className={cn(
                  "w-4 h-4 transition-transform duration-200 group-hover:scale-105",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section / Footer */}
      <div className="p-4 border-t border-border/50 bg-background/50 relative z-10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/60 bg-card/50 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-indigo-600 font-semibold text-xs text-white border border-primary/30 shadow-sm">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : "US"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email || "user@logsense.com"}</p>
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            handleNavClick();
          }}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/10 border border-transparent transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
          Disconnect
        </button>
      </div>
    </div>
  );
}
