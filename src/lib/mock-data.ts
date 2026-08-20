// ===== MOCK DATA FOR SMART BENDAHARA =====
// All data is static/dummy for frontend-only demo

export interface Student {
  id: string
  nisn: string
  name: string
  status: 'active' | 'alumni' | 'transferred'
  className: string
  classId: string
  enrollmentDate: string
  parentName: string
  parentPhone: string
}

export interface ClassRoom {
  id: string
  name: string
  grade: string
  sppAmount: number
  studentCount: number
}

export interface SppPayment {
  studentId: string
  studentName: string
  className: string
  month: number
  year: number
  amountDue: number
  amountPaid: number
  remaining: number
  status: 'unpaid' | 'partial' | 'paid'
  paidAt?: string
}

export interface SavingsAccount {
  studentId: string
  studentName: string
  className: string
  balance: number
  lastTransaction?: string
}

export interface SavingsTransaction {
  id: string
  studentId: string
  studentName: string
  type: 'deposit' | 'withdrawal'
  amount: number
  balanceAfter: number
  notes: string
  transactedAt: string
}

export interface CustomBill {
  id: string
  name: string
  description: string
  defaultAmount: number
  dueDate: string
  status: 'active' | 'archived'
  assignedCount: number
  paidCount: number
}

export interface NotificationLog {
  id: string
  studentName: string
  eventType: string
  recipientPhone: string
  messageSent: string
  status: 'queued' | 'sent' | 'failed' | 'delivered'
  sentAt: string
}

export interface ActivityLog {
  id: string
  userName: string
  action: 'create' | 'update' | 'delete' | 'export' | 'login' | 'logout'
  entityType: string
  description: string
  createdAt: string
}

// ---- CLASSES ----
export const classes: ClassRoom[] = [
  { id: 'c1', name: 'Kelas 1A', grade: '1', sppAmount: 250000, studentCount: 28 },
  { id: 'c2', name: 'Kelas 1B', grade: '1', sppAmount: 250000, studentCount: 27 },
  { id: 'c3', name: 'Kelas 2A', grade: '2', sppAmount: 275000, studentCount: 30 },
  { id: 'c4', name: 'Kelas 2B', grade: '2', sppAmount: 275000, studentCount: 29 },
  { id: 'c5', name: 'Kelas 3A', grade: '3', sppAmount: 300000, studentCount: 26 },
  { id: 'c6', name: 'Kelas 3B', grade: '3', sppAmount: 300000, studentCount: 25 },
  { id: 'c7', name: 'Kelas 4A', grade: '4', sppAmount: 325000, studentCount: 31 },
  { id: 'c8', name: 'Kelas 5A', grade: '5', sppAmount: 350000, studentCount: 28 },
  { id: 'c9', name: 'Kelas 6A', grade: '6', sppAmount: 375000, studentCount: 27 },
]

