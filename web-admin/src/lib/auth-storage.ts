const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const AUTH_STATE_KEY = "auth-storage";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const getStorages = (): { session: StorageLike; local: StorageLike } | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return {
    session: window.sessionStorage,
    local: window.localStorage,
  };
};

const read = (storage: StorageLike, key: string): string | null => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const write = (storage: StorageLike, key: string, value: string): void => {
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore storage write failures (private mode/quota)
  }
};

const remove = (storage: StorageLike, key: string): void => {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage remove failures
  }
};

const getWithMigration = (key: string): string | null => {
  const storages = getStorages();
  if (!storages) {
    return null;
  }

  const sessionValue = read(storages.session, key);
  if (sessionValue !== null) {
    return sessionValue;
  }

  const legacyLocalValue = read(storages.local, key);
  if (legacyLocalValue !== null) {
    write(storages.session, key, legacyLocalValue);
    remove(storages.local, key);
  }

  return legacyLocalValue;
};

const setSessionValue = (key: string, value: string): void => {
  const storages = getStorages();
  if (!storages) {
    return;
  }

  write(storages.session, key, value);
  remove(storages.local, key);
};

const clearKey = (key: string): void => {
  const storages = getStorages();
  if (!storages) {
    return;
  }

  remove(storages.session, key);
  remove(storages.local, key);
};

export const authStorage = {
  getAccessToken(): string | null {
    return getWithMigration(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return getWithMigration(REFRESH_TOKEN_KEY);
  },

  getAuthStateRaw(): string | null {
    return getWithMigration(AUTH_STATE_KEY);
  },

  setTokens(accessToken: string, refreshToken: string): void {
    setSessionValue(ACCESS_TOKEN_KEY, accessToken);
    setSessionValue(REFRESH_TOKEN_KEY, refreshToken);
  },

  setAccessToken(accessToken: string): void {
    setSessionValue(ACCESS_TOKEN_KEY, accessToken);
    clearKey(REFRESH_TOKEN_KEY);
  },

  clearTokens(): void {
    clearKey(ACCESS_TOKEN_KEY);
    clearKey(REFRESH_TOKEN_KEY);
  },

  clearAuthState(): void {
    clearKey(AUTH_STATE_KEY);
  },

  clearAllAuth(): void {
    clearKey(ACCESS_TOKEN_KEY);
    clearKey(REFRESH_TOKEN_KEY);
    clearKey(AUTH_STATE_KEY);
  },
};
