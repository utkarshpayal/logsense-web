import { api } from "./axios";
import {
  User,
  Project,
  ApiKey,
  Log,
  DashboardOverview,
  DashboardTimelineItem,
  DashboardLogLevelItem,
  DashboardServiceItem,
  DashboardRecentErrorItem,
} from "../types";

// Auth API types
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface MeResponse {
  success: boolean;
  data: User;
}

// Common response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiLogsResponse {
  success: boolean;
  data: Log[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface GetLogsQueryParams {
  projectId?: string;
  level?: "debug" | "info" | "warn" | "error";
  service?: string;
  environment?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "level" | "service" | "environment";
  sortOrder?: "ASC" | "DESC";
}

export const authApi = {
  login: async (data: any): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/login", data);
    return res.data;
  },
  register: async (data: any): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/register", data);
    return res.data;
  },
  logout: async (): Promise<{ success: boolean; message: string }> => {
    const res = await api.post<{ success: boolean; message: string }>("/auth/logout");
    return res.data;
  },
  me: async (): Promise<MeResponse> => {
    const res = await api.get<MeResponse>("/auth/me");
    return res.data;
  },
};

export const projectApi = {
  getProjects: async (): Promise<ApiResponse<Project[]>> => {
    const res = await api.get<ApiResponse<Project[]>>("/projects");
    return res.data;
  },
  getProject: async (id: string): Promise<ApiResponse<Project>> => {
    const res = await api.get<ApiResponse<Project>>(`/projects/${id}`);
    return res.data;
  },
  createProject: async (data: { name: string; description?: string }): Promise<ApiResponse<Project>> => {
    const res = await api.post<ApiResponse<Project>>("/projects", data);
    return res.data;
  },
  updateProject: async (id: string, data: { name?: string; description?: string }): Promise<ApiResponse<Project>> => {
    const res = await api.put<ApiResponse<Project>>(`/projects/${id}`, data);
    return res.data;
  },
  deleteProject: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<{ success: boolean; message: string }>(`/projects/${id}`);
    return res.data;
  },
};

export const apiKeyApi = {
  getApiKeys: async (projectId: string): Promise<ApiResponse<ApiKey[]>> => {
    const res = await api.get<ApiResponse<ApiKey[]>>(`/api-keys/projects/${projectId}`);
    return res.data;
  },
  createApiKey: async (
    projectId: string,
    data: { name: string; environment: string }
  ): Promise<ApiResponse<ApiKey>> => {
    const res = await api.post<ApiResponse<ApiKey>>(`/api-keys/projects/${projectId}`, data);
    return res.data;
  },
  deleteApiKey: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<{ success: boolean; message: string }>(`/api-keys/${id}`);
    return res.data;
  },
  rotateApiKey: async (id: string): Promise<ApiResponse<ApiKey>> => {
    const res = await api.post<ApiResponse<ApiKey>>(`/api-keys/${id}/rotate`);
    return res.data;
  },
  updateApiKeyStatus: async (id: string, isActive: boolean): Promise<ApiResponse<ApiKey>> => {
    const res = await api.patch<ApiResponse<ApiKey>>(`/api-keys/${id}/status`, { isActive });
    return res.data;
  },
};

export const logsApi = {
  getLogs: async (params?: GetLogsQueryParams): Promise<ApiLogsResponse> => {
    const res = await api.get<ApiLogsResponse>("/logs", { params });
    return res.data;
  },
  getLog: async (id: string): Promise<ApiResponse<Log>> => {
    const res = await api.get<ApiResponse<Log>>(`/logs/${id}`);
    return res.data;
  },
  deleteLog: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<{ success: boolean; message: string }>(`/logs/${id}`);
    return res.data;
  },
};

export const dashboardApi = {
  getOverview: async (projectId?: string): Promise<ApiResponse<DashboardOverview>> => {
    const res = await api.get<ApiResponse<DashboardOverview>>("/dashboard/overview", {
      params: { projectId },
    });
    return res.data;
  },
  getTimeline: async (projectId?: string): Promise<ApiResponse<DashboardTimelineItem[]>> => {
    const res = await api.get<ApiResponse<DashboardTimelineItem[]>>("/dashboard/timeline", {
      params: { projectId },
    });
    return res.data;
  },
  getLogLevels: async (projectId?: string): Promise<ApiResponse<DashboardLogLevelItem[]>> => {
    const res = await api.get<ApiResponse<DashboardLogLevelItem[]>>("/dashboard/log-levels", {
      params: { projectId },
    });
    return res.data;
  },
  getServices: async (projectId?: string): Promise<ApiResponse<DashboardServiceItem[]>> => {
    const res = await api.get<ApiResponse<DashboardServiceItem[]>>("/dashboard/services", {
      params: { projectId },
    });
    return res.data;
  },
  getRecentErrors: async (projectId?: string): Promise<ApiResponse<DashboardRecentErrorItem[]>> => {
    const res = await api.get<ApiResponse<DashboardRecentErrorItem[]>>("/dashboard/recent-errors", {
      params: { projectId },
    });
    return res.data;
  },
};

export interface AiChatResponse {
  success: boolean;
  message?: string;
  answer?: string;
  sql?: string;
  explanation?: string;
  data?: any[];
  errorType?: string;
}

export const aiApi = {
  chat: async (projectId: string, prompt: string): Promise<AiChatResponse> => {
    const res = await api.post<AiChatResponse>(`/projects/${projectId}/ai/chat`, { prompt });
    return res.data;
  },
};
