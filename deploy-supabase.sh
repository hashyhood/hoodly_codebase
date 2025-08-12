#!/bin/bash

# Hoodly App - Supabase Deployment Script
# This script deploys the complete Supabase setup including Edge Functions and database migrations

set -e

echo "🚀 Starting Hoodly Supabase deployment..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if project is linked
if [ ! -f "supabase/.temp/project_id" ]; then
    echo "🔗 Linking Supabase project..."
    echo "Please enter your Supabase project reference ID:"
    read -r PROJECT_REF
    
    if [ -z "$PROJECT_REF" ]; then
        echo "❌ Project reference ID is required"
        exit 1
    fi
    
    supabase link --project-ref "$PROJECT_REF"
fi

echo "📦 Deploying Edge Functions..."

# Deploy all Edge Functions
echo "  - Deploying sendPush function..."
supabase functions deploy sendPush

echo "  - Deploying onNotificationInsert function..."
supabase functions deploy onNotificationInsert

echo "  - Deploying mediaThumb function..."
supabase functions deploy mediaThumb

echo "  - Deploying scheduledCleanup function..."
supabase functions deploy scheduledCleanup

echo "🗄️ Applying database migrations..."

# Apply database migrations
supabase db push

echo "🔐 Setting up environment variables..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Please create one based on env.example"
    echo "   Required variables:"
    echo "   - EXPO_PUBLIC_SUPABASE_URL"
    echo "   - EXPO_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - FCM_SERVER_KEY (for push notifications)"
    echo "   - APNS_* variables (for iOS push notifications)"
else
    echo "✅ .env file found"
fi

echo "🔧 Setting up Supabase secrets..."

# Set up Supabase secrets for Edge Functions
if [ -f ".env" ]; then
    source .env
    
    if [ ! -z "$FCM_SERVER_KEY" ]; then
        echo "  - Setting FCM_SERVER_KEY..."
        supabase secrets set FCM_SERVER_KEY="$FCM_SERVER_KEY"
    fi
    
    if [ ! -z "$APNS_KEY_ID" ]; then
        echo "  - Setting APNS_KEY_ID..."
        supabase secrets set APNS_KEY_ID="$APNS_KEY_ID"
    fi
    
    if [ ! -z "$APNS_TEAM_ID" ]; then
        echo "  - Setting APNS_TEAM_ID..."
        supabase secrets set APNS_TEAM_ID="$APNS_TEAM_ID"
    fi
    
    if [ ! -z "$APNS_BUNDLE_ID" ]; then
        echo "  - Setting APNS_BUNDLE_ID..."
        supabase secrets set APNS_BUNDLE_ID="$APNS_BUNDLE_ID"
    fi
    
    if [ ! -z "$APNS_PRIVATE_KEY" ]; then
        echo "  - Setting APNS_PRIVATE_KEY..."
        supabase secrets set APNS_PRIVATE_KEY="$APNS_PRIVATE_KEY"
    fi
fi

echo "🎯 Setting up scheduled functions..."

# Create cron job for scheduledCleanup (manual setup required)
echo "  ⚠️  Manual setup required:"
echo "     In Supabase Dashboard > Database > Functions, create a cron job:"
echo "     0 2 * * * curl -X POST 'https://your-project.supabase.co/functions/v1/scheduledCleanup' \\"
echo "       -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'"

echo "✅ Deployment completed successfully!"

echo ""
echo "📱 Next steps:"
echo "1. Test your app with: npx expo start"
echo "2. Verify Edge Functions in Supabase Dashboard"
echo "3. Check RLS policies are working correctly"
echo "4. Test real-time features and push notifications"
echo ""
echo "🔗 Useful links:"
echo "- Supabase Dashboard: https://supabase.com/dashboard"
echo "- Edge Functions: https://supabase.com/docs/guides/functions"
echo "- Database: https://supabase.com/docs/guides/database"
echo "- Auth: https://supabase.com/docs/guides/auth"
