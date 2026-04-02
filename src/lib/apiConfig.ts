// Central API base URL — reads from env var in production, falls back to localhost for dev
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
