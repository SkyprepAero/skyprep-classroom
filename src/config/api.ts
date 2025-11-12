const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
export const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1'
export const API_URL = `${API_BASE_URL.replace(/\/$/, '')}/${API_VERSION}`
export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT_MS || 10_000)