"use client";

import { useMemo } from "react";

import { authStorage } from "@/lib/auth-storage";
import { useAuthStore } from "@/stores/auth-store";

export function useAuth() {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();

  const token = useMemo(() => authStorage.getAccessToken(), [isAuthenticated, user]);

  return {
    user,
    token,
    loading: isLoading,
    error: null as string | null,
    isAuthenticated,
    logout,
  };
}
