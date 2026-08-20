// ============================================
// Smart Bendahara — Supabase Data Hooks
// Central data layer replacing all mock-data usage
// ============================================
import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth-context'
import type {
  Student, Class, AcademicYear, StudentEnrollment, ParentContact,
  SppPayment, SavingsAccount, SavingsTransaction,
  CustomBill, BillAssignment,
  NotificationLog, ActivityLog, WaConfig, Tenant, User
} from './database.types'

// ============================================
// Generic fetch hook with loading/error state
// ============================================
function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await queryFn()
    if (error) {
      setError(error.message)
      console.error('Supabase query error:', error)
    } else {
      setData(data)
    }
    setLoading(false)
  }, deps)

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch, setData }
}

// ============================================
// Students with enrollment & parent info
// ============================================
export interface StudentWithDetails extends Student {
  enrollment?: StudentEnrollment & { class: Class }
  parent_contact?: ParentContact
  class_name?: string
  class_id?: string
}

export function useStudents() {
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id

  const { data: students, loading, error, refetch } = useSupabaseQuery<StudentWithDetails[]>(
    async () => {
      if (!tenantId) return { data: [], error: null }

      // Fetch students
      const { data: studentsRaw, error: err } = await supabase
        .from('students')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name')

      if (err || !studentsRaw) return { data: null, error: err }

      // Fetch enrollments with class info
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select('*, class:classes(*)')
        .eq('tenant_id', tenantId)
        .eq('is_active', true) as any

      // Fetch parent contacts
      const { data: parents } = await supabase
        .from('parent_contacts')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_primary', true)

      // Merge data
      const merged: StudentWithDetails[] = studentsRaw.map((s: Student) => {
        const enrollment = enrollments?.find((e: any) => e.student_id === s.id)
        const parent = parents?.find((p: ParentContact) => p.student_id === s.id)
        return {
          ...s,
          enrollment,
          parent_contact: parent,
          class_name: enrollment?.class?.name || '-',
          class_id: enrollment?.class?.id || '',
        }
      })

      return { data: merged, error: null }
    },
    [tenantId]
  )

  const addStudent = async (student: {
    name: string; nisn?: string; status?: string; enrollment_date?: string;
    class_id?: string; parent_name?: string; parent_phone?: string; parent_relationship?: string
  }) => {
    if (!tenantId) return { error: 'Not authenticated' }

    // Insert student
    const { data: newStudent, error: err } = await supabase
      .from('students')
      .insert({ tenant_id: tenantId, name: student.name, nisn: student.nisn || null, enrollment_date: student.enrollment_date || new Date().toISOString().split('T')[0] })
      .select()
      .single()

    if (err || !newStudent) return { error: err?.message || 'Failed to create student' }

    // Create enrollment if class_id provided
    if (student.class_id) {
      await supabase.from('student_enrollments').insert({
        tenant_id: tenantId, student_id: newStudent.id, class_id: student.class_id, is_active: true
      })
    }

    // Create parent contact if provided
    if (student.parent_name) {
      await supabase.from('parent_contacts').insert({
        tenant_id: tenantId, student_id: newStudent.id,
        name: student.parent_name,
        phone_wa: student.parent_phone || null,
        relationship: (student.parent_relationship as any) || 'mother',
        is_primary: true, wa_enabled: true
      })
    }

    // Create savings account
    await supabase.from('savings_accounts').insert({
      tenant_id: tenantId, student_id: newStudent.id, balance: 0
    })

    await refetch()
    return { error: null }
  }

  const updateStudent = async (id: string, updates: {
    name?: string; nisn?: string; status?: string;
    class_id?: string; parent_name?: string; parent_phone?: string
  }) => {
    if (!tenantId) return { error: 'Not authenticated' }

    const { error: err } = await supabase
      .from('students')
      .update({ name: updates.name, nisn: updates.nisn, status: updates.status as any })
      .eq('id', id)

    if (err) return { error: err.message }

    // Update enrollment if class changed
    if (updates.class_id) {
      await supabase.from('student_enrollments')
        .update({ is_active: false })
        .eq('student_id', id)
        .eq('tenant_id', tenantId)

      await supabase.from('student_enrollments').insert({
        tenant_id: tenantId, student_id: id, class_id: updates.class_id, is_active: true
      })
    }

    // Update parent contact
    if (updates.parent_name) {
      await supabase.from('parent_contacts')
        .update({ name: updates.parent_name, phone_wa: updates.parent_phone })
        .eq('student_id', id)
        .eq('is_primary', true)
    }

    await refetch()
    return { error: null }
  }

  const deleteStudent = async (id: string) => {
    if (!tenantId) return { error: 'Not authenticated' }

    // Must delete related records explicitly (RLS can block CASCADE)
    // Order matters: delete children before parents

    // 1. Delete savings transactions (via savings_account)
    const { data: savingsAcct } = await supabase
      .from('savings_accounts')
      .select('id')
      .eq('student_id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (savingsAcct) {
      await supabase.from('savings_transactions')
        .delete()
        .eq('savings_account_id', savingsAcct.id)
        .eq('tenant_id', tenantId)
    }

    // 2. Delete savings account
    await supabase.from('savings_accounts').delete().eq('student_id', id).eq('tenant_id', tenantId)

    // 3. Delete bill payments (via bill_assignments)
    const { data: billAssignments } = await supabase
      .from('bill_assignments')
      .select('id')
      .eq('student_id', id)
      .eq('tenant_id', tenantId)

    if (billAssignments && billAssignments.length > 0) {
      const assignmentIds = billAssignments.map(a => a.id)
      await supabase.from('bill_payments')
        .delete()
        .in('bill_assignment_id', assignmentIds)
        .eq('tenant_id', tenantId)
    }

    // 4. Delete bill assignments
    await supabase.from('bill_assignments').delete().eq('student_id', id).eq('tenant_id', tenantId)

    // 5. Delete SPP payments
    await supabase.from('spp_payments').delete().eq('student_id', id).eq('tenant_id', tenantId)

    // 6. Delete notification logs
    await supabase.from('notification_logs').delete().eq('student_id', id).eq('tenant_id', tenantId)

    // 7. Delete parent contacts
    await supabase.from('parent_contacts').delete().eq('student_id', id).eq('tenant_id', tenantId)

    // 8. Delete student enrollments
    await supabase.from('student_enrollments').delete().eq('student_id', id).eq('tenant_id', tenantId)

    // 9. Finally delete the student
    const { error: err } = await supabase.from('students').delete().eq('id', id).eq('tenant_id', tenantId)
    if (err) return { error: err.message }

    await refetch()
    return { error: null }
  }

  return { students: students || [], loading, error, refetch, addStudent, updateStudent, deleteStudent }
}

