// ============================================
// Smart Bendahara — PDF Report Generator Edge Function
// Generates server-side PDF reports with school branding
// PRD F-05: Laporan PDF layout siap cetak, berlogo sekolah
// ============================================
// Deploy: supabase functions deploy generate-pdf

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.8'
import { jsPDF } from 'https://esm.sh/jspdf@2.5.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================
// Helpers
// ============================================
function formatCurrency(amount: number): string {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function getStatusLabel(status: string): string {
  switch (status) {
    case 'paid': return 'Lunas'
    case 'partial': return 'Sebagian'
    case 'unpaid': return 'Belum Bayar'
    default: return status
  }
}

// ============================================
// PDF Header (reusable for all reports)
// ============================================
function addHeader(doc: jsPDF, tenant: any, reportTitle: string, period: string) {
  const pageWidth = doc.internal.pageSize.getWidth()

  // School name
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(tenant.name || 'Sekolah', pageWidth / 2, 20, { align: 'center' })

  // Address
  if (tenant.address) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(tenant.address, pageWidth / 2, 27, { align: 'center' })
  }

  // Divider line
  doc.setLineWidth(0.5)
  doc.line(15, 32, pageWidth - 15, 32)
  doc.setLineWidth(0.2)
  doc.line(15, 33, pageWidth - 15, 33)

  // Report title
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(reportTitle, pageWidth / 2, 42, { align: 'center' })

  // Period
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(period, pageWidth / 2, 49, { align: 'center' })

  return 55 // Return Y position after header
}

