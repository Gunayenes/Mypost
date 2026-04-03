import { useState } from 'react';
import { Link } from 'react-router-dom';
import { webAuthApi } from '@/api/webAuth';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data: res } = await webAuthApi.forgotPassword(email.trim());
      if (res.success) {
        setSent(true);
      } else {
        setError(res.message || 'Bir hata oluştu.');
      }
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <img src="/Logom.jpg" alt="KasaPlus" className="w-16 h-16 rounded-xl object-cover mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Şifremi Unuttum</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <Mail className="text-green-600" size={28} />
            </div>
            <p className="text-sm text-gray-600">
              Eğer bu e-posta adresi kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.
              Lütfen e-posta kutunuzu kontrol edin.
            </p>
            <Link
              to="/sifre-sifirla"
              className="block text-sm text-primary-600 font-medium hover:underline"
            >
              Sıfırlama kodunuz var mı? Şifre sıfırlama sayfasına gidin
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={14} />
              Giriş sayfasına dön
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition"
                  placeholder="ornek@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition disabled:opacity-50"
              >
                {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              <Link to="/login" className="inline-flex items-center gap-1 text-primary-600 font-medium hover:underline">
                <ArrowLeft size={14} />
                Giriş sayfasına dön
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
