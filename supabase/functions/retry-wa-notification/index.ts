// ============================================
// Smart Bendahara — WA Notification Retry Edge Function
// Retries failed WA notifications with exponential backoff
// PRD Section 9.4: 3 retries, delays 1min → 5min → 15min
// ============================================
// Deploy: supabase functions deploy retry-wa-notification

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Retry delays in minutes (PRD spec)
const RETRY_DELAYS: Record<number, number> = {
  0: 1,   // 1st retry: 1 minute after failure
  1: 5,   // 2nd retry: 5 minutes after 1st retry
  2: 15,  // 3rd retry: 15 minutes after 2nd retry
}

const MAX_RETRIES = 3

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    let totalRetried = 0
    let totalSuccess = 0
    let totalFailed = 0
    let totalSkipped = 0
    const errors: string[] = []

    // 1. Get all failed notifications eligible for retry
    const { data: failedLogs, error: fetchErr } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('status', 'failed')
      .lt('retry_count', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(50) // Process max 50 per run to avoid timeout

    if (fetchErr) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch failed notifications', details: fetchErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!failedLogs || failedLogs.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          summary: {
            message: 'No failed notifications to retry',
            retried: 0,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Process each failed notification
    for (const log of failedLogs) {
      const retryCount = log.retry_count || 0
      const requiredDelay = RETRY_DELAYS[retryCount] || 15 // minutes

      // Check if enough time has passed since last attempt
      const lastAttempt = new Date(log.created_at)
      const now = new Date()
      const minutesSinceLastAttempt = (now.getTime() - lastAttempt.getTime()) / (1000 * 60)

      if (minutesSinceLastAttempt < requiredDelay) {
        totalSkipped++
        continue // Not enough time has passed, skip
      }

      totalRetried++

      // 3. Call the send-wa-notification function to retry
      try {
        const fnUrl = `${supabaseUrl}/functions/v1/send-wa-notification`
        const response = await fetch(fnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            event_type: log.event_type,
            student_id: log.student_id,
            tenant_id: log.tenant_id,
            template_vars: {}, // Template vars will be re-fetched by the send function
          }),
        })

        const result = await response.json()

        if (result.success && result.status === 'sent') {
          // Success! Update the original log
          await supabase
            .from('notification_logs')
            .update({
              status: 'sent',
              retry_count: retryCount + 1,
              sent_at: new Date().toISOString(),
              error_message: null,
            })
            .eq('id', log.id)

          totalSuccess++
        } else {
          // Still failed — increment retry count
          const newRetryCount = retryCount + 1
          const newStatus = newRetryCount >= MAX_RETRIES ? 'failed' : 'failed'
          const errorMsg = result.error || result.status || 'Unknown error'

          await supabase
            .from('notification_logs')
            .update({
              retry_count: newRetryCount,
              error_message: `Retry ${newRetryCount}/${MAX_RETRIES}: ${errorMsg}`,
            })
            .eq('id', log.id)

          totalFailed++
          errors.push(`Log ${log.id}: retry ${newRetryCount} failed - ${errorMsg}`)
        }
      } catch (err: any) {
        // Network error during retry
        const newRetryCount = retryCount + 1
        await supabase
          .from('notification_logs')
          .update({
            retry_count: newRetryCount,
            error_message: `Retry ${newRetryCount}/${MAX_RETRIES}: ${err.message}`,
          })
          .eq('id', log.id)

        totalFailed++
        errors.push(`Log ${log.id}: retry error - ${err.message}`)
      }

      // Rate limiting: 2 second delay between retries
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          timestamp: new Date().toISOString(),
          total_eligible: failedLogs.length,
          retried: totalRetried,
          succeeded: totalSuccess,
          still_failed: totalFailed,
          skipped_too_early: totalSkipped,
          errors: errors.slice(0, 10),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