// ============================================
// PDF Footer (reusable)
// ============================================
function addFooter(doc: jsPDF, tenant: any) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageCount = doc.getNumberOfPages()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Footer line
    doc.setLineWidth(0.2)
    doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20)

    // Footer text
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Dicetak oleh Smart Bendahara — ${tenant.name}`,
      15, pageHeight - 14
    )
    doc.text(
      `Tanggal cetak: ${formatDate(new Date().toISOString())}`,
      15, pageHeight - 9
    )
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      pageWidth - 15, pageHeight - 14,
      { align: 'right' }
    )
  }
}

// ============================================
// Table drawing helper
// ============================================
function drawTable(
  doc: jsPDF,
  startY: number,
  headers: string[],
  rows: string[][],
  colWidths: number[],
  tenant: any
): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const startX = 15
  const rowHeight = 8
  const headerHeight = 10
  const bottomMargin = 30

  let y = startY

  // Draw header row
  doc.setFillColor(41, 98, 255) // Blue header
  doc.rect(startX, y, pageWidth - 30, headerHeight, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')

  let x = startX + 3
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x, y + 7)
    x += colWidths[i]
  }

  y += headerHeight
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')

  // Draw data rows
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    // Check if we need a new page
    if (y + rowHeight > pageHeight - bottomMargin) {
      doc.addPage()
      y = 20

      // Redraw header on new page
      doc.setFillColor(41, 98, 255)
      doc.rect(startX, y, pageWidth - 30, headerHeight, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')

      x = startX + 3
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], x, y + 7)
        x += colWidths[i]
      }
      y += headerHeight
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')
    }

    // Alternate row background
    if (rowIndex % 2 === 0) {
      doc.setFillColor(245, 247, 250)
      doc.rect(startX, y, pageWidth - 30, rowHeight, 'F')
    }

    // Row border
    doc.setDrawColor(220, 220, 220)
    doc.line(startX, y + rowHeight, pageWidth - 15, y + rowHeight)

    // Row data
    doc.setFontSize(8)
    x = startX + 3
    for (let i = 0; i < rows[rowIndex].length; i++) {
      const cellText = rows[rowIndex][i] || '-'
      doc.text(cellText.substring(0, 30), x, y + 6)
      x += colWidths[i]
    }

    y += rowHeight
  }

  return y
}

// ============================================
// Report Generators
// ============================================

async function generateSppMonthlyReport(
  supabase: any,
  tenantId: string,
  tenant: any,
  month: number,
  year: number,
  classId?: string
): Promise<jsPDF> {
  const doc = new jsPDF()

  // Build query
  let query = supabase
    .from('spp_payments')
    .select('*, student:students(name, nisn)')
    .eq('tenant_id', tenantId)
    .eq('month', month)
    .eq('year', year)
    .order('student(name)') as any

  const { data: payments } = await query

  // If classId filter, get students in that class
  let filteredPayments = payments || []
  let className = 'Semua Kelas'

  if (classId) {
    const { data: enrollments } = await supabase
      .from('student_enrollments')
      .select('student_id, class:classes(name)')
      .eq('class_id', classId)
      .eq('is_active', true) as any

    if (enrollments && enrollments.length > 0) {
      className = enrollments[0]?.class?.name || className
      const studentIds = new Set(enrollments.map((e: any) => e.student_id))
      filteredPayments = filteredPayments.filter((p: any) => studentIds.has(p.student_id))
    }
  }

  const period = `${MONTHS[month - 1]} ${year} — ${className}`
  let y = addHeader(doc, tenant, 'LAPORAN PEMBAYARAN SPP', period)

  // Summary section
  const totalDue = filteredPayments.reduce((sum: number, p: any) => sum + (p.amount_due || 0), 0)
  const totalPaid = filteredPayments.reduce((sum: number, p: any) => sum + (p.amount_paid || 0), 0)
  const totalArrears = totalDue - totalPaid
  const paidCount = filteredPayments.filter((p: any) => p.status === 'paid').length
  const unpaidCount = filteredPayments.filter((p: any) => p.status === 'unpaid').length
  const partialCount = filteredPayments.filter((p: any) => p.status === 'partial').length

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Ringkasan:', 15, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Total Tagihan  : ${formatCurrency(totalDue)}`, 15, y); y += 5
  doc.text(`Total Terbayar : ${formatCurrency(totalPaid)}`, 15, y); y += 5
  doc.text(`Total Tunggakan: ${formatCurrency(totalArrears)}`, 15, y); y += 5
  doc.text(`Lunas: ${paidCount}  |  Sebagian: ${partialCount}  |  Belum Bayar: ${unpaidCount}`, 15, y)
  y += 10

  // Table
  const headers = ['No', 'Nama Siswa', 'NISN', 'Tagihan', 'Terbayar', 'Sisa', 'Status']
  const colWidths = [12, 45, 25, 25, 25, 25, 23]

  const rows = filteredPayments.map((p: any, i: number) => [
    String(i + 1),
    p.student?.name || '-',
    p.student?.nisn || '-',
    formatCurrency(p.amount_due),
    formatCurrency(p.amount_paid),
    formatCurrency(p.amount_due - p.amount_paid),
    getStatusLabel(p.status),
  ])

  drawTable(doc, y, headers, rows, colWidths, tenant)
  addFooter(doc, tenant)

  return doc
}

