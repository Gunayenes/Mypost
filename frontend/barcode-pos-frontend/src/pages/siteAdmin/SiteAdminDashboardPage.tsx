import { useEffect, useState } from 'react';
import { siteAdminApi } from '@/api/siteAdmin';
import type { SiteAdminDashboard } from '@/types/siteAdmin';
import { Users, CreditCard, Store, AlertTriangle } from 'lucide-react';

export default function SiteAdminDashboardPage() {
  const [data, setData] = useState<SiteAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    siteAdminApi.getDashboard().then((res) => {
      if (res.data.success && res.data.data) setData(res.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" /></div>;
  if (!data) return <p className="text-gray-500">Veriler yüklenemedi.</p>;

  const stats = [
    { label: 'Toplam Müşteri', value: data.totalCustomers, sub: `${data.activeCustomers} aktif`, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Aktif Abonelik', value: data.activeSubscriptions, sub: `${data.totalSubscriptions} toplam`, icon: CreditCard, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Süresi Dolacak (7 gün)', value: data.expiringIn7Days, sub: 'dikkat gerekiyor', icon: AlertTriangle, color: 'bg-amber-50 text-amber-600' },
    { label: 'Toplam Mağaza', value: data.totalStores, sub: 'kayıtlı mağaza', icon: Store, color: 'bg-violet-50 text-violet-600' },
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
    </div>
  );
}
