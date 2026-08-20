// ============================================
// Smart Bendahara — WhatsApp Notification Edge Function
// Sends WA messages via Fonnte/Wablas gateway
// ============================================
// Deploy: supabase functions deploy send-wa-notification

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================
// Message Templates (matching PRD Section 9.6)
// ============================================
interface TemplateVars {
  student_name: string
  class_name: string
  school_name: string
  month_year?: string
  amount?: number
  balance?: number
  bill_name?: string
  due_date?: string
  remaining?: number
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount)
}

function replacePlaceholders(template: string, vars: TemplateVars): string {
  let msg = template
  msg = msg.replace(/\[Nama Siswa\]/g, vars.student_name || 'Siswa')
  msg = msg.replace(/\[Kelas\]/g, vars.class_name || '-')
  msg = msg.replace(/\[Nama Sekolah\]/g, vars.school_name || 'Sekolah')
  msg = msg.replace(/\[Bulan Tahun\]/g, vars.month_year || '')
  msg = msg.replace(/\[Jumlah\]/g, vars.amount !== undefined ? formatCurrency(vars.amount) : '0')
  msg = msg.replace(/\[Saldo Terkini\]/g, vars.balance !== undefined ? formatCurrency(vars.balance) : '0')
  msg = msg.replace(/\[Tanggal\]/g, new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }))
  msg = msg.replace(/\[Tanggal Jatuh Tempo\]/g, vars.due_date || '-')
  msg = msg.replace(/\[Sisa\]/g, vars.remaining !== undefined ? formatCurrency(vars.remaining) : '0')
  msg = msg.replace(/\[Nama Tagihan\]/g, vars.bill_name || '-')
  return msg
}

function getMessageTemplate(eventType: string, vars: TemplateVars, waConfig?: any): string {
  const templateKeyMap: Record<string, string> = {
    spp_paid: 'template_spp_paid',
    savings_deposit: 'template_savings_deposit',
    savings_withdrawal: 'template_savings_withdrawal',
    bill_created: 'template_bill_created',
    bill_paid: 'template_bill_paid',
    spp_reminder_h3: 'template_spp_reminder_h3',
    spp_reminder_h0: 'template_spp_reminder_h0',
    spp_overdue_h7: 'template_spp_overdue_h7',
  }

  const customTemplate = waConfig ? waConfig[templateKeyMap[eventType]] : null
  if (customTemplate) {
    return replacePlaceholders(customTemplate, vars)
  }

  switch (eventType) {
    case 'spp_paid':
      return `✅ Konfirmasi Pembayaran SPP

Yth. Orang tua/wali ${vars.student_name}
Kelas ${vars.class_name} — ${vars.school_name}

Bulan     : ${vars.month_year}
Jumlah    : Rp ${formatCurrency(vars.amount || 0)}
Status    : Lunas ✓

Terima kasih atas pembayarannya.
🏫 ${vars.school_name}`

    case 'savings_deposit':
      return `💰 Tabungan Bertambah

${vars.student_name} (Kls ${vars.class_name})

Setoran    : + Rp ${formatCurrency(vars.amount || 0)}
Saldo kini : Rp ${formatCurrency(vars.balance || 0)}

🏫 ${vars.school_name}`

    case 'savings_withdrawal':
      return `💸 Penarikan Tabungan

${vars.student_name} (Kls ${vars.class_name})

Penarikan  : - Rp ${formatCurrency(vars.amount || 0)}
Saldo kini : Rp ${formatCurrency(vars.balance || 0)}

🏫 ${vars.school_name}`

    case 'bill_created':
      return `📋 Tagihan Baru

Yth. Orang tua/wali ${vars.student_name}
Kelas ${vars.class_name}

Tagihan    : ${vars.bill_name}
Nominal    : Rp ${formatCurrency(vars.amount || 0)}
Jatuh tempo: ${vars.due_date || '-'}

Mohon segera dilunasi ke bendahara sekolah.

🏫 ${vars.school_name}`

    case 'bill_paid':
      return `✅ Konfirmasi Pembayaran Tagihan

Yth. Orang tua/wali ${vars.student_name}
Kelas ${vars.class_name}

Tagihan    : ${vars.bill_name}
Dibayar    : Rp ${formatCurrency(vars.amount || 0)}
Sisa       : Rp ${formatCurrency(vars.remaining || 0)}

🏫 ${vars.school_name}`

    case 'spp_reminder_h3':
      return `⏰ Pengingat Pembayaran SPP

Yth. Orang tua/wali ${vars.student_name}
Kelas ${vars.class_name}

SPP ${vars.month_year}  : Rp ${formatCurrency(vars.amount || 0)}
Jatuh tempo        : ${vars.due_date}
                     (3 hari lagi)

Mohon segera dilunasi ke bendahara sekolah.

🏫 ${vars.school_name}`

    case 'spp_reminder_h0':
      return `⚠️ SPP Jatuh Tempo Hari Ini

Yth. Orang tua/wali ${vars.student_name}
Kelas ${vars.class_name}

SPP ${vars.month_year}  : Rp ${formatCurrency(vars.amount || 0)}
Status             : Belum Lunas

Mohon segera selesaikan pembayaran hari ini.

🏫 ${vars.school_name}`

    case 'spp_overdue_h7':
      return `❗ Pemberitahuan Tunggakan SPP

Yth. Orang tua/wali ${vars.student_name}
Kelas ${vars.class_name}

SPP ${vars.month_year}  : Rp ${formatCurrency(vars.amount || 0)}
Telah jatuh tempo  : 7 hari yang lalu

Mohon segera selesaikan pembayaran ke
bendahara ${vars.school_name}.

Terima kasih atas perhatiannya.
— Sistem Smart Bendahara`

    default:
      return `Notifikasi dari ${vars.school_name} untuk ${vars.student_name}`
  }
}