async function generateSavingsReport(
  supabase: any,
  tenantId: string,
  tenant: any,
  classId?: string
): Promise<jsPDF> {
  const doc = new jsPDF()

  // Get savings accounts with student info
  const { data: accounts } = await supabase
    .from('savings_accounts')
    .select('*, student:students(name, nisn)')
    .eq('tenant_id', tenantId)
    .order('student(name)') as any

  let filteredAccounts = accounts || []
  let className = 'Semua Kelas'

  if (classId) {
    const { data: enrollments } = await supabase
      .from('student_enrollments')
      .select('student_id, class:classes(name)')
      .eq('class_id', classId)
      .eq('is_active', true) as any

    if (enrollments && enrollments.length > 0) {
      className = enrollments[0]?.class?.name || className
      const studentIds = new Set(enrollments.map((e: any) => e.student_id))
      filteredAccounts = filteredAccounts.filter((a: any) => studentIds.has(a.student_id))
    }
  }

  const period = `Per ${formatDate(new Date().toISOString())} — ${className}`
  let y = addHeader(doc, tenant, 'LAPORAN TABUNGAN SISWA', period)

  // Summary
  const totalBalance = filteredAccounts.reduce((sum: number, a: any) => sum + (a.balance || 0), 0)
  const accountCount = filteredAccounts.length

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Ringkasan:', 15, y); y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Total Saldo Gabungan : ${formatCurrency(totalBalance)}`, 15, y); y += 5
  doc.text(`Jumlah Rekening      : ${accountCount} siswa`, 15, y)
  y += 10

  // Table
  const headers = ['No', 'Nama Siswa', 'NISN', 'Saldo', 'Terakhir Diperbarui']
  const colWidths = [12, 55, 30, 40, 43]

  const rows = filteredAccounts.map((a: any, i: number) => [
    String(i + 1),
    a.student?.name || '-',
    a.student?.nisn || '-',
    formatCurrency(a.balance),
    formatDate(a.updated_at),
  ])

  drawTable(doc, y, headers, rows, colWidths, tenant)
  addFooter(doc, tenant)

  return doc
}

async function generateBillReport(
  supabase: any,
  tenantId: string,
  tenant: any,
  billId?: string
): Promise<jsPDF> {
  const doc = new jsPDF()

  // Get bill assignments with student info
  let query = supabase
    .from('bill_assignments')
    .select('*, student:students(name, nisn), bill:custom_bills(name, due_date, default_amount)')
    .eq('tenant_id', tenantId) as any

  if (billId) {
    query = query.eq('custom_bill_id', billId)
  }

  const { data: assignments } = await query

  const filteredAssignments = assignments || []

  // Get bill name for title
  let billName = 'Semua Tagihan'
  if (billId && filteredAssignments.length > 0) {
    billName = filteredAssignments[0]?.bill?.name || billName
  }

  const period = `${billName} — Per ${formatDate(new Date().toISOString())}`
  let y = addHeader(doc, tenant, 'LAPORAN TAGIHAN INSIDENTAL', period)

  // Summary
  const totalDue = filteredAssignments.reduce((sum: number, a: any) => sum + (a.amount_due || 0), 0)
  const totalPaid = filteredAssignments.reduce((sum: number, a: any) => sum + (a.amount_paid || 0), 0)
  const paidCount = filteredAssignments.filter((a: any) => a.status === 'paid').length
  const unpaidCount = filteredAssignments.filter((a: any) => a.status === 'unpaid').length

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Ringkasan:', 15, y); y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Total Tagihan  : ${formatCurrency(totalDue)}`, 15, y); y += 5
  doc.text(`Total Terbayar : ${formatCurrency(totalPaid)}`, 15, y); y += 5
  doc.text(`Lunas: ${paidCount}  |  Belum Bayar: ${unpaidCount}`, 15, y)
  y += 10

  // Table
  const headers = ['No', 'Nama Siswa', 'NISN', 'Tagihan', 'Terbayar', 'Sisa', 'Status']
  const colWidths = [12, 45, 25, 25, 25, 25, 23]

  const rows = filteredAssignments.map((a: any, i: number) => [
    String(i + 1),
    a.student?.name || '-',
    a.student?.nisn || '-',
    formatCurrency(a.amount_due),
    formatCurrency(a.amount_paid),
    formatCurrency(a.amount_due - a.amount_paid),
    getStatusLabel(a.status),
  ])

  drawTable(doc, y, headers, rows, colWidths, tenant)
  addFooter(doc, tenant)

  return doc
}

