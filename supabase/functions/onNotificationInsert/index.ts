import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  id: string
  receiver_id: string
  type: string
  title: string
  message: string
  data?: Record<string, any>
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

    // Get the notification data from the request
    const notification = await req.json() as NotificationPayload

    if (!notification.receiver_id || !notification.title || !notification.message) {
      return new Response(
        JSON.stringify({ error: 'Invalid notification data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call the sendPush function to send the actual push notification
    const pushResponse = await fetch(`${supabaseUrl}/functions/v1/sendPush`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiver_id: notification.receiver_id,
        title: notification.title,
        body: notification.message,
        data: {
          notification_id: notification.id,
          type: notification.type,
          ...notification.data
        },
        priority: notification.type === 'urgent' ? 'high' : 'normal'
      })
    })

    if (!pushResponse.ok) {
      const errorText = await pushResponse.text()
      console.error('Failed to send push notification:', errorText)
      
      return new Response(
        JSON.stringify({ error: 'Failed to send push notification' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const pushResult = await pushResponse.json()
    
    // Log the successful push notification
    console.log(`Push notification sent for notification ${notification.id}:`, pushResult)

    return new Response(
      JSON.stringify({ 
        message: 'Push notification triggered successfully',
        pushResult 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in onNotificationInsert function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
