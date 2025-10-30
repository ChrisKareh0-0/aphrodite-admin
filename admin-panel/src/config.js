// Use relative URL for API calls when admin panel is served from backend
export const API_URL = '/api';

// Use local backend for images in development, production otherwise
export const IMAGE_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001/api'
    : 'https://aphrodite-admin.onrender.com/api';

// Image helpers
export const getImageUrl = (path) => {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path;
  return `${IMAGE_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};