async function generateDailyIncomeReport(
  supabase: any,
  tenantId: string,
  tenant: any,
  date: string
): Promise<jsPDF> {
  const doc = new jsPDF()

  const reportDate = date || new Date().toISOString().split('T')[0]
  const dateStart = `${reportDate}T00:00:00`
  const dateEnd = `${reportDate}T23:59:59`

  // Get SPP payments for the day
  const { data: sppPayments } = await supabase
    .from('spp_payments')
    .select('*, student:students(name)')
    .eq('tenant_id', tenantId)
    .gte('paid_at', dateStart)
    .lte('paid_at', dateEnd)
    .in('status', ['paid', 'partial']) as any

  // Get bill payments for the day
  const { data: billPayments } = await supabase
    .from('bill_payments')
    .select('*, assignment:bill_assignments(student:students(name), bill:custom_bills(name))')
    .eq('tenant_id', tenantId)
    .gte('paid_at', dateStart)
    .lte('paid_at', dateEnd) as any

  // Get savings transactions for the day
  const { data: savingsTx } = await supabase
    .from('savings_transactions')
    .select('*, account:savings_accounts(student:students(name))')
    .eq('tenant_id', tenantId)
    .gte('transacted_at', dateStart)
    .lte('transacted_at', dateEnd) as any

  const period = formatDate(reportDate)
  let y = addHeader(doc, tenant, 'REKAP PEMASUKAN HARIAN', period)

  // ---- SPP Section ----
  const sppTotal = (sppPayments || []).reduce((sum: number, p: any) => sum + (p.amount_paid || 0), 0)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`A. Pembayaran SPP — Total: ${formatCurrency(sppTotal)}`, 15, y)
  y += 3

  if (sppPayments && sppPayments.length > 0) {
    const sppHeaders = ['No', 'Nama Siswa', 'Bulan', 'Jumlah', 'Status']
    const sppWidths = [12, 55, 35, 40, 38]
    const sppRows = sppPayments.map((p: any, i: number) => [
      String(i + 1),
      p.student?.name || '-',
      `${MONTHS[p.month - 1]} ${p.year}`,
      formatCurrency(p.amount_paid),
      getStatusLabel(p.status),
    ])
    y = drawTable(doc, y, sppHeaders, sppRows, sppWidths, tenant)
  } else {
    y += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text('Tidak ada pembayaran SPP pada hari ini.', 15, y)
  }
  y += 10

  // Check if we need new page
  if (y > doc.internal.pageSize.getHeight() - 80) {
    doc.addPage()
    y = 20
  }

  // ---- Bill Payments Section ----
  const billTotal = (billPayments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`B. Pembayaran Tagihan — Total: ${formatCurrency(billTotal)}`, 15, y)
  y += 3

  if (billPayments && billPayments.length > 0) {
    const billHeaders = ['No', 'Nama Siswa', 'Tagihan', 'Jumlah']
    const billWidths = [12, 55, 60, 53]
    const billRows = billPayments.map((p: any, i: number) => [
      String(i + 1),
      p.assignment?.student?.name || '-',
      p.assignment?.bill?.name || '-',
      formatCurrency(p.amount),
    ])
    y = drawTable(doc, y, billHeaders, billRows, billWidths, tenant)
  } else {
    y += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text('Tidak ada pembayaran tagihan pada hari ini.', 15, y)
  }
  y += 10

  // Check if we need new page
  if (y > doc.internal.pageSize.getHeight() - 80) {
    doc.addPage()
    y = 20
  }

  // ---- Savings Section ----
  const depositsTotal = (savingsTx || []).filter((t: any) => t.type === 'deposit').reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
  const withdrawalsTotal = (savingsTx || []).filter((t: any) => t.type === 'withdrawal').reduce((sum: number, t: any) => sum + (t.amount || 0), 0)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`C. Tabungan — Setor: ${formatCurrency(depositsTotal)} | Tarik: ${formatCurrency(withdrawalsTotal)}`, 15, y)
  y += 3

  if (savingsTx && savingsTx.length > 0) {
    const savingsHeaders = ['No', 'Nama Siswa', 'Jenis', 'Jumlah', 'Saldo Setelah']
    const savingsWidths = [12, 55, 30, 40, 43]
    const savingsRows = savingsTx.map((t: any, i: number) => [
      String(i + 1),
      t.account?.student?.name || '-',
      t.type === 'deposit' ? 'Setor' : 'Tarik',
      formatCurrency(t.amount),
      formatCurrency(t.balance_after),
    ])
    y = drawTable(doc, y, savingsHeaders, savingsRows, savingsWidths, tenant)
  } else {
    y += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text('Tidak ada transaksi tabungan pada hari ini.', 15, y)
  }
  y += 15

  // ---- Grand Total ----
  if (y > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage()
    y = 20
  }

  doc.setLineWidth(0.5)
  doc.line(15, y, doc.internal.pageSize.getWidth() - 15, y)
  y += 8
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  const grandTotal = sppTotal + billTotal + depositsTotal - withdrawalsTotal
  doc.text(`TOTAL PEMASUKAN BERSIH: ${formatCurrency(grandTotal)}`, 15, y)

  addFooter(doc, tenant)
  return doc
}

