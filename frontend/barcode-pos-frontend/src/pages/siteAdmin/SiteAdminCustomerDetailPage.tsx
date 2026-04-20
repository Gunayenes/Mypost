import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { siteAdminApi } from '@/api/siteAdmin';
import type { SiteAdminCustomerDetail, UpdateSiteAdminCustomerRequest } from '@/types/siteAdmin';
import { ArrowLeft, Mail, Phone, Store, Calendar, ToggleLeft, ToggleRight, CalendarPlus, XCircle, Pencil, KeyRound, Eye, EyeOff } from 'lucide-react';

export default function SiteAdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SiteAdminCustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [extendModal, setExtendModal] = useState<{ id: number; name: string } | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState<UpdateSiteAdminCustomerRequest>({
    firstName: '', lastName: '', businessName: '', email: '', phone: '', isActive: true, emailConfirmed: false,
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [resetModal, setResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await siteAdminApi.getCustomerDetail(Number(id));
      if (res.data.success && res.data.data) setData(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleToggle = async () => {
    if (!id) return;
    await siteAdminApi.toggleCustomerActive(Number(id));
    load();
  };

  const handleExtend = async () => {
    if (!extendModal) return;
    await siteAdminApi.extendSubscription(extendModal.id, extendDays);
    setExtendModal(null);
    load();
  };

  const handleCancel = async (subId: number) => {
    if (!confirm('Bu aboneliği iptal etmek istediğinize emin misiniz?')) return;
    await siteAdminApi.cancelSubscription(subId);
    load();
  };

  const openEditModal = () => {
    if (!data) return;
    setEditForm({
      firstName: data.firstName,
      lastName: data.lastName,
      businessName: data.businessName,
      email: data.email,
      phone: data.phone || '',
      isActive: data.isActive,
      emailConfirmed: data.emailConfirmed,
    });
    setEditError('');
    setEditModal(true);
  };

  const handleEditSave = async () => {
    if (!id) return;
    if (!editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.email.trim() || !editForm.businessName.trim()) {
      setEditError('Ad, soyad, işletme adı ve e-posta zorunludur.');
      return;
    }
    setEditSaving(true);
    setEditError('');
    try {
      const res = await siteAdminApi.updateCustomer(Number(id), editForm);
      if (res.data.success) {
        setEditModal(false);
        load();
      } else {
        setEditError(res.data.message || 'Güncelleme başarısız.');
      }
    } catch {
      setEditError('Bir hata oluştu.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!id) return;
    if (newPassword.length < 6) {
      setResetError('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    setResetSaving(true);
    setResetError('');
    setResetSuccess('');
    try {
      const res = await siteAdminApi.resetCustomerPassword(Number(id), newPassword);
      if (res.data.success) {
        setResetSuccess('Şifre başarıyla sıfırlandı.');
        setNewPassword('');
      } else {
        setResetError(res.data.message || 'Şifre sıfırlama başarısız.');
      }
    } catch {
      setResetError('Bir hata oluştu.');
    } finally {
      setResetSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" /></div>;
  if (!data) return <p className="text-gray-500">Müşteri bulunamadı.</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/site-admin/customers')} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{data.firstName} {data.lastName}</h1>
          <p className="text-sm text-gray-500">{data.businessName}</p>
        </div>
        <button
          onClick={openEditModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-50 text-violet-600 hover:bg-violet-100 transition"
        >
          <Pencil size={18} />
          Düzenle
        </button>
        <button
          onClick={() => { setResetModal(true); setNewPassword(''); setResetError(''); setResetSuccess(''); setShowPassword(false); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition"
        >
          <KeyRound size={18} />
          Şifre Sıfırla
        </button>
        <button
          onClick={handleToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            data.isActive
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
        >
          {data.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          {data.isActive ? 'Pasife Al' : 'Aktifleştir'}
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><Mail size={18} className="text-blue-600" /></div>
          <div>
            <p className="text-xs text-gray-400">E-posta</p>
            <p className="text-sm font-medium text-gray-900">{data.email}</p>
            {data.emailConfirmed && <span className="text-[10px] text-green-600">Doğrulanmış</span>}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><Phone size={18} className="text-emerald-600" /></div>
          <div>
            <p className="text-xs text-gray-400">Telefon</p>
            <p className="text-sm font-medium text-gray-900">{data.phone || '-'}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center"><Store size={18} className="text-violet-600" /></div>
          <div>
            <p className="text-xs text-gray-400">Mağaza ID</p>
            <p className="text-sm font-medium text-gray-900">#{data.storeId}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Calendar size={18} className="text-amber-600" /></div>
          <div>
            <p className="text-xs text-gray-400">Kayıt Tarihi</p>
            <p className="text-sm font-medium text-gray-900">{new Date(data.createdAt).toLocaleDateString('tr-TR')}</p>
          </div>
        </div>
      </div>

      {/* Durum */}
      <div className="flex gap-3">
        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${data.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {data.isActive ? 'Aktif Müşteri' : 'Pasif Müşteri'}
        </span>
      </div>

      {/* Abonelikler */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Abonelikler ({data.subscriptions.length})</h2>
        {data.subscriptions.length === 0 ? (
          <p className="text-sm text-gray-400">Bu müşteriye ait abonelik bulunamadı.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Plan</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Başlangıç</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Bitiş</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">Kalan</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">Durum</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {data.subscriptions.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        !s.isActive ? 'bg-gray-100 text-gray-500' :
                        s.daysRemaining <= 0 ? 'bg-red-50 text-red-600' :
                        s.daysRemaining <= 7 ? 'bg-amber-50 text-amber-600' :
                        'bg-green-50 text-green-700'
                      }`}>
                        {!s.isActive ? 'İptal' : s.daysRemaining <= 0 ? 'Süresi Dolmuş' : 'Aktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {s.isActive && s.daysRemaining > 0 && (
                          <>
                            <button
                              onClick={() => setExtendModal({ id: s.id, name: s.planName })}
                              title="Süre Uzat"
                              className="p-1.5 text-gray-400 hover:text-violet-600 transition"
                            >
                              <CalendarPlus size={16} />
                            </button>
                            <button
                              onClick={() => handleCancel(s.id)}
                              title="İptal Et"
                              className="p-1.5 text-gray-400 hover:text-red-600 transition"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
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

      {/* Extend Modal */}
      {extendModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setExtendModal(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Süre Uzat</h3>
            <p className="text-sm text-gray-500 mb-4">{extendModal.name} planını uzatın</p>
            <div className="flex gap-2 mb-4">
              {[30, 90, 180, 365].map((d) => (
                <button
                  key={d}
                  onClick={() => setExtendDays(d)}
                  className={`flex-1 py-2 text-sm rounded-lg border transition ${
                    extendDays === d ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {d} gün
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setExtendModal(null)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition">İptal</button>
              <button onClick={handleExtend} className="flex-1 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition">Uzat</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Müşteri Bilgilerini Düzenle</h3>
            {editError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{editError}</p>}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ad</label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Soyad</label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">İşletme Adı</label>
              <input
                type="text"
                value={editForm.businessName}
                onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">E-posta</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="flex gap-6 mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                />
                <span className="text-sm text-gray-700">Aktif</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.emailConfirmed}
                  onChange={(e) => setEditForm({ ...editForm, emailConfirmed: e.target.checked })}
                  className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                />
                <span className="text-sm text-gray-700">E-posta Doğrulanmış</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditModal(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition">İptal</button>
              <button onClick={handleEditSave} disabled={editSaving} className="flex-1 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition disabled:opacity-50">
                {editSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setResetModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Şifre Sıfırla</h3>
            <p className="text-sm text-gray-500 mb-4">{data?.firstName} {data?.lastName} için yeni şifre belirleyin</p>
            {resetError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{resetError}</p>}
            {resetSuccess && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 mb-3">{resetSuccess}</p>}
            <div className="relative mb-4">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yeni şifre (min 6 karakter)"
                className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setResetModal(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition">İptal</button>
              <button onClick={handleResetPassword} disabled={resetSaving} className="flex-1 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-50">
                {resetSaving ? 'Sıfırlanıyor...' : 'Şifreyi Sıfırla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
