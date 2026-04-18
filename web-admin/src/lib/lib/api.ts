import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiResponse } from "@/types/api";
import { showErrorToast } from "./error-toast";
import { authStorage } from "./auth-storage";
import { logTokenStatus, getTokenInfo, formatTimeRemaining } from "./token-utils";

// Determina l'API URL in base all'ambiente
// IMPORTANTE: Questa funzione viene eseguita nel browser, non durante il build
// L'URL deve includere /api perché axios lo usa come baseURL
const getApiUrl = () => {
  // Se è configurato esplicitamente, usa quello + /api
  if (process.env.NEXT_PUBLIC_API_URL) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    // Se l'URL non termina già con /api, aggiungilo
    return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  }
  
  // Se siamo nel browser (non durante SSR)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Se siamo su Railway (non localhost)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // URL del backend su Railway (con /api perché axios lo usa come baseURL)
      return 'https://api-gateway-production-55d4.up.railway.app/api';
    }
  }
  
  // Fallback a localhost per sviluppo
  return "http://localhost:3000/api";
};

// Crea l'istanza axios con baseURL dinamico
const createApiInstance = () => {
  const baseURL = getApiUrl();
  
  // Log dell'URL in uso (solo in development o nel browser)
  if (typeof window !== 'undefined') {
    console.log('🔗 API URL:', baseURL);
  }
  
  return axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

// Create axios instance
export const api = createApiInstance();

// Export API_URL for use in other parts of the app
export const API_URL = getApiUrl();

const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh"];

const waitForAccessToken = async (timeoutMs = 3000, intervalMs = 25): Promise<string | null> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const token = authStorage.getAccessToken();
    if (token && token !== "null" && token !== "undefined") {
      // Validate token format (should be JWT with 3 parts)
      const parts = token.split('.');
      if (parts.length === 3) {
        return token;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return null;
};

// Request interceptor - Add token to requests
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const url = config.url || "";
      const isAuthRequest = AUTH_PATHS.some((path) => url.includes(path));
      if (isAuthRequest) {
        return config;
      }

      let token = authStorage.getAccessToken();
      
      // If no token immediately available, wait for it
      if (!token || token === "null" || token === "undefined") {
        console.debug("🔍 No immediate token found, waiting...");
        token = await waitForAccessToken();
      }

      // Validate token format
      if (token) {
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.warn("⚠️ Invalid JWT token format, clearing token");
          authStorage.clearTokens();
          token = null;
        }
      }

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;

        // Log token status in development mode
        if (process.env.NODE_ENV === "development") {
          console.debug("🔐 Auth header set for request:", url);
          const tokenInfo = getTokenInfo();
          if (tokenInfo.accessToken.isExpiringSoon) {
            console.warn("⚠️ Access token sta per scadere:", formatTimeRemaining(tokenInfo.accessToken.expiresIn));
          }
        }
      } else {
        // Log warning if no token is available
        if (process.env.NODE_ENV === "development") {
          console.warn("⚠️ Nessun access token disponibile per la richiesta:", config.url);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

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

// Helper function to get user role from localStorage
const getUserRole = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const rawAuthState = authStorage.getAuthStateRaw();
    if (rawAuthState) {
      const parsed = JSON.parse(rawAuthState);
      return parsed?.state?.user?.ruolo || null;
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return null;
};

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 403 errors: don't show toast for admin users (normal behavior)
    if (error.response?.status === 403) {
      const userRole = getUserRole();
      // If user is admin, 403 errors are expected (normal access control)
      // Don't show toast to avoid noise
      if (userRole === "admin") {
        // Silently reject for admin - this is normal behavior
        return Promise.reject(error);
      }
      // For non-admin users, show error toast
      showErrorToast(error, "Accesso negato");
      return Promise.reject(error);
    }

    // Handle other client errors (400, 404, 422, etc.) - show toast
    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      // Skip 401 as it's handled by refresh token logic
      if (error.response.status !== 401) {
        showErrorToast(error, "Errore");
      }
      return Promise.reject(error);
    }

    // Handle server errors (500+) - show toast
    if (error.response?.status && error.response.status >= 500) {
      showErrorToast(error, "Errore del server");
      return Promise.reject(error);
    }

    // Handle network errors (no response)
    if (!error.response) {
      showErrorToast(new Error("Impossibile connettersi al server. Verifica la connessione internet."), "Errore di connessione");
      return Promise.reject(error);
    }

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Log token status in development mode
      if (process.env.NODE_ENV === 'development') {
        console.group('🔄 Tentativo refresh token');
        logTokenStatus();
        console.log('Richiesta originale:', originalRequest.url);
        console.groupEnd();
      }

      if (isRefreshing) {
        // Queue this request
        if (process.env.NODE_ENV === 'development') {
          console.log('⏳ Refresh già in corso, metto in coda la richiesta:', originalRequest.url);
        }
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = authStorage.getRefreshToken();
        if (!refreshToken) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Nessun refresh token disponibile');
          }
          throw new Error("No refresh token");
        }

        // Verifica se il refresh token è ancora valido
        const tokenInfo = getTokenInfo();
        if (!tokenInfo.refreshToken.isValid) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Refresh token scaduto:', formatTimeRemaining(tokenInfo.refreshToken.expiresIn));
          }
          throw new Error("Refresh token expired");
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Chiamata endpoint refresh token...');
        }

        const response = await axios.post<
          ApiResponse<{ accessToken: string; refreshToken: string }> | { accessToken: string; refreshToken: string }
        >(`${API_URL}/auth/refresh`, {}, {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        });

        const payload =
          "data" in response.data ? response.data.data : response.data;
        const { accessToken, refreshToken: newRefreshToken } = payload;
        authStorage.setTokens(accessToken, newRefreshToken);

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Token refreshato con successo');
          logTokenStatus();
        }

        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Log dettagliato dell'errore in development
        if (process.env.NODE_ENV === 'development') {
          console.group('❌ Errore durante refresh token');
          console.error('Errore:', refreshError);
          if (refreshError.response) {
            console.error('Status:', refreshError.response.status);
            console.error('Data:', refreshError.response.data);
          }
          logTokenStatus();
          console.groupEnd();
        }
        
        // Clear tokens and auth store, then redirect to login
        if (typeof window !== "undefined") {
          authStorage.clearAllAuth();
          
          // Mostra messaggio più chiaro all'utente
          if (process.env.NODE_ENV === 'development') {
            console.log('🔐 Reindirizzamento al login...');
          }
          
          // Use window.location.href for hard redirect to prevent loops
          window.location.href = "/login";
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