// ============================================
// Reconciliation Report
// ============================================
async function generateReconciliationReport(
  supabase: any,
  tenantId: string,
  tenant: any,
  reconciliationId?: string
): Promise<jsPDF> {
  const doc = new jsPDF()

  let query = supabase
    .from('cash_reconciliations')
    .select('*, reconciler:users(name)')
    .eq('tenant_id', tenantId)
    .order('reconciliation_date', { ascending: false }) as any

  if (reconciliationId) {
    query = query.eq('id', reconciliationId)
  }

  const { data: records } = await query
  const filteredRecords = records || []

  const period = `Per ${formatDate(new Date().toISOString())}`
  let y = addHeader(doc, tenant, 'LAPORAN REKONSILIASI KAS', period)

  // Table
  const headers = ['No', 'Tanggal', 'Kas Sistem', 'Kas Fisik', 'Selisih', 'Status', 'Oleh']
  const colWidths = [10, 25, 28, 28, 28, 25, 36]

  const rows = filteredRecords.map((r: any, i: number) => [
    String(i + 1),
    formatDate(r.reconciliation_date),
    formatCurrency(r.system_cash),
    formatCurrency(r.physical_cash),
    formatCurrency(Math.abs(r.difference)),
    r.status === 'balanced' ? 'Seimbang' : 'Selisih',
    r.reconciler?.name || '-',
  ])

  drawTable(doc, y, headers, rows, colWidths, tenant)
  addFooter(doc, tenant)

  return doc
}

// ============================================
// Main Handler
// ============================================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Parse request body
    const body = await req.json()
    const {
      report_type,
      tenant_id,
      month,
      year,
      class_id,
      bill_id,
      date,
      reconciliation_id,
    } = body

    if (!report_type || !tenant_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: report_type, tenant_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get tenant info
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenant_id)
      .single()

    if (!tenant) {
      return new Response(
        JSON.stringify({ error: 'Tenant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate PDF based on type
    let doc: jsPDF

    switch (report_type) {
      case 'spp_monthly':
        if (!month || !year) {
          return new Response(
            JSON.stringify({ error: 'spp_monthly requires month and year parameters' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        doc = await generateSppMonthlyReport(supabase, tenant_id, tenant, month, year, class_id)
        break

      case 'savings_report':
        doc = await generateSavingsReport(supabase, tenant_id, tenant, class_id)
        break

      case 'bill_report':
        doc = await generateBillReport(supabase, tenant_id, tenant, bill_id)
        break

      case 'daily_income':
        doc = await generateDailyIncomeReport(supabase, tenant_id, tenant, date)
        break

      case 'reconciliation':
        doc = await generateReconciliationReport(supabase, tenant_id, tenant, reconciliation_id)
        break

      default:
        return new Response(
          JSON.stringify({ error: `Unknown report type: ${report_type}. Valid: spp_monthly, savings_report, bill_report, daily_income, reconciliation` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Convert to binary
    const pdfOutput = doc.output('arraybuffer')

    // Return PDF
    return new Response(pdfOutput, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="laporan_${report_type}_${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
