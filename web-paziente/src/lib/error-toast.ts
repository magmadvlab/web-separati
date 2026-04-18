"use client";

export function showErrorToast(error: unknown, fallbackTitle = "Errore") {
  if (typeof window === "undefined") {
    return;
  }

  const maybeAxios = error as { response?: { data?: { message?: string; error?: { message?: string } } } };
  const message =
    maybeAxios?.response?.data?.error?.message ||
    maybeAxios?.response?.data?.message ||
    (error instanceof Error ? error.message : fallbackTitle);

  console.error(fallbackTitle, message, error);
}
