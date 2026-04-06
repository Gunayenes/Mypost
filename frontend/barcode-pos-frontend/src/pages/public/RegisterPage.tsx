import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { webAuthApi } from '@/api/webAuth';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors([]);

    if (form.password !== form.passwordConfirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    try {
      // 1. Web kaydı oluştur
      const { data: regRes } = await webAuthApi.register({
        firstName: form.firstName,
        lastName: form.lastName,
        businessName: form.businessName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      if (!regRes.success) {
        setError(regRes.message ?? 'Kayıt başarısız.');
        setErrors(regRes.errors ?? []);
        return;
      }

      // 2. Otomatik POS girişi (kayıt e-postası = username)
      const { data: loginRes } = await authApi.login({
        username: form.email,
        password: form.password,
      });

      if (loginRes.success && loginRes.data) {
        login(loginRes.data);
        navigate('/hos-geldiniz');
      } else {
        // Kayıt başarılı ama POS login başarısız — login sayfasına yönlendir
        navigate('/login');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: string[] } } };
      if (axiosErr.response?.data) {
        setError(axiosErr.response.data.message ?? 'Kayıt sırasında bir hata oluştu.');
        setErrors(axiosErr.response.data.errors ?? []);
      } else {
        setError('Kayıt sırasında bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-primary-950 to-violet-950 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-violet-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-primary-600/25">
            <img src="/Logom.jpg" alt="KasaPlus" className="w-full h-full rounded-xl object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Ücretsiz Deneyin</h1>
          <p className="text-sm text-gray-500 mt-1">14 gün ücretsiz, kredi kartı gerektirmez</p>
        </div>

        {/* Hatalar */}
        {(error || errors.length > 0) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error && <p>{error}</p>}
            {errors.map((e, i) => (
              <p key={i}>{e}</p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Ad Soyad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                placeholder="Adınız"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                placeholder="Soyadınız"
                required
              />
            </div>
          </div>

          {/* İşletme Adı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">İşletme Adı</label>
            <input
              type="text"
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
              placeholder="Mağaza veya işletme adı"
              required
            />
          </div>

          {/* E-posta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
              placeholder="ornek@email.com"
              required
            />
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
              placeholder="05XX XXX XX XX"
              required
            />
          </div>

          {/* Şifre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition pr-10"
                placeholder="En az 6 karakter"
                minLength={6}
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

          {/* Şifre Tekrar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre Tekrar</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="passwordConfirm"
              value={form.passwordConfirm}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
              placeholder="Şifrenizi tekrar girin"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary-600 to-violet-600 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-violet-700 transition-all shadow-lg shadow-primary-600/25 disabled:opacity-50 mt-2"
          >
            {loading ? 'Kaydediliyor...' : 'Ücretsiz Kaydol'}
          </button>
        </form>

        {/* Alt linkler */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-500">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              Giriş Yap
            </Link>
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={14} />
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
