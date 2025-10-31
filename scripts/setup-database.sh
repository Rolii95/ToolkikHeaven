#!/bin/bash

# Supabase Database Setup Script for Aurora Commerce
# This script helps set up the database connection and run migrations

set -e

echo "🚀 Aurora Commerce - Database Setup Script"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ Error: .env.local file not found!${NC}"
    echo "Please create .env.local with your Supabase credentials."
    exit 1
fi

# Load environment variables
source .env.local

echo -e "${BLUE}📋 Environment Check${NC}"
echo "=============================="

# Check required environment variables
required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "DATABASE_URL")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    else
        echo -e "${GREEN}✓${NC} $var is set"
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    printf '%s\n' "${missing_vars[@]}"
    exit 1
fi

# Check if DATABASE_URL contains placeholder
if [[ "$DATABASE_URL" == *"[YOUR_PASSWORD]"* ]]; then
    echo -e "${YELLOW}⚠️  Warning: DATABASE_URL contains placeholder [YOUR_PASSWORD]${NC}"
    echo "Please replace [YOUR_PASSWORD] with your actual Supabase database password."
    echo "You can find your password in the Supabase dashboard under Settings > Database."
    echo ""
    echo "Current DATABASE_URL: $DATABASE_URL"
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting. Please update your DATABASE_URL and run this script again."
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}🗄️  Database Connection Test${NC}"
echo "================================"

# Test database connection (if psql is available)
if command -v psql &> /dev/null; then
    echo "Testing database connection..."
    if psql "$DATABASE_URL" -c "SELECT version();" &> /dev/null; then
        echo -e "${GREEN}✓${NC} Database connection successful!"
    else
        echo -e "${RED}❌ Database connection failed!${NC}"
        echo "Please check your DATABASE_URL and network connection."
        echo "Make sure your IP is whitelisted in Supabase if using remote connection."
        
        read -p "Do you want to continue with the setup anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⚠️  psql not found. Skipping connection test.${NC}"
    echo "You can install PostgreSQL client tools to enable connection testing."
fi

echo ""
echo -e "${BLUE}📦 Available Database Scripts${NC}"
echo "================================"

# List available SQL files
sql_files=(
    "database/chat-support-setup.sql:Chat Support System (Messages, Sessions, Contact Forms)"
    "database/analytics-setup.sql:Analytics and Tracking"
    "apps/database/email-marketing-setup.sql:Email Marketing System"
    "apps/database/corrected-notifications-setup.sql:Notification System"
)

echo "Available database setup scripts:"
for i in "${!sql_files[@]}"; do
    IFS=':' read -r file description <<< "${sql_files[$i]}"
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $((i+1)). $description"
        echo "   File: $file"
    else
        echo -e "${RED}❌${NC} $((i+1)). $description"
        echo "   File: $file (NOT FOUND)"
    fi
done

echo ""
echo -e "${BLUE}🚀 Setup Options${NC}"
echo "==================="
echo "1. Run Chat Support Setup (Recommended for new chat functionality)"
echo "2. Run All Database Scripts"
echo "3. Run Custom SQL File"
echo "4. Show Database Connection Info"
echo "5. Exit"

read -p "Select an option (1-5): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}🔧 Setting up Chat Support System...${NC}"
        if [ -f "database/chat-support-setup.sql" ]; then
            if command -v psql &> /dev/null && [[ ! "$DATABASE_URL" == *"[YOUR_PASSWORD]"* ]]; then
                echo "Running chat-support-setup.sql..."
                psql "$DATABASE_URL" -f "database/chat-support-setup.sql"
                echo -e "${GREEN}✅ Chat Support System setup completed!${NC}"
            else
                echo -e "${YELLOW}ℹ️  To run the SQL script manually:${NC}"
                echo "1. Connect to your Supabase database"
                echo "2. Run the contents of: database/chat-support-setup.sql"
                echo ""
                echo "Or use the Supabase SQL Editor in your dashboard."
            fi
        else
            echo -e "${RED}❌ Chat support setup file not found!${NC}"
        fi
        ;;
    2)
        echo ""
        echo -e "${BLUE}🔧 Running all database scripts...${NC}"
        for script_info in "${sql_files[@]}"; do
            IFS=':' read -r file description <<< "$script_info"
            if [ -f "$file" ]; then
                echo ""
                echo -e "${BLUE}Running: $description${NC}"
                if command -v psql &> /dev/null && [[ ! "$DATABASE_URL" == *"[YOUR_PASSWORD]"* ]]; then
                    psql "$DATABASE_URL" -f "$file"
                    echo -e "${GREEN}✓ Completed: $description${NC}"
                else
                    echo -e "${YELLOW}ℹ️  File available: $file${NC}"
                fi
            fi
        done
        echo -e "${GREEN}✅ All available scripts processed!${NC}"
        ;;
    3)
        echo ""
        read -p "Enter the path to your SQL file: " custom_file
        if [ -f "$custom_file" ]; then
            if command -v psql &> /dev/null && [[ ! "$DATABASE_URL" == *"[YOUR_PASSWORD]"* ]]; then
                echo "Running $custom_file..."
                psql "$DATABASE_URL" -f "$custom_file"
                echo -e "${GREEN}✅ Custom SQL file executed!${NC}"
            else
                echo -e "${YELLOW}ℹ️  File found: $custom_file${NC}"
                echo "Run this file manually in your Supabase SQL Editor."
            fi
        else
            echo -e "${RED}❌ File not found: $custom_file${NC}"
        fi
        ;;
    4)
        echo ""
        echo -e "${BLUE}📊 Database Connection Information${NC}"
        echo "===================================="
        echo "Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
        echo "Database URL: ${DATABASE_URL//:*@/:***@}"  # Hide password in output
        echo "Project ID: $(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1/')"
        echo ""
        echo "To connect manually:"
        echo "1. Open Supabase Dashboard: https://app.supabase.com"
        echo "2. Go to your project settings"
        echo "3. Use the SQL Editor or connect via psql"
        ;;
    5)
        echo "Exiting setup script."
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid option selected.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Database setup process completed!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Verify the tables were created in your Supabase dashboard"
echo "2. Test the chat functionality on your application"
echo "3. Configure any additional settings as needed"
echo ""
echo -e "${YELLOW}💡 Tip:${NC} You can run this script again anytime to set up additional features."
echo ""
echo "Happy coding! 🚀"