// ============================================
// Classes
// ============================================
export function useClasses() {
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id

  const query = useSupabaseQuery<Class[]>(
    async () => {
      if (!tenantId) return { data: [], error: null }
      return await supabase
        .from('classes')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('grade')
    },
    [tenantId]
  )

  const addClass = async (data: { name: string; grade: string; spp_amount: number; academic_year_id: string }) => {
    if (!tenantId) return { error: 'Not authenticated' }
    const { error } = await supabase.from('classes').insert({ ...data, tenant_id: tenantId })
    if (error) return { error: error.message }
    await query.refetch()
    return { error: null }
  }

  const updateClass = async (id: string, data: { name?: string; grade?: string; spp_amount?: number }) => {
    if (!tenantId) return { error: 'Not authenticated' }
    const { error } = await supabase.from('classes').update(data).eq('id', id)
    if (error) return { error: error.message }
    await query.refetch()
    return { error: null }
  }

  const deleteClass = async (id: string) => {
    const { error } = await supabase.from('classes').delete().eq('id', id)
    if (error) return { error: error.message }
    await query.refetch()
    return { error: null }
  }

  return { classes: query.data || [], ...query, addClass, updateClass, deleteClass }
}

// ============================================
// Academic Years
// ============================================
export function useAcademicYears() {
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id

  const query = useSupabaseQuery<AcademicYear[]>(
    async () => {
      if (!tenantId) return { data: [], error: null }
      return await supabase
        .from('academic_years')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('is_active', { ascending: false })
    },
    [tenantId]
  )

  const addAcademicYear = async (data: { name: string; start_date: string; end_date: string }) => {
    if (!tenantId) return { error: 'Not authenticated' }
    const { error } = await supabase.from('academic_years').insert({ ...data, tenant_id: tenantId, is_active: false })
    if (error) return { error: error.message }
    await query.refetch()
    return { error: null }
  }

  const setActiveYear = async (id: string) => {
    if (!tenantId) return { error: 'Not authenticated' }
    // Deactivate all first
    await supabase.from('academic_years').update({ is_active: false }).eq('tenant_id', tenantId)
    // Activate selected
    const { error } = await supabase.from('academic_years').update({ is_active: true }).eq('id', id)
    if (error) return { error: error.message }
    await query.refetch()
    return { error: null }
  }

  return { academicYears: query.data || [], activeYear: (query.data || []).find(y => y.is_active), ...query, addAcademicYear, setActiveYear }
}

