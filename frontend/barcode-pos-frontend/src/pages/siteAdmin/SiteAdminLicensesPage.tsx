import { useEffect, useState, useCallback } from 'react';
import { siteAdminApi } from '@/api/siteAdmin';
import type { LicenseListItem, LicenseStats } from '@/types/siteAdmin';
import { Plus, RotateCcw, ToggleLeft, ToggleRight, Trash2, Key, Copy, MessageCircle } from 'lucide-react';

export default function SiteAdminLicensesPage() {
  const [licenses, setLicenses] = useState<LicenseListItem[]>([]);
  const [stats, setStats] = useState<LicenseStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [keyModal, setKeyModal] = useState<{ key: string; phone: string } | null>(null);
  const [renewModal, setRenewModal] = useState<{ id: number; name: string } | null>(null);
  const [renewDays, setRenewDays] = useState(365);
  const [renewPassword, setRenewPassword] = useState('');
  const [copied, setCopied] = useState(false);

  // Create form
  const [form, setForm] = useState({
    customerName: '', machineId: '', phone: '', note: '',
    username: '', password: '', durationDays: 365,
  });
  const [createError, setCreateError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        siteAdminApi.getLicenseStats(),
        siteAdminApi.getLicenses(),
      ]);
      if (statsRes.data.success && statsRes.data.data) setStats(statsRes.data.data);
      if (listRes.data.success && listRes.data.data) setLicenses(listRes.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      const { data: res } = await siteAdminApi.createLicense({
        customerName: form.customerName,
        machineId: form.machineId,
        phone: form.phone || undefined,
        note: form.note || undefined,
        username: form.username,
        password: form.password,
        durationDays: form.durationDays,
      });
      if (res.success && res.data) {
        setCreateModal(false);
        setKeyModal({ key: res.data.licenseKey, phone: form.phone });
        setForm({ customerName: '', machineId: '', phone: '', note: '', username: '', password: '', durationDays: 365 });
        load();
      } else {
        setCreateError(res.message ?? 'Hata oluştu.');
      }
    } catch {
      setCreateError('Lisans oluşturulamadı.');
    }
  };

  const handleRenew = async () => {
    if (!renewModal) return;
    try {
      const { data: res } = await siteAdminApi.renewLicense(renewModal.id, {
        durationDays: renewDays,
        password: renewPassword || undefined,
      });
      if (res.success && res.data) {
        setRenewModal(null);
        setKeyModal({ key: res.data.licenseKey, phone: '' });
        load();
      }
    } catch { /* ignore */ }
  };

  const handleToggle = async (id: number) => {
    await siteAdminApi.toggleLicense(id);
    load();
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" lisansı silinecek. Emin misiniz?`)) return;
    await siteAdminApi.deleteLicense(id);
    load();
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendWhatsApp = (key: string, phone: string) => {
    let p = phone.replace(/[^0-9+]/g, '');
    if (p.startsWith('0')) p = '90' + p.substring(1);
    if (!p.startsWith('+')) p = '+' + p;
    const msg = encodeURIComponent(`KasaPlus Lisans Anahtarınız:\n\n${key}\n\nUygulamada Ayarlar > Lisans Aktivasyonu bölümüne yapıştırın.`);
    window.open(`https://wa.me/${p.replace('+', '')}?text=${msg}`, '_blank');
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      'Aktif': 'bg-green-50 text-green-700',
      'Yakında Dolacak': 'bg-amber-50 text-amber-700',
      'Süresi Dolmuş': 'bg-red-50 text-red-600',
      'Pasif': 'bg-gray-100 text-gray-600',
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-gray-100'}`}>{status}</span>;
  };

  const statCards = stats ? [
    { label: 'Toplam', value: stats.total, icon: '👥', color: 'text-blue-600' },
    { label: 'Aktif', value: stats.active, icon: '✅', color: 'text-green-600' },
    { label: 'Yakında Dolacak', value: stats.expiringSoon, icon: '⚠️', color: 'text-amber-600' },
    { label: 'Süresi Dolmuş', value: stats.expired, icon: '❌', color: 'text-red-600' },
    { label: 'Pasif', value: stats.inactive, icon: '⏸️', color: 'text-gray-600' },
  ] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Lisans Yönetimi</h1>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm rounded-lg font-medium hover:bg-violet-700 transition"
        >
          <Plus size={16} /> Yeni Lisans
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">{s.label}</span>
                <span>{s.icon}</span>
              </div>
              <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-3 border-violet-500 border-t-transparent rounded-full" /></div>
        ) : licenses.length === 0 ? (
          <p className="text-center py-12 text-gray-400">Henüz lisans yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Müşteri</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Kullanıcı</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Şifre</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Telefon</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Makine ID</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">Süre</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">Kalan</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">Durum</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Not</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((l) => (
                  <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{l.customerName}</td>
                    <td className="py-3 px-4 font-mono text-xs text-blue-600 font-semibold">{l.username || '—'}</td>
                    <td className="py-3 px-4 font-mono text-xs text-violet-600">{l.password || '—'}</td>
                    <td className="py-3 px-4 text-gray-500">{l.phone || '—'}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-400">{l.machineId.substring(0, 12)}...</td>
                    <td className="py-3 px-4 text-center text-gray-500">{l.durationDays}g</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-semibold ${l.daysLeft <= 30 ? 'text-red-600' : 'text-green-600'}`}>
                        {l.daysLeft}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{statusBadge(l.status)}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs max-w-[120px] truncate">{l.note || '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setKeyModal({ key: l.licenseKey, phone: l.phone })} title="Anahtar" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <Key size={15} />
                        </button>
                        {l.phone && (
                          <button onClick={() => sendWhatsApp(l.licenseKey, l.phone)} title="WhatsApp" className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition">
                            <MessageCircle size={15} />
                          </button>
                        )}
                        <button onClick={() => { setRenewModal({ id: l.id, name: l.customerName }); setRenewDays(365); setRenewPassword(''); }} title="Yenile" className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition">
                          <RotateCcw size={15} />
                        </button>
                        <button onClick={() => handleToggle(l.id)} title={l.isActive ? 'Pasife Al' : 'Aktifleştir'} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition">
                          {l.isActive ? <ToggleRight size={17} className="text-green-500" /> : <ToggleLeft size={17} />}
                        </button>
                        <button onClick={() => handleDelete(l.id, l.customerName)} title="Sil" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={15} />
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

      {/* ── Create License Modal ── */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Yeni Lisans Üret</h3>
              <button onClick={() => setCreateModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Müşteri Adı *</label>
                <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-violet-500 outline-none" placeholder="Ali Bakkal" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Makine ID *</label>
                <input value={form.machineId} onChange={(e) => setForm({ ...form, machineId: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-violet-500 outline-none" placeholder="A1B2C3D4..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-violet-500 outline-none" placeholder="05XX XXX XXXX" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Süre (gün)</label>
                  <select value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-violet-500 outline-none">
                    <option value={30}>30 gün (Deneme)</option>
                    <option value={90}>90 gün (3 ay)</option>
                    <option value={180}>180 gün (6 ay)</option>
                    <option value={365}>365 gün (1 yıl)</option>
                    <option value={730}>730 gün (2 yıl)</option>
                    <option value={3650}>3650 gün (10 yıl)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kullanıcı Adı *</label>
                  <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-violet-500 outline-none" placeholder="alibakkal" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Şifre *</label>
                  <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-violet-500 outline-none" placeholder="Pos123!" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Not</label>
                <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-violet-500 outline-none" placeholder="Opsiyonel not..." />
              </div>
              {createError && <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">{createError}</div>}
              <button type="submit" className="w-full py-2.5 bg-violet-600 text-white rounded-lg font-medium text-sm hover:bg-violet-700 transition">
                Lisans Üret
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Key Modal ── */}
      {keyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-green-700">🔑 Lisans Anahtarı</h3>
              <button onClick={() => setKeyModal(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <textarea readOnly rows={4} value={keyModal.key} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono bg-gray-50 resize-none" />
            <div className="flex gap-2 mt-3">
              <button onClick={() => copyKey(keyModal.key)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                <Copy size={14} /> {copied ? 'Kopyalandı!' : 'Kopyala'}
              </button>
              {keyModal.phone && (
                <button onClick={() => sendWhatsApp(keyModal.key, keyModal.phone)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
                  <MessageCircle size={14} /> WhatsApp
                </button>
              )}
              <button onClick={() => setKeyModal(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Renew Modal ── */}
      {renewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Lisans Yenile</h3>
            <p className="text-sm text-gray-500 mb-4">{renewModal.name}</p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Yeni Süre (gün)</label>
                <select value={renewDays} onChange={(e) => setRenewDays(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-violet-500 outline-none">
                  <option value={30}>30 gün</option>
                  <option value={90}>90 gün</option>
                  <option value={180}>180 gün</option>
                  <option value={365}>365 gün</option>
                  <option value={730}>730 gün</option>
                  <option value={3650}>3650 gün</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Yeni Şifre (boş = Pos123!)</label>
                <input value={renewPassword} onChange={(e) => setRenewPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-violet-500 outline-none" placeholder="Opsiyonel" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleRenew} className="flex-1 py-2 bg-violet-600 text-white text-sm rounded-lg font-medium hover:bg-violet-700 transition">Yenile</button>
              <button onClick={() => setRenewModal(null)} className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg font-medium hover:bg-gray-50 transition">İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