// ---- STUDENTS ----
export const students: Student[] = [
  { id: 's1', nisn: '0012345601', name: 'Ahmad Fauzi Rahman', status: 'active', className: 'Kelas 1A', classId: 'c1', enrollmentDate: '2024-07-15', parentName: 'Ibu Siti Aminah', parentPhone: '6281234567001' },
  { id: 's2', nisn: '0012345602', name: 'Siti Nurhaliza Putri', status: 'active', className: 'Kelas 1A', classId: 'c1', enrollmentDate: '2024-07-15', parentName: 'Bapak Hendra Wijaya', parentPhone: '6281234567002' },
  { id: 's3', nisn: '0012345603', name: 'Muhammad Rizki Pratama', status: 'active', className: 'Kelas 1A', classId: 'c1', enrollmentDate: '2024-07-15', parentName: 'Ibu Dewi Lestari', parentPhone: '6281234567003' },
  { id: 's4', nisn: '0012345604', name: 'Aisyah Zahra Kamila', status: 'active', className: 'Kelas 1B', classId: 'c2', enrollmentDate: '2024-07-15', parentName: 'Bapak Bambang Suryadi', parentPhone: '6281234567004' },
  { id: 's5', nisn: '0012345605', name: 'Dimas Arya Wicaksono', status: 'active', className: 'Kelas 1B', classId: 'c2', enrollmentDate: '2024-07-15', parentName: 'Ibu Ratna Sari', parentPhone: '6281234567005' },
  { id: 's6', nisn: '0012345606', name: 'Putri Ayu Lestari', status: 'active', className: 'Kelas 2A', classId: 'c3', enrollmentDate: '2023-07-15', parentName: 'Bapak Agus Hermawan', parentPhone: '6281234567006' },
  { id: 's7', nisn: '0012345607', name: 'Rafi Dwi Nugroho', status: 'active', className: 'Kelas 2A', classId: 'c3', enrollmentDate: '2023-07-15', parentName: 'Ibu Lina Kartini', parentPhone: '6281234567007' },
  { id: 's8', nisn: '0012345608', name: 'Nadia Safitri', status: 'active', className: 'Kelas 2B', classId: 'c4', enrollmentDate: '2023-07-15', parentName: 'Bapak Yusuf Hakim', parentPhone: '6281234567008' },
  { id: 's9', nisn: '0012345609', name: 'Bayu Aditya Putra', status: 'active', className: 'Kelas 3A', classId: 'c5', enrollmentDate: '2022-07-15', parentName: 'Ibu Rina Wahyuni', parentPhone: '6281234567009' },
  { id: 's10', nisn: '0012345610', name: 'Zahra Amelia Salsabila', status: 'active', className: 'Kelas 3A', classId: 'c5', enrollmentDate: '2022-07-15', parentName: 'Bapak Dedi Kurniawan', parentPhone: '6281234567010' },
  { id: 's11', nisn: '0012345611', name: 'Farhan Maulana Akbar', status: 'active', className: 'Kelas 3B', classId: 'c6', enrollmentDate: '2022-07-15', parentName: 'Ibu Nurul Hidayah', parentPhone: '6281234567011' },
  { id: 's12', nisn: '0012345612', name: 'Anisa Rahmawati', status: 'active', className: 'Kelas 4A', classId: 'c7', enrollmentDate: '2021-07-15', parentName: 'Bapak Sugiarto', parentPhone: '6281234567012' },
  { id: 's13', nisn: '0012345613', name: 'Galang Saputra', status: 'active', className: 'Kelas 4A', classId: 'c7', enrollmentDate: '2021-07-15', parentName: 'Ibu Sri Rahayu', parentPhone: '6281234567013' },
  { id: 's14', nisn: '0012345614', name: 'Keyla Puspita Sari', status: 'active', className: 'Kelas 5A', classId: 'c8', enrollmentDate: '2020-07-15', parentName: 'Bapak Wahyu Santoso', parentPhone: '6281234567014' },
  { id: 's15', nisn: '0012345615', name: 'Rendi Mahardika', status: 'active', className: 'Kelas 5A', classId: 'c8', enrollmentDate: '2020-07-15', parentName: 'Ibu Mega Wulandari', parentPhone: '6281234567015' },
  { id: 's16', nisn: '0012345616', name: 'Salwa Khairunnisa', status: 'active', className: 'Kelas 6A', classId: 'c9', enrollmentDate: '2019-07-15', parentName: 'Bapak Irfan Habibi', parentPhone: '6281234567016' },
  { id: 's17', nisn: '0012345617', name: 'Yoga Pratama Putra', status: 'active', className: 'Kelas 6A', classId: 'c9', enrollmentDate: '2019-07-15', parentName: 'Ibu Fitri Handayani', parentPhone: '6281234567017' },
  { id: 's18', nisn: '0012345618', name: 'Citra Dewi Anggraini', status: 'active', className: 'Kelas 1A', classId: 'c1', enrollmentDate: '2024-07-15', parentName: 'Bapak Arief Budiman', parentPhone: '6281234567018' },
  { id: 's19', nisn: '0012345619', name: 'Ilham Firdaus', status: 'active', className: 'Kelas 2A', classId: 'c3', enrollmentDate: '2023-07-15', parentName: 'Ibu Yanti Permata', parentPhone: '6281234567019' },
  { id: 's20', nisn: '0012345620', name: 'Nazwa Aulia Maharani', status: 'active', className: 'Kelas 3A', classId: 'c5', enrollmentDate: '2022-07-15', parentName: 'Bapak Rizal Firmansyah', parentPhone: '6281234567020' },
]

