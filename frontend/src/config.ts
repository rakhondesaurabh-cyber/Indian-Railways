// Central API Configuration
// Automatically ensures `/api` is included regardless of how VITE_API_URL is formatted
export const getApiBaseUrl = (): string => {
  try {
    const custom = typeof window !== 'undefined' ? localStorage.getItem('RAIL_BACKEND_URL') : null;
    let rawUrl = (custom || import.meta.env.VITE_API_URL as string || 'http://localhost:8000/api').trim().replace(/\/+$/, '');
    if (!rawUrl.endsWith('/api')) {
      rawUrl = `${rawUrl}/api`;
    }
    return rawUrl;
  } catch {
    return 'http://localhost:8000/api';
  }
};

export const setCustomApiUrl = (url: string) => {
  try {
    if (typeof window !== 'undefined') {
      let clean = url.trim().replace(/\/+$/, '');
      if (clean && !clean.endsWith('/api')) {
        clean = `${clean}/api`;
      }
      if (clean) {
        localStorage.setItem('RAIL_BACKEND_URL', clean);
      } else {
        localStorage.removeItem('RAIL_BACKEND_URL');
      }
      window.location.reload();
    }
  } catch (e) {
    console.error('Error saving backend URL:', e);
  }
};

export const API_BASE_URL = getApiBaseUrl();
