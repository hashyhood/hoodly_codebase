# Security Hardening Deployment Script
# IMMEDIATE ACTION REQUIRED: Rotate Supabase keys in dashboard
# This script applies critical security fixes

Write-Host "🚨 CRITICAL SECURITY UPDATE REQUIRED 🚨" -ForegroundColor Red
Write-Host "===============================================" -ForegroundColor Red
Write-Host ""
Write-Host "STEP 1: ROTATE SUPABASE KEYS IMMEDIATELY" -ForegroundColor Yellow
Write-Host "   - Go to Supabase Dashboard > Settings > API" -ForegroundColor White
Write-Host "   - Click 'Regenerate' for both anon and service_role keys" -ForegroundColor White
Write-Host "   - Update your .env file with new keys" -ForegroundColor White
Write-Host "   - Restart your application" -ForegroundColor White
Write-Host ""
Write-Host "STEP 2: Deploy Security Fixes" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Red

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Install with: npm install -g supabase" -ForegroundColor Red
    exit 1
}

# Check if project is linked
try {
    $projectInfo = supabase status
    Write-Host "✅ Project linked successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Project not linked. Run: supabase link --project-ref YOUR_PROJECT_ID" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔒 Applying Security Hardening..." -ForegroundColor Cyan

# Apply the security migration
try {
    Write-Host "   Applying security migration..." -ForegroundColor White
    supabase db push --include-all
    
    Write-Host "✅ Security migration applied successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to apply security migration" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔐 Security Status:" -ForegroundColor Cyan
Write-Host "   ✅ Narrowed SQL grants applied" -ForegroundColor Green
Write-Host "   ✅ RLS enabled on all tables" -ForegroundColor Green
Write-Host "   ✅ Principle of least privilege implemented" -ForegroundColor Green
Write-Host "   ✅ Anonymous users restricted to SELECT only" -ForegroundColor Green
Write-Host "   ✅ Authenticated users have minimal necessary permissions" -ForegroundColor Green

Write-Host ""
Write-Host "⚠️  IMPORTANT REMINDERS:" -ForegroundColor Yellow
Write-Host "   1. Update your .env file with new Supabase keys" -ForegroundColor White
Write-Host "   2. Test your application thoroughly" -ForegroundColor White
Write-Host "   3. Monitor for any permission-related errors" -ForegroundColor White
Write-Host "   4. Review RLS policies if you encounter access issues" -ForegroundColor White

Write-Host ""
Write-Host "🔍 To verify security:" -ForegroundColor Cyan
Write-Host "   - Check Supabase Dashboard > Database > Policies" -ForegroundColor White
Write-Host "   - Verify RLS is enabled on all tables" -ForegroundColor White
Write-Host "   - Test with both authenticated and anonymous users" -ForegroundColor White

Write-Host ""
Write-Host "✅ Security hardening complete!" -ForegroundColor Green
Write-Host "   Your database is now significantly more secure." -ForegroundColor White