// ---- SPP PAYMENTS ----
function generateSppPayments(): SppPayment[] {
  const payments: SppPayment[] = []
  const year = 2025

  students.forEach((student) => {
    const cls = classes.find((c) => c.id === student.classId)
    if (!cls) return
    for (let month = 1; month <= 7; month++) {
      let status: SppPayment['status'] = 'unpaid'
      let amountPaid = 0

      if (month <= 5) {
        status = 'paid'
        amountPaid = cls.sppAmount
      } else if (month === 6) {
        // Some partial, some paid
        if (Math.random() > 0.3) {
          status = 'paid'
          amountPaid = cls.sppAmount
        } else {
          status = 'partial'
          amountPaid = Math.floor(cls.sppAmount * 0.5)
        }
      }
      // month 7 stays unpaid

      payments.push({
        studentId: student.id,
        studentName: student.name,
        className: student.className,
        month,
        year,
        amountDue: cls.sppAmount,
        amountPaid,
        remaining: cls.sppAmount - amountPaid,
        status,
        paidAt: status !== 'unpaid' ? `2025-${String(month).padStart(2, '0')}-10T08:00:00` : undefined,
      })
    }
  })
  return payments
}

export const sppPayments: SppPayment[] = generateSppPayments()

// ---- SAVINGS ----
export const savingsAccounts: SavingsAccount[] = students.map((s, i) => ({
  studentId: s.id,
  studentName: s.name,
  className: s.className,
  balance: [150000, 275000, 50000, 420000, 180000, 325000, 90000, 560000, 200000, 375000, 125000, 450000, 80000, 310000, 195000, 640000, 110000, 285000, 70000, 500000][i] || 100000,
  lastTransaction: '2025-07-10',
}))

export const savingsTransactions: SavingsTransaction[] = [
  { id: 'st1', studentId: 's1', studentName: 'Ahmad Fauzi Rahman', type: 'deposit', amount: 50000, balanceAfter: 150000, notes: 'Setoran mingguan', transactedAt: '2025-07-10T08:15:00' },
  { id: 'st2', studentId: 's2', studentName: 'Siti Nurhaliza Putri', type: 'deposit', amount: 75000, balanceAfter: 275000, notes: 'Setoran bulanan', transactedAt: '2025-07-10T08:20:00' },
  { id: 'st3', studentId: 's3', studentName: 'Muhammad Rizki Pratama', type: 'withdrawal', amount: 30000, balanceAfter: 50000, notes: 'Penarikan untuk beli buku', transactedAt: '2025-07-09T10:00:00' },
  { id: 'st4', studentId: 's4', studentName: 'Aisyah Zahra Kamila', type: 'deposit', amount: 100000, balanceAfter: 420000, notes: 'Setoran dari orang tua', transactedAt: '2025-07-09T08:30:00' },
  { id: 'st5', studentId: 's5', studentName: 'Dimas Arya Wicaksono', type: 'deposit', amount: 25000, balanceAfter: 180000, notes: 'Setoran harian', transactedAt: '2025-07-08T08:10:00' },
  { id: 'st6', studentId: 's6', studentName: 'Putri Ayu Lestari', type: 'withdrawal', amount: 50000, balanceAfter: 325000, notes: 'Penarikan untuk kegiatan', transactedAt: '2025-07-08T09:45:00' },
  { id: 'st7', studentId: 's7', studentName: 'Rafi Dwi Nugroho', type: 'deposit', amount: 40000, balanceAfter: 90000, notes: 'Setoran mingguan', transactedAt: '2025-07-07T08:20:00' },
  { id: 'st8', studentId: 's8', studentName: 'Nadia Safitri', type: 'deposit', amount: 200000, balanceAfter: 560000, notes: 'Setoran semester', transactedAt: '2025-07-07T08:40:00' },
  { id: 'st9', studentId: 's16', studentName: 'Salwa Khairunnisa', type: 'deposit', amount: 150000, balanceAfter: 640000, notes: 'Setoran tabungan wisuda', transactedAt: '2025-07-06T08:15:00' },
  { id: 'st10', studentId: 's12', studentName: 'Anisa Rahmawati', type: 'deposit', amount: 80000, balanceAfter: 450000, notes: 'Setoran mingguan', transactedAt: '2025-07-06T08:30:00' },
]