// ============================================
// SPP Payments
// ============================================
export function useSppPayments(filters?: { classId?: string; yearId?: string }) {
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id

  const { data, loading, error, refetch } = useSupabaseQuery<SppPayment[]>(
    async () => {
      if (!tenantId) return { data: [], error: null }
      let query = supabase.from('spp_payments').select('*').eq('tenant_id', tenantId)
      if (filters?.yearId) query = query.eq('academic_year_id', filters.yearId)
      return await query.order('year').order('month')
    },
    [tenantId, filters?.classId, filters?.yearId]
  )

  // Record payment via server-side RPC (atomik + auto-log)
  const recordPayment = async (paymentId: string, amount: number, _amountDue?: number) => {
    if (!tenantId) return { error: 'Not authenticated' }
    const { data: result, error: err } = await (supabase as any).rpc('record_spp_payment', {
      p_payment_id: paymentId,
      p_amount: amount,
    })
    if (err) return { error: err.message }
    await refetch()
    return { error: null, data: result }
  }

  // Create individual SPP payment record (still client-side for simple inserts)
  const createPaymentRecord = async (studentId: string, academicYearId: string, month: number, year: number, amountDue: number, amountPaid: number) => {
    if (!tenantId) return { error: 'Not authenticated' }
    const status = amountPaid >= amountDue ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid'
    const { error: err } = await supabase.from('spp_payments').insert({
      tenant_id: tenantId, student_id: studentId, academic_year_id: academicYearId,
      month, year, amount_due: amountDue, amount_paid: amountPaid, status,
      paid_at: status !== 'unpaid' ? new Date().toISOString() : null
    })
    if (err) return { error: err.message }
    await refetch()
    return { error: null }
  }

  // Generate SPP records for entire class via RPC
  const generateSppForClass = async (classId: string, academicYearId: string, month: number, year: number) => {
    if (!tenantId) return { error: 'Not authenticated' }
    const { data: result, error: err } = await (supabase as any).rpc('generate_spp_for_class', {
      p_class_id: classId,
      p_academic_year_id: academicYearId,
      p_month: month,
      p_year: year,
    })
    if (err) return { error: err.message }
    await refetch()
    return { error: null, data: result }
  }

  return { payments: data || [], loading, error, refetch, recordPayment, createPaymentRecord, generateSppForClass }
}

