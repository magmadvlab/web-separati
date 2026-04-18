import api from "./api";
import { getErrorMessage } from "@/hooks/useErrorHandler";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiResponse,
} from "@/types/api";

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse> | AuthResponse>(
        "/auth/login",
        credentials
      );
      const payload =
        "data" in response.data ? response.data.data : response.data;
      return payload;
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      throw new Error(message || "Errore durante il login");
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse> | AuthResponse>(
      "/auth/register",
      data
    );
    const payload =
      "data" in response.data ? response.data.data : response.data;
    return payload;
  },

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await api.post<
      ApiResponse<{ accessToken: string; refreshToken: string }> | AuthResponse
    >("/auth/refresh", {}, {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });
    const payload =
      "data" in response.data ? response.data.data : response.data;
    return {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    };
  },

  logout(): void {
    if (typeof window !== "undefined") {
      // Rimuovi tutti i token
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      delete api.defaults.headers.common.Authorization;
      
      // Rimuovi anche lo storage persistente di Zustand
      localStorage.removeItem("auth-storage");
      
      // Forza un hard reload per pulire completamente lo stato
      window.location.href = "/login";
    }
  },

  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  },

  getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refreshToken");
    }
    return null;
  },

  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    }
  },
};
