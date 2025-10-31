# Critical Environment Setup Script

# This script helps set up the critical environment variables needed for production deployment

echo "🚀 ToolkitHeaven Production Environment Setup"
echo "============================================="

# Create .env.local from template if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📋 Creating .env.local from template..."
    cp .env.local.example .env.local
    echo "✅ Created .env.local file"
else
    echo "ℹ️  .env.local already exists"
fi

echo ""
echo "🔧 Required Environment Variables for Production:"
echo ""

echo "1. Stripe Configuration:"
echo "   STRIPE_SECRET_KEY=sk_live_... (from Stripe Dashboard)"
echo "   STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe Webhook settings)"
echo ""

echo "2. Supabase Configuration:"
echo "   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
echo "   SUPABASE_SERVICE_ROLE_KEY=eyJ... (from Supabase API settings)"
echo ""

echo "3. Application Configuration:"
echo "   NEXT_PUBLIC_APP_URL=https://your-domain.com"
echo ""

echo "4. Optional (for enhanced features):"
echo "   DATABASE_URL=postgresql://... (if using direct DB connection)"
echo "   JWT_SECRET=your-jwt-secret"
echo "   NEXTAUTH_URL=https://your-domain.com"
echo "   NEXTAUTH_SECRET=your-nextauth-secret"
echo ""

echo "📝 Next Steps:"
echo "1. Update .env.local with your production values"
echo "2. Set up Supabase database schema (see PRODUCTION_READINESS_ANALYSIS.md)"
echo "3. Configure Stripe webhook: https://your-domain.com/api/stripe/webhook"
echo "4. Upload product images to replace placeholders"
echo "5. Test the application: npm run build && npm run start"
echo ""

echo "⚠️  Security Note: Never commit .env.local to version control"
echo "   Add these variables to your deployment platform (Vercel, Netlify, etc.)"