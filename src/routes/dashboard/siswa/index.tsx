import { createFileRoute } from '@tanstack/react-router'
import { Search, Plus, Upload, Download, Filter, Edit2, Trash2, X, Loader2, GraduationCap, BookOpen, Hash, Users, FileSpreadsheet, AlertCircle, CheckCircle2, FileDown } from 'lucide-react'
import { useState, useRef } from 'react'
import { useStudents, useClasses, useAcademicYears } from '../../../lib/supabase-hooks'
import type { StudentWithDetails } from '../../../lib/supabase-hooks'
import { formatDate, formatRupiah } from '../../../lib/utils'
import { useAuth } from '../../../lib/auth-context'
import { parseStudentExcel, exportToExcel, downloadImportTemplate } from '../../../lib/excel-utils'
import type { ImportStudentRow, ImportResult } from '../../../lib/excel-utils'

export const Route = createFileRoute('/dashboard/siswa/')({ component: SiswaPage })

function SiswaPage() {
  const { profile } = useAuth()
  const { students, loading, addStudent, updateStudent, deleteStudent } = useStudents()
  const { classes, addClass, updateClass, deleteClass } = useClasses()
  const { academicYears, activeYear } = useAcademicYears()
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<StudentWithDetails | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Class modal state
  const [showClassModal, setShowClassModal] = useState(false)
  const [editingClass, setEditingClass] = useState<any>(null)
  const [classGrade, setClassGrade] = useState('')
  const [classSection, setClassSection] = useState('')
  const [classSppAmount, setClassSppAmount] = useState('')
  const [classSaving, setClassSaving] = useState(false)
  const [classError, setClassError] = useState<string | null>(null)

  // Tab state: 'students' or 'classes'
  const [activeTab, setActiveTab] = useState<'students' | 'classes'>('students')

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 })
  const [importDone, setImportDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formNisn, setFormNisn] = useState('')
  const [formClassId, setFormClassId] = useState('')
  const [formParentName, setFormParentName] = useState('')
  const [formParentPhone, setFormParentPhone] = useState('')

  const filtered = students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.nisn || '').includes(search)
    const matchClass = !filterClass || s.class_id === filterClass
    return matchSearch && matchClass
  })

  const openModal = (student: StudentWithDetails | null) => {
    setEditingStudent(student)
    setFormName(student?.name || '')
    setFormNisn(student?.nisn || '')
    setFormClassId(student?.class_id || '')
    setFormParentName(student?.parent_contact?.name || '')
    setFormParentPhone(student?.parent_contact?.phone_wa || '')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) return
    setSaving(true)

    if (editingStudent) {
      await updateStudent(editingStudent.id, {
        name: formName, nisn: formNisn, class_id: formClassId || undefined,
        parent_name: formParentName || undefined, parent_phone: formParentPhone || undefined,
      })
    } else {
      await addStudent({
        name: formName, nisn: formNisn, class_id: formClassId || undefined,
        parent_name: formParentName || undefined, parent_phone: formParentPhone || undefined,
      })
    }
    setSaving(false)
    setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus data siswa ini? Semua data terkait (SPP, tabungan, tagihan) juga akan dihapus.')) {
      setDeleting(id)
      setDeleteError(null)
      const result = await deleteStudent(id)
      if (result.error) {
        setDeleteError(result.error)
        setTimeout(() => setDeleteError(null), 5000)
      }
      setDeleting(null)
    }
  }

  // Import Excel handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await parseStudentExcel(file)
      setImportResult(result)
      setImportDone(false)
      setImportProgress({ done: 0, total: 0 })
      setShowImportModal(true)
    } catch (err: any) {
      alert(err.message || 'Gagal membaca file Excel')
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleImportConfirm = async () => {
    if (!importResult || importResult.data.length === 0) return
    setImporting(true)
    setImportProgress({ done: 0, total: importResult.data.length })

    let successCount = 0
    for (let i = 0; i < importResult.data.length; i++) {
      const row = importResult.data[i]
      // Find matching class by name
      const matchedClass = row.kelas
        ? classes.find(c => c.name.toLowerCase() === row.kelas!.toLowerCase())
        : undefined

      await addStudent({
        name: row.nama,
        nisn: row.nisn,
        class_id: matchedClass?.id,
        parent_name: row.nama_ortu,
        parent_phone: row.no_wa_ortu,
      })
      successCount++
      setImportProgress({ done: i + 1, total: importResult.data.length })
    }
    setImporting(false)
    setImportDone(true)
  }

  // Export Excel handler
  const handleExport = () => {
    const dataToExport = filtered.length > 0 ? filtered : students
    exportToExcel(
      dataToExport,
      [
        { header: 'Nama', accessor: (s) => s.name, width: 28 },
        { header: 'NISN', accessor: (s) => s.nisn || '', width: 15 },
        { header: 'Kelas', accessor: (s) => s.class_name || '', width: 10 },
        { header: 'Status', accessor: (s) => s.status === 'active' ? 'Aktif' : s.status === 'alumni' ? 'Alumni' : 'Pindah', width: 10 },
        { header: 'Nama Orang Tua', accessor: (s) => s.parent_contact?.name || '', width: 25 },
        { header: 'No. WA Orang Tua', accessor: (s) => s.parent_contact?.phone_wa || '', width: 20 },
        { header: 'Tanggal Masuk', accessor: (s) => s.enrollment_date ? formatDate(s.enrollment_date) : '', width: 18 },
      ],
      `data_siswa_${new Date().toISOString().split('T')[0]}`,
      'Data Siswa'
    )
  }

  // Class management functions
  const openClassModal = (cls: any | null) => {
    setEditingClass(cls)
    setClassGrade(cls?.grade || '')
    setClassSection(cls ? cls.name.replace(cls.grade, '') : '')
    setClassSppAmount(cls?.spp_amount?.toString() || '')
    setClassError(null)
    setShowClassModal(true)
  }

  const handleClassSave = async () => {
    if (!classGrade) {
      setClassError('Tingkat kelas harus dipilih')
      return
    }
    if (!classSection.trim()) {
      setClassError('Nomor unik kelas harus diisi')
      return
    }

    const className = `${classGrade}${classSection.trim().toUpperCase()}`

    // Check for duplicate class name
    const isDuplicate = classes.some(c =>
      c.name === className && (!editingClass || c.id !== editingClass.id)
    )
    if (isDuplicate) {
      setClassError(`Kelas "${className}" sudah ada`)
      return
    }

    if (!activeYear) {
      setClassError('Tidak ada tahun ajaran aktif. Buat tahun ajaran dulu di Pengaturan.')
      return
    }

    setClassSaving(true)
    setClassError(null)

    if (editingClass) {
      const result = await updateClass(editingClass.id, {
        name: className,
        grade: classGrade,
        spp_amount: parseInt(classSppAmount) || 0,
      })
      if (result.error) {
        setClassError(result.error)
        setClassSaving(false)
        return
      }
    } else {
      const result = await addClass({
        name: className,
        grade: classGrade,
        spp_amount: parseInt(classSppAmount) || 0,
        academic_year_id: activeYear.id,
      })
      if (result.error) {
        setClassError(result.error)
        setClassSaving(false)
        return
      }
    }

    setClassSaving(false)
    setShowClassModal(false)
  }

  const handleClassDelete = async (id: string, name: string) => {
    const studentsInClass = students.filter(s => s.class_id === id)
    if (studentsInClass.length > 0) {
      alert(`Tidak bisa menghapus kelas "${name}" karena masih ada ${studentsInClass.length} siswa terdaftar.`)
      return
    }
    if (confirm(`Yakin ingin menghapus kelas "${name}"?`)) {
      await deleteClass(id)
    }
  }

  // Count students per class
  const getStudentCount = (classId: string) => {
    return students.filter(s => s.class_id === classId).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-slate-500">Memuat data siswa...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Siswa & Kelas</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data siswa dan kelas {profile?.tenant_name || ''}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'students'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Siswa ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Kelas ({classes.length})
        </button>
      </div>

      {/* ============================================ */}
      {/* CLASSES TAB */}
      {/* ============================================ */}
      {activeTab === 'classes' && (
        <div className="space-y-4 animate-fade-in">
          {/* Class Action Bar */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Tahun Ajaran: <strong className="text-slate-700">{activeYear?.name || 'Belum ada'}</strong>
            </p>
            <button className="btn-primary btn-sm" onClick={() => openClassModal(null)}>
              <Plus className="w-4 h-4" />
              Buat Kelas Baru
            </button>
          </div>

          {/* Class Cards Grid */}
          {classes.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-slate-700 mb-2">Belum Ada Kelas</h3>
              <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                Buat kelas terlebih dahulu sebelum menambahkan siswa. Setiap kelas memiliki tingkat (angka) dan nomor unik (huruf/kode).
              </p>
              <button className="btn-primary" onClick={() => openClassModal(null)}>
                <Plus className="w-4 h-4" />
                Buat Kelas Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {classes.map((cls) => {
                const count = getStudentCount(cls.id)
                return (
                  <div key={cls.id} className="card p-5 hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {cls.name}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openClassModal(cls)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Edit kelas"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleClassDelete(cls.id, cls.name)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Hapus kelas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Tingkat</span>
                        <span className="text-sm font-medium text-slate-700">Kelas {cls.grade}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Kode Unik</span>
                        <span className="text-sm font-medium text-slate-700 font-mono">{cls.name.replace(cls.grade, '') || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Siswa</span>
                        <span className="text-sm font-semibold text-emerald-600">{count} siswa</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">SPP/Bulan</span>
                        <span className="text-sm font-medium text-slate-700">{formatRupiah(cls.spp_amount)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Add Class Card */}
              <button
                onClick={() => openClassModal(null)}
                className="card p-5 border-2 border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center gap-2 min-h-[160px] cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  <Plus className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <span className="text-sm text-slate-400 group-hover:text-emerald-600 font-medium transition-colors">Tambah Kelas</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* STUDENTS TAB */}
      {/* ============================================ */}
      {activeTab === 'students' && (
        <div className="space-y-4 animate-fade-in">
          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button className="btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4" />
              Import Excel
            </button>
            <button
              className="btn-secondary btn-sm"
              onClick={handleExport}
              disabled={students.length === 0}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="btn-primary btn-sm" onClick={() => openModal(null)}>
              <Plus className="w-4 h-4" />
              Tambah Siswa
            </button>
          </div>

          {/* Delete Error */}
          {deleteError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">Gagal menghapus siswa: {deleteError}</p>
              <button onClick={() => setDeleteError(null)} className="ml-auto p-1 hover:bg-red-100 rounded cursor-pointer">
                <X className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="card p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama atau NISN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="select"
                  style={{ width: '180px' }}
                >
                  <option value="">Semua Kelas</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <span className="text-sm text-slate-500 ml-auto">{filtered.length} siswa</span>
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Siswa</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">NISN</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kelas</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Orang Tua</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tgl Masuk</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => (
                    <tr key={s.id} className="table-row-hover">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                            {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-sm font-medium text-slate-800">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-600 font-mono">{s.nisn || '-'}</td>
                      <td className="px-6 py-3.5">
                        <span className="badge badge-info">{s.class_name}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`badge ${
                          s.status === 'active' ? 'badge-success' :
                          s.status === 'alumni' ? 'badge-neutral' : 'badge-warning'
                        }`}>
                          {s.status === 'active' ? 'Aktif' : s.status === 'alumni' ? 'Alumni' : 'Pindah'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-600">{s.parent_contact?.name || '-'}</td>
                      <td className="px-6 py-3.5 text-sm text-slate-500">{s.enrollment_date ? formatDate(s.enrollment_date) : '-'}</td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openModal(s)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        {search || filterClass ? 'Tidak ada siswa yang cocok dengan filter' : (
                          <div>
                            <p className="mb-2">Belum ada data siswa</p>
                            {classes.length === 0 && (
                              <p className="text-xs">
                                <button onClick={() => setActiveTab('classes')} className="text-emerald-600 font-medium hover:underline cursor-pointer">
                                  Buat kelas dulu
                                </button>
                                {' '}sebelum menambahkan siswa
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* STUDENT MODAL */}
      {/* ============================================ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-lg text-slate-900">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input type="text" className="input" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nama lengkap siswa" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NISN</label>
                  <input type="text" className="input" value={formNisn} onChange={e => setFormNisn(e.target.value)} placeholder="0012345678" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
                  <select className="select" value={formClassId} onChange={e => setFormClassId(e.target.value)}>
                    <option value="">Pilih Kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {classes.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Belum ada kelas.{' '}
                      <button
                        type="button"
                        onClick={() => { setShowModal(false); setActiveTab('classes'); openClassModal(null) }}
                        className="text-emerald-600 font-medium hover:underline cursor-pointer"
                      >
                        Buat kelas dulu
                      </button>
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Orang Tua / Wali</label>
                <input type="text" className="input" value={formParentName} onChange={e => setFormParentName(e.target.value)} placeholder="Nama orang tua" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">No. WhatsApp Orang Tua</label>
                <input type="text" className="input" value={formParentPhone} onChange={e => setFormParentPhone(e.target.value)} placeholder="6281234567890" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
              <button onClick={handleSave} disabled={saving || !formName.trim()} className="btn-primary disabled:opacity-60">
                {saving ? 'Menyimpan...' : editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* CLASS MODAL */}
      {/* ============================================ */}
      {showClassModal && (
        <div className="modal-overlay" onClick={() => setShowClassModal(false)}>
          <div className="modal-content max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-lg text-slate-900">
                {editingClass ? 'Edit Kelas' : 'Buat Kelas Baru'}
              </h3>
              <button onClick={() => setShowClassModal(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Error Alert */}
              {classError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 animate-fade-in">
                  <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{classError}</p>
                </div>
              )}

              {/* Preview */}
              {classGrade && classSection && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 text-center animate-fade-in">
                  <p className="text-xs text-emerald-600 mb-1">Nama Kelas</p>
                  <p className="text-3xl font-bold text-emerald-700">{classGrade}{classSection.trim().toUpperCase()}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      Tingkat Kelas (Angka)
                    </span>
                  </label>
                  <select
                    className="select"
                    value={classGrade}
                    onChange={(e) => setClassGrade(e.target.value)}
                  >
                    <option value="">Pilih Tingkat</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                      <option key={n} value={n.toString()}>{n}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">SD: 1-6 | SMP: 7-9 | SMA: 10-12</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      Nomor Unik Kelas
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={classSection}
                    onChange={(e) => setClassSection(e.target.value)}
                    placeholder="A, B, C atau Unggulan"
                    maxLength={20}
                  />
                  <p className="text-xs text-slate-400 mt-1">Contoh: A, B, Unggulan, Reguler</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Biaya SPP / Bulan (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input pl-10"
                    value={classSppAmount ? parseInt(classSppAmount).toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '')
                      setClassSppAmount(raw)
                    }}
                    placeholder="150.000"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {classSppAmount && parseInt(classSppAmount) > 0 ? `= ${formatRupiah(parseInt(classSppAmount))} per bulan` : 'Opsional, bisa diatur nanti'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500">
                  <strong>Tahun Ajaran:</strong> {activeYear?.name || '—'}
                  {!activeYear && (
                    <span className="text-amber-600 ml-1">(Buat tahun ajaran dulu di menu Pengaturan)</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setShowClassModal(false)} className="btn-secondary">Batal</button>
              <button
                onClick={handleClassSave}
                disabled={classSaving || !classGrade || !classSection.trim()}
                className="btn-primary disabled:opacity-60"
              >
                {classSaving ? 'Menyimpan...' : editingClass ? 'Simpan Perubahan' : 'Buat Kelas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
