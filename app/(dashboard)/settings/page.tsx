"use client";

import React, { useState } from "react";
import { useAuthStore } from "../../../store/auth.store";
import { toast } from "sonner";
import {
  User,
  Bell,
  HardDrive,
  Mail,
  MessageSquare,
  ShieldAlert,
  Loader2,
  Lock,
  Eye,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Database
} from "lucide-react";
import { cn } from "../../../utils/cn";

type TabType = "profile" | "alerts" | "retention";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // State: Profile settings
  const [displayName, setDisplayName] = useState(user?.name || "John Doe");
  const [email, setEmail] = useState(user?.email || "john@example.com");
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

  // Handlers
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setTimeout(() => {
      setProfileSaving(false);
      toast.success("Profile details updated successfully!");
    }, 800);
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

  const handleSaveAlerts = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertsSaving(true);
    setTimeout(() => {
      setAlertsSaving(false);
      toast.success("Notification preferences updated successfully!");
    }, 800);
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

  const handleSaveRetention = () => {
    setRetentionSaving(true);
    setTimeout(() => {
      setRetentionSaving(false);
      toast.success("Storage retention policies updated!");
    }, 800);
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
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight sm:text-2xl">Settings</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Configure account parameters, alerting webhooks, and log retention tiers.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        {/* Navigation Tabs Sidebar */}
        <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-zinc-850 pr-0 md:pr-4 h-fit">
          <button
            onClick={() => setActiveTab("profile")}
            className={cn(
              "flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
              activeTab === "profile"
                ? "bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 md:rounded-l-none"
                : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
            )}
          >
            <User className="h-4 w-4" />
            Profile & Security
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={cn(
              "flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
              activeTab === "alerts"
                ? "bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 md:rounded-l-none"
                : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
            )}
          >
            <Bell className="h-4 w-4" />
            Alerting & Webhooks
          </button>
          <button
            onClick={() => setActiveTab("retention")}
            className={cn(
              "flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
              activeTab === "retention"
                ? "bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 md:rounded-l-none"
                : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
            )}
          >
            <HardDrive className="h-4 w-4" />
            Retention & Policies
          </button>
        </div>

        {/* Tab Panels */}
        <div className="space-y-6">
          {/* TAB 1: Profile & Security */}
          {activeTab === "profile" && (
            <div className="space-y-6 fade-in">
              {/* Account Settings */}
              <div className="glass-card p-6 rounded-xl border border-zinc-800 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <User className="h-4.5 w-4.5 text-indigo-400" />
                    Account Profile
                  </h3>
                  <p className="text-[11px] text-zinc-450 mt-0.5">
                    Update your public display information and registered email address.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="block w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      {profileSaving && <Loader2 className="h-3 w-3 animate-spin text-white" />}
                      Save Profile Changes
                    </button>
                  </div>
                </form>
              </div>

              {/* Password Settings */}
              <div className="glass-card p-6 rounded-xl border border-zinc-800 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Lock className="h-4.5 w-4.5 text-indigo-400" />
                    Security Credentials
                  </h3>
                  <p className="text-[11px] text-zinc-450 mt-0.5">
                    Update your account password to ensure maximum security.
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Current Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="block w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-800 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        New Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-800 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      {passwordSaving && <Loader2 className="h-3 w-3 animate-spin text-white" />}
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: Alerting & Webhooks */}
          {activeTab === "alerts" && (
            <div className="space-y-6 fade-in">
              {/* Integrations Header */}
              <div className="glass-card p-6 rounded-xl border border-zinc-800 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bell className="h-4.5 w-4.5 text-indigo-400" />
                    Alerting Notifications & Incident Management
                  </h3>
                  <p className="text-[11px] text-zinc-450 mt-0.5">
                    Connect alerting endpoints to dispatch system alarms, latency anomalies, or critical exception triggers.
                  </p>
                </div>

                {/* Email Notifications Segment */}
                <div className="space-y-4 border-t border-zinc-850 pt-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-zinc-200">Email Alerts & Digests</span>
                        <span className="text-[10px] text-zinc-450 block mt-0.5">
                          Configure notifications delivered directly to your registered inbox.
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailAlerts}
                        onChange={(e) => setEmailAlerts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white" />
                    </label>
                  </div>

                  {emailAlerts && (
                    <div className="grid gap-4 sm:grid-cols-2 bg-zinc-950/40 p-4 border border-zinc-850 rounded-lg animate-fade-in text-xs">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                          Digest Frequency
                        </label>
                        <select
                          value={emailFrequency}
                          onChange={(e) => setEmailFrequency(e.target.value)}
                          className="block w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-250 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="instant">Instant Realtime Alerts</option>
                          <option value="hourly">Hourly Summaries</option>
                          <option value="daily">Daily Health Digests</option>
                          <option value="weekly">Weekly Reports</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                          Minimum Severity Alert Threshold
                        </label>
                        <select
                          value={minSeverity}
                          onChange={(e) => setMinSeverity(e.target.value)}
                          className="block w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-250 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="debug">All Logs (Debug & above)</option>
                          <option value="info">General Info (Info & above)</option>
                          <option value="warn">Warnings (Warn & above)</option>
                          <option value="error">Errors Only (Error & Critical)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Slack Integration Card */}
                <div className="space-y-4 border-t border-zinc-850 pt-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center h-10 w-10 bg-[#4A154B]/10 border border-[#4A154B]/20 rounded-lg">
                        <svg className="h-5 w-5 fill-[#E01E5A]" viewBox="0 0 24 24">
                          <path d="M5.04 15.12a2.52 2.52 0 1 1-2.52-2.52h2.52v2.52zm1.26 0a2.52 2.52 0 0 1 5.04 0v5.04a2.52 2.52 0 1 1-5.04 0v-5.04zM8.82 5.04a2.52 2.52 0 1 1 2.52-2.52v2.52H8.82zm0 1.26a2.52 2.52 0 0 1 0 5.04H3.78a2.52 2.52 0 1 1 0-5.04h5.04zm10.14 2.52a2.52 2.52 0 1 1 2.52 2.52h-2.52V8.82zm-1.26 0a2.52 2.52 0 0 1-5.04 0V3.78a2.52 2.52 0 1 1 5.04 0v5.04zm-3.78 10.14a2.52 2.52 0 1 1-2.52 2.52v-2.52h2.52zm0-1.26a2.52 2.52 0 0 1 0-5.04h5.04a2.52 2.52 0 1 1 0 5.04h-5.04z" />
                        </svg>
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-zinc-200">Slack Slackbot Integration</span>
                        <span className="text-[10px] text-zinc-450 block mt-0.5">
                          Push system alerts directly to a channel workspace using Slack Webhook endpoints.
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slackAlerts}
                        onChange={(e) => setSlackAlerts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white" />
                    </label>
                  </div>

                  {slackAlerts && (
                    <div className="space-y-3 bg-[#4A154B]/5 p-4 border border-[#4A154B]/15 rounded-lg animate-fade-in">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                          Slack Incoming Webhook URL
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
                            value={slackWebhook}
                            onChange={(e) => setSlackWebhook(e.target.value)}
                            className="block w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-800 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={handleTestSlack}
                            disabled={slackTesting}
                            className="px-3.5 py-2 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                          >
                            {slackTesting && <Loader2 className="h-3 w-3 animate-spin" />}
                            Test Link
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Discord Integration Card */}
                <div className="space-y-4 border-t border-zinc-850 pt-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center h-10 w-10 bg-[#5865F2]/10 border border-[#5865F2]/20 text-[#5865F2] rounded-lg">
                        {/* Custom Discord SVG */}
                        <svg className="h-5 w-5 fill-current" viewBox="0 0 127.14 96.36">
                          <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5A50.93,50.93,0,0,0,31,78,75.49,75.49,0,0,0,96.1,78a50.93,50.93,0,0,0,2.83,2.5,68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.06-18.83C129.89,50.41,124.08,27.54,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.73,46,53.73,53,48.55,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96,46,96,53,90.79,65.69,84.69,65.69Z" />
                        </svg>
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-zinc-200">Discord Alert Webhooks</span>
                        <span className="text-[10px] text-zinc-450 block mt-0.5">
                          Send incident notification logs directly to your Discord chat servers.
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={discordAlerts}
                        onChange={(e) => setDiscordAlerts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white" />
                    </label>
                  </div>

                  {discordAlerts && (
                    <div className="space-y-3 bg-[#5865F2]/5 p-4 border border-[#5865F2]/15 rounded-lg animate-fade-in">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                          Discord Webhook URL
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="https://discord.com/api/webhooks/000000000000000000/XXXXXXXXXXXXXXXXXXXXXXXX"
                            value={discordWebhook}
                            onChange={(e) => setDiscordWebhook(e.target.value)}
                            className="block w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-800 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={handleTestDiscord}
                            disabled={discordTesting}
                            className="px-3.5 py-2 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                          >
                            {discordTesting && <Loader2 className="h-3 w-3 animate-spin" />}
                            Test Link
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Footer */}
                <div className="flex justify-end border-t border-zinc-850 pt-5">
                  <button
                    onClick={handleSaveAlerts}
                    disabled={alertsSaving}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    {alertsSaving && <Loader2 className="h-3 w-3 animate-spin text-white" />}
                    Save Integration Config
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Data Retention & Storage Policy */}
          {activeTab === "retention" && (
            <div className="space-y-6 fade-in">
              <div className="glass-card p-6 rounded-xl border border-zinc-800 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="h-4.5 w-4.5 text-indigo-400" />
                    Storage Policy & Data Retention Tiers
                  </h3>
                  <p className="text-[11px] text-zinc-450 mt-0.5">
                    Optimize storage usage and billing profiles. Choose how long raw indexed log files should remain in high-speed hot query nodes.
                  </p>
                </div>

                {/* Slider Component */}
                <div className="space-y-6 pt-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-300">Hot Query Storage Retention</span>
                      <span className="font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/15">
                        {retentionDays} Days
                      </span>
                    </div>
                    <input
                      type="range"
                      min="7"
                      max="90"
                      step="1"
                      value={retentionDays}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        // Snap to tiers: 7, 14, 30, 60, 90
                        if (val <= 10) setRetentionDays(7);
                        else if (val <= 22) setRetentionDays(14);
                        else if (val <= 45) setRetentionDays(30);
                        else if (val <= 75) setRetentionDays(60);
                        else setRetentionDays(90);
                      }}
                      className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-zinc-850"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-550 font-medium px-0.5">
                      <span>7d (Basic)</span>
                      <span>14d</span>
                      <span>30d (Standard)</span>
                      <span>60d</span>
                      <span>90d (Enterprise)</span>
                    </div>
                  </div>

                  {/* Estimation Panel */}
                  <div className="grid gap-4 sm:grid-cols-3 bg-zinc-950/40 p-4 border border-zinc-850 rounded-lg text-xs">
                    <div className="space-y-1">
                      <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Storage Limit
                      </span>
                      <span className="text-base font-bold text-zinc-200">{metrics.space}</span>
                      <span className="block text-[10px] text-zinc-550 leading-none">Max log file quota</span>
                    </div>
                    <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-zinc-850 pt-3 sm:pt-0 sm:pl-4">
                      <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Monthly Cost
                      </span>
                      <span className="text-base font-bold text-white">
                        {metrics.cost === 0 ? "Free Tier" : `$${metrics.cost} / mo`}
                      </span>
                      <span className="block text-[10px] text-zinc-550 leading-none">Estimated charge</span>
                    </div>
                    <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-zinc-850 pt-3 sm:pt-0 sm:pl-4">
                      <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        Active Tier
                      </span>
                      <span className="text-base font-bold text-indigo-400 truncate block">{metrics.tier}</span>
                      <span className="block text-[10px] text-zinc-550 leading-none">Contract profile</span>
                    </div>
                  </div>

                  {/* Description of Tier details */}
                  <div className="grid gap-4 sm:grid-cols-2 text-xs border-t border-zinc-850 pt-5">
                    <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-1.5">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                        Hot Storage Performance (Tier 1)
                      </span>
                      <p className="text-zinc-400 leading-relaxed text-[11px]">
                        Indexed in primary database nodes. Full support for rapid search query filters, real-time analytics aggregations, and stack trace parsing.
                      </p>
                    </div>
                    <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-1.5">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                        Cold Archival Backup (Tier 2)
                      </span>
                      <p className="text-zinc-400 leading-relaxed text-[11px]">
                        After the selected threshold, logs are compressed and archived in cold cloud buckets. Queries will require an index restoration period of 1-3 minutes.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Save retention */}
                <div className="flex justify-end border-t border-zinc-850 pt-5">
                  <button
                    onClick={handleSaveRetention}
                    disabled={retentionSaving}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {retentionSaving && <Loader2 className="h-3 w-3 animate-spin text-white" />}
                    Save Retention Strategy
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
