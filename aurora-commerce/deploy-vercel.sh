#!/bin/bash

# 🚀 AURORA COMMERCE - VERCEL DEPLOYMENT SCRIPT
# Run this script from the aurora-commerce directory

echo "🚀 Starting Aurora Commerce Vercel Deployment..."
echo "================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the aurora-commerce directory"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Run build test
echo "🏗️ Running build test..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix build errors before deploying."
    exit 1
fi

echo "✅ Build successful!"

# Environment variables check
echo "🔧 Checking environment variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "⚠️  Warning: NEXT_PUBLIC_SUPABASE_URL not set"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY not set"
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Deployment completed!"
echo "📋 Next steps:"
echo "   1. Configure environment variables in Vercel dashboard"
echo "   2. Set up custom domain (optional)"
echo "   3. Run database setup scripts in Supabase"
echo "   4. Test all functionality in production"
echo ""
echo "📚 For detailed instructions, see VERCEL_DEPLOYMENT_ANALYSIS.md"