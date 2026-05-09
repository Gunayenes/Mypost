import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Wifi, WifiOff, Settings, Cloud, Monitor } from 'lucide-react';
import { isElectron } from '@/utils/platform';
import { setConnectionMode, getConnectionMode } from '@/api/client';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConnSettings, setShowConnSettings] = useState(false);
  const [connMode, setConnModeState] = useState<'local' | 'remote'>(() =>
    (getConnectionMode() ?? (isElectron() ? 'local' : 'remote'))
  );
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  // İlk açılışta Electron ortamında mod hiç set edilmemişse 'local' olarak ata
  useEffect(() => {
    if (isElectron() && !getConnectionMode()) {
      setConnectionMode('local');
    }
  }, []);

  const switchMode = (mode: 'local' | 'remote') => {
    setConnectionMode(mode);
    setConnModeState(mode);
    setShowConnSettings(false);
    setError('');
    // Mod değiştiğinde aktif token başka backend için geçersiz — temizle
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch { /* yok say */ }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Browser autofill (Chrome / 1Password / LastPass) bazen onChange tetiklemez,
    // React state boş kalır. Form'dan canlı değerleri oku.
    const fd = new FormData(e.currentTarget);
    const u = ((fd.get('username') as string) || username || '').trim();
    const p = (fd.get('password') as string) || password || '';

    if (!u || !p) {
      setError('Kullanıcı adı ve şifre boş olamaz.');
      return;
    }

    setLoading(true);
    try {
      const { data: res } = await authApi.login({ username: u, password: p });
      if (res.success && res.data) {
        login(res.data);
        navigate(isElectron() ? '/' : '/app');
      } else {
        setError(res.message ?? 'Giriş başarısız.');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message ?? 'Kullanıcı adı veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/KasaResim.jpg)',
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Back button */}
      {!isElectron() && (
        <Link
          to="/"
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/80 hover:text-white transition group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Ana Sayfa</span>
        </Link>
      )}

      {/* Bağlantı modu göstergesi (sadece Electron desktop'ta) */}
      {isElectron() && (
        <button
          type="button"
          onClick={() => setShowConnSettings(true)}
          className="absolute top-6 right-6 z-20 flex items-center gap-2 px-3 py-2 bg-white/15 backdrop-blur border border-white/30 rounded-lg text-white hover:bg-white/25 transition text-sm"
          title="Bağlantı modunu değiştir"
        >
          {connMode === 'remote' ? (
            <>
              <Wifi size={16} className="text-emerald-300" />
              <span className="font-medium">Çevrimiçi (cari-soft.com)</span>
            </>
          ) : (
            <>
              <WifiOff size={16} className="text-amber-300" />
              <span className="font-medium">Çevrimdışı (Bu Bilgisayar)</span>
            </>
          )}
          <Settings size={14} className="opacity-70" />
        </button>
      )}

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/carisoftlogo.png" alt="Cari Soft" className="h-20 w-auto object-contain mb-2" />
          <p className="text-sm text-gray-500 mt-1">Akıllı Satış Noktası</p>
          {isElectron() && (
            <p className="text-[10px] mt-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
              {connMode === 'remote' ? '🟢 Bulut' : '🟠 Yerel cihaz'}
            </p>
          )}
        </div>

        {error && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            error.includes('devre dışı')
              ? 'bg-amber-50 border border-amber-300 text-amber-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kullanıcı Adı / E-posta
            </label>
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
              placeholder="Kullanıcı adı veya e-posta"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Şifre
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition pr-10"
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
            className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition disabled:opacity-50"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <p className="mt-4 text-center">
          <Link to="/sifremi-unuttum" className="text-sm text-primary-600 font-medium hover:underline">
            Şifremi Unuttum
          </Link>
        </p>

        {/* Web ortamında veya Electron + remote modda kayıt linki göster */}
        {(!isElectron() || connMode === 'remote') && (
          <p className="mt-6 text-center text-sm text-gray-500">
            Hesabınız yok mu?{' '}
            <Link to="/kayit" className="text-primary-600 font-medium hover:underline">
              Ücretsiz Kaydolun
            </Link>
          </p>
        )}
      </div>

      {/* ─── Bağlantı Modu Seçim Modalı (Electron desktop) ─── */}
      {showConnSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowConnSettings(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-2">Bağlantı Modu</h2>
            <p className="text-sm text-gray-500 mb-5">
              Uygulamanın hangi veritabanına bağlanacağını seçin.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => switchMode('remote')}
                className={`w-full text-left p-4 rounded-xl border-2 transition ${
                  connMode === 'remote'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Cloud size={28} className={connMode === 'remote' ? 'text-emerald-600 shrink-0' : 'text-gray-400 shrink-0'} />
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900">🟢 Çevrimiçi — cari-soft.com</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Bulut hesabınızla bağlanır. Verileriniz cari-soft.com sunucusunda
                      tutulur, başka cihazlardan da erişebilirsiniz.
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1.5">İnternet gerektirir.</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => switchMode('local')}
                className={`w-full text-left p-4 rounded-xl border-2 transition ${
                  connMode === 'local'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Monitor size={28} className={connMode === 'local' ? 'text-amber-600 shrink-0' : 'text-gray-400 shrink-0'} />
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900">🟠 Çevrimdışı — Bu Bilgisayar</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Bu cihazda yerel olarak çalışır. Veriler sadece bu bilgisayarda
                      tutulur, internet kesik olsa bile çalışır.
                    </p>
                    <p className="text-[11px] text-amber-700 font-semibold mt-1.5">İnternet gerekmez.</p>
                  </div>
                </div>
              </button>
            </div>

            <p className="text-[11px] text-gray-400 mt-4">
              ⚠ Mod değiştirirseniz oturumunuz kapanır, yeni modla tekrar giriş yapmanız gerekir.
              İki mod farklı veritabanı kullandığı için verileriniz karışmaz.
            </p>

            <button
              type="button"
              onClick={() => setShowConnSettings(false)}
              className="mt-5 w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
