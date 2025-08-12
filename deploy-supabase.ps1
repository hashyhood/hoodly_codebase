# Hoodly App - Supabase Deployment Script (PowerShell)
# This script deploys the complete Supabase setup including Edge Functions and database migrations

param(
    [string]$ProjectRef = ""
)

Write-Host "🚀 Starting Hoodly Supabase deployment..." -ForegroundColor Green

# Check if Supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g supabase
}

# Check if project is linked
if (-not (Test-Path "supabase\.temp\project_id")) {
    Write-Host "🔗 Linking Supabase project..." -ForegroundColor Yellow
    
    if ([string]::IsNullOrEmpty($ProjectRef)) {
        $ProjectRef = Read-Host "Please enter your Supabase project reference ID"
    }
    
    if ([string]::IsNullOrEmpty($ProjectRef)) {
        Write-Host "❌ Project reference ID is required" -ForegroundColor Red
        exit 1
    }
    
    supabase link --project-ref $ProjectRef
}

Write-Host "📦 Deploying Edge Functions..." -ForegroundColor Green

# Deploy all Edge Functions
Write-Host "  - Deploying sendPush function..." -ForegroundColor Yellow
supabase functions deploy sendPush

Write-Host "  - Deploying onNotificationInsert function..." -ForegroundColor Yellow
supabase functions deploy onNotificationInsert

Write-Host "  - Deploying mediaThumb function..." -ForegroundColor Yellow
supabase functions deploy mediaThumb

Write-Host "  - Deploying scheduledCleanup function..." -ForegroundColor Yellow
supabase functions deploy scheduledCleanup

Write-Host "🗄️ Applying database migrations..." -ForegroundColor Green

# Apply database migrations
supabase db push

Write-Host "🔐 Setting up environment variables..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Please create one based on env.example" -ForegroundColor Yellow
    Write-Host "   Required variables:" -ForegroundColor Yellow
    Write-Host "   - EXPO_PUBLIC_SUPABASE_URL" -ForegroundColor Yellow
    Write-Host "   - EXPO_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Yellow
    Write-Host "   - FCM_SERVER_KEY (for push notifications)" -ForegroundColor Yellow
    Write-Host "   - APNS_* variables (for iOS push notifications)" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file found" -ForegroundColor Green
}

Write-Host "🔧 Setting up Supabase secrets..." -ForegroundColor Green

# Set up Supabase secrets for Edge Functions
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            $key = $matches[1]
            $value = $matches[2]
            
            switch ($key) {
                "FCM_SERVER_KEY" {
                    Write-Host "  - Setting FCM_SERVER_KEY..." -ForegroundColor Yellow
                    supabase secrets set FCM_SERVER_KEY="$value"
                }
                "APNS_KEY_ID" {
                    Write-Host "  - Setting APNS_KEY_ID..." -ForegroundColor Yellow
                    supabase secrets set APNS_KEY_ID="$value"
                }
                "APNS_TEAM_ID" {
                    Write-Host "  - Setting APNS_TEAM_ID..." -ForegroundColor Yellow
                    supabase secrets set APNS_TEAM_ID="$value"
                }
                "APNS_BUNDLE_ID" {
                    Write-Host "  - Setting APNS_BUNDLE_ID..." -ForegroundColor Yellow
                    supabase secrets set APNS_BUNDLE_ID="$value"
                }
                "APNS_PRIVATE_KEY" {
                    Write-Host "  - Setting APNS_PRIVATE_KEY..." -ForegroundColor Yellow
                    supabase secrets set APNS_PRIVATE_KEY="$value"
                }
            }
        }
    }
}

Write-Host "🎯 Setting up scheduled functions..." -ForegroundColor Green

# Create cron job for scheduledCleanup (manual setup required)
Write-Host "  ⚠️  Manual setup required:" -ForegroundColor Yellow
Write-Host "     In Supabase Dashboard > Database > Functions, create a cron job:" -ForegroundColor Yellow
Write-Host "     0 2 * * * curl -X POST 'https://your-project.supabase.co/functions/v1/scheduledCleanup' \\" -ForegroundColor Yellow
Write-Host "       -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'" -ForegroundColor Yellow

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green

Write-Host ""
Write-Host "📱 Next steps:" -ForegroundColor Cyan
Write-Host "1. Test your app with: npx expo start" -ForegroundColor White
Write-Host "2. Verify Edge Functions in Supabase Dashboard" -ForegroundColor White
Write-Host "3. Check RLS policies are working correctly" -ForegroundColor White
Write-Host "4. Test real-time features and push notifications" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Useful links:" -ForegroundColor Cyan
Write-Host "- Supabase Dashboard: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "- Edge Functions: https://supabase.com/docs/guides/functions" -ForegroundColor White
Write-Host "- Database: https://supabase.com/docs/guides/database" -ForegroundColor White
Write-Host "- Auth: https://supabase.com/docs/guides/auth" -ForegroundColor White
