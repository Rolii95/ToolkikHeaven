#!/bin/bash
# Script to run database setup on Supabase

echo "Setting up Aurora Commerce database schema on Supabase..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not set. Please update .env.local with your Supabase database URL"
    echo "Format: postgresql://postgres:[PASSWORD]@db.iyenjqsvxizjucmjukvj.supabase.co:5432/postgres"
    exit 1
fi

echo "Running base schema setup..."
psql "$DATABASE_URL" -f database/base-schema-setup.sql

echo "Running order prioritization setup..."
psql "$DATABASE_URL" -f database/order-prioritization-setup.sql

echo "Running notifications setup..."
psql "$DATABASE_URL" -f database/order-notifications-setup.sql

echo "Database setup completed!"

# Verify tables were created
echo "Verifying tables..."
psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('products', 'customers', 'orders');"