import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  School,
  CreditCard,
  Users,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  GraduationCap,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { useState } from 'react'
import { formatCurrency } from '../lib/utils'
import { useAuth } from '../lib/auth-context'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/onboarding')({ component: OnboardingPage })

const steps = [
  { id: 1, title: 'Data Sekolah', description: 'Informasi dasar sekolah Anda', icon: School },
  { id: 2, title: 'Konfigurasi SPP', description: 'Nominal SPP per kelas', icon: CreditCard },
  { id: 3, title: 'Import Siswa', description: 'Tambahkan data siswa', icon: Users },
  { id: 4, title: 'WhatsApp', description: 'Setup notifikasi WA', icon: MessageSquare },
]

// Shared onboarding state
interface OnboardingData {
  // Step 1
  schoolName: string
  npsn: string
  address: string
  email: string
  phone: string
  educationLevel: string
  // Step 2
  sppDueDay: number
  classes: { name: string; grade: string; amount: string }[]
  // Step 3
  manualStudents: { name: string; nisn: string; classIndex: number; parentPhone: string }[]
  // Step 4
  waGateway: string
  waApiKey: string
  waSenderNumber: string
  reminderH3: boolean
  reminderH0: boolean
  reminderH7: boolean
}

function OnboardingPage() {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [data, setData] = useState<OnboardingData>({
    schoolName: profile?.tenant_name || '',
    npsn: '',
    address: '',
    email: profile?.email || '',
    phone: '',
    educationLevel: 'SD',
    sppDueDay: 10,
    classes: [
      { name: 'Kelas 1', grade: '1', amount: '250000' },
      { name: 'Kelas 2', grade: '2', amount: '275000' },
      { name: 'Kelas 3', grade: '3', amount: '300000' },
      { name: 'Kelas 4', grade: '4', amount: '325000' },
      { name: 'Kelas 5', grade: '5', amount: '350000' },
      { name: 'Kelas 6', grade: '6', amount: '375000' },
    ],
    manualStudents: [],
    waGateway: 'fonnte',
    waApiKey: '',
    waSenderNumber: '',
    reminderH3: true,
    reminderH0: true,
    reminderH7: true,
  })

  const update = (partial: Partial<OnboardingData>) => setData((prev) => ({ ...prev, ...partial }))

  const saveStep = async (step: number): Promise<boolean> => {
    if (!profile) return false
    setSaving(true)
    setError(null)

    // Use 'any' cast for Supabase queries until types are generated from live DB
    const db = supabase as any

    try {
      if (step === 1) {
        // Update tenant data
        const { error: err } = await db
          .from('tenants')
          .update({
            name: data.schoolName,
            npsn: data.npsn || null,
            address: data.address || null,
            email: data.email || null,
            phone: data.phone || null,
            education_level: data.educationLevel,
            spp_due_day: data.sppDueDay,
          })
          .eq('id', profile.tenant_id)

        if (err) throw err
      } else if (step === 2) {
        // Create academic year + classes
        // First check if academic year exists
        const { data: existingYears } = await db
          .from('academic_years')
          .select('id')
          .eq('tenant_id', profile.tenant_id)
          .eq('is_active', true)
          .limit(1)

        let academicYearId: string

        if (existingYears && existingYears.length > 0) {
          academicYearId = existingYears[0].id
        } else {
          // Create new academic year
          const currentYear = new Date().getFullYear()
          const { data: newYear, error: yearErr } = await db
            .from('academic_years')
            .insert({
              tenant_id: profile.tenant_id,
              name: `${currentYear}/${currentYear + 1}`,
              start_date: `${currentYear}-07-01`,
              end_date: `${currentYear + 1}-06-30`,
              is_active: true,
            })
            .select('id')
            .single()

          if (yearErr) throw yearErr
          academicYearId = newYear.id
        }

        // Delete existing classes for this academic year (fresh setup)
        await db
          .from('classes')
          .delete()
          .eq('tenant_id', profile.tenant_id)
          .eq('academic_year_id', academicYearId)

        // Insert new classes
        const classInserts = data.classes
          .filter((c) => c.name && c.amount)
          .map((c) => ({
            tenant_id: profile.tenant_id,
            academic_year_id: academicYearId,
            name: c.name,
            grade: c.grade || c.name.replace(/\D/g, '') || '1',
            spp_amount: parseInt(c.amount) || 0,
          }))

        if (classInserts.length > 0) {
          const { error: classErr } = await db.from('classes').insert(classInserts)
          if (classErr) throw classErr
        }

        // Update SPP due day on tenant
        await db
          .from('tenants')
          .update({ spp_due_day: data.sppDueDay })
          .eq('id', profile.tenant_id)
      } else if (step === 3) {
        // Insert manual students if any
        if (data.manualStudents.length > 0) {
          // Get classes for mapping
          const { data: classesData } = await db
            .from('classes')
            .select('id, name')
            .eq('tenant_id', profile.tenant_id)

          for (const student of data.manualStudents) {
            const { data: newStudent, error: studentErr } = await db
              .from('students')
              .insert({
                tenant_id: profile.tenant_id,
                name: student.name,
                nisn: student.nisn || null,
              })
              .select('id')
              .single()

            if (studentErr) throw studentErr

            // Create enrollment if class selected
            if (classesData && student.classIndex >= 0 && student.classIndex < classesData.length) {
              await db.from('student_enrollments').insert({
                tenant_id: profile.tenant_id,
                student_id: newStudent.id,
                class_id: classesData[student.classIndex].id,
                is_active: true,
              })
            }

            // Create parent contact if phone provided
            if (student.parentPhone) {
              await db.from('parent_contacts').insert({
                tenant_id: profile.tenant_id,
                student_id: newStudent.id,
                name: `Orang Tua ${student.name}`,
                phone_wa: student.parentPhone,
                is_primary: true,
              })
            }

            // Create savings account
            await db.from('savings_accounts').insert({
              tenant_id: profile.tenant_id,
              student_id: newStudent.id,
              balance: 0,
            })
          }
        }
      } else if (step === 4) {
        // Update WA config
        const { error: waErr } = await db
          .from('wa_configs')
          .update({
            gateway: data.waGateway,
            api_key: data.waApiKey || null,
            sender_number: data.waSenderNumber || null,
            is_active: !!(data.waApiKey && data.waSenderNumber),
            reminder_h_minus_3: data.reminderH3,
            reminder_h_0: data.reminderH0,
            reminder_h_plus_7: data.reminderH7,
          })
          .eq('tenant_id', profile.tenant_id)

        if (waErr) throw waErr
      }


      setSaving(false)
      return true
    } catch (err: any) {
      console.error('Save error:', err)
      setError(err.message || 'Gagal menyimpan data')
      setSaving(false)
      return false
    }
  }

  const goNext = async () => {
    const saved = await saveStep(currentStep)
    if (!saved) return

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    } else {
      await refreshProfile()
      navigate({ to: '/dashboard' })
    }
  }

  const goBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">Smart Bendahara</span>
          </div>
          <button
            onClick={() => navigate({ to: '/dashboard' })}
            className="text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            Lewati Setup →
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep
              const isComplete = step.id < currentStep
              const StepIcon = step.icon

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isComplete
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                          : isActive
                          ? 'bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isComplete ? (
                        <Check className="w-5 h-5 animate-scale-in" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <p className={`text-xs font-medium mt-2 ${
                      isActive ? 'text-emerald-700' : isComplete ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-20 h-0.5 mx-3 mt-[-18px] transition-all duration-500 ${
                      isComplete ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}></div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="animate-slide-up" key={currentStep}>
          {currentStep === 1 && <Step1DataSekolah data={data} update={update} />}
          {currentStep === 2 && <Step2KonfigurasiSpp data={data} update={update} />}
          {currentStep === 3 && <Step3ImportSiswa data={data} update={update} />}
          {currentStep === 4 && <Step4WhatsApp data={data} update={update} />}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 max-w-2xl mx-auto">
          <button
            onClick={goBack}
            disabled={currentStep === 1 || saving}
            className={`btn-secondary ${currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>

          <div className="flex items-center gap-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  step.id === currentStep ? 'bg-emerald-500 w-6' :
                  step.id < currentStep ? 'bg-emerald-400' : 'bg-slate-200'
                }`}
              ></div>
            ))}
          </div>

          <button onClick={goNext} disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : currentStep === 4 ? (
              <>
                <Sparkles className="w-4 h-4" />
                Mulai Dashboard
              </>
            ) : (
              <>
                Simpan & Lanjut
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Step Components (with data binding)
// ============================================

interface StepProps {
  data: OnboardingData
  update: (partial: Partial<OnboardingData>) => void
}

function Step1DataSekolah({ data, update }: StepProps) {
  return (
    <div className="card max-w-2xl mx-auto">
      <div className="card-header">
        <h2 className="text-xl font-bold text-slate-900">Informasi Sekolah</h2>
        <p className="text-sm text-slate-500 mt-1">Lengkapi data dasar sekolah Anda</p>
      </div>
      <div className="card-body space-y-5">
        {/* Logo Upload */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all">
            <Upload className="w-6 h-6 text-slate-400" />
            <span className="text-[10px] text-slate-400 mt-1">Logo</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Logo Sekolah</p>
            <p className="text-xs text-slate-400">PNG, JPG max 2MB. Opsional.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Sekolah *</label>
            <input
              type="text"
              className="input"
              value={data.schoolName}
              onChange={(e) => update({ schoolName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">NPSN</label>
            <input
              type="text"
              className="input"
              placeholder="20345678"
              value={data.npsn}
              onChange={(e) => update({ npsn: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap *</label>
          <input
            type="text"
            className="input"
            placeholder="Jl. Pendidikan No. 12, Kec. Menteng, Jakarta Pusat"
            value={data.address}
            onChange={(e) => update({ address: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              className="input"
              placeholder="admin@sekolah.sch.id"
              value={data.email}
              onChange={(e) => update({ email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">No. Telepon</label>
            <input
              type="text"
              className="input"
              placeholder="021-12345678"
              value={data.phone}
              onChange={(e) => update({ phone: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Jenjang Pendidikan</label>
          <select
            className="select"
            style={{ width: '250px' }}
            value={data.educationLevel}
            onChange={(e) => update({ educationLevel: e.target.value })}
          >
            <option value="SD">SD / MI</option>
            <option value="SMP">SMP / MTs</option>
            <option value="SMA">SMA / MA</option>
            <option value="SMK">SMK</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function Step2KonfigurasiSpp({ data, update }: StepProps) {
  const addClass = () => {
    update({ classes: [...data.classes, { name: '', grade: '', amount: '' }] })
  }

  const removeClass = (index: number) => {
    update({ classes: data.classes.filter((_, i) => i !== index) })
  }

  const updateClass = (index: number, field: string, value: string) => {
    const newClasses = [...data.classes]
    ;(newClasses[index] as any)[field] = value
    // Auto-derive grade from class name
    if (field === 'name') {
      const grade = value.replace(/\D/g, '')
      newClasses[index].grade = grade || ''
    }
    update({ classes: newClasses })
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="card-header">
        <h2 className="text-xl font-bold text-slate-900">Konfigurasi SPP per Kelas</h2>
        <p className="text-sm text-slate-500 mt-1">Atur nominal SPP bulanan untuk setiap kelas</p>
      </div>
      <div className="card-body space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Tanggal Jatuh Tempo SPP</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-blue-600">Setiap tanggal</span>
              <select
                className="select text-sm"
                style={{ width: '80px' }}
                value={data.sppDueDay}
                onChange={(e) => update({ sppDueDay: parseInt(e.target.value) })}
              >
                {Array.from({ length: 28 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <span className="text-sm text-blue-600">per bulan</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {data.classes.map((cls, index) => (
            <div key={index} className="flex items-center gap-3 animate-fade-in">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                {index + 1}
              </div>
              <input
                type="text"
                className="input flex-1"
                placeholder="Nama kelas"
                value={cls.name}
                onChange={(e) => updateClass(index, 'name', e.target.value)}
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Rp</span>
                <input
                  type="number"
                  className="input pl-10"
                  style={{ width: '180px' }}
                  placeholder="250000"
                  value={cls.amount}
                  onChange={(e) => updateClass(index, 'amount', e.target.value)}
                />
              </div>
              <button
                onClick={() => removeClass(index)}
                className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button onClick={addClass} className="btn-secondary w-full justify-center">
          <Plus className="w-4 h-4" />
          Tambah Kelas
        </button>

        <div className="bg-slate-50 rounded-xl p-4 mt-4">
          <p className="text-xs text-slate-500 mb-2">Ringkasan:</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">{data.classes.length} kelas dikonfigurasi</span>
            <span className="text-sm font-semibold text-slate-800">
              SPP: {data.classes.length > 0 ? formatCurrency(parseInt(data.classes[0].amount || '0')) : '-'} — {data.classes.length > 0 ? formatCurrency(parseInt(data.classes[data.classes.length - 1].amount || '0')) : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step3ImportSiswa({ data, update }: StepProps) {
  const addStudent = () => {
    update({
      manualStudents: [
        ...data.manualStudents,
        { name: '', nisn: '', classIndex: 0, parentPhone: '' },
      ],
    })
  }

  const updateStudent = (index: number, field: string, value: any) => {
    const newStudents = [...data.manualStudents]
    ;(newStudents[index] as any)[field] = value
    update({ manualStudents: newStudents })
  }

  const removeStudent = (index: number) => {
    update({ manualStudents: data.manualStudents.filter((_, i) => i !== index) })
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="card-header">
        <h2 className="text-xl font-bold text-slate-900">Import Data Siswa</h2>
        <p className="text-sm text-slate-500 mt-1">Import dari file Excel atau tambahkan manual</p>
      </div>
      <div className="card-body space-y-6">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer">
          <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700 mb-1">
            Drag & drop file Excel di sini
          </p>
          <p className="text-xs text-slate-400 mb-4">atau klik untuk memilih file (.xlsx, .xls)</p>
          <button className="btn-primary btn-sm mx-auto">
            <Upload className="w-4 h-4" />
            Pilih File
          </button>
        </div>

        {/* Download Template */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Users className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Butuh Template?</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Download template Excel yang sudah diformat untuk import data siswa.
            </p>
            <button className="text-xs text-amber-700 font-semibold mt-2 hover:underline cursor-pointer">
              📥 Download Template Excel
            </button>
          </div>
        </div>

        {/* Or Manual */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-slate-400">atau tambahkan manual</span>
          </div>
        </div>

        {/* Manual Students List */}
        <div className="space-y-3">
          {data.manualStudents.map((student, index) => (
            <div key={index} className="flex items-center gap-2 animate-fade-in">
              <input
                type="text"
                className="input flex-1"
                placeholder="Nama lengkap siswa"
                value={student.name}
                onChange={(e) => updateStudent(index, 'name', e.target.value)}
              />
              <input
                type="text"
                className="input"
                style={{ width: '120px' }}
                placeholder="NISN"
                value={student.nisn}
                onChange={(e) => updateStudent(index, 'nisn', e.target.value)}
              />
              <select
                className="select"
                style={{ width: '140px' }}
                value={student.classIndex}
                onChange={(e) => updateStudent(index, 'classIndex', parseInt(e.target.value))}
              >
                {data.classes.map((cls, ci) => (
                  <option key={ci} value={ci}>{cls.name}</option>
                ))}
              </select>
              <input
                type="text"
                className="input"
                style={{ width: '140px' }}
                placeholder="No. WA Ortu"
                value={student.parentPhone}
                onChange={(e) => updateStudent(index, 'parentPhone', e.target.value)}
              />
              <button
                onClick={() => removeStudent(index)}
                className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button onClick={addStudent} className="btn-secondary w-full justify-center">
            <Plus className="w-4 h-4" />
            Tambah Siswa
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Data siap import</span>
            <span className="text-sm font-semibold text-emerald-600">{data.manualStudents.length} siswa</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Anda bisa melewati langkah ini dan menambahkan data siswa nanti.</p>
        </div>
      </div>
    </div>
  )
}

function Step4WhatsApp({ data, update }: StepProps) {
  return (
    <div className="card max-w-2xl mx-auto">
      <div className="card-header">
        <h2 className="text-xl font-bold text-slate-900">Setup WhatsApp Gateway</h2>
        <p className="text-sm text-slate-500 mt-1">Aktifkan notifikasi WhatsApp otomatis (opsional)</p>
      </div>
      <div className="card-body space-y-5">
        {/* Info */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-emerald-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Mengapa WhatsApp?</p>
            <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">
              Sistem akan mengirim pengingat tunggakan SPP secara otomatis atas nama sekolah.
              Bendahara tidak perlu "sungkan nagih" — semua berjalan otomatis.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Provider Gateway</label>
          <select
            className="select"
            style={{ width: '300px' }}
            value={data.waGateway}
            onChange={(e) => update({ waGateway: e.target.value })}
          >
            <option value="fonnte">Fonnte (fonnte.com) — Rekomendasi</option>
            <option value="wablas">Wablas (wablas.com)</option>
            <option value="">Belum punya — setup nanti</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
          <input
            type="text"
            className="input"
            placeholder="Paste API key dari dashboard gateway"
            value={data.waApiKey}
            onChange={(e) => update({ waApiKey: e.target.value })}
          />
          <p className="text-xs text-slate-400 mt-1">Dapatkan API key dari dashboard Fonnte/Wablas setelah mendaftar</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nomor WA Pengirim</label>
          <input
            type="text"
            className="input"
            placeholder="6281234500001"
            value={data.waSenderNumber}
            onChange={(e) => update({ waSenderNumber: e.target.value })}
          />
          <p className="text-xs text-slate-400 mt-1">Gunakan nomor WA bisnis resmi sekolah, bukan nomor pribadi</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Jadwal Pengingat Otomatis</label>
          <div className="space-y-2.5">
            {[
              { key: 'reminderH3' as const, label: 'H-3 sebelum jatuh tempo', desc: 'Pengingat lembut 3 hari sebelum deadline' },
              { key: 'reminderH0' as const, label: 'H-0 pada hari jatuh tempo', desc: 'Reminder tepat di hari deadline' },
              { key: 'reminderH7' as const, label: 'H+7 setelah jatuh tempo', desc: 'Pemberitahuan tunggakan otomatis — solusi "sungkan nagih"' },
            ].map((r) => (
              <label key={r.key} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={data[r.key]}
                  onChange={(e) => update({ [r.key]: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 accent-emerald-600 mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">{r.label}</span>
                  <p className="text-xs text-slate-400">{r.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-400">
            💡 Langkah ini opsional. Anda bisa mengaktifkan WhatsApp gateway kapan saja melalui menu Pengaturan.
            Semua fitur lain tetap berfungsi tanpa gateway WA.
          </p>
        </div>
      </div>
    </div>
  )
}
