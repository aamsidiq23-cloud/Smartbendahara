import { createFileRoute, Link } from '@tanstack/react-router'
import {
  GraduationCap,
  CreditCard,
  PiggyBank,
  MessageSquare,
  FileText,
  Shield,
  ArrowRight,
  Check,
  Star,
  Users,
  School,
  Zap,
  ChevronRight,
} from 'lucide-react'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">Smart Bendahara</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#fitur" className="text-sm text-slate-600 hover:text-emerald-600 transition-colors">Fitur</a>
            <a href="#harga" className="text-sm text-slate-600 hover:text-emerald-600 transition-colors">Harga</a>
            <a href="#testimoni" className="text-sm text-slate-600 hover:text-emerald-600 transition-colors">Testimoni</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary btn-sm">Masuk</Link>
            <Link to="/register" className="btn-primary btn-sm">Daftar Gratis</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-[0.03]"></div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-200 rounded-full blur-3xl opacity-20"></div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-6 animate-fade-in">
              <Zap className="w-4 h-4" />
              Solusi #1 Manajemen Keuangan Sekolah
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6 animate-slide-up">
              Kelola Keuangan Sekolah
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">
                Tanpa Ribet
              </span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
              SPP, tabungan siswa, tagihan insidental, laporan otomatis, dan
              <strong className="text-slate-800"> notifikasi WhatsApp pengingat tunggakan</strong> — semua dalam satu platform. Tidak perlu lagi <em>sungkan nagih</em>.
            </p>
            <div className="flex items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/register" className="btn-primary text-base px-8 py-3">
                Coba Gratis 14 Hari
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="btn-secondary text-base px-8 py-3">
                Masuk Dashboard
              </Link>
            </div>
            <p className="text-sm text-slate-400 mt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              Tanpa kartu kredit · Setup 10 menit · 250+ sekolah sudah bergabung
            </p>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {[
              { label: 'Sekolah Aktif', value: '250+', icon: School },
              { label: 'Transaksi/Bulan', value: '50.000+', icon: CreditCard },
              { label: 'WA Terkirim', value: '120.000+', icon: MessageSquare },
              { label: 'Kepuasan Pengguna', value: '98%', icon: Star },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-5 rounded-xl bg-white/80 border border-slate-100 stat-card">
                <stat.icon className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">14 Fitur Inti yang Dibutuhkan Bendahara</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Dari pencatatan SPP hingga pengingat tunggakan otomatis. Semua kebutuhan keuangan sekolah dalam satu platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: CreditCard, title: 'Manajemen SPP', desc: 'Tabel bulanan per kelas, input pembayaran cepat, dukungan cicilan, tanda terima digital.' , color: 'bg-emerald-100 text-emerald-600' },
              { icon: PiggyBank, title: 'Tabungan Siswa Digital', desc: 'Gantikan buku tabungan fisik. Saldo real-time, riwayat mutasi lengkap.', color: 'bg-blue-100 text-blue-600' },
              { icon: MessageSquare, title: 'Notifikasi WhatsApp', desc: 'Pengingat tunggakan otomatis H-3, H-0, H+7. Solusi masalah "sungkan nagih".', color: 'bg-amber-100 text-amber-600' },
              { icon: FileText, title: 'Laporan Otomatis', desc: 'Generate laporan SPP, tabungan, dan pemasukan. Export PDF & Excel siap cetak.', color: 'bg-purple-100 text-purple-600' },
              { icon: Users, title: 'Portal Orang Tua', desc: 'Orang tua bisa cek SPP, saldo tabungan, dan tagihan anak secara mandiri.', color: 'bg-pink-100 text-pink-600' },
              { icon: Shield, title: 'Multi-Tenant Aman', desc: 'Data setiap sekolah terisolasi 100%. Row-Level Security di level database.', color: 'bg-slate-200 text-slate-600' },
            ].map((feat) => (
              <div key={feat.title} className="card p-6 stat-card group cursor-pointer">
                <div className={`w-12 h-12 rounded-xl ${feat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feat.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{feat.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WA Feature Highlight */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-4">
                <MessageSquare className="w-4 h-4" />
                Fitur Unggulan
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Tidak Perlu Lagi <span className="text-emerald-600">"Sungkan Nagih"</span>
              </h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Sistem mengirim pengingat tunggakan secara otomatis atas nama sekolah. Bendahara tidak perlu menghubungi orang tua satu per satu. Pesan dikirim via WhatsApp — media yang paling familiar bagi orang tua Indonesia.
              </p>
              <div className="space-y-3">
                {[
                  'Konfirmasi pembayaran otomatis real-time',
                  'Pengingat H-3 sebelum jatuh tempo',
                  'Pengingat H-0 pada hari jatuh tempo',
                  'Pemberitahuan tunggakan H+7 — 100% otomatis',
                  'Template pesan bisa dikustomisasi per sekolah',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <p className="text-sm text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 border border-emerald-100">
                <div className="bg-white rounded-xl shadow-lg p-5 mb-4 animate-slide-up">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">✅</span>
                    <span className="font-semibold text-sm text-slate-800">Konfirmasi Pembayaran SPP</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 font-mono leading-relaxed">
                    Yth. Orang tua/wali Ahmad Fauzi<br />
                    Kelas 1A — SD Nusantara Jaya<br /><br />
                    Bulan: Juli 2025<br />
                    Jumlah: Rp 250.000<br />
                    Status: Lunas ✓<br /><br />
                    🏫 SD Nusantara Jaya
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-5 animate-slide-up" style={{ animationDelay: '0.15s' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">⏰</span>
                    <span className="font-semibold text-sm text-slate-800">Pengingat SPP — H-3</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 font-mono leading-relaxed">
                    Yth. Orang tua/wali Bayu Aditya<br />
                    Kelas 3A<br /><br />
                    SPP Juli 2025: Rp 300.000<br />
                    Jatuh tempo: 10 Juli 2025<br />
                    (3 hari lagi)<br /><br />
                    🏫 SD Nusantara Jaya
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="harga" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Pilih Paket yang Sesuai</h2>
            <p className="text-slate-600">Mulai gratis 14 hari. Tanpa kartu kredit. Upgrade kapan saja.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '149.000',
                desc: 'Untuk sekolah kecil',
                capacity: '≤ 200 siswa',
                features: ['SPP & tabungan', 'Laporan PDF & Excel', 'Notif WA 500 pesan/bln', 'Backup cloud', 'Email support'],
                highlighted: false,
              },
              {
                name: 'Professional',
                price: '299.000',
                desc: 'Untuk sekolah menengah',
                capacity: '≤ 500 siswa',
                features: ['Semua fitur Starter', 'Portal orang tua', 'Tagihan kustom', 'Audit log', 'Notif WA unlimited', 'Priority support'],
                highlighted: true,
              },
              {
                name: 'Enterprise',
                price: '499.000',
                desc: 'Untuk sekolah besar',
                capacity: 'Unlimited siswa',
                features: ['Semua fitur Professional', 'Custom branding', 'Rekonsiliasi kas', 'SLA 99.9%', 'Dedicated support', 'API access'],
                highlighted: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-emerald-600 to-emerald-700 text-white shadow-2xl shadow-emerald-600/20 scale-105 relative'
                    : 'bg-white border border-slate-200 stat-card'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full">
                    POPULER
                  </div>
                )}
                <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? '' : 'text-slate-900'}`}>{plan.name}</h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? 'text-emerald-100' : 'text-slate-500'}`}>{plan.desc}</p>
                <div className="mb-1">
                  <span className={`text-4xl font-extrabold ${plan.highlighted ? '' : 'text-slate-900'}`}>Rp {plan.price}</span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlighted ? 'text-emerald-200' : 'text-slate-400'}`}>/bulan · {plan.capacity}</p>
                <div className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? 'text-emerald-200' : 'text-emerald-500'}`} />
                      <span className={`text-sm ${plan.highlighted ? 'text-emerald-50' : 'text-slate-600'}`}>{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  className={`w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer ${
                    plan.highlighted
                      ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                      : 'btn-primary justify-center'
                  }`}
                >
                  Mulai Sekarang
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500 mt-6">
            💡 Diskon 2 bulan untuk pembayaran tahunan (bayar 10 bulan, dapat 12 bulan)
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimoni" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Dipercaya Sekolah di Seluruh Indonesia</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote: 'Dulu nagih SPP satu-satu ke orang tua, sekarang sistem yang kirim WA otomatis. Orang tua juga senang dapat konfirmasi langsung.',
                name: 'Bu Sari Rahayu',
                role: 'Bendahara · SD Nusantara Jaya',
              },
              {
                quote: 'Saya bisa lihat rekap keuangan kapan saja tanpa minta ke bendahara. Dashboard-nya sangat jelas dan mudah dipahami.',
                name: 'Pak Andi Wijaya',
                role: 'Kepala Sekolah · SMP Maju Bersama',
              },
              {
                quote: 'Anak saya punya tabungan di sekolah, sekarang saya bisa cek saldonya dari HP. Transparansi yang luar biasa!',
                name: 'Ibu Dewi Lestari',
                role: 'Orang Tua Siswa · SMA Harapan Bangsa',
              },
            ].map((t) => (
              <div key={t.name} className="card p-6 stat-card">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-sm text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-hero relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-400 rounded-full blur-3xl opacity-10"></div>
        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Siap Mendigitalkan Keuangan Sekolah Anda?</h2>
          <p className="text-emerald-100 mb-8 text-lg">Mulai trial gratis 14 hari sekarang. Tanpa kartu kredit.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-8 py-4 rounded-xl text-lg hover:bg-emerald-50 transition-all duration-200 hover:shadow-xl hover:shadow-black/10">
            Daftar Sekarang — Gratis
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">Smart Bendahara</span>
            </div>
            <p className="text-sm">© 2025 Smart Bendahara. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
