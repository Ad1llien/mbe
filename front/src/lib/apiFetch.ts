// apiFetch is no longer used — endpoints use ownerId query param instead
// Kept as passthrough for backward compatibility
export function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  return fetch(input, init);
}
