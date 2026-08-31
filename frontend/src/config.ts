// Central API Configuration
// Automatically ensures `/api` is included regardless of how VITE_API_URL is formatted
let rawUrl = (import.meta.env.VITE_API_URL as string || 'http://localhost:8000/api').trim().replace(/\/+$/, '');
if (!rawUrl.endsWith('/api')) {
  rawUrl = `${rawUrl}/api`;
}

export const API_BASE_URL = rawUrl;
