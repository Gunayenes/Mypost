import { useEffect, useState, useCallback } from 'react';
import { siteAdminApi } from '@/api/siteAdmin';
import type { SiteAdminCustomerListItem } from '@/types/siteAdmin';
import { Search, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';

export default function SiteAdminCustomersPage() {
  const [customers, setCustomers] = useState<SiteAdminCustomerListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const pageSize = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await siteAdminApi.getCustomers({ search: search || undefined, page, pageSize });
      if (res.success && res.data) {
        setCustomers(res.data.items);
        setTotalCount(res.data.totalCount);
      }
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleToggle = async (id: number) => {
    await siteAdminApi.toggleCustomerActive(id);
    load();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Müşteriler</h1>
        <span className="text-sm text-gray-500">{totalCount} kayıt</span>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none"
            placeholder="E-posta, ad veya işletme ara..."
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition">
          Ara
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-3 border-violet-500 border-t-transparent rounded-full" /></div>
        ) : customers.length === 0 ? (
          <p className="text-center py-12 text-gray-400">Kayıt bulunamadı.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Müşteri</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">E-posta</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">İşletme</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Plan</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Bitiş</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">Durum</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{c.firstName} {c.lastName}</p>
                      <p className="text-xs text-gray-400">{c.phone || '-'}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{c.email}</td>
                    <td className="py-3 px-4 text-gray-600">{c.businessName}</td>
                    <td className="py-3 px-4">
                      {c.activePlan ? (
                        <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                          {c.activePlan}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Yok</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {c.subscriptionExpiry ? new Date(c.subscriptionExpiry).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${c.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {c.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggle(c.id)}
                        title={c.isActive ? 'Pasife Al' : 'Aktifleştir'}
                        className="text-gray-400 hover:text-violet-600 transition"
                      >
                        {c.isActive ? <ToggleRight size={22} className="text-green-500" /> : <ToggleLeft size={22} />}
                      </button>
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
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
