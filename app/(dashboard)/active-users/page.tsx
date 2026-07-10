"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../../../lib/api";
import { useProjectStore } from "../../../store/project.store";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Search,
  Filter,
  RefreshCw,
  Clock,
  Compass,
  User,
  Info,
  FolderOpen,
  Loader2,
  Globe,
  MapPin,
  ChevronRight,
  Clipboard,
  Check,
  Play,
  Pause,
  UserCheck,
  Code,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import { Button } from "../../../components/ui/button";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
} from "../../../components/ui/map";

export default function ActiveUsersMapPage() {
  const router = useRouter();
  const { selectedProjectId, projects } = useProjectStore();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStep, setSelectedStep] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([-98.5795, 39.8283]); // US Center default
  const [mapZoom, setMapZoom] = useState(3);
  const [hasSetInitialCenter, setHasSetInitialCenter] = useState(false);

  // Polling state
  const [pollInterval, setPollInterval] = useState<number | false>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: onboardingRes, isLoading: onboardingLoading, refetch, isFetching } = useQuery({
    queryKey: ["dashboardOnboarding", selectedProjectId],
    queryFn: () => dashboardApi.getOnboarding(selectedProjectId!),
    enabled: !!selectedProjectId,
    refetchInterval: pollInterval,
  });

  const onboardingLogs = onboardingRes?.data || [];

  // Map backend logs to structured markers
  const onboardingMarkers = useMemo(() => {
    return onboardingLogs
      .filter((log) => {
        const onboarding = log.metadata?.onboarding;
        return (
          onboarding &&
          onboarding.location &&
          typeof onboarding.location.latitude === "number" &&
          typeof onboarding.location.longitude === "number"
        );
      })
      .map((log) => {
        const onboarding = log.metadata!.onboarding;
        const loc = onboarding.location;
        return {
          id: log.id,
          userId: onboarding.userId || "anonymous",
          step: onboarding.step || "onboarded",
          city: loc.city || "Unknown City",
          country: loc.country || "Unknown Country",
          region: loc.region || "",
          ip: loc.ip || "Unknown IP",
          lat: loc.latitude,
          lng: loc.longitude,
          createdAt: log.created_at,
          metadata: onboarding.metadata || {},
        };
      });
  }, [onboardingLogs]);

  // Set initial map center to first user marker when loaded
  useEffect(() => {
    if (!hasSetInitialCenter && onboardingMarkers.length > 0) {
      setMapCenter([onboardingMarkers[0].lng, onboardingMarkers[0].lat]);
      setMapZoom(5);
      setHasSetInitialCenter(true);
    }
  }, [onboardingMarkers, hasSetInitialCenter]);

  // Get unique onboarding steps for the filter dropdown
  const uniqueSteps = useMemo(() => {
    const steps = new Set<string>();
    onboardingMarkers.forEach((m) => {
      if (m.step) steps.add(m.step);
    });
    return Array.from(steps);
  }, [onboardingMarkers]);

  // Filter markers based on search and step filter
  const filteredMarkers = useMemo(() => {
    return onboardingMarkers.filter((m) => {
      const matchesSearch =
        m.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.ip.includes(searchQuery);

      const matchesStep = selectedStep === "all" || m.step === selectedStep;

      return matchesSearch && matchesStep;
    });
  }, [onboardingMarkers, searchQuery, selectedStep]);

  // Handle focusing on a user marker
  const handleFocusUser = (user: any) => {
    setSelectedUser(user);
    setMapCenter([user.lng, user.lat]);
    setMapZoom(7);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(type);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Empty states
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6">
          <FolderOpen className="h-8 w-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
        <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
          Create a project workspace to start ingesting logs and visualizing onboarding users on the map.
        </p>
        <Button onClick={() => router.push("/projects")} size="default">
          Create Project
        </Button>
      </div>
    );
  }

  if (!selectedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6">
          <Info className="h-8 w-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Select a project</h3>
        <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
          Choose a project from the dropdown in the top navigation bar to view its active user onboarding data.
        </p>
      </div>
    );
  }

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">Active Telemetry</span>
          </div>
          <h1 className="text-xl pt-2 font-bold text-white tracking-tight">Active Users Map</h1>
          <p className="text-sm text-slate-400 mt-1">
            Visualizing real-time onboarding flows and user locales for <span className="text-slate-200 font-medium">{activeProject?.name}</span>
          </p>
        </div>

        {/* Polling / Refresh Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs">
            <button
              onClick={() => setPollInterval(pollInterval ? false : 5000)}
              className={cn(
                "p-1 rounded-md transition-colors hover:bg-slate-800",
                pollInterval ? "text-cyan-400" : "text-slate-500"
              )}
              title={pollInterval ? "Pause Auto-refresh" : "Enable Auto-refresh"}
            >
              {pollInterval ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            </button>
            <span className="text-slate-400 font-mono select-none">
              {pollInterval ? "Auto (5s)" : "Paused"}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 p-2 bg-slate-950 text-slate-400"
          >
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content Layout */}
      {onboardingLoading && onboardingLogs.length === 0 ? (
        <div className="flex h-96 items-center justify-center bg-slate-900/20 border border-slate-800 rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-500" />
            <span className="text-sm text-slate-400">Loading user onboarding data…</span>
          </div>
        </div>
      ) : onboardingLogs.length === 0 ? (
        /* Empty Telemetry State with Code Integration Guide */
        <div className="grid gap-6 lg:grid-cols-5 bg-slate-900/20 border border-slate-800 rounded-2xl p-8">
          <div className="lg:col-span-2 flex flex-col justify-center max-w-md">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5">
              <Globe className="size-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No active onboarding sessions</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              We couldn't find any onboarding logs for this project. Start tracking user onboarding telemetry from your app using the LogSense SDK.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ensure you pass the coordinates and location details to record active users correctly on the geographic map.
            </p>
          </div>

          <div className="lg:col-span-3 bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-850">
              <div className="flex items-center gap-2">
                <Code className="size-4 text-slate-450" />
                <span className="text-xs font-semibold text-slate-300 font-mono">SDK Integration</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  copyToClipboard(
                    `await logsense.onboarding.userOnboarded("user_101", "profile_setup", {\n    latitude: 28.6139,\n    longitude: 77.2090,\n    city: "New Delhi",\n    country: "India",\n    region: "Delhi",\n    ip: "122.161.49.20"\n}, {\n    completedSections: ["basic_info", "avatar"]\n});`,
                    "sdk-guide"
                  )
                }
              >
                {copiedId === "sdk-guide" ? <Check className="size-3.5 text-emerald-400" /> : <Clipboard className="size-3.5" />}
              </Button>
            </div>
            <pre className="p-4 text-[11px] font-mono text-slate-400 overflow-x-auto leading-relaxed bg-slate-950">
              <span className="text-slate-500">// Initialize LogSense client and log onboarding telemetry</span>
              {"\n"}
              <span className="text-cyan-400">await</span> logsense.onboarding.userOnboarded(
              {"\n"}  <span className="text-emerald-400">"user_101"</span>, <span className="text-emerald-400">"profile_setup"</span>,
              {"\n"}  {"{"}
              {"\n"}    latitude: <span className="text-amber-400">28.6139</span>,
              {"\n"}    longitude: <span className="text-amber-400">77.2090</span>,
              {"\n"}    city: <span className="text-emerald-400">"New Delhi"</span>,
              {"\n"}    country: <span className="text-emerald-400">"India"</span>,
              {"\n"}    region: <span className="text-emerald-400">"Delhi"</span>,
              {"\n"}    ip: <span className="text-emerald-400">"122.161.49.20"</span>
              {"\n"}  {"}"},
              {"\n"}  {"{"}
              {"\n"}    completedSections: [
              <span className="text-emerald-400">"basic_info"</span>, <span className="text-emerald-400">"avatar"</span>
              ]
              {"\n"}  {"}"}
              {"\n"});
            </pre>
          </div>
        </div>
      ) : (
        /* Dynamic Split Map UI */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
          {/* Map Column (9/12) */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search active users by ID, city, country, or IP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 text-white rounded-xl py-2 pl-10 pr-4 text-xs outline-none transition-all focus:border-cyan-500 focus:bg-slate-900/80"
                />
              </div>

              {/* Step selector */}
              <div className="relative shrink-0 flex items-center gap-2 bg-slate-900/50 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                <Filter className="size-3.5 text-slate-400" />
                <select
                  value={selectedStep}
                  onChange={(e) => setSelectedStep(e.target.value)}
                  className="bg-transparent text-slate-200 outline-none pr-4 cursor-pointer text-xs font-semibold capitalize"
                >
                  <option value="all" className="bg-slate-900 text-slate-200">All Steps</option>
                  {uniqueSteps.map((step) => (
                    <option key={step} value={step} className="bg-slate-900 text-slate-200 capitalize">
                      {step}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Geographic Map component */}
            <div className="flex-1 min-h-[480px] lg:min-h-0 rounded-2xl overflow-hidden border border-slate-800 shadow-xl shadow-slate-950/40 relative">
              <Map center={mapCenter} zoom={mapZoom}>
                {filteredMarkers.map((marker) => {
                  const isSelected = selectedUser?.id === marker.id;
                  return (
                    <MapMarker key={marker.id} longitude={marker.lng} latitude={marker.lat}>
                      <MarkerContent>
                        <div
                          onClick={() => handleFocusUser(marker)}
                          className={cn(
                            "size-5 flex items-center justify-center cursor-pointer rounded-full border bg-slate-950 shadow-lg transition-all duration-300 hover:scale-125",
                            isSelected
                              ? "border-cyan-400 scale-110 shadow-cyan-400/40 ring-4 ring-cyan-500/20"
                              : "border-slate-500 shadow-slate-500/20"
                          )}
                        >
                          <span className={cn(
                            "size-2 rounded-full",
                            isSelected ? "bg-cyan-400 animate-pulse" : "bg-slate-400"
                          )} />
                        </div>
                        <MarkerLabel position="bottom">
                          {marker.userId}
                        </MarkerLabel>
                      </MarkerContent>
                      <MarkerPopup className="w-80 p-0 bg-slate-955 border border-slate-900 shadow-2xl">
                        {/* Popup Header with slate theme */}
                        <div className="relative p-3.5 flex items-center gap-3 border-b border-slate-900 bg-slate-950">
                          <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-cyan-400">
                            <UserCheck className="size-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[9px] text-slate-500 font-extrabold tracking-widest uppercase">User Onboarding</p>
                            <h3 className="text-xs text-white font-bold font-mono truncate mt-0.5" title={marker.userId}>
                              {marker.userId}
                            </h3>
                          </div>
                        </div>

                        {/* Popup Body */}
                        <div className="p-4 space-y-3.5 text-xs bg-slate-950">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block">City</span>
                              <span className="text-slate-300 font-bold mt-0.5 block">{marker.city}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block">Country</span>
                              <span className="text-slate-300 font-bold mt-0.5 block">{marker.country}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block">IP Address</span>
                              <span className="text-slate-400 font-mono mt-0.5 block truncate" title={marker.ip}>{marker.ip}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block">Status</span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
                                {marker.step}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <Clock className="size-3 text-slate-600" />
                              {new Date(marker.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span>{new Date(marker.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </MarkerPopup>
                    </MapMarker>
                  );
                })}
              </Map>
            </div>
          </div>

          {/* Sidebar Panel Column (4/12) */}
          <div className="lg:col-span-4 flex flex-col space-y-5 h-[600px] overflow-hidden">
            {/* Active Users Count Card */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400">Total Filtered</span>
                <div className="text-2xl font-bold text-white font-mono mt-0.5">{filteredMarkers.length}</div>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-slate-400">Active Sessions</span>
                <div className="text-2xl font-bold text-cyan-400 font-mono mt-0.5">{onboardingMarkers.length}</div>
              </div>
            </div>

            {/* Interactive Users List & Selection Details */}
            <div className="flex-1 bg-slate-900/30 border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-350">Onboarding Session Logs</span>
                <span className="text-[10px] text-slate-500 font-mono">Real-time telemetry</span>
              </div>

              {/* Scrollable users list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredMarkers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-slate-650 p-4">
                    <Info className="size-6 text-slate-600 mb-2" />
                    <p className="text-xs font-medium">No sessions match current search criteria</p>
                  </div>
                ) : (
                  filteredMarkers.map((marker) => {
                    const isSelected = selectedUser?.id === marker.id;
                    const elapsed = formatDistanceToNow(new Date(marker.createdAt), { addSuffix: true });

                    return (
                      <div
                        key={marker.id}
                        onClick={() => handleFocusUser(marker)}
                        className={cn(
                          "p-3 rounded-xl border transition-all cursor-pointer group flex items-center justify-between",
                          isSelected
                            ? "bg-slate-900 border-slate-600 text-white"
                            : "bg-slate-950/20 border-slate-600 hover:bg-slate-950 hover:border-slate-500 text-slate-300"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <User className={cn("size-3.5 shrink-0", isSelected ? "text-cyan-400" : "text-slate-500")} />
                            <span className="text-xs font-semibold font-mono truncate">{marker.userId}</span>
                            <span className="inline-flex items-center px-1 rounded text-[9px] bg-slate-950 border border-slate-800 text-slate-400 capitalize">
                              {marker.step}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">{marker.city}, {marker.country}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-3 shrink-0">
                          <span className="text-[9px] text-slate-600 font-mono whitespace-nowrap">{elapsed}</span>
                          <ChevronRight className={cn(
                            "size-3.5 transition-transform",
                            isSelected ? "text-cyan-400 translate-x-0.5" : "text-slate-600 group-hover:text-slate-400"
                          )} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>


            </div>

          </div>

          {/* Selected User Metadata Inspector */}
          {selectedUser && (
            <div className="lg:col-span-12 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4 select-text w-full">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="size-4.5 text-cyan-400 animate-pulse" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest">Session Inspector</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-mono">Scope: {selectedUser.userId}</span>
                  <button
                    onClick={() => copyToClipboard(selectedUser.userId, "userId")}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-350 transition-colors"
                    title="Copy User ID"
                  >
                    {copiedId === "userId" ? <Check className="size-3.5 text-emerald-400" /> : <Clipboard className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
                {/* User ID */}
                <div className="p-3 bg-slate-950/40 border border-slate-700 rounded-xl space-y-1">
                  <span className="text-slate-500 text-[9px] uppercase tracking-wider font-semibold block">User ID</span>
                  <span className="text-slate-200 font-mono font-bold truncate block" title={selectedUser.userId}>
                    {selectedUser.userId}
                  </span>
                </div>

                {/* IP Address */}
                <div className="p-3 bg-slate-950/40 border border-slate-700 rounded-xl space-y-1">
                  <span className="text-slate-500 text-[9px] uppercase tracking-wider font-semibold block">IP Address</span>
                  <span className="text-slate-200 font-mono font-bold block">
                    {selectedUser.ip || "N/A"}
                  </span>
                </div>

                {/* Geolocation */}
                <div className="p-3 bg-slate-950/40 border border-slate-700 rounded-xl space-y-1">
                  <span className="text-slate-500 text-[9px] uppercase tracking-wider font-semibold block">Location</span>
                  <span className="text-slate-200 font-bold block truncate" title={`${selectedUser.city || ""}, ${selectedUser.country || ""}`}>
                    {selectedUser.city || "Unknown"}, {selectedUser.country || "Unknown"}
                  </span>
                </div>

                {/* Coordinates */}
                <div className="p-3 bg-slate-950/40 border border-slate-700 rounded-xl space-y-1">
                  <span className="text-slate-500 text-[9px] uppercase tracking-wider font-semibold block">Coordinates</span>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-slate-200 font-mono font-bold block truncate">
                      {selectedUser.lat.toFixed(4)}, {selectedUser.lng.toFixed(4)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(`${selectedUser.lat}, ${selectedUser.lng}`, "coords")}
                      className="text-slate-500 hover:text-slate-350 transition-colors p-0.5 rounded"
                      title="Copy Coordinates"
                    >
                      {copiedId === "coords" ? <Check className="size-3 text-emerald-400" /> : <Clipboard className="size-3" />}
                    </button>
                  </div>
                </div>

                {/* Current Step */}
                <div className="p-3 bg-slate-950/40 border border-slate-700 rounded-xl space-y-1">
                  <span className="text-slate-500 text-[9px] uppercase tracking-wider font-semibold block">Current Step</span>
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 capitalize mt-0.5">
                      {selectedUser.step || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Captured Time */}
                <div className="p-3 bg-slate-950/40 border border-slate-700 rounded-xl space-y-1">
                  <span className="text-slate-500 text-[9px] uppercase tracking-wider font-semibold block">Captured</span>
                  <span className="text-slate-200 font-bold block">
                    {new Date(selectedUser.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>

              {/* Custom Payload */}
              {selectedUser.metadata && Object.keys(selectedUser.metadata).length > 0 && (
                <div className="space-y-2">
                  <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider block">Custom Payload</span>
                  <div className="p-4 bg-slate-950/60 border border-slate-700 rounded-xl max-h-40 overflow-y-auto text-xs font-mono text-slate-300 leading-normal scrollbar-thin select-text">
                    <pre className="text-[11px] text-cyan-400/90 whitespace-pre-wrap">
                      {JSON.stringify(selectedUser.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}        </div>
      )}
    </div>
  );
}
