import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteAdminAuthStore } from '@/store/siteAdminAuthStore';
import { siteAdminApi } from '@/api/siteAdmin';
import { Shield, Eye, EyeOff } from 'lucide-react';

export default function SiteAdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useSiteAdminAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Browser autofill onChange tetiklemediğinde React state boş kalır.
    // Form'dan canlı değerleri oku.
    const fd = new FormData(e.currentTarget);
    const em = ((fd.get('email') as string) || email || '').trim();
    const pw = (fd.get('password') as string) || password || '';

    if (!em || !pw) {
      setError('E-posta ve şifre boş olamaz.');
      return;
    }

    setLoading(true);
    try {
      const { data: res } = await siteAdminApi.login({ email: em, password: pw });
      if (res.success && res.data) {
        login(res.data.token, res.data.email);
        navigate('/site-admin');
      } else {
        setError(res.message ?? 'Giriş başarısız.');
      }
    } catch {
      setError('E-posta veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-slate-700 rounded-xl flex items-center justify-center mb-3 shadow-lg">
            <Shield className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Site Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Cari Soft Yönetim Paneli</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition"
              placeholder="admin@cari-soft.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-slate-700 text-white rounded-lg font-medium hover:from-violet-700 hover:to-slate-800 transition disabled:opacity-50"
          >
            {loading ? 'Giriş yapılıyor...' : 'Yönetici Girişi'}
          </button>
        </form>
      </div>
    </div>
  );
}
