import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { isElectron } from '@/utils/platform';

export default function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const handler = () => setExpired(true);
    window.addEventListener('subscription-expired', handler);
    return () => window.removeEventListener('subscription-expired', handler);
  }, []);

  if (!expired) return <>{children}</>;

  const basePath = isElectron() ? '/' : '/app';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-amber-200 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} className="text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Aboneliğiniz Sona Erdi</h2>
        <p className="text-gray-600 text-sm mb-6">
          Abonelik süreniz dolmuştur. Sistemi kullanmaya devam edebilmek için lütfen aboneliğinizi yenileyiniz.
        </p>
        <div className="space-y-3">
          <a
            href="https://wa.me/905555555555?text=Merhaba,%20aboneliğimi%20yenilemek%20istiyorum."
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition"
          >
            WhatsApp ile İletişime Geç
          </a>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = basePath;
            }}
            className="block w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}
