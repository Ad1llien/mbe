/**
 * Backend API base URL.
 * Development: http://localhost:3000  (from .env)
 * Production:  set VITE_API_URL in Vercel project settings
 */
export const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
