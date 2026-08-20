import { createFileRoute } from '@tanstack/react-router'
import { Settings, School, Calendar, Users, MessageSquare, Save, Plus, Trash2, Loader2, RefreshCw, Check, X, Edit2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSettings, useClasses, useAcademicYears, useStudents } from '../../../lib/supabase-hooks'
import { formatCurrency, formatDate } from '../../../lib/utils'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'

export const Route = createFileRoute('/dashboard/pengaturan/')({ component: PengaturanPage })

const settingsTabs = [
  { id: 'sekolah', label: 'Profil Sekolah', icon: School },
  { id: 'tahun-ajaran', label: 'Tahun Ajaran', icon: Calendar },
  { id: 'kelas', label: 'Kelas & SPP', icon: Users },
  { id: 'whatsapp', label: 'WhatsApp Gateway', icon: MessageSquare },
  { id: 'pengguna', label: 'Pengguna', icon: Users },
]

function PengaturanPage() {
  const [activeTab, setActiveTab] = useState('sekolah')
  const { loading: settingsLoading } = useSettings()

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-500">Memuat pengaturan...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan</h1>
        <p className="text-slate-500 text-sm mt-1">Konfigurasi sekolah, tahun ajaran, kelas, dan integrasi</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-56 flex-shrink-0">
          <div className="card p-2 space-y-1">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'sekolah' && <ProfilSekolah />}
          {activeTab === 'tahun-ajaran' && <TahunAjaran />}
          {activeTab === 'kelas' && <KelasSpp />}
          {activeTab === 'whatsapp' && <WhatsAppGateway />}
          {activeTab === 'pengguna' && <ManajemenPengguna />}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Profil Sekolah
