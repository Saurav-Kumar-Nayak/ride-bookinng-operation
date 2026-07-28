// API base URL — points to Render backend in production, local in dev
const API_BASE = import.meta.env.VITE_API_URL || '';

export default API_BASE;
