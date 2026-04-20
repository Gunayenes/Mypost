import { useEffect, useState, useCallback } from 'react';
import { siteAdminApi } from '@/api/siteAdmin';
import type { SiteAdminSubscriptionItem } from '@/types/siteAdmin';
import { ChevronLeft, ChevronRight, CalendarPlus, XCircle } from 'lucide-react';

export default function SiteAdminSubscriptionsPage() {
  const [subs, setSubs] = useState<SiteAdminSubscriptionItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [extendModal, setExtendModal] = useState<{ id: number; name: string } | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const pageSize = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await siteAdminApi.getSubscriptions({ filter: filter || undefined, page, pageSize });
      if (res.success && res.data) {
        setSubs(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleExtend = async () => {
    if (!extendModal) return;
    await siteAdminApi.extendSubscription(extendModal.id, extendDays);
    setExtendModal(null);
    load();
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Bu aboneliği iptal etmek istediğinize emin misiniz?')) return;
    await siteAdminApi.cancelSubscription(id);
    load();
  };

  const filters = [
    { value: '', label: 'Tümü' },
    { value: 'active', label: 'Aktif' },
    { value: 'expiring', label: 'Süresi Dolacak' },
    { value: 'expired', label: 'Süresi Dolmuş' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Abonelikler</h1>
        <span className="text-sm text-gray-500">{totalCount} kayıt</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`px-4 py-2 text-sm rounded-lg border transition ${
              filter === f.value
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-3 border-violet-500 border-t-transparent rounded-full" /></div>
        ) : subs.length === 0 ? (
          <p className="text-center py-12 text-gray-400">Kayıt bulunamadı.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Müşteri</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">İşletme</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Plan</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Başlangıç</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Bitiş</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">Kalan</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">Durum</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{s.customerName}</p>
                      <p className="text-xs text-gray-400">{s.customerEmail}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{s.businessName}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        s.planSlug === 'demo' ? 'bg-gray-100 text-gray-600' :
                        s.planSlug === 'pro' ? 'bg-violet-50 text-violet-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {s.planName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{new Date(s.startsAt).toLocaleDateString('tr-TR')}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{new Date(s.expiresAt).toLocaleDateString('tr-TR')}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs font-bold ${s.daysRemaining <= 3 ? 'text-red-600' : s.daysRemaining <= 7 ? 'text-amber-600' : 'text-gray-700'}`}>
                        {s.daysRemaining} gün
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${s.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {s.isActive ? 'Aktif' : 'İptal'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setExtendModal({ id: s.id, name: s.customerName })}
                          title="Süre Uzat"
                          className="p-1.5 text-gray-400 hover:text-violet-600 transition rounded-lg hover:bg-violet-50"
                        >
                          <CalendarPlus size={16} />
                        </button>
                        {s.isActive && (
                          <button
                            onClick={() => handleCancel(s.id)}
                            title="İptal Et"
                            className="p-1.5 text-gray-400 hover:text-red-600 transition rounded-lg hover:bg-red-50"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Extend Modal */}
      {extendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Abonelik Süre Uzat</h3>
            <p className="text-sm text-gray-500 mb-4">{extendModal.name}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Eklenecek Gün Sayısı</label>
              <input
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(Number(e.target.value))}
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExtend}
                className="flex-1 py-2 bg-violet-600 text-white text-sm rounded-lg font-medium hover:bg-violet-700 transition"
              >
                Uzat
              </button>
              <button
                onClick={() => setExtendModal(null)}
                className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg font-medium hover:bg-gray-50 transition"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
