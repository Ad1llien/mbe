import { useAuthStore } from "@/store/authStore";

/**
 * Wrapper around fetch that automatically adds Authorization header
 * and the API base URL prefix when given a relative path.
 */
export function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().token;
  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(!init.body || typeof init.body !== "string" ? {} : { "Content-Type": "application/json" }),
    },
  });
}
