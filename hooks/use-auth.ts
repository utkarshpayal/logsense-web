import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../store/auth.store";

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, isAuthenticated, isLoading, initialize, logout } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.replace("/login");
      } else if (!requireAuth && isAuthenticated && pathname === "/login") {
        router.replace("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, requireAuth, router, pathname]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    logout,
  };
}
