const configuredApiBase = import.meta.env.VITE_API_BASE_URL;

export const API_BASE = (configuredApiBase || 'http://localhost:5000/api/v1').replace(/\/+$/, '');
