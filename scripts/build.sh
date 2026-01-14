#!/bin/bash

# Build script for Notum browser extension

set -e

BUILD_TYPE=${1:-production}

echo "🏗️ Building Notum extension for $BUILD_TYPE..."

# Clean previous build
echo "🧹 Cleaning previous build..."
npm run clean

# Type checking
echo "🔍 Running type checks..."
npm run type-check

# Linting
echo "📝 Running linter..."
npm run lint

# Build
if [ "$BUILD_TYPE" = "production" ]; then
    echo "📦 Building for production..."
    npm run build
else
    echo "🛠️ Building for development..."
    npm run build:dev
fi

echo "✅ Build complete!"

# Show build info
if [ -d "dist" ]; then
    echo ""
    echo "📊 Build information:"
    echo "Build type: $BUILD_TYPE"
    echo "Output directory: dist/"
    echo "Files created:"
    ls -la dist/
    
    echo ""
    echo "📦 Extension ready to load:"
    echo "1. Open Chrome/Firefox extensions page"
    echo "2. Enable Developer mode"
    echo "3. Click 'Load unpacked' and select 'dist' folder"
fi