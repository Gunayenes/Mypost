import { useEffect, useState } from 'react';
import { siteAdminApi } from '@/api/siteAdmin';
import type { SystemInfo } from '@/types/siteAdmin';
import { Server, Database, Shield, CheckCircle2, XCircle, KeyRound, Eye, EyeOff } from 'lucide-react';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function EnvStatus({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 py-2">
      {ok ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
      <span className={`text-sm ${ok ? 'text-gray-700' : 'text-red-600 font-medium'}`}>{label}</span>
      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
        {ok ? 'Yapılandırılmış' : 'Eksik'}
      </span>
    </div>
  );
}

export default function SiteAdminSettingsPage() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    siteAdminApi.getSystemInfo().then((res) => {
      if (res.data.success && res.data.data) setInfo(res.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    if (newPw.length < 8) {
      setPwMsg({ type: 'error', text: 'Yeni şifre en az 8 karakter olmalı.' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ type: 'error', text: 'Yeni şifreler eşleşmiyor.' });
      return;
    }

    setPwLoading(true);
    try {
      const res = await siteAdminApi.changePassword({ currentPassword: currentPw, newPassword: newPw });
      if (res.data.success) {
        setPwMsg({ type: 'success', text: 'Şifre başarıyla değiştirildi.' });
        setCurrentPw('');
        setNewPw('');
        setConfirmPw('');
      } else {
        setPwMsg({ type: 'error', text: (res.data as any).message || 'Şifre değiştirilemedi.' });
      }
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Bir hata oluştu.' });
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sistem Bilgisi */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server size={20} className="text-violet-600" />
            <h2 className="text-lg font-semibold text-gray-900">Sistem Bilgisi</h2>
          </div>
          {info && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">API Sürümü</span>
                <span className="font-medium text-gray-900">v{info.apiVersion}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Ortam</span>
                <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                  info.environment === 'Production' ? 'bg-red-50 text-red-700' :
                  info.environment === 'Development' ? 'bg-blue-50 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{info.environment}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Sunucu Zamanı</span>
                <span className="font-medium text-gray-900">{new Date(info.serverTime).toLocaleString('tr-TR')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Toplam Lisans</span>
                <span className="font-medium text-gray-900">{info.totalLicenses}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Aktif Lisans</span>
                <span className="font-medium text-green-700">{info.activeLicenses}</span>
              </div>
            </div>
          )}
        </div>

        {/* Veritabanı */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database size={20} className="text-violet-600" />
            <h2 className="text-lg font-semibold text-gray-900">Veritabanı</h2>
          </div>
          {info && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Ana Veritabanı</span>
                <span className="font-medium text-gray-900">{formatBytes(info.mainDbSize)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Lisans Veritabanı</span>
                <span className="font-medium text-gray-900">{formatBytes(info.licenseDbSize)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Production Güvenlik Durumu */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={20} className="text-violet-600" />
            <h2 className="text-lg font-semibold text-gray-900">Güvenlik Durumu</h2>
          </div>
          {info && (
            <div className="divide-y divide-gray-50">
              <EnvStatus ok={info.jwtSecretConfigured} label="JWT_SECRET (env var)" />
              <EnvStatus ok={info.adminEmailConfigured} label="SITE_ADMIN_EMAIL (env var)" />
              <EnvStatus ok={info.adminPasswordConfigured} label="SITE_ADMIN_PASSWORD (env var)" />
              <EnvStatus ok={info.allowedOriginsConfigured} label="ALLOWED_ORIGINS (env var)" />
            </div>
          )}
          {info && (!info.jwtSecretConfigured || !info.adminEmailConfigured || !info.adminPasswordConfigured) && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                ⚠️ Production ortamında eksik env var'lar güvenlik açığı oluşturabilir. 
                Sunucuda ilgili ortam değişkenlerini tanımlayın.
              </p>
            </div>
          )}
        </div>

        {/* Şifre Değiştir */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={20} className="text-violet-600" />
            <h2 className="text-lg font-semibold text-gray-900">Şifre Değiştir</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mevcut Şifre</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none"
                />
                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Yeni Şifre</label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none"
                />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Yeni Şifre (Tekrar)</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none"
              />
            </div>
            {pwMsg && (
              <div className={`p-2.5 rounded-lg text-xs ${pwMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {pwMsg.text}
              </div>
            )}
            <button
              type="submit"
              disabled={pwLoading}
              className="w-full py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition"
            >
              {pwLoading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
