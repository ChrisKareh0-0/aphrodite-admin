// Always use production backend for API calls
export const API_URL = 'https://aphrodite-admin.onrender.com/api';

// Always use production backend for images
// Serve images from the root uploads path on the backend
export const IMAGE_BASE_URL = 'https://aphrodite-admin.onrender.com';

// Image helpers
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${IMAGE_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};