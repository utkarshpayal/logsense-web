"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  ChevronDown,
  User,
  Bell,
  HardDrive,
} from "lucide-react";
import { cn } from "../../utils/cn";

interface SidebarProps {
  closeMobileMenu?: () => void;
}

export default function Sidebar({ closeMobileMenu }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuthStore();

  const currentTab = searchParams.get("tab") || "profile";
  const [settingsExpanded, setSettingsExpanded] = useState(pathname.startsWith("/settings"));

  useEffect(() => {
    if (pathname.startsWith("/settings")) {
      setSettingsExpanded(true);
    }
  }, [pathname]);

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Active Users", href: "/active-users", icon: Map },
    { name: "Logs Explorer", href: "/logs", icon: Terminal },
    { name: "API Keys", href: "/api-keys", icon: Key },
    { name: "Projects", href: "/projects", icon: FolderGit2 },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      children: [
        { name: "Profile & Security", href: "/settings?tab=profile", icon: User },
        { name: "Alerting & Webhooks", href: "/settings?tab=alerts", icon: Bell },
        { name: "Retention & Policies", href: "/settings?tab=retention", icon: HardDrive },
      ],
    },
  ];

  const handleNavClick = () => {
    if (closeMobileMenu) {
      closeMobileMenu();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen border-r border-slate-800/80 bg-background/50 relative overflow-hidden">
      {/* Brand Header */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-650">
          <Cpu className="w-4.5 h-4.5 text-slate-900" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-foreground flex items-center gap-1">
            LogSense
          </span>
          <span className="text-[11px] font-medium text-slate-500 leading-none mt-0.5">
            Observability Platform
          </span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2.5 overflow-y-auto relative z-10">
        {navigation.map((item) => {
          const hasChildren = !!item.children;
          const isSettings = item.name === "Settings";
          const isExpanded = isSettings ? settingsExpanded : false;
          
          const isActive = pathname === item.href || (!hasChildren && pathname.startsWith(item.href + "/"));
          const isMainActive = isActive || (isSettings && pathname.startsWith("/settings"));

          return (
            <div key={item.name} className="space-y-1">
              <Link
                href={item.href}
                onClick={(e) => {
                  handleNavClick();
                  if (isSettings) {
                    setSettingsExpanded(!settingsExpanded);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative border",
                  isMainActive
                    ? "bg-slate-900 text-primary border-slate-800/80 shadow-sm"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-slate-900/50 hover:border-slate-800/50"
                )}
              >
                {/* Left active indicator */}
                {isMainActive && (
                  <span className="absolute left-1.5 h-4 w-1 rounded-full bg-primary" />
                )}
                <item.icon
                  className={cn(
                    "w-4 h-4 transition-transform duration-200 group-hover:scale-105",
                    isMainActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{item.name}</span>

                {isSettings && (
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 ml-auto transition-transform duration-200 text-muted-foreground group-hover:text-foreground",
                      isExpanded && "transform rotate-180"
                    )}
                  />
                )}
              </Link>

              {item.children && isExpanded && (
                <div className="mt-1 ml-4 pl-4 border-l border-slate-800 space-y-1.5 transition-all duration-200">
                  {item.children.map((child) => {
                    const isChildActive = pathname === "/settings" && (
                      (child.href.includes("tab=profile") && currentTab === "profile") ||
                      (child.href.includes("tab=alerts") && currentTab === "alerts") ||
                      (child.href.includes("tab=retention") && currentTab === "retention")
                    );

                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        onClick={handleNavClick}
                        className={cn(
                          "flex items-center gap-2.5 pl-6 pr-3 py-2 text-xs font-semibold rounded-lg transition-all duration-150 relative group/child",
                          isChildActive
                            ? "bg-slate-900/80 text-cyan-400 font-bold"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-slate-900/30"
                        )}
                      >
                        {isChildActive && (
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-0.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                        )}
                        <child.icon
                          className={cn(
                            "w-3.5 h-3.5",
                            isChildActive ? "text-cyan-400" : "text-zinc-400 group-hover/child:text-zinc-200"
                          )}
                        />
                        <span>{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Section / Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-background/50 relative z-10">
        <button
          onClick={() => {
            logout();
            handleNavClick();
          }}
          className="flex w-full items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-500/10 border border-red-500/50 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          Disconnect
        </button>
      </div>
    </div>
  );
}