// ============================================
function ProfilSekolah() {
  const { tenant, updateTenant } = useSettings()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState('')
  const [npsn, setNpsn] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [sppDueDay, setSppDueDay] = useState(10)

  useEffect(() => {
    if (tenant) {
      setName(tenant.name || '')
      setNpsn(tenant.npsn || '')
      setAddress(tenant.address || '')
      setEmail(tenant.email || '')
      setPhone(tenant.phone || '')
      setSppDueDay(tenant.spp_due_day || 10)
    }
  }, [tenant])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    await updateTenant({ name, npsn, address, email, phone, spp_due_day: sppDueDay })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="card animate-fade-in">
      <div className="card-header"><h3 className="font-semibold text-slate-900">Profil Sekolah</h3></div>
      <div className="card-body space-y-5">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
            {(tenant?.name || 'SB').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <button className="btn-secondary btn-sm mb-1">Upload Logo</button>
            <p className="text-xs text-slate-400">PNG, JPG max 2MB</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Sekolah</label>
            <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">NPSN</label>
            <input type="text" className="input" value={npsn} onChange={e => setNpsn(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
          <input type="text" className="input" value={address} onChange={e => setAddress(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telepon</label>
            <input type="text" className="input" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Jatuh Tempo SPP</label>
          <select className="select" style={{ width: '200px' }} value={sppDueDay} onChange={e => setSppDueDay(Number(e.target.value))}>
            {Array.from({ length: 28 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Tanggal {i + 1} setiap bulan</option>
            ))}
          </select>
        </div>
        <div className="pt-2 flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : <><Save className="w-4 h-4" />Simpan Perubahan</>}
          </button>
          {saved && <span className="flex items-center gap-1 text-sm text-emerald-600 animate-fade-in"><Check className="w-4 h-4" /> Tersimpan!</span>}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Tahun Ajaran — with Add & Activate
// ============================================
function TahunAjaran() {
  const { academicYears, loading, addAcademicYear, setActiveYear } = useAcademicYears()
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formName, setFormName] = useState('')
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')

  const handleAdd = async () => {
    if (!formName || !formStart || !formEnd) return
    setSaving(true)
    await addAcademicYear({ name: formName, start_date: formStart, end_date: formEnd })
    setSaving(false)
    setShowModal(false)
    setFormName(''); setFormStart(''); setFormEnd('')
  }

  const handleActivate = async (id: string) => {
    if (confirm('Aktifkan tahun ajaran ini? Tahun ajaran lain akan dinonaktifkan.')) {
      await setActiveYear(id)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
  }

  return (
    <>
      <div className="card animate-fade-in">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Tahun Ajaran</h3>
          <button className="btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Tahun Ajaran Baru</button>
        </div>
        <div className="card-body p-0">
          <div className="divide-y divide-slate-100">
            {academicYears.map((ta) => (
              <div key={ta.id} className="flex items-center gap-4 px-6 py-4 table-row-hover">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{ta.name}</p>
                    {ta.is_active && <span className="badge badge-success">Aktif</span>}
                  </div>
                  <p className="text-xs text-slate-500">{formatDate(ta.start_date)} — {formatDate(ta.end_date)}</p>
                </div>
                {!ta.is_active && (
                  <button onClick={() => handleActivate(ta.id)} className="btn-secondary btn-sm">Aktifkan</button>
                )}
              </div>
            ))}
            {academicYears.length === 0 && <div className="px-6 py-12 text-center text-sm text-slate-400">Belum ada tahun ajaran</div>}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-lg text-slate-900">Tahun Ajaran Baru</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Tahun Ajaran</label>
                <input type="text" className="input" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Contoh: 2025/2026" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
                  <input type="date" className="input" value={formStart} onChange={e => setFormStart(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Selesai</label>
                  <input type="date" className="input" value={formEnd} onChange={e => setFormEnd(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
              <button onClick={handleAdd} disabled={saving || !formName || !formStart || !formEnd} className="btn-primary disabled:opacity-60">
                {saving ? 'Menyimpan...' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ============================================
// Kelas & SPP — with Add, Edit, Delete
// ============================================
function KelasSpp() {
  const { classes, loading, addClass, updateClass, deleteClass } = useClasses()
  const { students } = useStudents()
  const { activeYear } = useAcademicYears()

  const [showModal, setShowModal] = useState(false)
  const [editingClass, setEditingClass] = useState<typeof classes[0] | null>(null)
  const [saving, setSaving] = useState(false)
  const [formName, setFormName] = useState('')
  const [formGrade, setFormGrade] = useState('')
  const [formSpp, setFormSpp] = useState(0)

  const getStudentCount = (classId: string) => students.filter(s => s.class_id === classId).length

  const openModal = (cls: typeof classes[0] | null) => {
    setEditingClass(cls)
    setFormName(cls?.name || '')
    setFormGrade(cls?.grade || '')
    setFormSpp(cls?.spp_amount || 0)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formName || !formGrade) return
    setSaving(true)
    if (editingClass) {
      await updateClass(editingClass.id, { name: formName, grade: formGrade, spp_amount: formSpp })
    } else {
      if (!activeYear) { alert('Buat tahun ajaran terlebih dahulu'); setSaving(false); return }
      await addClass({ name: formName, grade: formGrade, spp_amount: formSpp, academic_year_id: activeYear.id })
    }
    setSaving(false)
    setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    const count = getStudentCount(id)
    if (count > 0) { alert(`Tidak bisa menghapus kelas yang memiliki ${count} siswa. Pindahkan siswa terlebih dahulu.`); return }
    if (confirm('Yakin ingin menghapus kelas ini?')) {
      await deleteClass(id)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
  }

  return (
    <>
      <div className="card animate-fade-in">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Kelas & Nominal SPP</h3>
          <button className="btn-primary btn-sm" onClick={() => openModal(null)}><Plus className="w-4 h-4" />Tambah Kelas</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Kelas</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Jenjang</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500">SPP/Bulan</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500">Siswa</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.map((c) => (
                <tr key={c.id} className="table-row-hover">
                  <td className="px-6 py-3 text-sm font-medium text-slate-800">{c.name}</td>
                  <td className="px-6 py-3 text-sm text-slate-600">Kelas {c.grade}</td>
                  <td className="px-6 py-3 text-sm text-right font-semibold text-slate-900">{formatCurrency(c.spp_amount)}</td>
                  <td className="px-6 py-3 text-sm text-center text-slate-600">{getStudentCount(c.id)}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => openModal(c)} className="text-blue-600 text-sm font-medium hover:text-blue-700 cursor-pointer mr-3">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 text-sm font-medium hover:text-red-700 cursor-pointer">Hapus</button>
                  </td>
                </tr>
              ))}
              {classes.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">Belum ada kelas</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-lg text-slate-900">{editingClass ? 'Edit Kelas' : 'Tambah Kelas Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kelas</label>
                <input type="text" className="input" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Contoh: 1A, 4B, 7C" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jenjang</label>
                  <input type="text" className="input" value={formGrade} onChange={e => setFormGrade(e.target.value)} placeholder="Contoh: 1, 4, 7" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nominal SPP/Bulan</label>
                  <input type="number" className="input" value={formSpp} onChange={e => setFormSpp(Number(e.target.value))} placeholder="250000" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
              <button onClick={handleSave} disabled={saving || !formName || !formGrade} className="btn-primary disabled:opacity-60">
                {saving ? 'Menyimpan...' : editingClass ? 'Simpan Perubahan' : 'Tambah Kelas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ============================================
// WhatsApp Gateway
// ============================================
function WhatsAppGateway() {
  const { waConfig, updateWaConfig, tenant } = useSettings()
  const { students } = useStudents()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [gateway, setGateway] = useState<'fonnte' | 'wablas' | 'other' | 'self_hosted'>('fonnte')
  const [gatewayUrl, setGatewayUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [senderNumber, setSenderNumber] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [reminderH3, setReminderH3] = useState(true)
  const [reminderH0, setReminderH0] = useState(true)
  const [reminderH7, setReminderH7] = useState(true)

  // State for Custom Templates
  const [templateSppPaid, setTemplateSppPaid] = useState('')
  const [templateSavingsDeposit, setTemplateSavingsDeposit] = useState('')
  const [templateSavingsWithdrawal, setTemplateSavingsWithdrawal] = useState('')
  const [templateBillCreated, setTemplateBillCreated] = useState('')
  const [templateBillPaid, setTemplateBillPaid] = useState('')
  const [templateSppReminderH3, setTemplateSppReminderH3] = useState('')
  const [templateSppReminderH0, setTemplateSppReminderH0] = useState('')
  const [templateSppOverdueH7, setTemplateSppOverdueH7] = useState('')

  // State for Test Modal
  const [showTestModal, setShowTestModal] = useState(false)
  const [testStudentId, setTestStudentId] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [testEventType, setTestEventType] = useState('spp_paid')
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (waConfig) {
      setGateway(waConfig.gateway || 'fonnte')
      setGatewayUrl(waConfig.gateway_url || '')
      setApiKey(waConfig.api_key || '')
      setSenderNumber(waConfig.sender_number || '')
      setIsActive(waConfig.is_active || false)
      setReminderH3(waConfig.reminder_h_minus_3 ?? true)
      setReminderH0(waConfig.reminder_h_0 ?? true)
      setReminderH7(waConfig.reminder_h_plus_7 ?? true)

      setTemplateSppPaid(waConfig.template_spp_paid || '')
      setTemplateSavingsDeposit(waConfig.template_savings_deposit || '')
      setTemplateSavingsWithdrawal(waConfig.template_savings_withdrawal || '')
      setTemplateBillCreated(waConfig.template_bill_created || '')
      setTemplateBillPaid(waConfig.template_bill_paid || '')
      setTemplateSppReminderH3(waConfig.template_spp_reminder_h3 || '')
      setTemplateSppReminderH0(waConfig.template_spp_reminder_h0 || '')
      setTemplateSppOverdueH7(waConfig.template_spp_overdue_h7 || '')
    }
  }, [waConfig])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    await updateWaConfig({
      gateway, gateway_url: gatewayUrl, api_key: apiKey, sender_number: senderNumber, is_active: isActive,
      reminder_h_minus_3: reminderH3, reminder_h_0: reminderH0, reminder_h_plus_7: reminderH7,
      template_spp_paid: templateSppPaid || null,
      template_savings_deposit: templateSavingsDeposit || null,
      template_savings_withdrawal: templateSavingsWithdrawal || null,
      template_bill_created: templateBillCreated || null,
      template_bill_paid: templateBillPaid || null,
      template_spp_reminder_h3: templateSppReminderH3 || null,
      template_spp_reminder_h0: templateSppReminderH0 || null,
      template_spp_overdue_h7: templateSppOverdueH7 || null,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleStudentChange = (studentId: string) => {
    setTestStudentId(studentId)
    const student = students.find(s => s.id === studentId)
    if (student?.parent_contact?.phone_wa) {
      setTestPhone(student.parent_contact.phone_wa)
    } else {
      setTestPhone('')
    }
  }

  const getPreviewText = () => {
    if (!testStudentId) return 'Pilih siswa terlebih dahulu untuk melihat preview pesan.'
    const student = students.find(s => s.id === testStudentId)
    if (!student) return 'Siswa tidak ditemukan.'

    const vars = {
      student_name: student.name,
      class_name: student.class_name || '-',
      school_name: tenant?.name || 'Sekolah',
      month_year: 'Agustus 2026',
      amount: 250000,
      balance: 150000,
      bill_name: 'Uang Seragam',
      due_date: '10 Agustus 2026',
      remaining: 50000,
    }

    const templateMap: Record<string, string> = {
      spp_paid: templateSppPaid || `✅ Konfirmasi Pembayaran SPP\n\nYth. Orang tua/wali [Nama Siswa]\nKelas [Kelas] — [Nama Sekolah]\n\nBulan     : [Bulan Tahun]\nJumlah    : Rp [Jumlah]\nStatus    : Lunas ✓\n\nTerima kasih atas pembayarannya.\n🏫 [Nama Sekolah]`,
      savings_deposit: templateSavingsDeposit || `💰 Tabungan Bertambah\n\n[Nama Siswa] (Kls [Kelas])\n\nSetoran    : + Rp [Jumlah]\nSaldo kini : Rp [Saldo Terkini]\n\n🏫 [Nama Sekolah]`,
      savings_withdrawal: templateSavingsWithdrawal || `💸 Penarikan Tabungan\n\n[Nama Siswa] (Kls [Kelas])\n\nPenarikan  : - Rp [Jumlah]\nSaldo kini : Rp [Saldo Terkini]\n\n🏫 [Nama Sekolah]`,
      bill_created: templateBillCreated || `📋 Tagihan Baru\n\nYth. Orang tua/wali [Nama Siswa]\nKelas [Kelas]\n\nTagihan    : [Nama Tagihan]\nNominal    : Rp [Jumlah]\nJatuh tempo: [Tanggal Jatuh Tempo]\n\nMohon segera dilunasi ke bendahara sekolah.\n\n🏫 [Nama Sekolah]`,
      bill_paid: templateBillPaid || `✅ Konfirmasi Pembayaran Tagihan\n\nYth. Orang tua/wali [Nama Siswa]\nKelas [Kelas]\n\nTagihan    : [Nama Tagihan]\nDibayar    : Rp [Jumlah]\nSisa       : Rp [Sisa]\n\n🏫 [Nama Sekolah]`,
      spp_reminder_h3: templateSppReminderH3 || `⏰ Pengingat Pembayaran SPP\n\nYth. Orang tua/wali [Nama Siswa]\nKelas [Kelas]\n\nSPP [Bulan Tahun]  : Rp [Jumlah]\nJatuh tempo        : [Tanggal Jatuh Tempo]\n                     (3 hari lagi)\n\nMohon segera dilunasi ke bendahara sekolah.\n\n🏫 [Nama Sekolah]`,
      spp_reminder_h0: templateSppReminderH0 || `⚠️ SPP Jatuh Tempo Hari Ini\n\nYth. Orang tua/wali [Nama Siswa]\nKelas [Kelas]\n\nSPP [Bulan Tahun]  : Rp [Jumlah]\nStatus             : Belum Lunas\n\nMohon segera selesaikan pembayaran hari ini.\n\n🏫 [Nama Sekolah]`,
      spp_overdue_h7: templateSppOverdueH7 || `❗ Pemberitahuan Tunggakan SPP\n\nYth. Orang tua/wali [Nama Siswa]\nKelas [Kelas]\n\nSPP [Bulan Tahun]  : Rp [Jumlah]\nTelah jatuh tempo  : 7 hari yang lalu\n\nMohon segera selesaikan pembayaran ke\nbendahara [Nama Sekolah].\n\nTerima kasih atas perhatiannya.\n— Sistem Smart Bendahara`,
    }

    let msg = templateMap[testEventType] || ''
    msg = msg.replace(/\[Nama Siswa\]/g, vars.student_name || 'Siswa')
    msg = msg.replace(/\[Kelas\]/g, vars.class_name || '-')
    msg = msg.replace(/\[Nama Sekolah\]/g, vars.school_name || 'Sekolah')
    msg = msg.replace(/\[Bulan Tahun\]/g, vars.month_year || '')
    msg = msg.replace(/\[Jumlah\]/g, formatCurrency(vars.amount))
    msg = msg.replace(/\[Saldo Terkini\]/g, formatCurrency(vars.balance))
    msg = msg.replace(/\[Tanggal\]/g, new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }))
    msg = msg.replace(/\[Tanggal Jatuh Tempo\]/g, vars.due_date || '-')
    msg = msg.replace(/\[Sisa\]/g, formatCurrency(vars.remaining))
    msg = msg.replace(/\[Nama Tagihan\]/g, vars.bill_name || '-')
    return msg
  }

  const handleTestSend = async () => {
    if (!testStudentId || !testPhone) return
    setTestSending(true)
    setTestResult(null)

    try {
      const mockVars = {
        month_year: 'Agustus 2026',
        amount: 250000,
        balance: 150000,
        bill_name: 'Uang Seragam',
        due_date: '10 Agustus 2026',
        remaining: 50000,
      }

      const { data, error } = await supabase.functions.invoke('send-wa-notification', {
        body: {
          event_type: testEventType,
          student_id: testStudentId,
          tenant_id: waConfig?.tenant_id,
          phone_override: testPhone,
          template_vars: mockVars,
        }
      })

      if (error) {
        setTestResult({ success: false, message: error.message || 'Gagal mengirim pesan.' })
      } else if (data && data.success) {
        setTestResult({ success: true, message: 'Pesan tes berhasil dikirim!' })
      } else {
        setTestResult({ success: false, message: data?.error || 'Gagal mengirim pesan (terjadi kesalahan pada API gateway).' })
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Kesalahan jaringan.' })
    } finally {
      setTestSending(false)
    }
  }

  return (
    <div className="card animate-fade-in">
      <div className="card-header"><h3 className="font-semibold text-slate-900">Konfigurasi WhatsApp Gateway</h3></div>
      <div className="card-body space-y-5">
        <div className={`rounded-xl p-4 border ${isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`status-dot ${isActive ? 'status-dot-success' : 'status-dot-danger'}`}></div>
            <p className={`text-sm font-semibold ${isActive ? 'text-emerald-800' : 'text-slate-600'}`}>
              {isActive ? 'Gateway Aktif' : 'Gateway Tidak Aktif'}
            </p>
          </div>
          {isActive && senderNumber && <p className="text-xs text-emerald-600">Terhubung ke {gateway.charAt(0).toUpperCase() + gateway.slice(1)} · Nomor: {senderNumber}</p>}
        </div>
        <div className="flex items-center gap-3">
          <label className="block text-sm font-medium text-slate-700">Status Gateway</label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-slate-300 accent-emerald-600" />
            <span className="text-sm text-slate-700">Aktifkan</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Provider Gateway</label>
          <select className="select" style={{ width: '250px' }} value={gateway} onChange={e => setGateway(e.target.value as any)}>
            <option value="fonnte">Fonnte (fonnte.com)</option>
            <option value="wablas">Wablas (wablas.com)</option>
            <option value="self_hosted">Self-Hosted (Gratis)</option>
            <option value="other">Lainnya</option>
          </select>
        </div>
        
        {gateway === 'self_hosted' ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Gateway URL</label>
            <input type="text" className="input" value={gatewayUrl} onChange={e => setGatewayUrl(e.target.value)} placeholder="https://xxx.trycloudflare.com" />
            <p className="text-xs text-slate-400 mt-1">URL publik dari Cloudflare Tunnel / localtunnel (contoh: https://xxx.loca.lt)</p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
            <input type="password" className="input" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Masukkan API key dari gateway" />
            <p className="text-xs text-slate-400 mt-1">Salin API key dari dashboard gateway Anda</p>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nomor WA Pengirim</label>
          <input type="text" className="input" value={senderNumber} onChange={e => setSenderNumber(e.target.value)} placeholder="6281234567890" />
          <p className="text-xs text-slate-400 mt-1">Gunakan nomor WA bisnis resmi sekolah</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Jadwal Pengingat</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={reminderH3} onChange={e => setReminderH3(e.target.checked)} className="w-4 h-4 rounded border-slate-300 accent-emerald-600" />
              <span className="text-sm text-slate-700">H-3 sebelum jatuh tempo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={reminderH0} onChange={e => setReminderH0(e.target.checked)} className="w-4 h-4 rounded border-slate-300 accent-emerald-600" />
              <span className="text-sm text-slate-700">H-0 pada hari jatuh tempo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={reminderH7} onChange={e => setReminderH7(e.target.checked)} className="w-4 h-4 rounded border-slate-300 accent-emerald-600" />
              <span className="text-sm text-slate-700">H+7 setelah jatuh tempo (tunggakan)</span>
            </label>
          </div>
        </div>

        {/* Kustomisasi Template */}
        <div className="border-t border-slate-200 pt-5 space-y-4">
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Kustomisasi Template Pesan</h4>
            <p className="text-xs text-slate-500 mt-0.5">Sesuaikan isi notifikasi WhatsApp untuk setiap kejadian. Biarkan kosong untuk menggunakan template bawaan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Konfirmasi SPP Lunas</label>
              <textarea
                rows={5}
                className="input h-28 py-2 resize-none text-xs font-mono"
                value={templateSppPaid}
                onChange={e => setTemplateSppPaid(e.target.value)}
                placeholder={`✅ Konfirmasi Pembayaran SPP\n\nYth. Orang tua/wali [Nama Siswa]\nKelas [Kelas] — [Nama Sekolah]\n\nBulan     : [Bulan Tahun]\nJumlah    : Rp [Jumlah]\nStatus    : Lunas ✓\n\nTerima kasih atas pembayarannya.\n🏫 [Nama Sekolah]`}
              />
              <p className="text-[10px] text-slate-400">Placeholder: [Nama Siswa], [Kelas], [Bulan Tahun], [Jumlah], [Nama Sekolah]</p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Setoran Tabungan</label>
              <textarea
                rows={5}
                className="input h-28 py-2 resize-none text-xs font-mono"
                value={templateSavingsDeposit}
                onChange={e => setTemplateSavingsDeposit(e.target.value)}
                placeholder={`💰 Tabungan Bertambah\n\n[Nama Siswa] (Kls [Kelas])\n\nSetoran    : + Rp [Jumlah]\nSaldo kini : Rp [Saldo Terkini]\n\n🏫 [Nama Sekolah]`}
              />
              <p className="text-[10px] text-slate-400">Placeholder: [Nama Siswa], [Kelas], [Jumlah], [Saldo Terkini], [Nama Sekolah]</p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Penarikan Tabungan</label>
              <textarea
                rows={5}
                className="input h-28 py-2 resize-none text-xs font-mono"
                value={templateSavingsWithdrawal}
                onChange={e => setTemplateSavingsWithdrawal(e.target.value)}
                placeholder={`💸 Penarikan Tabungan\n\n[Nama Siswa] (Kls [Kelas])\n\nPenarikan  : - Rp [Jumlah]\nSaldo kini : Rp [Saldo Terkini]\n\n🏫 [Nama Sekolah]`}
              />
              <p className="text-[10px] text-slate-400">Placeholder: [Nama Siswa], [Kelas], [Jumlah], [Saldo Terkini], [Nama Sekolah]</p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Tagihan Baru</label>
              <textarea
                rows={5}
                className="input h-28 py-2 resize-none text-xs font-mono"
                value={templateBillCreated}
                onChange={e => setTemplateBillCreated(e.target.value)}
                placeholder={`📋 Tagihan Baru\n\nYth. Orang tua/wali [Nama Siswa]\nKelas [Kelas]\n\nTagihan    : [Nama Tagihan]\nNominal    : Rp [Jumlah]\nJatuh tempo: [Tanggal Jatuh Tempo]\n\nMohon segera dilunasi ke bendahara sekolah.\n\n🏫 [Nama Sekolah]`}
              />
              <p className="text-[10px] text-slate-400">Placeholder: [Nama Siswa], [Kelas], [Nama Tagihan], [Jumlah], [Tanggal Jatuh Tempo], [Nama Sekolah]</p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Konfirmasi Bayar Tagihan</label>
              <textarea
                rows={5}
                className="input h-28 py-2 resize-none text-xs font-mono"
                value={templateBillPaid}
                onChange={e => setTemplateBillPaid(e.target.value)}
                placeholder={`✅ Konfirmasi Pembayaran Tagihan\n\nYth. Orang tua/wali [Nama Siswa]\nKelas [Kelas]\n\nTagihan    : [Nama Tagihan]\nDibayar    : Rp [Jumlah]\nSisa       : Rp [Sisa]\n\n🏫 [Nama Sekolah]`}
              />
              <p className="text-[10px] text-slate-400">Placeholder: [Nama Siswa], [Kelas], [Nama Tagihan], [Jumlah], [Sisa], [Nama Sekolah]</p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Pengingat SPP (H-3)</label>
              <textarea
                rows={5}
                className="input h-28 py-2 resize-none text-xs font-mono"
                value={templateSppReminderH3}
                onChange={e => setTemplateSppReminderH3(e.target.value)}
                placeholder={`⏰ Pengingat Pembayaran SPP\n\nYth. Orang tua/wali [Nama Siswa]\nKelas [Kelas]\n\nSPP [Bulan Tahun]  : Rp [Jumlah]\nJatuh tempo        : [Tanggal Jatuh Tempo]\n                     (3 hari lagi)\n\nMohon segera dilunasi ke bendahara sekolah.\n\n🏫 [Nama Sekolah]`}
              />
              <p className="text-[10px] text-slate-400">Placeholder: [Nama Siswa], [Kelas], [Bulan Tahun], [Jumlah], [Tanggal Jatuh Tempo], [Nama Sekolah]</p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Pengingat Hari H (H-0)</label>
              <textarea
                rows={5}
                className="input h-28 py-2 resize-none text-xs font-mono"
                value={templateSppReminderH0}
                onChange={e => setTemplateSppReminderH0(e.target.value)}
                placeholder={`⚠️ SPP Jatuh Tempo Hari Ini\n\nYth. Orang tua/wali [Nama Siswa]\nKelas [Kelas]\n\nSPP [Bulan Tahun]  : Rp [Jumlah]\nStatus             : Belum Lunas\n\nMohon segera selesaikan pembayaran hari ini.\n\n🏫 [Nama Sekolah]`}
              />
              <p className="text-[10px] text-slate-400">Placeholder: [Nama Siswa], [Kelas], [Bulan Tahun], [Jumlah], [Nama Sekolah]</p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Tunggakan SPP (H+7)</label>
              <textarea
                rows={5}
                className="input h-28 py-2 resize-none text-xs font-mono"
                value={templateSppOverdueH7}
                onChange={e => setTemplateSppOverdueH7(e.target.value)}
                placeholder={`❗ Pemberitahuan Tunggakan SPP\n\nYth. Orang tua/wali [Nama Siswa]\nKelas [Kelas]\n\nSPP [Bulan Tahun]  : Rp [Jumlah]\nTelah jatuh tempo  : 7 hari yang lalu\n\nMohon segera selesaikan pembayaran ke\nbendahara [Nama Sekolah].\n\nTerima kasih atas perhatiannya.\n— Sistem Smart Bendahara`}
              />
              <p className="text-[10px] text-slate-400">Placeholder: [Nama Siswa], [Kelas], [Bulan Tahun], [Jumlah], [Nama Sekolah]</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100 items-center">
          <button 
            type="button" 
            onClick={() => {
              if (students.length > 0) {
                handleStudentChange(students[0].id)
              }
              setTestResult(null)
              setShowTestModal(true)
            }} 
            disabled={!isActive || (gateway === 'self_hosted' ? !gatewayUrl : !apiKey)}
            className="btn-secondary disabled:opacity-50 cursor-pointer"
          >
            Tes Kirim Pesan
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60 cursor-pointer">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : <><Save className="w-4 h-4" />Simpan Konfigurasi</>}
          </button>
          {saved && <span className="flex items-center gap-1 text-sm text-emerald-600 animate-fade-in"><Check className="w-4 h-4" /> Tersimpan!</span>}
        </div>
      </div>

      {/* Test Message Modal */}
      {showTestModal && (
        <div className="modal-overlay" onClick={() => setShowTestModal(false)}>
          <div className="modal-content max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-lg text-slate-900">Uji Coba Pengiriman Pesan</h3>
              <button onClick={() => setShowTestModal(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Side Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Siswa Contoh</label>
                    <select 
                      className="select" 
                      value={testStudentId} 
                      onChange={e => handleStudentChange(e.target.value)}
                    >
                      <option value="">Pilih Siswa</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.class_name})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nomor WhatsApp Target</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={testPhone} 
                      onChange={e => setTestPhone(e.target.value)} 
                      placeholder="628123456789"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Ubah ke nomor pribadi Anda untuk menguji penerimaan pesan.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Skenario Pesan</label>
                    <select 
                      className="select" 
                      value={testEventType} 
                      onChange={e => setTestEventType(e.target.value)}
                    >
                      <option value="spp_paid">✅ Konfirmasi SPP Lunas</option>
                      <option value="savings_deposit">💰 Setoran Tabungan</option>
                      <option value="savings_withdrawal">💸 Penarikan Tabungan</option>
                      <option value="bill_created">📋 Tagihan Baru</option>
                      <option value="bill_paid">✅ Konfirmasi Bayar Tagihan</option>
                      <option value="spp_reminder_h3">⏰ Pengingat SPP (H-3)</option>
                      <option value="spp_reminder_h0">⚠️ Pengingat SPP (H-0)</option>
                      <option value="spp_overdue_h7">❗ Tunggakan SPP (H+7)</option>
                    </select>
                  </div>
                </div>

                {/* Right Side Preview */}
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preview Tampilan Pesan</label>
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs whitespace-pre-wrap text-slate-700 overflow-y-auto max-h-56">
                    {getPreviewText()}
                  </div>
                </div>
              </div>

              {testResult && (
                <div className={`p-3 rounded-lg border text-sm ${
                  testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {testResult.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setShowTestModal(false)} className="btn-secondary">Batal</button>
              <button 
                onClick={handleTestSend} 
                disabled={testSending || !testStudentId || !testPhone} 
                className="btn-primary disabled:opacity-60 cursor-pointer"
              >
                {testSending ? 'Mengirim...' : 'Kirim Pesan Tes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Manajemen Pengguna — with Add
// ============================================
function ManajemenPengguna() {
  const { users, refetchUsers } = useSettings()
  const { profile } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole] = useState<'admin' | 'treasurer' | 'principal'>('treasurer')

  const roleLabels: Record<string, string> = { admin: 'Admin', principal: 'Kepala Sekolah', treasurer: 'Bendahara' }

  const handleAddUser = async () => {
    if (!formName || !formEmail || !profile?.tenant_id) return
    setSaving(true)
    const { error } = await supabase.from('users').insert({
      tenant_id: profile.tenant_id, name: formName, email: formEmail, role: formRole, is_active: true,
    })
    if (error) { alert('Gagal menambah pengguna: ' + error.message) }
    setSaving(false)
    setShowModal(false)
    setFormName(''); setFormEmail(''); setFormRole('treasurer')
    await refetchUsers()
  }

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    await supabase.from('users').update({ is_active: !currentActive }).eq('id', userId)
    await refetchUsers()
  }

  const handleDeleteUser = async (userId: string) => {
    if (userId === profile?.user_id) { alert('Tidak bisa menghapus akun Anda sendiri'); return }
    if (confirm('Yakin ingin menghapus pengguna ini?')) {
      await supabase.from('users').delete().eq('id', userId)
      await refetchUsers()
    }
  }

  return (
    <>
      <div className="card animate-fade-in">
        <div className="card-header flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Pengguna</h3>
          <button className="btn-primary btn-sm" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Tambah Pengguna</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Pengguna</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Peran</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500">Login Terakhir</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="table-row-hover">
                  <td className="px-6 py-3">
                    <p className="text-sm font-medium text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-6 py-3"><span className="badge badge-info">{roleLabels[u.role] || u.role}</span></td>
                  <td className="px-6 py-3 text-sm text-slate-500">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button onClick={() => handleToggleActive(u.id, u.is_active)} className="cursor-pointer">
                      <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 text-sm font-medium hover:text-red-700 cursor-pointer">Hapus</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">Belum ada pengguna</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-lg text-slate-900">Tambah Pengguna</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input type="text" className="input" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nama pengguna" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" className="input" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="email@sekolah.sch.id" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Peran</label>
                <select className="select" value={formRole} onChange={e => setFormRole(e.target.value as any)}>
                  <option value="admin">Admin Sekolah</option>
                  <option value="treasurer">Bendahara</option>
                  <option value="principal">Kepala Sekolah</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
              <button onClick={handleAddUser} disabled={saving || !formName || !formEmail} className="btn-primary disabled:opacity-60">
                {saving ? 'Menyimpan...' : 'Tambah Pengguna'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
