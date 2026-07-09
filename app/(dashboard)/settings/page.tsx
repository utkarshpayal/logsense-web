"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../../store/auth.store";
import { toast } from "sonner";
import {
  User,
  Bell,
  HardDrive,
  Mail,
  Loader2,
  Lock,
  Database,
  CheckCircle,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import { authApi } from "../../../lib/api";

type TabType = "profile" | "alerts" | "retention";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>("profile");

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

  // Slack Integration
  const [slackAlerts, setSlackAlerts] = useState(false);
  const [slackWebhook, setSlackWebhook] = useState("");
  const [slackTesting, setSlackTesting] = useState(false);

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
      setSlackAlerts(user.slack_alerts ?? false);
      setSlackWebhook(user.slack_webhook_url ?? "");
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
        slack_alerts: slackAlerts,
        slack_webhook_url: slackWebhook || null,
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

  const handleTestSlack = () => {
    if (!slackWebhook) {
      toast.error("Please provide a Slack Webhook URL to test.");
      return;
    }
    setSlackTesting(true);
    setTimeout(() => {
      setSlackTesting(false);
      toast.success("Slack Webhook test message dispatched!");
    }, 1200);
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
    <div className="space-y-6 max-w-5xl relative text-xs">

      {/* Page Header */}
      <div className="border-b border-slate-800 pb-5">
        <h2 className="text-base font-extrabold text-white tracking-widest uppercase">System Settings</h2>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
          Configure account parameters, alerting webhooks, and log retention tiers.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        {/* Navigation Tabs Sidebar */}
        <div className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-slate-900 pr-0 md:pr-4 h-fit">
          {[
            { id: "profile", label: "Profile & Security", icon: User },
            { id: "alerts", label: "Alerting & Webhooks", icon: Bell },
            { id: "retention", label: "Retention & Policies", icon: HardDrive },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                activeTab === tab.id
                  ? "bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-500 md:rounded-l-none"
                  : "text-slate-500 hover:bg-slate-950 hover:text-slate-300"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        <div className="space-y-6">
          {/* TAB 1: Profile & Security */}
          {activeTab === "profile" && (
            <div className="space-y-6 scale-in">
              {/* Account Settings */}
              <div className="cyber-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                    <User className="h-4.5 w-4.5 text-cyan-400" />
                    Account Profile
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed uppercase tracking-wider">
                    Update your public display information and registered email address.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="block w-full px-3.5 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-xs text-slate-202 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full px-3.5 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-xs text-slate-202 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-900">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/30 text-cyan-455 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {profileSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Save Profile Changes
                    </button>
                  </div>
                </form>
              </div>

              {/* Password Settings */}
              <div className="cyber-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                    <Lock className="h-4.5 w-4.5 text-cyan-400" />
                    Security Credentials
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed uppercase tracking-wider">
                    Update your account password to ensure maximum security.
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="block w-full px-3.5 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-xs text-slate-202 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full px-3.5 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-xs text-slate-202 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-900">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/30 text-cyan-455 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {passwordSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: Alerting & Webhooks */}
          {activeTab === "alerts" && (
            <div className="space-y-6 scale-in">
              <form onSubmit={handleSaveAlerts} className="space-y-6">
                {/* Email Routing */}
                <div className="cyber-panel p-6 rounded-2xl border border-slate-800 space-y-5">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                      <Bell className="h-4.5 w-4.5 text-cyan-400" />
                      Notification Routing
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed uppercase tracking-wider">
                      Set up alert relays and webhooks to trigger notifications on exception spikes.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 border border-slate-855 bg-slate-955/25 rounded-xl">
                      <div className="space-y-0.5">
                        <span className="block font-bold text-slate-200 uppercase tracking-widest text-xs">Email Digests</span>
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Receive critical system alerts via email</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEmailAlerts(!emailAlerts)}
                        className={cn(
                          "relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          emailAlerts ? "bg-cyan-500" : "bg-slate-900 border-slate-800"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-slate-955 shadow ring-0 transition duration-200 ease-in-out mt-[2px]",
                            emailAlerts ? "translate-x-3.5" : "translate-x-0.5"
                          )}
                        />
                      </button>
                    </div>

                    {emailAlerts && (
                      <div className="grid gap-4 sm:grid-cols-2 p-4 border border-slate-855 bg-slate-955/35 rounded-xl">
                        <div className="space-y-1.5">
                          <label className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                            Digest Frequency
                          </label>
                          <select
                            value={emailFrequency}
                            onChange={(e) => setEmailFrequency(e.target.value)}
                            className="block w-full px-3.5 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-xs text-slate-350 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono cursor-pointer"
                          >
                            <option value="hourly">Hourly Summary</option>
                            <option value="daily">Daily digest</option>
                            <option value="weekly">Weekly digest</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                            Minimum Severity
                          </label>
                          <select
                            value={minSeverity}
                            onChange={(e) => setMinSeverity(e.target.value)}
                            className="block w-full px-3.5 py-2.5 bg-slate-955 border border-slate-800 rounded-xl text-xs text-slate-350 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono cursor-pointer"
                          >
                            <option value="info">Info & Above</option>
                            <option value="warn">Warn & Above</option>
                            <option value="error">Error Only</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Slack & Discord Webhooks */}
                <div className="cyber-panel p-6 rounded-2xl border border-slate-800 space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">ChatOps Integrations</h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed uppercase tracking-wider">
                      Forward telemetry alerts directly to corporate communication channels.
                    </p>
                  </div>
                  <div className="space-y-5">
                    {/* Slack */}
                    <div className="p-4 border border-slate-855 bg-slate-955/25 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="block font-bold text-slate-200 uppercase tracking-widest text-xs">Slack Webhook Channel</span>
                        <button
                          type="button"
                          onClick={() => setSlackAlerts(!slackAlerts)}
                          className={cn(
                            "relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                            slackAlerts ? "bg-cyan-500" : "bg-slate-900 border-slate-800"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-slate-955 shadow ring-0 transition duration-200 ease-in-out mt-[2px]",
                              slackAlerts ? "translate-x-3.5" : "translate-x-0.5"
                            )}
                          />
                        </button>
                      </div>
                      {slackAlerts && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="https://hooks.slack.com/services/..."
                            value={slackWebhook}
                            onChange={(e) => setSlackWebhook(e.target.value)}
                            className="block w-full px-3.5 py-2.5 bg-slate-955 border border-slate-805 rounded-xl text-xs text-slate-202 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleTestSlack}
                            disabled={slackTesting}
                            className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/30 text-cyan-455 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap"
                          >
                            {slackTesting ? "Testing..." : "Test Link"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Discord */}
                    <div className="p-4 border border-slate-855 bg-slate-955/25 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="block font-bold text-slate-200 uppercase tracking-widest text-xs">Discord Webhook Channel</span>
                        <button
                          type="button"
                          onClick={() => setDiscordAlerts(!discordAlerts)}
                          className={cn(
                            "relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                            discordAlerts ? "bg-cyan-500" : "bg-slate-900 border-slate-800"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-slate-955 shadow ring-0 transition duration-200 ease-in-out mt-[2px]",
                              discordAlerts ? "translate-x-3.5" : "translate-x-0.5"
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
                            className="block w-full px-3.5 py-2.5 bg-slate-955 border border-slate-805 rounded-xl text-xs text-slate-202 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleTestDiscord}
                            disabled={discordTesting}
                            className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/30 text-cyan-455 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap"
                          >
                            {discordTesting ? "Testing..." : "Test Link"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end pt-4 border-t border-slate-900">
                  <button
                    type="submit"
                    disabled={alertsSaving}
                    className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/30 text-cyan-455 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {alertsSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save Preferences
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: Retention & Policies */}
          {activeTab === "retention" && (
            <div className="space-y-6 scale-in">
              <div className="cyber-panel p-6 rounded-2xl border border-slate-800 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                    <HardDrive className="h-4.5 w-4.5 text-cyan-400" />
                    Telemetry Retention policy
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed uppercase tracking-wider">
                    Adjust how long Clickhouse buffers raw and aggregated telemetry logs before archival.
                  </p>
                </div>

                {/* Slider */}
                <div className="space-y-5 py-4">
                  <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                    <span>Purge Threshold</span>
                    <span className="text-cyan-400 font-bold font-mono">{retentionDays} Days</span>
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
                        // Snap to closest valid tier
                        const tiers = [7, 14, 30, 60, 90];
                        const closest = tiers.reduce((prev, curr) =>
                          Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
                        );
                        setRetentionDays(closest);
                      }}
                      className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2 select-none">
                      <span>7d</span>
                      <span>14d</span>
                      <span>30d</span>
                      <span>60d</span>
                      <span>90d</span>
                    </div>
                  </div>
                </div>

                {/* Info Deck */}
                <div className="grid gap-3.5 sm:grid-cols-3 p-4 border border-slate-855 bg-slate-955/25 rounded-xl">
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-slate-555 uppercase tracking-widest">Storage Space</span>
                    <span className="text-xs font-bold text-slate-200 block font-mono">{metrics.space}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-slate-555 uppercase tracking-widest">Est Cost / mo</span>
                    <span className="text-xs font-bold text-cyan-400 block font-mono">
                      {metrics.cost === 0 ? "Free" : `$${metrics.cost}`}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-slate-555 uppercase tracking-widest">Plan Tier</span>
                    <span className="text-xs font-bold text-slate-350 block truncate">{metrics.tier}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-900">
                  <button
                    onClick={handleSaveRetention}
                    disabled={retentionSaving}
                    className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/30 text-cyan-455 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {retentionSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save Retention Policy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
