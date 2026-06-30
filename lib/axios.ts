import axios from "axios";
import { useAuthStore } from "../store/auth.store";

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
    const token =
        typeof window !== "undefined"
            ? localStorage.getItem("accessToken")
            : null;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = "Bearer " + token;
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken =
                typeof window !== "undefined"
                    ? localStorage.getItem("refreshToken")
                    : null;

            if (!refreshToken) {
                isRefreshing = false;
                useAuthStore.getState().logout();
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
                    { refreshToken }
                );

                if (response.data?.success && response.data?.data) {
                    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
                    const user = useAuthStore.getState().user;
                    
                    // Update store and localStorage
                    useAuthStore.getState().setAuth(user, accessToken, newRefreshToken);

                    processQueue(null, accessToken);
                    isRefreshing = false;

                    originalRequest.headers.Authorization = "Bearer " + accessToken;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;
                useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);