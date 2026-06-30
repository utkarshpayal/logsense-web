"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuthStore } from "../../../store/auth.store";
import { authApi } from "../../../lib/api";
import { Activity, Mail, Lock, User, Loader2, ArrowRight } from "lucide-react";

// Form validation schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address").trim(),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
  email: z.string().email("Please enter a valid email address").trim(),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoginView, setIsLoginView] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form hook
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLoginForm,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // Register form hook
  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
    reset: resetRegisterForm,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onLoginSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await authApi.login(values);
      if (response.success && response.data) {
        setAuth(response.data.user, response.data.accessToken, response.data.refreshToken);
        toast.success("Successfully logged in!");
        router.push("/dashboard");
      } else {
        toast.error(response.message || "Failed to log in");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await authApi.register(values);
      if (response.success && response.data) {
        setAuth(response.data.user, response.data.accessToken, response.data.refreshToken);
        toast.success("Account created successfully!");
        router.push("/dashboard");
      } else {
        toast.error(response.message || "Failed to register");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed. Try a different email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    resetLoginForm();
    resetRegisterForm();
  };

  return (
    <div className="glass-panel p-8 sm:p-10 rounded-2xl border border-zinc-800 shadow-2xl glow-indigo relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30 mb-4 animate-bounce" style={{ animationDuration: '3s' }}>
          <Activity className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {isLoginView ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          {isLoginView
            ? "Sign in to monitor and query your logs"
            : "Get started with AI-powered observability"}
        </p>
      </div>

      {/* Form Content */}
      {isLoginView ? (
        <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                type="email"
                placeholder="developer@logsense.com"
                className="block w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                {...registerLogin("email")}
                disabled={isSubmitting}
              />
            </div>
            {loginErrors.email && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{loginErrors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                className="block w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                {...registerLogin("password")}
                disabled={isSubmitting}
              />
            </div>
            {loginErrors.password && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">
                {loginErrors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-indigo-600/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <User className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                placeholder="Alex Mercer"
                className="block w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                {...registerRegister("name")}
                disabled={isSubmitting}
              />
            </div>
            {registerErrors.name && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{registerErrors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                type="email"
                placeholder="developer@logsense.com"
                className="block w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                {...registerRegister("email")}
                disabled={isSubmitting}
              />
            </div>
            {registerErrors.email && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">
                {registerErrors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                placeholder="At least 8 characters"
                className="block w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                {...registerRegister("password")}
                disabled={isSubmitting}
              />
            </div>
            {registerErrors.password && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">
                {registerErrors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-indigo-600/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <>
                Create Account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Switch link */}
      <div className="mt-6 text-center">
        <button
          onClick={toggleView}
          disabled={isSubmitting}
          className="text-xs font-medium text-zinc-450 hover:text-indigo-400 transition-colors focus:outline-none"
        >
          {isLoginView ? (
            <>
              Don't have an account? <span className="text-indigo-500 font-semibold">Sign up</span>
            </>
          ) : (
            <>
              Already have an account? <span className="text-indigo-500 font-semibold">Sign in</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
