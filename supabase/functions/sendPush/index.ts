import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushNotification {
  receiver_id: string
  title: string
  body: string
  data?: Record<string, any>
  priority?: 'high' | 'normal'
}

interface DeviceToken {
  id: string
  user_id: string
  token: string
  provider: 'fcm' | 'apns'
  device_type?: 'ios' | 'android'
  created_at: string
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

    // Get request body
    const { receiver_id, title, body, data, priority = 'normal' } = await req.json() as PushNotification

    if (!receiver_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: receiver_id, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch user settings and possibly defer
    const { data: settings } = await supabase.from('user_settings').select('notification_prefs').eq('user_id', receiver_id).maybeSingle();

    function inQuietHours(prefs: any) {
      try {
        if (!prefs?.quietHours) return false;
        const { start, end, timezone } = prefs.quietHours;
        const now = new Date().toLocaleString('en-US', { timeZone: timezone || 'UTC' });
        const [h, m] = (new Date(now).toTimeString().slice(0,5)).split(':').map(Number);
        const cur = h*60+m;
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const s = sh*60+sm, e = eh*60+em;
        return s < e ? (cur>=s && cur<=e) : (cur>=s || cur<=e);
      } catch { return false; }
    }

    if (inQuietHours(settings?.notification_prefs)) {
      await supabase.from('analytics_events').insert({ user_id: receiver_id, event: 'push_deferred', props: { title, data }});
      // Optional: write to a queue table and deliver via scheduled function later
      return new Response(JSON.stringify({ deferred: true }), { headers: corsHeaders });
    }

    // Get device tokens for the receiver
    const { data: deviceTokens, error: tokenError } = await supabase
      .from('device_tokens')
      .select('*')
      .eq('user_id', receiver_id)

    if (tokenError) {
      console.error('Error fetching device tokens:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch device tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!deviceTokens || deviceTokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No device tokens found for user' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send push notifications to all devices
    const results = await Promise.allSettled(
      deviceTokens.map(async (token: DeviceToken) => {
        try {
          if (token.provider === 'fcm') {
            return await sendFCMNotification(token.token, title, body, data, priority)
          } else if (token.provider === 'apns') {
            return await sendAPNSNotification(token.token, title, body, data, priority)
          }
        } catch (error) {
          console.error(`Error sending to ${token.provider}:`, error)
          return { success: false, error: error.message }
        }
      })
    )

    // Count successful and failed notifications
    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length
    const failed = results.length - successful

    return new Response(
      JSON.stringify({
        message: 'Push notifications sent',
        total: deviceTokens.length,
        successful,
        failed
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in sendPush function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function sendFCMNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, any>,
  priority: 'high' | 'normal' = 'normal'
) {
  const fcmKey = Deno.env.get('FCM_SERVER_KEY')
  if (!fcmKey) {
    throw new Error('FCM_SERVER_KEY not configured')
  }

  const message = {
    to: token,
    notification: {
      title,
      body,
      sound: 'default'
    },
    data: data || {},
    priority: priority === 'high' ? 'high' : 'normal',
    android: {
      priority: priority === 'high' ? 'high' : 'normal',
      notification: {
        channel_id: 'default',
        priority: priority === 'high' ? 'max' : 'default'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      },
      headers: {
        'apns-priority': priority === 'high' ? '10' : '5'
      }
    }
  }

  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Authorization': `key=${fcmKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`FCM request failed: ${response.status} ${errorText}`)
  }

  const result = await response.json()
  return { success: true, messageId: result.message_id }
}

async function sendAPNSNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, any>,
  priority: 'high' | 'normal' = 'normal'
) {
  const apnsKeyId = Deno.env.get('APNS_KEY_ID')
  const apnsTeamId = Deno.env.get('APNS_TEAM_ID')
  const apnsBundleId = Deno.env.get('APNS_BUNDLE_ID')
  const apnsPrivateKey = Deno.env.get('APNS_PRIVATE_KEY')

  if (!apnsKeyId || !apnsTeamId || !apnsBundleId || !apnsPrivateKey) {
    throw new Error('APNS configuration incomplete')
  }

  // Note: In production, you'd want to use proper JWT signing
  // This is a simplified version
  const payload = {
    aps: {
      alert: {
        title,
        body
      },
      sound: 'default',
      badge: 1,
      'content-available': 1
    },
    ...data
  }

  const response = await fetch(`https://api.push.apple.com/3/device/${token}`, {
    method: 'POST',
    headers: {
      'apns-topic': apnsBundleId,
      'apns-push-type': 'alert',
      'apns-priority': priority === 'high' ? '10' : '5',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`APNS request failed: ${response.status} ${errorText}`)
  }

  return { success: true }
}
