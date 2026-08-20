// ============================================
// Smart Bendahara — Excel Import/Export Utilities
// Uses SheetJS (xlsx) for reading and writing Excel files
// ============================================

import * as XLSX from 'xlsx'

// ============================================
// TYPES
// ============================================

export interface ImportStudentRow {
  nama: string
  nisn?: string
  kelas?: string
  nama_ortu?: string
  no_wa_ortu?: string
}

export interface ImportResult {
  success: number
  failed: number
  errors: string[]
  data: ImportStudentRow[]
}

// ============================================
// IMPORT: Read Excel File → Student Data
// ============================================

export function parseStudentExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]

        // Convert to JSON with headers
        const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' })

        const result: ImportResult = {
          success: 0,
          failed: 0,
          errors: [],
          data: [],
        }

        rawRows.forEach((row, index) => {
          const rowNum = index + 2 // 1-indexed + header row

          // Try to find name column (case-insensitive, various common names)
          const nama = findColumnValue(row, ['nama', 'nama lengkap', 'nama siswa', 'name', 'student name', 'nama_lengkap', 'nama_siswa'])
          const nisn = findColumnValue(row, ['nisn', 'nis', 'no induk', 'no_induk', 'nomor induk'])
          const kelas = findColumnValue(row, ['kelas', 'class', 'tingkat', 'rombel', 'rombongan belajar'])
          const namaOrtu = findColumnValue(row, ['nama ortu', 'nama orang tua', 'orang tua', 'wali', 'nama_ortu', 'parent', 'nama orang tua/wali', 'nama wali'])
          const noWa = findColumnValue(row, ['no wa', 'no whatsapp', 'whatsapp', 'no hp', 'telepon', 'hp', 'no_wa', 'phone', 'no_hp', 'no. wa', 'no. hp'])

          if (!nama || nama.trim() === '') {
            result.failed++
            result.errors.push(`Baris ${rowNum}: Nama kosong, dilewati`)
            return
          }

          result.success++
          result.data.push({
            nama: nama.trim(),
            nisn: nisn?.toString().trim() || undefined,
            kelas: kelas?.toString().trim() || undefined,
            nama_ortu: namaOrtu?.trim() || undefined,
            no_wa_ortu: normalizePhone(noWa?.toString().trim()),
          })
        })

        resolve(result)
      } catch (err) {
        reject(new Error('Gagal membaca file Excel. Pastikan format file benar (.xlsx atau .xls)'))
      }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsArrayBuffer(file)
  })
}

// ============================================
// EXPORT: Generate & Download Excel
// ============================================

export interface ExportColumn<T> {
  header: string
  accessor: (row: T) => string | number
  width?: number
}

export function exportToExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName: string = 'Data'
) {
  // Convert data to rows
  const headers = columns.map(c => c.header)
  const rows = data.map(item => columns.map(col => col.accessor(item)))

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

  // Set column widths
  ws['!cols'] = columns.map(c => ({ wch: c.width || 18 }))

  // Style header (bold) - SheetJS community edition doesn't support styling
  // but we set the widths properly

  // Create workbook
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Download
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// ============================================
// TEMPLATE: Generate Import Template
// ============================================

export function downloadImportTemplate() {
  const templateData = [
    ['Nama', 'NISN', 'Kelas', 'Nama Orang Tua', 'No. WA Orang Tua'],
    ['Ahmad Rizky Pratama', '0012345678', '1A', 'Siti Aminah', '6281234567890'],
    ['Putri Rahmawati', '0012345679', '2B', 'Budi Santoso', '6289876543210'],
    ['Muhammad Fajar', '0012345680', '1A', 'Dewi Kartini', '6281122334455'],
  ]

  const ws = XLSX.utils.aoa_to_sheet(templateData)
  ws['!cols'] = [
    { wch: 28 }, // Nama
    { wch: 15 }, // NISN
    { wch: 10 }, // Kelas
    { wch: 25 }, // Nama Orang Tua
    { wch: 20 }, // No. WA
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template Import Siswa')
  XLSX.writeFile(wb, 'template_import_siswa.xlsx')
}

// ============================================
// HELPERS
// ============================================

function findColumnValue(row: Record<string, any>, possibleNames: string[]): string | undefined {
  // First try exact match (case-insensitive)
  for (const key of Object.keys(row)) {
    const lowerKey = key.toLowerCase().trim()
    for (const name of possibleNames) {
      if (lowerKey === name.toLowerCase()) {
        return row[key]?.toString()
      }
    }
  }
  // Then try partial match
  for (const key of Object.keys(row)) {
    const lowerKey = key.toLowerCase().trim()
    for (const name of possibleNames) {
      if (lowerKey.includes(name.toLowerCase()) || name.toLowerCase().includes(lowerKey)) {
        return row[key]?.toString()
      }
    }
  }
  return undefined
}

function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined
  // Remove non-digits
  let cleaned = phone.replace(/\D/g, '')
  // Convert 08xxx to 628xxx
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1)
  }
  // Must start with 62
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned
  }
  return cleaned || undefined
}
