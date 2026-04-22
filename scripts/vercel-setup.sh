#!/bin/bash

# Vercel Environment Setup Script
# Run: chmod +x scripts/vercel-setup.sh && ./scripts/vercel-setup.sh

echo "=== Vercel Environment Setup ==="

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo "1. Login to Vercel (will open browser):"
echo "   vercel login"
echo ""
echo "2. After login, run these commands:"
echo ""
echo "   # Link project"
echo "   vercel link"
echo ""
echo "   # Add environment variables (production)"
echo '   vercel env add MONGODB_URI production'
echo "   # Enter: mongodb+srv://abcd:abcd@cluster0.4acsjko.mongodb.net/amyalcar?appName=Cluster0"
echo ""
echo '   vercel env add JWT_SECRET production'
echo "   # Enter: your-very-long-random-secret-here"
echo ""
echo '   vercel env add NEXT_PUBLIC_APP_URL production'
echo "   # Enter: https://your-project.vercel.app"
echo ""
echo "3. Redeploy:"
echo "   vercel --prod redeploy"
echo ""
echo "=== OR manually in Vercel Dashboard ==="
echo "Go to: Vercel Dashboard > Your Project > Settings > Environment Variables"
echo "Add:"
echo "  MONGODB_URI = mongodb+srv://abcd:abcd@cluster0.4acsjko.mongodb.net/amyalcar?appName=Cluster0"
echo "  JWT_SECRET = your-very-long-random-secret-here"
echo "  NEXT_PUBLIC_APP_URL = https://project-xztxa.vercel.app"
echo ""
echo "Then Redeploy from Deployments tab"