// ---- CUSTOM BILLS ----
export const customBills: CustomBill[] = [
  { id: 'b1', name: 'Uang Ujian Semester 1', description: 'Biaya ujian semester ganjil TA 2025/2026', defaultAmount: 150000, dueDate: '2025-11-15', status: 'active', assignedCount: 251, paidCount: 0 },
  { id: 'b2', name: 'Seragam Baru Kelas 1', description: 'Seragam putih-merah dan olahraga', defaultAmount: 450000, dueDate: '2025-08-01', status: 'active', assignedCount: 55, paidCount: 38 },
  { id: 'b3', name: 'Study Tour Kelas 6', description: 'Kunjungan edukasi ke Bandung 3 hari', defaultAmount: 750000, dueDate: '2025-09-30', status: 'active', assignedCount: 27, paidCount: 12 },
  { id: 'b4', name: 'Buku Paket Semester 2', description: 'Paket buku pelajaran semester genap', defaultAmount: 285000, dueDate: '2025-01-15', status: 'archived', assignedCount: 251, paidCount: 245 },
]

// ---- NOTIFICATION LOGS ----
export const notificationLogs: NotificationLog[] = [
  { id: 'n1', studentName: 'Ahmad Fauzi Rahman', eventType: 'spp_paid', recipientPhone: '6281234567001', messageSent: '✅ Konfirmasi Pembayaran SPP - Ahmad Fauzi Rahman - Juni 2025 - Rp 250.000 - Lunas', status: 'delivered', sentAt: '2025-07-10T08:16:00' },
  { id: 'n2', studentName: 'Siti Nurhaliza Putri', eventType: 'savings_deposit', recipientPhone: '6281234567002', messageSent: '💰 Tabungan Bertambah - Siti Nurhaliza Putri - +Rp 75.000 - Saldo: Rp 275.000', status: 'delivered', sentAt: '2025-07-10T08:21:00' },
  { id: 'n3', studentName: 'Bayu Aditya Putra', eventType: 'spp_reminder_h3', recipientPhone: '6281234567009', messageSent: '⏰ Pengingat SPP Juli 2025 - Bayu Aditya Putra - Rp 300.000 - Jatuh tempo 3 hari lagi', status: 'sent', sentAt: '2025-07-07T08:00:00' },
  { id: 'n4', studentName: 'Dimas Arya Wicaksono', eventType: 'spp_overdue_h7', recipientPhone: '6281234567005', messageSent: '❗ Tunggakan SPP Juni 2025 - Dimas Arya Wicaksono - Rp 250.000 - Telah jatuh tempo 7 hari', status: 'delivered', sentAt: '2025-07-17T08:00:00' },
  { id: 'n5', studentName: 'Galang Saputra', eventType: 'bill_created', recipientPhone: '6281234567013', messageSent: '📋 Tagihan Baru: Uang Ujian Semester 1 - Galang Saputra - Rp 150.000 - Jatuh tempo: 15 Nov 2025', status: 'sent', sentAt: '2025-07-05T10:00:00' },
  { id: 'n6', studentName: 'Keyla Puspita Sari', eventType: 'spp_paid', recipientPhone: '6281234567014', messageSent: '✅ Konfirmasi Pembayaran SPP - Keyla Puspita Sari - Juni 2025 - Rp 350.000 - Lunas', status: 'failed', sentAt: '2025-07-04T08:30:00' },
  { id: 'n7', studentName: 'Muhammad Rizki Pratama', eventType: 'savings_withdrawal', recipientPhone: '6281234567003', messageSent: '💸 Penarikan Tabungan - Muhammad Rizki Pratama - Rp 30.000 - Saldo: Rp 50.000', status: 'delivered', sentAt: '2025-07-09T10:05:00' },
  { id: 'n8', studentName: 'Salwa Khairunnisa', eventType: 'bill_paid', recipientPhone: '6281234567016', messageSent: '✅ Konfirmasi Pembayaran - Seragam Baru - Salwa Khairunnisa - Rp 450.000 - Lunas', status: 'delivered', sentAt: '2025-07-03T09:15:00' },
]

