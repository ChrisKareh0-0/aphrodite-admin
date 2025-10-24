#!/bin/bash

echo "🚀 Building admin panel with production configuration..."

# Change to admin-panel directory
cd "$(dirname "$0")/../admin-panel"

# Install dependencies if needed
npm install

# Build with production environment
REACT_APP_API_URL=https://aphrodite-admin.onrender.com/api npm run build

echo "✅ Admin panel build completed!"