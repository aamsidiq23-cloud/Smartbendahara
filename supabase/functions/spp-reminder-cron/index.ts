// ============================================
// Smart Bendahara — SPP Reminder Cron Edge Function
// Scheduled daily at 08:00 WIB (01:00 UTC)
// Checks SPP due dates and sends H-3, H-0, H+7 reminders
// ============================================
// Deploy: supabase functions deploy spp-reminder-cron

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

interface TenantConfig {
  id: string
  name: string
  spp_due_day: number
  wa_config: {
    is_active: boolean
    api_key: string
    gateway: string
    reminder_h_minus_3: boolean
    reminder_h_0: boolean
    reminder_h_plus_7: boolean
  } | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()

    let totalSent = 0
    let totalSkipped = 0
    let totalFailed = 0
    const errors: string[] = []

    // 1. Get all active tenants with WA config
    const { data: tenants, error: tenantErr } = await supabase
      .from('tenants')
      .select(`
        id, name, spp_due_day,
        wa_config:wa_configs(is_active, api_key, gateway, reminder_h_minus_3, reminder_h_0, reminder_h_plus_7)
      `)
      .in('status', ['trial', 'active']) as any

    if (tenantErr || !tenants) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch tenants', details: tenantErr?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Process each tenant
    for (const tenant of tenants as TenantConfig[]) {
      const waConfig = Array.isArray(tenant.wa_config) ? tenant.wa_config[0] : tenant.wa_config

      // Skip if WA not configured
      if (!waConfig || !waConfig.is_active || !waConfig.api_key) {
        totalSkipped++
        continue
      }

      const dueDay = tenant.spp_due_day || 10
      const daysDiff = currentDay - dueDay // positive = past due, negative = before due

      // Determine which reminder to send
      let eventType: string | null = null

      if (daysDiff === -3 && waConfig.reminder_h_minus_3) {
        eventType = 'spp_reminder_h3'
      } else if (daysDiff === 0 && waConfig.reminder_h_0) {
        eventType = 'spp_reminder_h0'
      } else if (daysDiff === 7 && waConfig.reminder_h_plus_7) {
        eventType = 'spp_overdue_h7'
      }

      if (!eventType) {
        continue // No reminder needed today for this tenant
      }

      // 3. Get unpaid/partial SPP for current month
      const { data: unpaidSpp } = await supabase
        .from('spp_payments')
        .select('*, student:students(id, name)')
        .eq('tenant_id', tenant.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .in('status', ['unpaid', 'partial']) as any

      if (!unpaidSpp || unpaidSpp.length === 0) {
        continue
      }

      // 4. Send reminder for each unpaid student
      for (const payment of unpaidSpp) {
        const studentId = payment.student_id

        // Check if we already sent this reminder today (avoid duplicates)
        const todayStart = new Date(currentYear, currentMonth - 1, currentDay).toISOString()
        const { data: existingLog } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('student_id', studentId)
          .eq('event_type', eventType)
          .gte('created_at', todayStart)
          .limit(1)

        if (existingLog && existingLog.length > 0) {
          totalSkipped++
          continue
        }

        // Build due date string
        const dueDateStr = `${dueDay} ${MONTHS[currentMonth - 1]} ${currentYear}`
        const monthYearStr = `${MONTHS[currentMonth - 1]} ${currentYear}`

        // Call the send-wa-notification function
        try {
          const fnUrl = `${supabaseUrl}/functions/v1/send-wa-notification`
          const response = await fetch(fnUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              event_type: eventType,
              student_id: studentId,
              tenant_id: tenant.id,
              template_vars: {
                month_year: monthYearStr,
                amount: payment.amount_due - payment.amount_paid,
                due_date: dueDateStr,
              },
            }),
          })

          const result = await response.json()
          if (result.success) {
            totalSent++
          } else {
            totalFailed++
            errors.push(`${payment.student?.name}: ${result.error || 'unknown'}`)
          }
        } catch (err: any) {
          totalFailed++
          errors.push(`${payment.student?.name}: ${err.message}`)
        }

        // Rate limiting: wait 2 seconds between messages (30/min per PRD)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          date: today.toISOString().split('T')[0],
          tenants_processed: tenants.length,
          messages_sent: totalSent,
          messages_skipped: totalSkipped,
          messages_failed: totalFailed,
          errors: errors.slice(0, 10), // Limit error details
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
