#!/bin/bash

echo "🚀 Starting Groupon Admin Prototype..."
echo ""
echo "📦 Installing dependencies..."
cd frontend && npm install && cd ..

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "Starting frontend..."
echo "  Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the service"
echo ""

# Start frontend
cd frontend && npm run dev

