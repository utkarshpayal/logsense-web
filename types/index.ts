export interface User {
  id: string;
  name: string;
  email: string;
  slack_webhook_url?: string | null;
  discord_webhook_url?: string | null;
  email_alerts?: boolean;
  email_frequency?: string;
  min_severity?: string;
  slack_alerts?: boolean;
  discord_alerts?: boolean;
  retention_days?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  discord_webhook_url?: string | null;
  slack_webhook_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  project_id: string;
  environment: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Log {
  id: string;
  project_id: string;
  api_key_id: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  service?: string;
  environment?: string;
  metadata?: Record<string, any>;
  trace_id?: string;
  request_id?: string;
  hostname?: string;
  created_at: string;
}

export interface DashboardOverview {
  totalLogs: number;
  errorCount: number;
  errorRate: number;
  averageLatencyMs: number;
  activeApiKeys: number;
}

export interface DashboardTimelineItem {
  time_bucket: string;
  total_count: number;
  error_count: number;
  info_count: number;
  warn_count: number;
  debug_count: number;
}

export interface DashboardLogLevelItem {
  level: string;
  count: number;
}

export interface DashboardServiceItem {
  service: string;
  total_count: number;
  error_count: number;
  avg_latency: number;
}

export interface DashboardRecentErrorItem {
  id: string;
  message: string;
  level: string;
  service?: string;
  environment?: string;
  created_at: string;
  trace_id?: string;
}
