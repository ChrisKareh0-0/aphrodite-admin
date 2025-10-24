// Use relative URL for API calls when admin panel is served from backend
export const API_URL = '/api';

// Always use production URL for image uploads and previews
export const IMAGE_BASE_URL = 'https://aphrodite-admin.onrender.com/api';

// Image helpers
export const getImageUrl = (path) => {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path;
  return `${IMAGE_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};