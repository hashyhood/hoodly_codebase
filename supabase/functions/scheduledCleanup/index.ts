import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CleanupStats {
  notifications_deleted: number
  events_deleted: number
  device_tokens_deleted: number
  old_messages_deleted: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const stats: CleanupStats = {
      notifications_deleted: 0,
      events_deleted: 0,
      device_tokens_deleted: 0,
      old_messages_deleted: 0
    }

    // 1. Clean up old notifications (older than 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: oldNotifications, error: notifError } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', ninetyDaysAgo.toISOString())
      .select('id')

    if (!notifError && oldNotifications) {
      stats.notifications_deleted = oldNotifications.length
    }

    // 2. Clean up old events (older than 1 year)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const { data: oldEvents, error: eventError } = await supabase
      .from('events')
      .delete()
      .lt('start_time', oneYearAgo.toISOString())
      .select('id')

    if (!eventError && oldEvents) {
      stats.events_deleted = oldEvents.length
    }

    // 3. Clean up orphaned device tokens (tokens not associated with active users)
    const { data: orphanedTokens, error: tokenError } = await supabase
      .from('device_tokens')
      .delete()
      .not('user_id', 'in', `(select id from auth.users where deleted_at is null)`)
      .select('id')

    if (!tokenError && orphanedTokens) {
      stats.device_tokens_deleted = orphanedTokens.length
    }

    // 4. Clean up old messages (older than 2 years)
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    const { data: oldMessages, error: messageError } = await supabase
      .from('messages')
      .delete()
      .lt('created_at', twoYearsAgo.toISOString())
      .select('id')

    if (!messageError && oldMessages) {
      stats.old_messages_deleted = oldMessages.length
    }

    // 5. Clean up old DM messages (older than 2 years)
    const { data: oldDMMessages, error: dmMessageError } = await supabase
      .from('dm_messages')
      .delete()
      .lt('created_at', twoYearsAgo.toISOString())
      .select('id')

    if (!dmMessageError && oldDMMessages) {
      stats.old_messages_deleted += oldDMMessages.length
    }

    // 6. Clean up old posts (older than 3 years)
    const threeYearsAgo = new Date()
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3)

    const { data: oldPosts, error: postError } = await supabase
      .from('posts')
      .delete()
      .lt('created_at', threeYearsAgo.toISOString())
      .select('id')

    // Log cleanup results
    console.log('Scheduled cleanup completed:', stats)

    return new Response(
      JSON.stringify({
        message: 'Scheduled cleanup completed successfully',
        timestamp: new Date().toISOString(),
        stats
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in scheduledCleanup function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
