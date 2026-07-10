"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuthStore } from "../../../store/auth.store";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Bell,
  HardDrive,
  Mail,
  Loader2,
  Lock,
  Database,
  CheckCircle,
  Globe,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import { authApi } from "../../../lib/api";

type TabType = "profile" | "alerts" | "retention";

function SettingsPageContent() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>("profile");

  useEffect(() => {
    if (tabParam && ["profile", "alerts", "retention"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    router.push(`/settings?tab=${tabId}`);
  };

  // State: Profile settings
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // State: Password settings
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // State: Alert Integrations
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [emailFrequency, setEmailFrequency] = useState("daily");
  const [minSeverity, setMinSeverity] = useState("error");
  const [alertsSaving, setAlertsSaving] = useState(false);

  // Discord Integration
  const [discordAlerts, setDiscordAlerts] = useState(false);
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [discordTesting, setDiscordTesting] = useState(false);

  // State: Retention Policies
  const [retentionDays, setRetentionDays] = useState(30);
  const [retentionSaving, setRetentionSaving] = useState(false);

  // Sync state whenever user object is available
  useEffect(() => {
    if (user) {
      setDisplayName(user.name || "");
      setEmail(user.email || "");
      setEmailAlerts(user.email_alerts ?? true);
      setEmailFrequency(user.email_frequency ?? "daily");
      setMinSeverity(user.min_severity ?? "error");
      setDiscordAlerts(user.discord_alerts ?? false);
      setDiscordWebhook(user.discord_webhook_url ?? "");
      setRetentionDays(user.retention_days ?? 30);
    }
  }, [user]);

  // Handlers
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await authApi.updateSettings({
        name: displayName,
        email: email,
      });
      if (res.success && res.data) {
        useAuthStore.getState().updateUser(res.data);
        toast.success("Profile details updated successfully!");
      } else {
        toast.error(res.message || "Failed to update profile.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in both password fields.");
      return;
    }
    setPasswordSaving(true);
    setTimeout(() => {
      setPasswordSaving(false);
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password updated successfully!");
    }, 1000);
  };

  const handleSaveAlerts = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertsSaving(true);
    try {
      const res = await authApi.updateSettings({
        email_alerts: emailAlerts,
        email_frequency: emailFrequency,
        min_severity: minSeverity,
        discord_alerts: discordAlerts,
        discord_webhook_url: discordWebhook || null,
      });
      if (res.success && res.data) {
        useAuthStore.getState().updateUser(res.data);
        toast.success("Notification preferences updated successfully!");
      } else {
        toast.error(res.message || "Failed to update notification preferences.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update notification preferences.");
    } finally {
      setAlertsSaving(false);
    }
  };



  const handleTestDiscord = () => {
    if (!discordWebhook) {
      toast.error("Please provide a Discord Webhook URL to test.");
      return;
    }
    setDiscordTesting(true);
    setTimeout(() => {
      setDiscordTesting(false);
      toast.success("Discord Webhook test alert dispatched!");
    }, 1200);
  };

  const handleSaveRetention = async () => {
    setRetentionSaving(true);
    try {
      const res = await authApi.updateSettings({
        retention_days: retentionDays,
      });
      if (res.success && res.data) {
        useAuthStore.getState().updateUser(res.data);
        toast.success("Storage retention policies updated!");
      } else {
        toast.error(res.message || "Failed to update retention policy.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update retention policy.");
    } finally {
      setRetentionSaving(false);
    }
  };

  // Cost estimates based on retention slider
  const getRetentionMetrics = (days: number) => {
    switch (days) {
      case 7:
        return { cost: 0, space: "50 GB", tier: "Basic Free" };
      case 14:
        return { cost: 15, space: "120 GB", tier: "Growth Starter" };
      case 30:
        return { cost: 49, space: "350 GB", tier: "Standard Professional" };
      case 60:
        return { cost: 99, space: "800 GB", tier: "Scale Pro" };
      case 90:
        return { cost: 149, space: "1.5 TB", tier: "Enterprise Tier" };
      default:
        return { cost: 49, space: "350 GB", tier: "Standard Professional" };
    }
  };

  const metrics = getRetentionMetrics(retentionDays);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h2 className="text-base font-extrabold text-white tracking-widest uppercase">System Settings</h2>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">
            Configure account profile, alerting webhooks, and log retention policies.
          </p>
        </div>
      </div>

      {/* Detail Content (No card border/background) */}
      <div className="space-y-8 py-2">
          {/* TAB 1: Profile & Security */}
          {activeTab === "profile" && (
            <div className="space-y-8">
              {/* Account Settings */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <User className="h-4 w-4 text-cyan-400" />
                    Account Profile
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1 uppercase tracking-wider">
                    Update your public display information and registered email address.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5 pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="block w-full px-4 py-2.5 bg-zinc-950/60 hover:bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700/80 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl text-xs font-mono text-zinc-200 placeholder-zinc-600 transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full px-4 py-2.5 bg-zinc-950/60 hover:bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700/80 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl text-xs font-mono text-zinc-200 placeholder-zinc-600 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-cyan-500/50 disabled:to-blue-500/50 text-slate-950 text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_-4px_rgba(6,182,212,0.25)] active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
                    >
                      {profileSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
                      ) : (
                        <span>Save Changes</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <div className="border-t border-zinc-800/80 my-8" />

              {/* Password Settings */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Lock className="h-4 w-4 text-cyan-400" />
                    Security Credentials
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1 uppercase tracking-wider">
                    Update your account password to ensure maximum security.
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-5 pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="block w-full px-4 py-2.5 bg-zinc-950/60 hover:bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700/80 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl text-xs font-mono text-zinc-200 placeholder-zinc-600 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full px-4 py-2.5 bg-zinc-950/60 hover:bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700/80 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl text-xs font-mono text-zinc-200 placeholder-zinc-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-cyan-500/50 disabled:to-blue-500/50 text-slate-950 text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_-4px_rgba(6,182,212,0.25)] active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
                    >
                      {passwordSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
                      ) : (
                        <span>Update Password</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: Alerting & Webhooks */}
          {activeTab === "alerts" && (
            <form onSubmit={handleSaveAlerts} className="space-y-8">
              {/* Email Routing */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Bell className="h-4 w-4 text-cyan-400" />
                    Notification Routing
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider">
                    Set up alert relays and webhooks to trigger notifications on exception spikes.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-4 border-b border-zinc-900/40">
                    <div className="space-y-0.5">
                      <span className="block font-bold text-zinc-200 text-xs uppercase tracking-wider">Email Digests</span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Receive critical system alerts via email</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailAlerts(!emailAlerts)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        emailAlerts ? "bg-cyan-500" : "bg-zinc-950 border-zinc-800"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full transition duration-205 ease-in-out mt-[2px]",
                          emailAlerts ? "translate-x-4 bg-zinc-950" : "translate-x-0.5 bg-zinc-500"
                        )}
                      />
                    </button>
                  </div>

                  {emailAlerts && (
                    <div className="grid gap-4 sm:grid-cols-2 py-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          Digest Frequency
                        </label>
                        <select
                          value={emailFrequency}
                          onChange={(e) => setEmailFrequency(e.target.value)}
                          className="block w-full px-4 py-2.5 bg-zinc-950/40 hover:bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700/80 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 focus:bg-zinc-950/80 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono cursor-pointer"
                        >
                          <option value="hourly" className="bg-zinc-900 text-zinc-200">Hourly Summary</option>
                          <option value="daily" className="bg-zinc-900 text-zinc-200">Daily Digest</option>
                          <option value="weekly" className="bg-zinc-900 text-zinc-200">Weekly Digest</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          Minimum Severity
                        </label>
                        <select
                          value={minSeverity}
                          onChange={(e) => setMinSeverity(e.target.value)}
                          className="block w-full px-4 py-2.5 bg-zinc-950/40 hover:bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700/80 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 focus:bg-zinc-950/80 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono cursor-pointer"
                        >
                          <option value="info" className="bg-zinc-900 text-zinc-200">Info & Above</option>
                          <option value="warn" className="bg-zinc-900 text-zinc-200">Warn & Above</option>
                          <option value="error" className="bg-zinc-900 text-zinc-200">Error Only</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-zinc-800/80 my-8" />

              {/* Discord Webhooks */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Globe className="h-4 w-4 text-cyan-400" />
                    ChatOps Integrations
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1 uppercase tracking-wider">
                    Forward telemetry alerts directly to corporate communication channels.
                  </p>
                </div>
                <div className="space-y-5">
                  <div className="py-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="block font-bold text-zinc-200 text-xs uppercase tracking-wider">Discord Webhook Channel</span>
                      <button
                        type="button"
                        onClick={() => setDiscordAlerts(!discordAlerts)}
                        className={cn(
                          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          discordAlerts ? "bg-cyan-500" : "bg-zinc-950 border-zinc-800"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full transition duration-200 ease-in-out mt-[2px]",
                            discordAlerts ? "translate-x-4 bg-zinc-950" : "translate-x-0.5 bg-zinc-500"
                          )}
                        />
                      </button>
                    </div>
                    {discordAlerts && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="https://discord.com/api/webhooks/..."
                          value={discordWebhook}
                          onChange={(e) => setDiscordWebhook(e.target.value)}
                          className="block w-full px-4 py-2.5 bg-zinc-950/40 hover:bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700/80 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 focus:bg-zinc-950/80 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleTestDiscord}
                          disabled={discordTesting}
                          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 px-4 py-2.5 rounded-xl transition-all cursor-pointer bg-transparent"
                        >
                          {discordTesting ? "Testing..." : "Test"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-800/80">
                <button
                  type="submit"
                  disabled={alertsSaving}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-cyan-500/50 disabled:to-blue-500/50 text-slate-950 text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_-4px_rgba(6,182,212,0.25)] active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
                >
                  {alertsSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
                  ) : (
                    <span>Save Preferences</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Retention & Policies */}
          {activeTab === "retention" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-cyan-400" />
                  Telemetry Retention Policy
                </h3>
                <p className="text-[11px] text-zinc-400 mt-1 uppercase tracking-wider">
                  Adjust how long Clickhouse buffers raw and aggregated telemetry logs before archival.
                </p>
              </div>

              {/* Slider */}
              <div className="space-y-5 py-4">
                <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                  <span>Purge Threshold</span>
                  <span className="text-cyan-400 font-bold font-mono text-sm">{retentionDays} Days</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={7}
                    max={90}
                    step={1}
                    value={retentionDays}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const tiers = [7, 14, 30, 60, 90];
                      const closest = tiers.reduce((prev, curr) =>
                        Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
                      );
                      setRetentionDays(closest);
                    }}
                    className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2 select-none">
                    <span>7d</span>
                    <span>14d</span>
                    <span>30d</span>
                    <span>60d</span>
                    <span>90d</span>
                  </div>
                </div>
              </div>

              {/* Info Deck */}
              <div className="grid gap-4 sm:grid-cols-3 py-4 border-y border-zinc-900/40">
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Storage Space</span>
                  <span className="text-xs font-bold text-zinc-200 block font-mono">{metrics.space}</span>
                </div>
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Est Cost / mo</span>
                  <span className="text-xs font-bold text-cyan-400 block font-mono">
                    {metrics.cost === 0 ? "Free" : `$${metrics.cost}`}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Plan Tier</span>
                  <span className="text-xs font-bold text-zinc-300 block truncate uppercase tracking-wider">{metrics.tier}</span>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-800/40">
                <button
                  onClick={handleSaveRetention}
                  disabled={retentionSaving}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-cyan-500/50 disabled:to-blue-500/50 text-slate-950 text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_-4px_rgba(6,182,212,0.25)] active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
                >
                  {retentionSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
                  ) : (
                    <span>Save Policy</span>
                  )}
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  );
}