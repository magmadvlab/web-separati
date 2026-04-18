import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "@/lib/auth";
import { analyzeToken } from "@/lib/token-utils";
import type { User, LoginRequest, RegisterRequest } from "@/types/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(credentials);
          if (typeof window !== "undefined") {
            // Clear any existing tokens first
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            
            // Set new tokens
            localStorage.setItem("accessToken", response.accessToken);
            localStorage.setItem("refreshToken", response.refreshToken);
            
            // Verify tokens were saved correctly
            const savedAccessToken = localStorage.getItem("accessToken");
            const savedRefreshToken = localStorage.getItem("refreshToken");
            
            if (savedAccessToken === response.accessToken && savedRefreshToken === response.refreshToken) {
              console.log("✅ Token salvati correttamente in LocalStorage");
            } else {
              console.error("❌ Errore nel salvataggio dei token in LocalStorage");
              throw new Error("Failed to save tokens to localStorage");
            }
          }
          
          // Set tokens in axios defaults
          authService.setTokens(response.accessToken, response.refreshToken);
          
          // Update auth state
          set({
            user: response.user as User,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(data);
          if (typeof window !== "undefined") {
            localStorage.setItem("accessToken", response.accessToken);
            localStorage.setItem("refreshToken", response.refreshToken);
          }
          authService.setTokens(response.accessToken, response.refreshToken);
          set({
            user: response.user as User,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        // Pulisci lo stato prima di chiamare authService.logout
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        // Pulisci anche lo storage persistente
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth-storage");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
        // Chiama authService.logout che fa il redirect
        authService.logout();
      },

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      refreshToken: async () => {
        try {
          const tokens = await authService.refreshToken();
          if (typeof window !== "undefined") {
            localStorage.setItem("accessToken", tokens.accessToken);
            localStorage.setItem("refreshToken", tokens.refreshToken);
          }
          authService.setTokens(tokens.accessToken, tokens.refreshToken);
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => () => {
        if (typeof window === "undefined") {
          return;
        }
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
        const tokenInfo = analyzeToken(accessToken);
        if (!tokenInfo.isValid) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("auth-storage");
          useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }
  )
);