// ============================================
// Gateway Senders
// ============================================
async function sendViaFonnte(apiKey: string, phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: phone,
        message: message,
        countryCode: '62',
      }),
    })

    const result = await response.json()
    if (result.status === true || result.status === 'true') {
      return { success: true }
    }
    return { success: false, error: result.reason || result.message || 'Fonnte API error' }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}

async function sendViaWablas(apiKey: string, phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://pati.wablas.com/api/send-message', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phone,
        message: message,
      }),
    })

    const result = await response.json()
    if (result.status === true || result.status === 'true') {
      return { success: true }
    }
    return { success: false, error: result.message || 'Wablas API error' }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}

async function sendViaSelfHosted(gatewayUrl: string, phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const url = gatewayUrl.endsWith('/') ? `${gatewayUrl}send` : `${gatewayUrl}/send`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: phone,
        message: message,
      }),
    })

    const result = await response.json()
    if (result.status === true || result.status === 'true') {
      return { success: true }
    }
    return { success: false, error: result.reason || result.message || 'Self-hosted API error' }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error connecting to self-hosted gateway' }
  }
}

// ============================================
// Main Handler
// ============================================
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const body = await req.json()
    const {
      event_type,
      student_id,
      tenant_id,
      template_vars = {},
      phone_override,
    } = body

    if (!event_type || !student_id || !tenant_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: event_type, student_id, tenant_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Get WA config for tenant
    const { data: waConfig } = await supabase
      .from('wa_configs')
      .select('*')
      .eq('tenant_id', tenant_id)
      .single()

    // Skip if gateway not configured
    if (!waConfig || !waConfig.is_active || (waConfig.gateway !== 'self_hosted' && !waConfig.api_key)) {
      // Log as skipped
      await supabase.from('notification_logs').insert({
        tenant_id,
        student_id,
        event_type,
        status: 'skipped_no_gateway',
        message_sent: 'Gateway WA belum dikonfigurasi',
      })

      return new Response(
        JSON.stringify({ success: true, status: 'skipped_no_gateway' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Determine target phone number
    let phone = phone_override

    if (!phone) {
      const { data: contacts } = await supabase
        .from('parent_contacts')
        .select('*')
        .eq('student_id', student_id)
        .eq('is_primary', true)
        .eq('wa_enabled', true)

      if (!contacts || contacts.length === 0) {
        await supabase.from('notification_logs').insert({
          tenant_id,
          student_id,
          event_type,
          status: 'skipped_no_gateway',
          message_sent: 'Tidak ada kontak orang tua yang aktif',
        })

        return new Response(
          JSON.stringify({ success: true, status: 'no_contact' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      phone = contacts[0].phone_wa
    }

    if (!phone) {
      return new Response(
        JSON.stringify({ success: true, status: 'no_phone' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Get tenant name
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenant_id)
      .single()

    // 4. Get student info with class
    const { data: student } = await supabase
      .from('students')
      .select('name')
      .eq('id', student_id)
      .single()

    const { data: enrollment } = await supabase
      .from('student_enrollments')
      .select('*, class:classes(name)')
      .eq('student_id', student_id)
      .eq('is_active', true)
      .single() as any

    // 5. Build message from template
    const vars: TemplateVars = {
      student_name: student?.name || 'Siswa',
      class_name: enrollment?.class?.name || '-',
      school_name: tenant?.name || 'Sekolah',
      ...template_vars,
    }

    const message = getMessageTemplate(event_type, vars, waConfig)

    // 6. Send via gateway
    let sendResult: { success: boolean; error?: string }

    if (waConfig.gateway === 'fonnte') {
      sendResult = await sendViaFonnte(waConfig.api_key, phone, message)
    } else if (waConfig.gateway === 'wablas') {
      sendResult = await sendViaWablas(waConfig.api_key, phone, message)
    } else if (waConfig.gateway === 'self_hosted') {
      if (!waConfig.gateway_url) {
        sendResult = { success: false, error: 'Self-hosted Gateway URL is missing' }
      } else {
        sendResult = await sendViaSelfHosted(waConfig.gateway_url, phone, message)
      }
    } else {
      sendResult = { success: false, error: `Unsupported gateway: ${waConfig.gateway}` }
    }

    // 7. Log result
    await supabase.from('notification_logs').insert({
      tenant_id,
      student_id,
      event_type,
      recipient_phone: phone,
      message_sent: message,
      status: sendResult.success ? 'sent' : 'failed',
      error_message: sendResult.error || null,
      sent_at: sendResult.success ? new Date().toISOString() : null,
    })

    return new Response(
      JSON.stringify({
        success: sendResult.success,
        status: sendResult.success ? 'sent' : 'failed',
        error: sendResult.error,
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
