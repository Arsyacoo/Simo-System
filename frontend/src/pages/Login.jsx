import { useState } from 'react';
import { useAppData } from '../context/AppDataCore';
import { LogIn, Mail, Lock, ShieldAlert } from 'lucide-react';

export default function Login() {
  const { login } = useAppData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err?.message || 'Login gagal. Silakan periksa kembali email dan password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-6 font-sans">
      <div className="w-full max-w-5xl grid md:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Brand & Value Prop */}
        <div className="md:col-span-5 text-white space-y-6 hidden md:block">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-2xl font-black shadow-lg shadow-blue-500/30">
            S
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-none">
            SIMO <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Mugi Jaya</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Operational Management Information System untuk efisiensi Produksi, Logistik, dan Digital Quality Control.
          </p>
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium text-slate-300">Pantau produksi dan logistik dalam satu alur kerja</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
              <span className="text-sm font-medium text-slate-300">Kontrol akses tim sesuai tanggung jawab operasional</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <span className="text-sm font-medium text-slate-300">Riwayat perubahan tersimpan untuk kebutuhan audit</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="md:col-span-7 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/40">
          <div className="md:hidden text-center mb-6">
            <h1 className="text-3xl font-black text-white">SIMO Mugi Jaya</h1>
            <p className="text-slate-400 text-sm mt-1">Operational Management Information System</p>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Masuk ke SIMO</h2>
          <p className="text-slate-400 text-sm mb-6">Gunakan akun yang telah terdaftar untuk melanjutkan.</p>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              <ShieldAlert className="flex-shrink-0 mt-0.5" size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="email">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="nama@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:shadow-blue-600/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Masuk Aplikasi</span>
                </>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
