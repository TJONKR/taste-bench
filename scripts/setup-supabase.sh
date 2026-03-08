#!/bin/bash
set -e

echo "=== Taste Bench — Supabase Setup ==="
echo ""

# Check for supabase CLI
if command -v supabase &> /dev/null; then
  echo "✅ Supabase CLI found"
else
  echo "⚠️  Supabase CLI not found. Install with: brew install supabase/tap/supabase"
  echo "   Or run the migration SQL manually in the Supabase dashboard."
fi

echo ""
echo "📋 Steps to complete setup:"
echo ""
echo "1. Create a Supabase project at https://supabase.com/dashboard"
echo "2. Go to Settings → API to get your URL and service_role key"
echo "3. Update .env.local with:"
echo "   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
echo "   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
echo ""
echo "4. Run the migration SQL in the Supabase SQL Editor:"
echo "   File: supabase/migrations/001_initial.sql"
echo ""

if command -v supabase &> /dev/null; then
  echo "Or if you have a linked project, run:"
  echo "   supabase db push"
fi

echo ""
echo "Once env vars are set, restart the app and it will use Supabase automatically."
echo "Without env vars, JSON file storage continues to work as fallback."
