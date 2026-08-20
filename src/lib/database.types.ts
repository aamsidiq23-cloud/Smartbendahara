// ============================================
// Smart Bendahara — Database Types
// Auto-generated TypeScript types matching the Supabase schema
// ============================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          address: string | null
          phone: string | null
          email: string | null
          logo_url: string | null
          npsn: string | null
          education_level: 'SD' | 'SMP' | 'SMA' | 'SMK' | 'MI' | 'MTs' | 'MA' | null
          plan: 'starter' | 'professional' | 'enterprise'
          status: 'trial' | 'active' | 'suspended' | 'cancelled'
          spp_due_day: number | null
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          address?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          npsn?: string | null
          education_level?: 'SD' | 'SMP' | 'SMA' | 'SMK' | 'MI' | 'MTs' | 'MA' | null
          plan?: 'starter' | 'professional' | 'enterprise'
          status?: 'trial' | 'active' | 'suspended' | 'cancelled'
          spp_due_day?: number | null
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          npsn?: string | null
          education_level?: 'SD' | 'SMP' | 'SMA' | 'SMK' | 'MI' | 'MTs' | 'MA' | null
          plan?: 'starter' | 'professional' | 'enterprise'
          status?: 'trial' | 'active' | 'suspended' | 'cancelled'
          spp_due_day?: number | null
          trial_ends_at?: string | null
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          auth_id: string | null
          name: string
          email: string
          role: 'admin' | 'treasurer' | 'principal'
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          auth_id?: string | null
          name: string
          email: string
          role?: 'admin' | 'treasurer' | 'principal'
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          auth_id?: string | null
          name?: string
          email?: string
          role?: 'admin' | 'treasurer' | 'principal'
          is_active?: boolean
          last_login_at?: string | null
          updated_at?: string
        }
      }
      wa_configs: {
        Row: {
          id: string
          tenant_id: string
          gateway: 'fonnte' | 'wablas' | 'other' | 'self_hosted'
          gateway_url: string | null
          api_key: string | null
          sender_number: string | null
          is_active: boolean
          reminder_h_minus_3: boolean
          reminder_h_0: boolean
          reminder_h_plus_7: boolean
          template_spp_paid: string | null
          template_savings_deposit: string | null
          template_savings_withdrawal: string | null
          template_bill_created: string | null
          template_bill_paid: string | null
          template_spp_reminder_h3: string | null
          template_spp_reminder_h0: string | null
          template_spp_overdue_h7: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          gateway?: 'fonnte' | 'wablas' | 'other' | 'self_hosted'
          gateway_url?: string | null
          api_key?: string | null
          sender_number?: string | null
          is_active?: boolean
          reminder_h_minus_3?: boolean
          reminder_h_0?: boolean
          reminder_h_plus_7?: boolean
          template_spp_paid?: string | null
          template_savings_deposit?: string | null
          template_savings_withdrawal?: string | null
          template_bill_created?: string | null
          template_bill_paid?: string | null
          template_spp_reminder_h3?: string | null
          template_spp_reminder_h0?: string | null
          template_spp_overdue_h7?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          gateway?: 'fonnte' | 'wablas' | 'other' | 'self_hosted'
          gateway_url?: string | null
          api_key?: string | null
          sender_number?: string | null
          is_active?: boolean
          reminder_h_minus_3?: boolean
          reminder_h_0?: boolean
          reminder_h_plus_7?: boolean
          template_spp_paid?: string | null
          template_savings_deposit?: string | null
          template_savings_withdrawal?: string | null
          template_bill_created?: string | null
          template_bill_paid?: string | null
          template_spp_reminder_h3?: string | null
          template_spp_reminder_h0?: string | null
          template_spp_overdue_h7?: string | null
          updated_at?: string
        }
      }
      academic_years: {
        Row: {
          id: string
          tenant_id: string
          name: string
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          tenant_id?: string
          name?: string
          start_date?: string
          end_date?: string
          is_active?: boolean
        }
      }
      classes: {
        Row: {
          id: string
          academic_year_id: string
          tenant_id: string
          name: string
          grade: string
          spp_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          academic_year_id: string
          tenant_id: string
          name: string
          grade: string
          spp_amount?: number
          created_at?: string
        }
        Update: {
          academic_year_id?: string
          tenant_id?: string
          name?: string
          grade?: string
          spp_amount?: number
        }
      }
      students: {
        Row: {
          id: string
          tenant_id: string
          nisn: string | null
          name: string
          status: 'active' | 'alumni' | 'transferred'
          enrollment_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          nisn?: string | null
          name: string
          status?: 'active' | 'alumni' | 'transferred'
          enrollment_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          nisn?: string | null
          name?: string
          status?: 'active' | 'alumni' | 'transferred'
          enrollment_date?: string | null
          updated_at?: string
        }
      }
      student_enrollments: {
        Row: {
          id: string
          tenant_id: string
          student_id: string
          class_id: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          student_id: string
          class_id: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          tenant_id?: string
          student_id?: string
          class_id?: string
          is_active?: boolean
        }
      }
      parent_contacts: {
        Row: {
          id: string
          student_id: string
          tenant_id: string
          name: string
          relationship: 'mother' | 'father' | 'guardian'
          phone_wa: string | null
          wa_enabled: boolean
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          tenant_id: string
          name: string
          relationship?: 'mother' | 'father' | 'guardian'
          phone_wa?: string | null
          wa_enabled?: boolean
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          student_id?: string
          tenant_id?: string
          name?: string
          relationship?: 'mother' | 'father' | 'guardian'
          phone_wa?: string | null
          wa_enabled?: boolean
          is_primary?: boolean
        }
      }
      spp_payments: {
        Row: {
          id: string
          tenant_id: string
          student_id: string
          academic_year_id: string
          month: number
          year: number
          amount_due: number
          amount_paid: number
          remaining: number
          status: 'unpaid' | 'partial' | 'paid'
          recorded_by: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          student_id: string
          academic_year_id: string
          month: number
          year: number
          amount_due: number
          amount_paid?: number
          status?: 'unpaid' | 'partial' | 'paid'
          recorded_by?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          student_id?: string
          academic_year_id?: string
          month?: number
          year?: number
          amount_due?: number
          amount_paid?: number
          status?: 'unpaid' | 'partial' | 'paid'
          recorded_by?: string | null
          paid_at?: string | null
          updated_at?: string
        }
      }
      savings_accounts: {
        Row: {
          id: string
          tenant_id: string
          student_id: string
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          student_id: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          student_id?: string
          balance?: number
          updated_at?: string
        }
      }
      savings_transactions: {
        Row: {
          id: string
          tenant_id: string
          savings_account_id: string
          type: 'deposit' | 'withdrawal'
          amount: number
          balance_after: number
          notes: string | null
          recorded_by: string | null
          transacted_at: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          savings_account_id: string
          type: 'deposit' | 'withdrawal'
          amount: number
          balance_after: number
          notes?: string | null
          recorded_by?: string | null
          transacted_at?: string
          created_at?: string
        }
        Update: {
          tenant_id?: string
          savings_account_id?: string
          type?: 'deposit' | 'withdrawal'
          amount?: number
          balance_after?: number
          notes?: string | null
          recorded_by?: string | null
          transacted_at?: string
        }
      }
      custom_bills: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          default_amount: number
          due_date: string | null
          status: 'active' | 'archived'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          default_amount: number
          due_date?: string | null
          status?: 'active' | 'archived'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          name?: string
          description?: string | null
          default_amount?: number
          due_date?: string | null
          status?: 'active' | 'archived'
          created_by?: string | null
          updated_at?: string
        }
      }
      bill_assignments: {
        Row: {
          id: string
          tenant_id: string
          custom_bill_id: string
          student_id: string
          amount_due: number
          amount_paid: number
          remaining: number
          status: 'unpaid' | 'partial' | 'paid'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          custom_bill_id: string
          student_id: string
          amount_due: number
          amount_paid?: number
          status?: 'unpaid' | 'partial' | 'paid'
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          custom_bill_id?: string
          student_id?: string
          amount_due?: number
          amount_paid?: number
          status?: 'unpaid' | 'partial' | 'paid'
          updated_at?: string
        }
      }
      bill_payments: {
        Row: {
          id: string
          tenant_id: string
          bill_assignment_id: string
          amount: number
          recorded_by: string | null
          paid_at: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          bill_assignment_id: string
          amount: number
          recorded_by?: string | null
          paid_at?: string
          created_at?: string
        }
        Update: {
          tenant_id?: string
          bill_assignment_id?: string
          amount?: number
          recorded_by?: string | null
          paid_at?: string
        }
      }
      notification_logs: {
        Row: {
          id: string
          tenant_id: string
          student_id: string
          event_type: 'spp_paid' | 'savings_deposit' | 'savings_withdrawal' | 'bill_created' | 'bill_paid' | 'spp_reminder_h3' | 'spp_reminder_h0' | 'spp_overdue_h7'
          recipient_phone: string | null
          message_sent: string | null
          status: 'queued' | 'sent' | 'failed' | 'delivered' | 'skipped_no_gateway'
          retry_count: number
          error_message: string | null
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          student_id: string
          event_type: 'spp_paid' | 'savings_deposit' | 'savings_withdrawal' | 'bill_created' | 'bill_paid' | 'spp_reminder_h3' | 'spp_reminder_h0' | 'spp_overdue_h7'
          recipient_phone?: string | null
          message_sent?: string | null
          status?: 'queued' | 'sent' | 'failed' | 'delivered' | 'skipped_no_gateway'
          retry_count?: number
          error_message?: string | null
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          tenant_id?: string
          student_id?: string
          event_type?: 'spp_paid' | 'savings_deposit' | 'savings_withdrawal' | 'bill_created' | 'bill_paid' | 'spp_reminder_h3' | 'spp_reminder_h0' | 'spp_overdue_h7'
          recipient_phone?: string | null
          message_sent?: string | null
          status?: 'queued' | 'sent' | 'failed' | 'delivered' | 'skipped_no_gateway'
          retry_count?: number
          error_message?: string | null
          sent_at?: string | null
        }
      }
      activity_logs: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          action: 'create' | 'update' | 'delete' | 'export' | 'login' | 'logout'
          entity_type: string
          entity_id: string | null
          before_data: Json | null
          after_data: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id?: string | null
          action: 'create' | 'update' | 'delete' | 'export' | 'login' | 'logout'
          entity_type: string
          entity_id?: string | null
          before_data?: Json | null
          after_data?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          tenant_id?: string
          user_id?: string | null
          action?: 'create' | 'update' | 'delete' | 'export' | 'login' | 'logout'
          entity_type?: string
          entity_id?: string | null
          before_data?: Json | null
          after_data?: Json | null
          ip_address?: string | null
        }
      }
      cash_reconciliations: {
        Row: {
          id: string
          tenant_id: string
          reconciled_by: string
          reconciliation_date: string
          system_spp_income: number
          system_bill_income: number
          system_savings_withdrawal: number
          system_savings_deposit: number
          system_cash: number
          physical_cash: number
          difference: number
          status: 'balanced' | 'discrepancy'
          notes: string | null
          period_start: string
          period_end: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          reconciled_by: string
          reconciliation_date?: string
          system_spp_income?: number
          system_bill_income?: number
          system_savings_withdrawal?: number
          system_savings_deposit?: number
          system_cash?: number
          physical_cash: number
          status?: 'balanced' | 'discrepancy'
          notes?: string | null
          period_start: string
          period_end: string
          created_at?: string
        }
        Update: {
          tenant_id?: string
          reconciled_by?: string
          reconciliation_date?: string
          system_spp_income?: number
          system_bill_income?: number
          system_savings_withdrawal?: number
          system_savings_deposit?: number
          system_cash?: number
          physical_cash?: number
          status?: 'balanced' | 'discrepancy'
          notes?: string | null
          period_start?: string
          period_end?: string
        }
      }
    }
    Functions: {
      handle_new_registration: {
        Args: {
          p_school_name: string
          p_admin_name: string
          p_email: string
          p_auth_id: string
        }
        Returns: Json
      }
      get_user_profile: {
        Args: Record<string, never>
        Returns: Json
      }
      record_spp_payment: {
        Args: {
          p_payment_id: string
          p_amount: number
        }
        Returns: Json
      }
      generate_spp_for_class: {
        Args: {
          p_class_id: string
          p_academic_year_id: string
          p_month: number
          p_year: number
        }
        Returns: Json
      }
      process_savings_deposit: {
        Args: {
          p_account_id: string
          p_amount: number
          p_notes?: string | null
        }
        Returns: Json
      }
      process_savings_withdrawal: {
        Args: {
          p_account_id: string
          p_amount: number
          p_notes?: string | null
        }
        Returns: Json
      }
      record_bill_payment: {
        Args: {
          p_assignment_id: string
          p_amount: number
        }
        Returns: Json
      }
      create_bill_with_assignments: {
        Args: {
          p_name: string
          p_description?: string | null
          p_default_amount: number
          p_due_date?: string | null
          p_class_ids?: string[]
        }
        Returns: Json
      }
      get_dashboard_stats: {
        Args: Record<string, never>
        Returns: Json
      }
      mass_promote_students: {
        Args: {
          p_from_academic_year_id: string
          p_to_academic_year_id: string
          p_grade_mapping?: Record<string, string>
          p_max_grade?: string
        }
        Returns: Json
      }
      portal_lookup_by_phone: {
        Args: {
          p_phone: string
        }
        Returns: Json
      }
      update_user_role: {
        Args: {
          p_user_id: string
          p_new_role: string
        }
        Returns: Json
      }
      add_user_to_tenant: {
        Args: {
          p_name: string
          p_email: string
          p_role?: string
          p_auth_id?: string
        }
        Returns: Json
      }
      get_my_role: {
        Args: Record<string, never>
        Returns: string
      }
      perform_reconciliation: {
        Args: {
          p_physical_cash: number
          p_period_start: string
          p_period_end: string
          p_notes?: string | null
        }
        Returns: Json
      }
      get_reconciliation_history: {
        Args: {
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
    }
    Enums: Record<string, never>
  }
}

