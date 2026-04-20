import { useEffect, useState } from 'react';
import { Shield, Copy, CheckCircle, AlertTriangle, MessageCircle } from 'lucide-react';
import api from '@/api/client';

const SUPPORT_PHONE = '905427460197'; // Destek hattı numarası

interface LicenseStatus {
  machineId: string;
  isLicensed: boolean;
  customerName?: string;
  expiresAt?: string;
  error?: string;
}

interface LicenseGateProps {
  children: React.ReactNode;
}

export default function LicenseGate({ children }: LicenseGateProps) {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [licenseKey, setLicenseKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const checkLicense = async () => {
    try {
      const { data } = await api.get('/license/status');
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkLicense(); }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivating(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.post('/license/activate', { licenseKey: licenseKey.trim() });
      if (data.success) {
        const msg = data.username
          ? `${data.message}\n\nKullanıcı adı: ${data.username}`
          : data.message;
        setSuccess(msg);
        setTimeout(() => checkLicense(), 2000);
      } else {
        setError(data.message);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Aktivasyon başarısız.');
    } finally {
      setActivating(false);
    }
  };

  const copyMachineId = () => {
    if (status?.machineId) {
      navigator.clipboard.writeText(status.machineId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const requestLicenseViaWhatsApp = () => {
    const machineId = status?.machineId ?? '';
    const msg = encodeURIComponent(
      `Cari Soft Lisans Talebi\n\nMakine ID: ${machineId}\n\nMerhaba, Cari Soft uygulaması için lisans anahtarı talep ediyorum.`
    );
    window.open(`https://wa.me/${SUPPORT_PHONE}?text=${msg}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
        <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Lisans geçerli → uygulamayı göster
  if (status?.isLicensed) {
    return <>{children}</>;
  }

  // Lisans yok veya geçersiz → aktivasyon ekranı
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <img src="/Logom.jpg" alt="Cari Soft" className="w-16 h-16 rounded-xl object-cover mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Cari Soft</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <Shield size={14} className="text-amber-500" />
            <p className="text-sm text-gray-500">Lisans Aktivasyonu</p>
          </div>
        </div>

        {/* Makine ID */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-xs text-gray-500 mb-2">Makine Kimliği (Bu kodu geliştiriciye gönderin)</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-gray-200 rounded px-3 py-2 text-sm font-mono text-gray-800 select-all">
              {status?.machineId ?? '—'}
            </code>
            <button
              onClick={copyMachineId}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              title="Kopyala"
            >
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
            </button>
          </div>
          {copied && <p className="text-xs text-green-600 mt-1">Kopyalandı!</p>}
        </div>

        {/* Hata mesajı (varsa) */}
        {status?.error && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            <AlertTriangle size={16} />
            <span>{status.error}</span>
          </div>
        )}

        {/* Lisans giriş formu */}
        <form onSubmit={handleActivate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lisans Anahtarı</label>
            <textarea
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="Geliştiriciden aldığınız lisans anahtarını buraya yapıştırın..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none resize-none font-mono"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={activating || !licenseKey.trim()}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activating ? 'Kontrol ediliyor...' : 'Lisansı Aktive Et'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Lisans almak için geliştiriciye Makine Kimliğinizi gönderin.
        </p>

        {/* WhatsApp ile Lisans Talep Et */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={requestLicenseViaWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition"
          >
            <MessageCircle size={18} />
            WhatsApp ile Lisans Talep Et
          </button>
          <p className="text-center text-[11px] text-gray-400 mt-2">
            Makine ID otomatik olarak mesaja eklenir
          </p>
        </div>
      </div>
    </div>
  );
}
