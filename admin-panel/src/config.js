// Always use production backend for API calls
export const API_URL = 'https://aphrodite-admin.onrender.com/api';

// Always use production backend for images
export const IMAGE_BASE_URL = 'https://aphrodite-admin.onrender.com/api';

// Image helpers
export const getImageUrl = (path) => {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path;
  return `${IMAGE_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};