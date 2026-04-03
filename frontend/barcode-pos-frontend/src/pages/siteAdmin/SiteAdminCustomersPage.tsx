import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { siteAdminApi } from '@/api/siteAdmin';
import type { SiteAdminCustomerListItem } from '@/types/siteAdmin';
import { Search, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, Eye, Plus, X } from 'lucide-react';

const emptyForm = {
  firstName: '',
  lastName: '',
  businessName: '',
  email: '',
  phone: '',
  password: '',
};

export default function SiteAdminCustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<SiteAdminCustomerListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const pageSize = 15;

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      const { data: res } = await siteAdminApi.createCustomer({
        ...createForm,
        phone: createForm.phone || undefined,
      });
      if (res.success) {
        setShowCreate(false);
        setCreateForm(emptyForm);
        load();
      } else {
        setCreateError(res.message ?? 'Oluşturma başarısız.');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setCreateError(axiosErr.response?.data?.message ?? 'Bir hata oluştu.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Müşteriler</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{totalCount} kayıt</span>
          <button
            onClick={() => { setShowCreate(true); setCreateError(''); setCreateForm(emptyForm); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition"
          >
            <Plus size={16} />
            Yeni Müşteri
          </button>
        </div>
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
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/site-admin/customers/${c.id}`)}
                          title="Detay"
                          className="p-1 text-gray-400 hover:text-violet-600 transition"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggle(c.id); }}
                          title={c.isActive ? 'Pasife Al' : 'Aktifleştir'}
                          className="p-1 text-gray-400 hover:text-violet-600 transition"
                        >
                          {c.isActive ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                        </button>
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

      {/* Create Customer Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Yeni Müşteri Oluştur</h2>
              <button type="button" onClick={() => setShowCreate(false)} title="Kapat" className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="create-firstName" className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                  <input
                    id="create-firstName"
                    type="text"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none"
                    placeholder="Ad"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="create-lastName" className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                  <input
                    id="create-lastName"
                    type="text"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none"
                    placeholder="Soyad"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="create-businessName" className="block text-sm font-medium text-gray-700 mb-1">İşletme Adı</label>
                <input
                  id="create-businessName"
                  type="text"
                  value={createForm.businessName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, businessName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none"
                  placeholder="Mağaza veya işletme adı"
                  required
                />
              </div>

              <div>
                <label htmlFor="create-email" className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none"
                  placeholder="ornek@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="create-phone" className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  id="create-phone"
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none"
                  placeholder="Opsiyonel"
                />
              </div>

              <div>
                <label htmlFor="create-password" className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                <input
                  id="create-password"
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none"
                  placeholder="En az 8 karakter, büyük harf, küçük harf, rakam"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition disabled:opacity-50"
                >
                  {createLoading ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
