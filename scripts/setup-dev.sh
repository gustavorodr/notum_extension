#!/bin/bash

# Development script for Notum browser extension

set -e

echo "🚀 Starting Notum development environment..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Type checking
echo "🔍 Running type checks..."
npm run type-check

# Build in development mode
echo "🏗️ Building extension..."
npm run build:dev

echo "✅ Development build complete!"
echo ""
echo "📖 Next steps:"
echo "1. Open Chrome/Firefox and go to Extensions page"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked' and select the 'dist' folder"
echo "4. Run 'npm run dev' in another terminal for watch mode"
echo ""
echo "🔧 Available commands:"
echo "- npm run dev        : Watch mode for development"
echo "- npm run build      : Production build"
echo "- npm run lint       : Run linter"
echo "- npm run test       : Run tests"