// ============================================
// Convenience type aliases
// ============================================
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Shortcut types for common entities
export type Tenant = Tables<'tenants'>
export type User = Tables<'users'>
export type WaConfig = Tables<'wa_configs'>
export type AcademicYear = Tables<'academic_years'>
export type Class = Tables<'classes'>
export type Student = Tables<'students'>
export type StudentEnrollment = Tables<'student_enrollments'>
export type ParentContact = Tables<'parent_contacts'>
export type SppPayment = Tables<'spp_payments'>
export type SavingsAccount = Tables<'savings_accounts'>
export type SavingsTransaction = Tables<'savings_transactions'>
export type CustomBill = Tables<'custom_bills'>
export type BillAssignment = Tables<'bill_assignments'>
export type BillPayment = Tables<'bill_payments'>
export type NotificationLog = Tables<'notification_logs'>
export type ActivityLog = Tables<'activity_logs'>
export type CashReconciliation = Tables<'cash_reconciliations'>

// User profile returned by get_user_profile() RPC
export interface UserProfile {
  user_id: string
  tenant_id: string
  name: string
  email: string
  role: 'admin' | 'treasurer' | 'principal'
  tenant_name: string
  tenant_slug: string
  tenant_plan: 'starter' | 'professional' | 'enterprise'
  tenant_status: 'trial' | 'active' | 'suspended' | 'cancelled'
  tenant_logo: string | null
  tenant_spp_due_day: number | null
}