// ============================================
// Savings
// ============================================
export function useSavings() {
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id

  const { data: accounts, loading, error, refetch } = useSupabaseQuery<(SavingsAccount & { student?: Student })[]>(
    async () => {
      if (!tenantId) return { data: [], error: null }
      const { data, error } = await supabase
        .from('savings_accounts')
        .select('*, student:students(id, name, nisn)')
        .eq('tenant_id', tenantId) as any
      return { data, error }
    },
    [tenantId]
  )

  const { data: transactions, refetch: refetchTx } = useSupabaseQuery<SavingsTransaction[]>(
    async () => {
      if (!tenantId) return { data: [], error: null }
      return await supabase.from('savings_transactions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('transacted_at', { ascending: false })
        .limit(100)
    },
    [tenantId]
  )

  // Deposit via server-side RPC (atomik: update saldo + insert transaksi)
  const deposit = async (accountId: string, amount: number, notes?: string) => {
    if (!tenantId) return { error: 'Not authenticated' }
    const { data: result, error: err } = await (supabase as any).rpc('process_savings_deposit', {
      p_account_id: accountId,
      p_amount: amount,
      p_notes: notes || null,
    })
    if (err) return { error: err.message }
    await refetch()
    await refetchTx()
    return { error: null, data: result }
  }

  // Withdraw via server-side RPC (atomik: validasi saldo + update + insert)
  const withdraw = async (accountId: string, amount: number, notes?: string) => {
    if (!tenantId) return { error: 'Not authenticated' }
    const { data: result, error: err } = await (supabase as any).rpc('process_savings_withdrawal', {
      p_account_id: accountId,
      p_amount: amount,
      p_notes: notes || null,
    })
    if (err) return { error: err.message }
    await refetch()
    await refetchTx()
    return { error: null, data: result }
  }

  return { accounts: accounts || [], transactions: transactions || [], loading, error, refetch, deposit, withdraw }
}

// ============================================
// Custom Bills (Tagihan)
// ============================================
export function useCustomBills() {
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id

  const { data: bills, loading, error, refetch } = useSupabaseQuery<CustomBill[]>(
    async () => {
      if (!tenantId) return { data: [], error: null }
      return await supabase.from('custom_bills')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
    },
    [tenantId]
  )

  const { data: assignments, refetch: refetchAssignments } = useSupabaseQuery<(BillAssignment & { student?: Student })[]>(
    async () => {
      if (!tenantId) return { data: [], error: null }
      const { data, error } = await supabase.from('bill_assignments')
        .select('*, student:students(id, name, nisn)')
        .eq('tenant_id', tenantId) as any
      return { data, error }
    },
    [tenantId]
  )

  // Create bill with auto-assignment via server-side RPC
  const createBill = async (bill: { name: string; description?: string; default_amount: number; due_date?: string; class_ids?: string[] }) => {
    if (!tenantId) return { error: 'Not authenticated' }

    const { data: result, error: err } = await (supabase as any).rpc('create_bill_with_assignments', {
      p_name: bill.name,
      p_description: bill.description || null,
      p_default_amount: bill.default_amount,
      p_due_date: bill.due_date || null,
      p_class_ids: bill.class_ids || [],
    })
    if (err) return { error: err.message }

    await refetch()
    await refetchAssignments()
    return { error: null, data: result }
  }

  const archiveBill = async (id: string) => {
    const { error: err } = await supabase.from('custom_bills')
      .update({ status: 'archived' })
      .eq('id', id)
    if (err) return { error: err.message }
    await refetch()
    return { error: null }
  }

  // Record bill payment via server-side RPC (atomik + auto-log)
  const recordBillPayment = async (assignmentId: string, amount: number) => {
    if (!tenantId) return { error: 'Not authenticated' }

    const { data: result, error: err } = await (supabase as any).rpc('record_bill_payment', {
      p_assignment_id: assignmentId,
      p_amount: amount,
    })
    if (err) return { error: err.message }

    await refetch()
    await refetchAssignments()
    return { error: null, data: result }
  }

  return { bills: bills || [], assignments: assignments || [], loading, error, refetch, createBill, archiveBill, recordBillPayment }
}

// ============================================
// Dashboard Stats (aggregated)
// ============================================
export function useDashboardStats() {
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id

  const { data, loading, error, refetch } = useSupabaseQuery<{
    totalStudents: number; totalClasses: number;
    monthlyIncome: number; totalArrears: number; arrearsCount: number;
    totalSavings: number; monthlyIncomeData: { month: string; amount: number }[];
    paymentStatusData: { name: string; value: number }[];
    recentActivities: ActivityLog[]; recentTransactions: SavingsTransaction[];
  }>(
    async () => {
      if (!tenantId) return { data: null, error: null }

      // Single RPC call replaces 5+ separate queries
      const { data: stats, error: err } = await (supabase as any).rpc('get_dashboard_stats')

      if (err || !stats || !stats.success) {
        // Fallback: return empty stats if RPC fails
        return {
          data: {
            totalStudents: 0, totalClasses: 0, monthlyIncome: 0,
            totalArrears: 0, arrearsCount: 0, totalSavings: 0,
            monthlyIncomeData: [], paymentStatusData: [],
            recentActivities: [], recentTransactions: [],
          },
          error: err,
        }
      }

      // Transform server response to match existing component expectations
      const monthlyIncomeData = (stats.monthly_income_data || []).map((d: any) => ({
        month: d.month, amount: d.amount,
      }))

      const paymentStatusData = stats.payment_status_data ? [
        { name: 'Lunas', value: stats.payment_status_data.paid || 0 },
        { name: 'Sebagian', value: stats.payment_status_data.partial || 0 },
        { name: 'Belum Bayar', value: stats.payment_status_data.unpaid || 0 },
      ] : []

      return {
        data: {
          totalStudents: stats.total_students || 0,
          totalClasses: stats.total_classes || 0,
          monthlyIncome: stats.monthly_income || 0,
          totalArrears: stats.total_arrears || 0,
          arrearsCount: stats.arrears_count || 0,
          totalSavings: stats.total_savings || 0,
          monthlyIncomeData,
          paymentStatusData,
          recentActivities: stats.recent_activities || [],
          recentTransactions: [],
        },
        error: null,
      }
    },
    [tenantId]
  )

  return { stats: data, loading, error, refetch }
}

// ============================================
// Audit / Activity Logs
// ============================================
export function useAuditLogs(filters?: { action?: string; dateFrom?: string; dateTo?: string }) {
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id

  const query = useSupabaseQuery<(ActivityLog & { user?: User })[]>(
    async () => {
      if (!tenantId) return { data: [], error: null }
      let q = supabase.from('activity_logs')
        .select('*, user:users(name, email)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(100) as any

      if (filters?.action) q = q.eq('action', filters.action)
      if (filters?.dateFrom) q = q.gte('created_at', filters.dateFrom)
      if (filters?.dateTo) q = q.lte('created_at', filters.dateTo)

      return await q
    },
    [tenantId, filters?.action, filters?.dateFrom, filters?.dateTo]
  )

  return { logs: query.data || [], ...query }
}

// ============================================
// Notification Logs
// ============================================
export function useNotificationLogs() {
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id

  const query = useSupabaseQuery<(NotificationLog & { student?: Student })[]>(
    async () => {
      if (!tenantId) return { data: [], error: null }
      const { data, error } = await supabase.from('notification_logs')
        .select('*, student:students(name)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(100) as any
      return { data, error }
    },
    [tenantId]
  )

  return { logs: query.data || [], ...query }
}

// ============================================
// Settings (Tenant, Classes, WA Config)
// ============================================
export function useSettings() {
  const { profile, refreshProfile } = useAuth()
  const tenantId = profile?.tenant_id

  const { data: tenant, loading: tenantLoading, refetch: refetchTenant } = useSupabaseQuery<Tenant>(
    async () => {
      if (!tenantId) return { data: null, error: null }
      return await supabase.from('tenants').select('*').eq('id', tenantId).single()
    },
    [tenantId]
  )

  const { data: waConfig, refetch: refetchWa } = useSupabaseQuery<WaConfig>(
    async () => {
      if (!tenantId) return { data: null, error: null }
      return await supabase.from('wa_configs').select('*').eq('tenant_id', tenantId).single()
    },
    [tenantId]
  )

  const { data: allUsers, refetch: refetchUsers } = useSupabaseQuery<User[]>(
    async () => {
      if (!tenantId) return { data: [], error: null }
      return await supabase.from('users').select('*').eq('tenant_id', tenantId).order('name')
    },
    [tenantId]
  )

  const updateTenant = async (updates: Partial<Tenant>) => {
    if (!tenantId) return { error: 'Not authenticated' }
    const { error } = await supabase.from('tenants').update(updates).eq('id', tenantId)
    if (error) return { error: error.message }
    await refetchTenant()
    await refreshProfile()
    return { error: null }
  }

  const updateWaConfig = async (updates: Partial<WaConfig>) => {
    if (!tenantId) return { error: 'Not authenticated' }
    const { error } = await supabase.from('wa_configs').update(updates).eq('tenant_id', tenantId)
    if (error) return { error: error.message }
    await refetchWa()
    return { error: null }
  }

  return {
    tenant, waConfig, users: allUsers || [],
    loading: tenantLoading,
    updateTenant, updateWaConfig,
    refetchTenant, refetchWa, refetchUsers,
  }
}

// ============================================
// Portal Orang Tua — secure lookup via RPC
// ============================================
export interface PortalStudentData {
  student: { id: string; name: string; nisn: string | null; status: string }
  className: string
  tenantName: string
  tenantLogo: string | null
  sppPayments: SppPayment[]
  savingsAccount: SavingsAccount | null
  savingsTransactions: SavingsTransaction[]
  billAssignments: (BillAssignment & { bill?: CustomBill })[]
}

export function usePortalData(phoneNumber: string | null) {
  const [data, setData] = useState<PortalStudentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!phoneNumber) return
    setLoading(true)
    setError(null)

    try {
      // Use secure RPC that returns all portal data in one call
      const { data: result, error: rpcErr } = await (supabase as any).rpc('portal_lookup_by_phone', {
        p_phone: phoneNumber,
      })

      if (rpcErr) {
        setError(rpcErr.message || 'Terjadi kesalahan')
        setLoading(false)
        return
      }

      if (!result || !result.success) {
        setError(result?.error || 'Nomor tidak terdaftar di sistem')
        setLoading(false)
        return
      }

      // Transform RPC response to match PortalStudentData interface
      setData({
        student: result.student,
        className: result.class_name || '-',
        tenantName: result.tenant_name || 'Sekolah',
        tenantLogo: result.tenant_logo || null,
        sppPayments: result.spp_payments || [],
        savingsAccount: result.savings_account || null,
        savingsTransactions: result.savings_transactions || [],
        billAssignments: (result.bill_assignments || []).map((ba: any) => ({
          ...ba,
          bill: ba.bill_name ? { name: ba.bill_name, description: ba.bill_description, due_date: ba.due_date } : undefined,
        })),
      })
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan')
    }

    setLoading(false)
  }, [phoneNumber])

  useEffect(() => {
    if (phoneNumber) fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// ============================================
// Mass Promotion (Kenaikan Kelas Massal F-10)
// ============================================
export function useMassPromotion() {
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id

  const promote = async (
    fromAcademicYearId: string,
    toAcademicYearId: string,
    gradeMapping?: Record<string, string>,
    maxGrade?: string,
  ) => {
    if (!tenantId) return { error: 'Not authenticated' }

    const { data: result, error: err } = await (supabase as any).rpc('mass_promote_students', {
      p_from_academic_year_id: fromAcademicYearId,
      p_to_academic_year_id: toAcademicYearId,
      p_grade_mapping: gradeMapping || {},
      p_max_grade: maxGrade || '6',
    })

    if (err) return { error: err.message }
    return { error: null, data: result }
  }

  return { promote }
}

// ============================================
// User Management (admin only)
// ============================================
export function useUserManagement() {
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id

  const updateRole = async (userId: string, newRole: string) => {
    if (!tenantId) return { error: 'Not authenticated' }

    const { data: result, error: err } = await (supabase as any).rpc('update_user_role', {
      p_user_id: userId,
      p_new_role: newRole,
    })

    if (err) return { error: err.message }
    return { error: null, data: result }
  }

  const addUser = async (name: string, email: string, role: string = 'treasurer') => {
    if (!tenantId) return { error: 'Not authenticated' }

    const { data: result, error: err } = await (supabase as any).rpc('add_user_to_tenant', {
      p_name: name,
      p_email: email,
      p_role: role,
    })

    if (err) return { error: err.message }
    return { error: null, data: result }
  }

  const deactivateUser = async (userId: string) => {
    if (!tenantId) return { error: 'Not authenticated' }

    const { error: err } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)

    if (err) return { error: err.message }
    return { error: null }
  }

  return { updateRole, addUser, deactivateUser }
}

// ============================================
// Cash Reconciliation (F-13)
// ============================================
export interface ReconciliationRecord {
  id: string
  reconciliation_date: string
  system_spp_income: number
  system_bill_income: number
  system_savings_deposit: number
  system_savings_withdrawal: number
  system_cash: number
  physical_cash: number
  difference: number
  status: 'balanced' | 'discrepancy'
  notes: string | null
  period_start: string
  period_end: string
  reconciled_by_name: string
  created_at: string
}

export function useReconciliation() {
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id
  const [history, setHistory] = useState<ReconciliationRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchHistory = useCallback(async (limit = 20, offset = 0) => {
    if (!tenantId) return

    setLoading(true)
    setError(null)

    const { data: result, error: err } = await (supabase as any).rpc('get_reconciliation_history', {
      p_limit: limit,
      p_offset: offset,
    })

    if (err) {
      setError(err.message)
      console.error('Reconciliation history error:', err)
    } else if (result) {
      setHistory(result.records || [])
      setTotal(result.total || 0)
    }
    setLoading(false)
  }, [tenantId])

  useEffect(() => {
    if (tenantId) {
      fetchHistory()
    }
  }, [tenantId, fetchHistory])

  const performReconciliation = async (
    physicalCash: number,
    periodStart: string,
    periodEnd: string,
    notes?: string
  ) => {
    if (!tenantId) return { error: 'Not authenticated' }

    const { data: result, error: err } = await (supabase as any).rpc('perform_reconciliation', {
      p_physical_cash: physicalCash,
      p_period_start: periodStart,
      p_period_end: periodEnd,
      p_notes: notes || null,
    })

    if (err) return { error: err.message }

    // Refresh history after successful reconciliation
    await fetchHistory()

    return { error: null, data: result }
  }

  return {
    history,
    total,
    loading,
    error,
    fetchHistory,
    performReconciliation,
  }
}

// ============================================
// PDF Report Generation (server-side)
// ============================================
export type PdfReportType = 'spp_monthly' | 'savings_report' | 'bill_report' | 'daily_income' | 'reconciliation'

export interface PdfReportParams {
  report_type: PdfReportType
  month?: number
  year?: number
  class_id?: string
  bill_id?: string
  date?: string
  reconciliation_id?: string
}

export function useGeneratePdf() {
  const { profile } = useAuth()
  const tenantId = profile?.tenant_id
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generatePdf = async (params: PdfReportParams) => {
    if (!tenantId) return { error: 'Not authenticated' }

    setGenerating(true)
    setError(null)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      if (!token) {
        setError('Session expired')
        setGenerating(false)
        return { error: 'Session expired' }
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...params,
          tenant_id: tenantId,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        const errMsg = errData.error || 'Failed to generate PDF'
        setError(errMsg)
        setGenerating(false)
        return { error: errMsg }
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `laporan_${params.report_type}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setGenerating(false)
      return { error: null }
    } catch (err: any) {
      const errMsg = err.message || 'Network error'
      setError(errMsg)
      setGenerating(false)
      return { error: errMsg }
    }
  }

  return { generatePdf, generating, error }
}
