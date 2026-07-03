"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuthStore } from "../../../store/auth.store";
import { authApi } from "../../../lib/api";
import { Cpu, Mail, Lock, User, Loader2, ArrowRight } from "lucide-react";

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
    <div className="cyber-panel p-8 sm:p-10 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden group font-mono">
      {/* Glow corner accent */}
      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-cyan-500/5 blur-[50px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col items-center mb-8 relative z-10">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-650 shadow-lg shadow-cyan-500/20 mb-4 animate-spin" style={{ animationDuration: "12s" }}>
          <Cpu className="w-6 h-6 text-slate-900" />
        </div>
        <h2 className="text-sm font-extrabold text-white tracking-widest uppercase">
          {isLoginView ? "SYSTEM ACCESS" : "GENERATE CLIENT CREDENTIALS"}
        </h2>
        <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest leading-relaxed text-center">
          {isLoginView
            ? "Provide authorization keys to access dashboard telemetry"
            : "Register new developer credentials on LogSense stack"}
        </p>
      </div>

      {/* Form Content */}
      {isLoginView ? (
        <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-5 relative z-10 text-xs">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">
              Email Endpoint
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-650">
                <Mail className="h-3.5 w-3.5" />
              </span>
              <input
                type="email"
                placeholder="developer@logsense.com"
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-800 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
                {...registerLogin("email")}
                disabled={isSubmitting}
              />
            </div>
            {loginErrors.email && (
              <p className="text-[10px] text-rose-500 mt-1 font-bold uppercase tracking-wider">{loginErrors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">
              Security Key
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-655">
                <Lock className="h-3.5 w-3.5" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-800 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
                {...registerLogin("password")}
                disabled={isSubmitting}
              />
            </div>
            {loginErrors.password && (
              <p className="text-[10px] text-rose-500 mt-1 font-bold uppercase tracking-wider">{loginErrors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 hover:from-cyan-400 hover:to-indigo-600 text-slate-900 font-bold uppercase tracking-widest text-xs transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <span>Establish Session</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="space-y-5 relative z-10 text-xs">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">
              Operator Identifier
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-655">
                <User className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                placeholder="Alex Mercer"
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-800 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
                {...registerRegister("name")}
                disabled={isSubmitting}
              />
            </div>
            {registerErrors.name && (
              <p className="text-[10px] text-rose-500 mt-1 font-bold uppercase tracking-wider">{registerErrors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">
              Email Address
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-655">
                <Mail className="h-3.5 w-3.5" />
              </span>
              <input
                type="email"
                placeholder="developer@logsense.com"
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-800 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
                {...registerRegister("email")}
                disabled={isSubmitting}
              />
            </div>
            {registerErrors.email && (
              <p className="text-[10px] text-rose-500 mt-1 font-bold uppercase tracking-wider">{registerErrors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-400 uppercase tracking-widest text-[10px]">
              Security Key
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-655">
                <Lock className="h-3.5 w-3.5" />
              </span>
              <input
                type="password"
                placeholder="At least 8 characters"
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-800 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/10 transition-all font-mono"
                {...registerRegister("password")}
                disabled={isSubmitting}
              />
            </div>
            {registerErrors.password && (
              <p className="text-[10px] text-rose-500 mt-1 font-bold uppercase tracking-wider">{registerErrors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 hover:from-cyan-400 hover:to-indigo-600 text-slate-900 font-bold uppercase tracking-widest text-xs transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <span>Generate Profile</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Switch link */}
      <div className="mt-6 text-center relative z-10">
        <button
          onClick={toggleView}
          disabled={isSubmitting}
          className="text-xs font-bold text-slate-500 hover:text-cyan-400 uppercase tracking-widest transition-colors focus:outline-none cursor-pointer"
        >
          {isLoginView ? (
            <>
              Register client? <span className="text-cyan-400 hover:underline">Execute creation</span>
            </>
          ) : (
            <>
              Already registered? <span className="text-cyan-400 hover:underline">Verify Identity</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
