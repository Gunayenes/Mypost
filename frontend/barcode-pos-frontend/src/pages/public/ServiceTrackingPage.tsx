import { useState } from 'react';
import { servicesApi } from '@/api/services';
import type { ServiceTracking } from '@/types';
import {
  Search,
  Wrench,
  Clock,
  Package,
  DollarSign,
  Phone,
  Hash,
} from 'lucide-react';

interface Props {
  embedded?: boolean;
}

export default function ServiceTrackingPage({ embedded }: Props) {
  const [mode, setMode] = useState<'number' | 'phone'>('number');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ServiceTracking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    setSearched(true);

    try {
      if (mode === 'number') {
        const { data: res } = await servicesApi.trackByNumber(query.trim());
        if (res.success && res.data) setResults([res.data]);
        else setError(res.message ?? 'Servis kaydı bulunamadı.');
      } else {
        const { data: res } = await servicesApi.trackByPhone(query.trim());
        if (res.success && res.data) setResults(res.data);
        else setError(res.message ?? 'Kayıt bulunamadı.');
      }
    } catch {
      setError('Sorgulama sırasında bir hata oluştu.');
    }
    setLoading(false);
  };

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50'}>
      <div className={`max-w-3xl mx-auto px-4 ${embedded ? 'py-6' : 'py-12'}`}>
        {/* Başlık */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <Wrench size={32} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">Servis Takip</h1>
          <p className="text-gray-500 mt-2">Servis numaranız veya telefon numaranız ile durumunuzu sorgulayın</p>
        </div>

        {/* Arama */}
        <div className="bg-white rounded-2xl shadow-lg border p-6 mb-6">
          <div className="flex gap-2 mb-4">
            <button onClick={() => { setMode('number'); setQuery(''); setResults([]); setSearched(false); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition ${mode === 'number' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <Hash size={14} /> Servis Numarası
            </button>
            <button onClick={() => { setMode('phone'); setQuery(''); setResults([]); setSearched(false); }} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition ${mode === 'phone' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <Phone size={14} /> Telefon Numarası
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={mode === 'number' ? 'Servis numarası girin (ör: SRV-01-20250402-0001)' : 'Telefon numarası girin'}
                className="w-full pl-10 pr-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 outline-none text-base font-medium"
              />
            </div>
            <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition disabled:opacity-50">
              {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : 'Sorgula'}
            </button>
          </form>
        </div>

        {/* Hata */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700 text-center">{error}</div>
        )}

        {/* Sonuçlar */}
        {results.map((s, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-lg border overflow-hidden mb-6">
            {/* Durum başlık */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium opacity-80">Servis No</p>
                  <p className="text-xl font-black">{s.serviceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium opacity-80">Durum</p>
                  <p className="text-lg font-black">{s.statusName}</p>
                </div>
              </div>
            </div>

            {/* Cihaz bilgisi */}
            <div className="px-6 py-4 border-b">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5"><Wrench size={12} /> Cihaz</h3>
              <p className="font-bold text-gray-900">{s.deviceName} {s.deviceBrand && `— ${s.deviceBrand}`} {s.deviceModel && s.deviceModel}</p>
              <p className="text-sm text-gray-600 mt-1">{s.faultDescription}</p>
            </div>

            {/* Tarihler */}
            <div className="px-6 py-4 border-b grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-gray-400">Kayıt Tarihi</p>
                <p className="text-sm font-bold">{new Date(s.createdAt).toLocaleDateString('tr-TR')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Tahmini Teslim</p>
                <p className="text-sm font-bold">{s.estimatedCompletionDate ? new Date(s.estimatedCompletionDate).toLocaleDateString('tr-TR') : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Tamamlanma</p>
                <p className="text-sm font-bold">{s.completedDate ? new Date(s.completedDate).toLocaleDateString('tr-TR') : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Teslim</p>
                <p className="text-sm font-bold">{s.deliveredDate ? new Date(s.deliveredDate).toLocaleDateString('tr-TR') : '—'}</p>
              </div>
            </div>

            {/* Ücret */}
            <div className="px-6 py-4 border-b">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5"><DollarSign size={12} /> Ücret Bilgisi</h3>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-gray-400">Toplam</p>
                  <p className="text-lg font-black">₺{s.totalCost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Ödenen</p>
                  <p className="text-lg font-black text-green-600">₺{s.paidAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Kalan</p>
                  <p className="text-lg font-black text-red-600">₺{Math.max(0, s.totalCost - s.paidAmount).toFixed(2)}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${s.paymentStatusName === 'Ödendi' ? 'bg-green-100 text-green-700' : s.paymentStatusName === 'Kısmi Ödendi' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{s.paymentStatusName}</span>
              </div>
            </div>

            {/* Parçalar */}
            {s.parts.length > 0 && (
              <div className="px-6 py-4 border-b">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5"><Package size={12} /> Kullanılan Parçalar</h3>
                <div className="space-y-1">
                  {s.parts.map((p, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{p.partName} <span className="text-gray-400">x{p.quantity}</span></span>
                      <span className="font-bold tabular-nums">₺{p.totalCost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* İşlem geçmişi */}
            {s.logs.length > 0 && (
              <div className="px-6 py-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1.5"><Clock size={12} /> İşlem Geçmişi</h3>
                <div className="space-y-3">
                  {s.logs.map((l, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-sm">{l.description}</p>
                        {l.statusName && <p className="text-xs text-blue-600 font-medium">{l.statusName}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(l.createdAt).toLocaleString('tr-TR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Boş sonuç */}
        {searched && !loading && !error && results.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Search size={48} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Sonuç bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}