// ---- ACTIVITY LOGS ----
export const activityLogs: ActivityLog[] = [
  { id: 'a1', userName: 'Bu Sari', action: 'create', entityType: 'spp_payments', description: 'Input pembayaran SPP Ahmad Fauzi Rahman bulan Juni 2025', createdAt: '2025-07-10T08:15:00' },
  { id: 'a2', userName: 'Bu Sari', action: 'create', entityType: 'savings_transactions', description: 'Input setoran tabungan Siti Nurhaliza Putri Rp 75.000', createdAt: '2025-07-10T08:20:00' },
  { id: 'a3', userName: 'Bu Sari', action: 'create', entityType: 'savings_transactions', description: 'Penarikan tabungan Muhammad Rizki Pratama Rp 30.000', createdAt: '2025-07-09T10:00:00' },
  { id: 'a4', userName: 'Pak Andi', action: 'login', entityType: 'users', description: 'Login ke dashboard', createdAt: '2025-07-09T07:30:00' },
  { id: 'a5', userName: 'Bu Sari', action: 'create', entityType: 'custom_bills', description: 'Membuat tagihan baru: Uang Ujian Semester 1', createdAt: '2025-07-05T10:00:00' },
  { id: 'a6', userName: 'Bu Sari', action: 'update', entityType: 'students', description: 'Update data siswa Rendi Mahardika - perubahan nomor kontak orang tua', createdAt: '2025-07-04T14:30:00' },
  { id: 'a7', userName: 'Bu Sari', action: 'export', entityType: 'spp_payments', description: 'Export laporan SPP bulan Juni 2025 ke PDF', createdAt: '2025-07-03T16:00:00' },
  { id: 'a8', userName: 'Pak Andi', action: 'export', entityType: 'spp_payments', description: 'Export rekap pemasukan semester 1 ke Excel', createdAt: '2025-07-02T11:00:00' },
  { id: 'a9', userName: 'Bu Sari', action: 'delete', entityType: 'students', description: 'Hapus data siswa pindahan: Rani Setiyowati', createdAt: '2025-07-01T09:00:00' },
  { id: 'a10', userName: 'Bu Sari', action: 'login', entityType: 'users', description: 'Login ke dashboard', createdAt: '2025-07-01T07:45:00' },
]

// ---- DASHBOARD STATS ----
export const dashboardStats = {
  totalStudents: 251,
  totalClasses: 9,
  monthlyIncome: 68750000,
  totalArrears: 12500000,
  totalSavings: 4850000,
  arrearsCount: 42,
  notifSent: 156,
  notifFailed: 3,
}

export const monthlyIncomeData = [
  { month: 'Jan', income: 62500000 },
  { month: 'Feb', income: 65000000 },
  { month: 'Mar', income: 63750000 },
  { month: 'Apr', income: 67500000 },
  { month: 'Mei', income: 71250000 },
  { month: 'Jun', income: 68750000 },
  { month: 'Jul', income: 45000000 },
]

export const paymentStatusData = [
  { name: 'Lunas', value: 185, color: '#10b981' },
  { name: 'Sebagian', value: 24, color: '#f59e0b' },
  { name: 'Belum Bayar', value: 42, color: '#ef4444' },
]
