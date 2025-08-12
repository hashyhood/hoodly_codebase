# Supabase Edge Functions

This directory contains Deno Edge Functions for the Hoodly app.

## Functions Overview

### 1. `sendPush` - Push Notification Service
- **Purpose**: Sends push notifications via FCM (Android) and APNs (iOS)
- **Authentication**: Two-client auth (Supabase service role or authenticated user)
- **Features**: Priority levels, custom data payloads, multi-device support

### 2. `onNotificationInsert` - Notification Webhook
- **Purpose**: Automatically triggers push notifications when new notifications are inserted
- **Trigger**: Database INSERT on notifications table
- **Integration**: Calls sendPush function

### 3. `mediaThumb` - Image Thumbnail Generation
- **Purpose**: Creates thumbnails from uploaded images
- **Status**: Placeholder implementation (requires image processing library)
- **Storage**: Downloads from Supabase Storage, processes, uploads back

### 4. `scheduledCleanup` - Automated Cleanup
- **Purpose**: Daily cleanup of old data
- **Tasks**: Old notifications (90 days), events (1 year), messages (2 years), posts (3 years)
- **Schedule**: Run via Supabase Cron

## Deployment

### Prerequisites
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref YOUR_PROJECT_ID`

### Deploy All Functions
```bash
supabase functions deploy sendPush
supabase functions deploy onNotificationInsert
supabase functions deploy mediaThumb
supabase functions deploy scheduledCleanup
```

### Deploy Individual Function
```bash
supabase functions deploy FUNCTION_NAME
```

## Environment Variables

### Required for All Functions
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access

### Required for `sendPush`
- `FCM_SERVER_KEY`: Firebase Cloud Messaging server key
- `APNS_KEY_ID`: Apple Push Notification Service key ID
- `APNS_TEAM_ID`: Apple Developer Team ID
- `APNS_BUNDLE_ID`: iOS app bundle identifier
- `APNS_PRIVATE_KEY`: APNs private key (P8 file content)

### Setting Secrets
```bash
supabase secrets set FCM_SERVER_KEY=your_fcm_key
supabase secrets set APNS_KEY_ID=your_apns_key_id
supabase secrets set APNS_TEAM_ID=your_team_id
supabase secrets set APNS_BUNDLE_ID=com.yourapp.bundle
supabase secrets set APNS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

## Testing

### Local Development
```bash
# Start Supabase locally
supabase start

# Test function locally
supabase functions serve sendPush --env-file ./supabase/.env.local
```

### Test sendPush Function
```bash
curl -X POST 'http://localhost:54321/functions/v1/sendPush' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "receiver_id": "user-uuid",
    "title": "Test Notification",
    "body": "This is a test push notification",
    "data": {"type": "test"},
    "priority": "normal"
  }'
```

## Scheduled Functions

### Setup Cron Job for scheduledCleanup
```bash
# In Supabase Dashboard > Database > Functions
# Create a cron job that runs daily at 2 AM UTC
0 2 * * * curl -X POST 'https://your-project.supabase.co/functions/v1/scheduledCleanup' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'
```

## Security Notes

- **Service Role Key**: Only use in Edge Functions, never expose to client
- **RLS Policies**: All database access is controlled by Row Level Security
- **Authentication**: Functions verify user permissions before processing requests
- **Input Validation**: All inputs are validated and sanitized

## Troubleshooting

### Common Issues
1. **Function not found**: Ensure function is deployed and project is linked
2. **Permission denied**: Check RLS policies and user authentication
3. **Environment variables**: Verify all required secrets are set
4. **CORS errors**: Check function CORS headers configuration

### Logs
View function logs in Supabase Dashboard > Edge Functions > Function Name > Logs

### Local Debugging
```bash
# Start with debug logging
supabase functions serve --debug

# Check local logs
supabase logs
```
