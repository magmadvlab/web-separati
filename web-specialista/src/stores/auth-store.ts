import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authService } from "@/lib/auth";
import { authStorage } from "@/lib/auth-storage";
import { analyzeToken } from "@/lib/token-utils";
import type { User, LoginRequest, RegisterRequest } from "@/types/api";

interface AuthState {
  user: User | null;
  token: string | null;
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
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(credentials);

          authStorage.clearTokens();
          authStorage.setTokens(response.accessToken, response.refreshToken);

          const savedAccessToken = authStorage.getAccessToken();
          const savedRefreshToken = authStorage.getRefreshToken();

          if (
            savedAccessToken === response.accessToken &&
            savedRefreshToken === response.refreshToken
          ) {
            console.log("✅ Token salvati correttamente in SessionStorage");
          } else {
            console.error("❌ Errore nel salvataggio dei token in SessionStorage");
            throw new Error("Failed to save tokens to sessionStorage");
          }
          
          // Set tokens in axios defaults
          authService.setTokens(response.accessToken, response.refreshToken);
          
          // Update auth state
          set({
            user: response.user as User,
            token: response.accessToken,
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
          authStorage.setTokens(response.accessToken, response.refreshToken);
          authService.setTokens(response.accessToken, response.refreshToken);
          set({
            user: response.user as User,
            token: response.accessToken,
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
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        authStorage.clearAllAuth();
        // Chiama authService.logout che fa il redirect
        authService.logout();
      },

      setUser: (user: User | null) => {
        set({
          user,
          token: authStorage.getAccessToken(),
          isAuthenticated: !!user,
        });
      },

      refreshToken: async () => {
        try {
          const tokens = await authService.refreshToken();
          authStorage.setTokens(tokens.accessToken, tokens.refreshToken);
          authService.setTokens(tokens.accessToken, tokens.refreshToken);
          set({ token: tokens.accessToken, isAuthenticated: true });
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => () => {
        const accessToken = authStorage.getAccessToken();
        if (!accessToken) {
          useAuthStore.setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }
        const tokenInfo = analyzeToken(accessToken);
        if (!tokenInfo.isValid) {
          authStorage.clearAllAuth();
          useAuthStore.setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } else {
          useAuthStore.setState({ token: accessToken, isLoading: false });
        }
      },
    }
  )
);
