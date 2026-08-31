// Central API Configuration
// Reads VITE_API_URL from environment variables in production (e.g., Render backend URL)
// Defaults to local backend URL during local development
export const API_BASE_URL = (import.meta.env.VITE_API_URL as string || 'http://localhost:8000/api').replace(/\/+$/, '');
