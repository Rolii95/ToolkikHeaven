#!/bin/bash

# 📁 MOVE AURORA-COMMERCE TO ROOT FOR VERCEL DEPLOYMENT
# This script moves all files from aurora-commerce/ to the root directory

echo "🚀 Moving Aurora Commerce files to root for Vercel deployment..."
echo "================================================================"

# Check if we're in the right directory
if [ ! -d "aurora-commerce" ]; then
    echo "❌ Error: aurora-commerce directory not found!"
    exit 1
fi

# Create backup directory
echo "📦 Creating backup of current structure..."
mkdir -p backup_$(date +%Y%m%d_%H%M%S)
cp -r aurora-commerce backup_$(date +%Y%m%d_%H%M%S)/

# Move aurora-mobile to a safe location first
if [ -d "aurora-mobile" ]; then
    echo "📱 Preserving aurora-mobile directory..."
    mv aurora-mobile temp_aurora_mobile
fi

# Create apps directory for organization
echo "📁 Creating apps directory structure..."
mkdir -p apps

# Move aurora-mobile back to apps
if [ -d "temp_aurora_mobile" ]; then
    mv temp_aurora_mobile apps/aurora-mobile
fi

# Move all aurora-commerce files to root (except some we want to keep organized)
echo "🔄 Moving Next.js app files to root..."

# Move core Next.js files to root
mv aurora-commerce/package.json ./
mv aurora-commerce/package-lock.json ./
mv aurora-commerce/next.config.js ./
mv aurora-commerce/tsconfig.json ./
mv aurora-commerce/tailwind.config.ts ./
mv aurora-commerce/postcss.config.js ./
mv aurora-commerce/next-env.d.ts ./
mv aurora-commerce/.env.local ./
mv aurora-commerce/.env.local.example ./

# Move source and public directories
mv aurora-commerce/src ./
mv aurora-commerce/public ./

# Move node_modules if it exists
if [ -d "aurora-commerce/node_modules" ]; then
    mv aurora-commerce/node_modules ./
fi

# Move .next build directory if it exists
if [ -d "aurora-commerce/.next" ]; then
    mv aurora-commerce/.next ./
fi

# Move scripts to apps/scripts for organization
mv aurora-commerce/scripts apps/
mv aurora-commerce/database apps/
mv aurora-commerce/supabase apps/

# Move deployment script to root
mv aurora-commerce/deploy-vercel.sh ./

# Move documentation files to docs/
mkdir -p docs
mv aurora-commerce/*.md docs/ 2>/dev/null || true
mv aurora-commerce/*.txt docs/ 2>/dev/null || true

# Move test files to apps/tests
mkdir -p apps/tests
mv aurora-commerce/test-*.js apps/tests/ 2>/dev/null || true
mv aurora-commerce/test-*.sh apps/tests/ 2>/dev/null || true
mv aurora-commerce/run-migration.js apps/tests/
mv aurora-commerce/populate-sample-data.js apps/tests/
mv aurora-commerce/supabase-config-helper.js apps/tests/

# Remove empty aurora-commerce directory
rmdir aurora-commerce 2>/dev/null || echo "⚠️ aurora-commerce directory not empty, keeping remaining files"

echo ""
echo "✅ File movement completed!"
echo ""
echo "📁 New structure:"
echo "├── package.json (Next.js app)"
echo "├── next.config.js"
echo "├── src/ (Next.js source)"
echo "├── public/ (static assets)"
echo "├── apps/"
echo "│   ├── aurora-mobile/ (React Native)"
echo "│   ├── scripts/ (build scripts)"
echo "│   ├── database/ (SQL files)"
echo "│   ├── supabase/ (Supabase functions)"
echo "│   └── tests/ (test files)"
echo "└── docs/ (documentation)"
echo ""
echo "🚀 Ready for Vercel deployment!"
echo "Run: vercel --prod"