import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { webAuthApi } from '@/api/webAuth';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function EmailConfirmPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Geçersiz doğrulama bağlantısı.');
      return;
    }

    webAuthApi.confirmEmail(token)
      .then((res) => {
        if (res.data.success) {
          setStatus('success');
          setMessage(res.data.message ?? 'E-posta adresiniz doğrulandı.');
        } else {
          setStatus('error');
          setMessage(res.data.message ?? 'Doğrulama başarısız.');
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message ?? 'Doğrulama bağlantısı geçersiz veya süresi dolmuş.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-sm w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 size={48} className="text-primary animate-spin mx-auto mb-4" />
            <p className="text-gray-600">E-posta doğrulanıyor...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Doğrulama Başarılı</h2>
            <p className="text-sm text-gray-600 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition"
            >
              Giriş Yap
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Doğrulama Başarısız</h2>
            <p className="text-sm text-gray-600 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Giriş Sayfasına Dön
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
