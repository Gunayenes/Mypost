import { useEffect, useState } from 'react';
import { siteAdminApi } from '@/api/siteAdmin';
import type { SiteAdminDashboard, PasswordResetRequestItem } from '@/types/siteAdmin';
import { Users, CreditCard, Store, AlertTriangle, KeyRound, X, Eye, EyeOff } from 'lucide-react';

export default function SiteAdminDashboardPage() {
  const [data, setData] = useState<SiteAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetRequests, setResetRequests] = useState<PasswordResetRequestItem[]>([]);
  const [resetModal, setResetModal] = useState<PasswordResetRequestItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSaving, setResetSaving] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const loadData = () => {
    siteAdminApi.getDashboard().then((res) => {
      if (res.data.success && res.data.data) setData(res.data.data);
    }).finally(() => setLoading(false));
    siteAdminApi.getPasswordResetRequests().then((res) => {
      if (res.data.success && res.data.data) setResetRequests(res.data.data);
    });
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" /></div>;
  if (!data) return <p className="text-gray-500">Veriler yüklenemedi.</p>;

  const stats = [
    { label: 'Toplam Müşteri', value: data.totalCustomers, sub: `${data.activeCustomers} aktif`, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Aktif Abonelik', value: data.activeSubscriptions, sub: `${data.totalSubscriptions} toplam`, icon: CreditCard, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Süresi Dolacak (7 gün)', value: data.expiringIn7Days, sub: 'dikkat gerekiyor', icon: AlertTriangle, color: 'bg-amber-50 text-amber-600' },
    { label: 'Toplam Mağaza', value: data.totalStores, sub: 'kayıtlı mağaza', icon: Store, color: 'bg-violet-50 text-violet-600' },
    ...(resetRequests.length > 0 ? [{ label: 'Şifre Sıfırlama Talebi', value: resetRequests.length, sub: 'bekleyen talep', icon: KeyRound, color: 'bg-red-50 text-red-600' }] : []),
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Password Reset Requests */}
      {resetRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 p-5">
          <h2 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
            <KeyRound size={20} /> Şifre Sıfırlama Talepleri ({resetRequests.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Ad Soyad</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">E-posta</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">İşletme</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Talep Tarihi</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Kalan Süre</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {resetRequests.map((r) => {
                  const minutesLeft = Math.max(0, Math.round((new Date(r.expiresAt).getTime() - Date.now()) / 60000));
                  return (
                    <tr key={r.customerId} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-medium text-gray-900">{r.fullName}</td>
                      <td className="py-2.5 px-3 text-gray-600">{r.email}</td>
                      <td className="py-2.5 px-3 text-gray-600">{r.businessName}</td>
                      <td className="py-2.5 px-3 text-gray-400">{new Date(r.requestedAt).toLocaleString('tr-TR')}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${minutesLeft > 15 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {minutesLeft} dk
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-2">
                        <button
                          onClick={() => { setResetModal(r); setNewPassword(''); setResetMsg(''); setShowPassword(false); }}
                          className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                        >
                          Şifre Belirle
                        </button>
                        <button
                          onClick={async () => {
                            await siteAdminApi.dismissPasswordResetRequest(r.customerId);
                            loadData();
                          }}
                          className="text-xs px-2 py-1.5 text-gray-400 hover:text-red-500 transition"
                          title="Talebi kaldır"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent customers */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Son Kaydolan Müşteriler</h2>
        {data.recentCustomers.length === 0 ? (
          <p className="text-sm text-gray-400">Henüz müşteri kaydı yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Ad Soyad</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">E-posta</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">İşletme</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Kayıt Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {data.recentCustomers.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium text-gray-900">{c.fullName}</td>
                    <td className="py-2.5 px-3 text-gray-600">{c.email}</td>
                    <td className="py-2.5 px-3 text-gray-600">{c.businessName}</td>
                    <td className="py-2.5 px-3 text-gray-400">{new Date(c.createdAt).toLocaleDateString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Reset Password Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Şifre Belirle</h3>
            <p className="text-sm text-gray-500 mb-4">{resetModal.fullName} — {resetModal.email}</p>
            {resetMsg && (
              <div className={`mb-3 p-2 rounded text-sm ${resetMsg.includes('başarı') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {resetMsg}
              </div>
            )}
            <div className="relative mb-4">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yeni şifre (min 6 karakter)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10 outline-none focus:ring-2 focus:ring-amber-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setResetModal(null)}
                className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={resetSaving || newPassword.length < 6}
                onClick={async () => {
                  setResetSaving(true);
                  setResetMsg('');
                  try {
                    const res = await siteAdminApi.resetCustomerPassword(resetModal.customerId, newPassword);
                    if (res.data.success) {
                      setResetMsg('Şifre başarıyla güncellendi.');
                      setTimeout(() => { setResetModal(null); loadData(); }, 1200);
                    } else {
                      setResetMsg(res.data.message ?? 'Bir hata oluştu.');
                    }
                  } catch {
                    setResetMsg('Bir hata oluştu.');
                  } finally {
                    setResetSaving(false);
                  }
                }}
                className="flex-1 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-50"
              >
                {resetSaving ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
