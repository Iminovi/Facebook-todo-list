import { CalendarDays, CheckSquare, BellRing, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  loading: boolean;
  error: string | null;
  onSignIn: () => void;
}

export function AuthScreen({ loading, error, onSignIn }: AuthScreenProps) {
  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-blue-400 tracking-wide">
              PantauFB · Manajemen Multi-Akun
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-50 leading-tight">
              Pastikan setiap akun Facebook sudah login dan upload konten hari ini.
            </h1>
            <p className="text-base text-slate-400 leading-relaxed max-w-xl">
              Dashboard checklist harian yang ringkas dan tersinkronisasi antar perangkat,
              lengkap dengan kalender aktivitas dan notifikasi pengingat otomatis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#111827] border border-slate-800/80 space-y-2">
              <CheckSquare className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-100">Checklist Cepat</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tandai status login dan upload konten dalam satu klik untuk setiap akun.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#111827] border border-slate-800/80 space-y-2">
              <CalendarDays className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-100">Sinkron Kalender</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pantau riwayat konsistensi harian per tanggal langsung dari kalender bulanan.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#111827] border border-slate-800/80 space-y-2">
              <BellRing className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-semibold text-slate-100">Notifikasi Otomatis</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dapatkan pengingat browser otomatis jika masih ada akun yang belum tuntas.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="p-6 sm:p-8 rounded-2xl bg-[#111827] border border-slate-800 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-100">
                Masuk untuk Sinkronisasi Cloud
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Daftar akun Facebook, checklist harian, dan jadwal pengingat Anda tersimpan aman dan selalu sinkron di laptop maupun ponsel.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-200 leading-relaxed"
              >
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={onSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{loading ? 'Menghubungkan ke Google...' : 'Masuk dengan Google'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-xs text-slate-500 leading-relaxed">
              Hanya menyimpan data checklist dan nama akun Anda di akun pribadi Anda. Tidak meminta kata sandi Facebook.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
