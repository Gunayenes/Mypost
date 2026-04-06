import { useEffect, useState, useRef } from 'react';
import { storeSettingsApi, getLogoUrl, type StoreSettings } from '@/api/storeSettings';
import { useStoreSettings } from '@/store/storeSettingsStore';
import { Store, Upload, Trash2, Save, Palette } from 'lucide-react';

export default function StoreSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const globalStore = useStoreSettings();

  useEffect(() => {
    storeSettingsApi.get().then((res) => {
      if (res.data.success && res.data.data) setSettings(res.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMsg('');
    try {
      const res = await storeSettingsApi.update({
        name: settings.name,
        address: settings.address,
        phone: settings.phone,
        themeColor: settings.themeColor,
      });
      if (res.data.success) {
        setMsg('Bilgiler kaydedildi.');
        globalStore.update({ name: settings.name, address: settings.address, phone: settings.phone, themeColor: settings.themeColor });
      }
    } catch {
      setMsg('Bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Önizleme
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setMsg('');
    try {
      const res = await storeSettingsApi.uploadLogo(file);
      if (res.data.success && res.data.data) {
        setSettings((s) => s ? { ...s, logoPath: res.data.data!.logoPath } : s);
        globalStore.update({ logoPath: res.data.data.logoPath });
        setMsg('Logo yüklendi.');
        setLogoPreview(null);
      }
    } catch {
      setMsg('Logo yüklenemedi.');
      setLogoPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleLogoDelete = async () => {
    setMsg('');
    try {
      const res = await storeSettingsApi.deleteLogo();
      if (res.data.success) {
        setSettings((s) => s ? { ...s, logoPath: undefined } : s);
        globalStore.update({ logoPath: undefined });
        setMsg('Logo silindi.');
      }
    } catch {
      setMsg('Bir hata oluştu.');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!settings) return <p className="text-gray-500">Mağaza bilgileri yüklenemedi.</p>;

  const logoSrc = logoPreview || getLogoUrl(settings.logoPath);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Store size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-gray-900">Mağaza Ayarları</h1>
      </div>

      {msg && (
        <div className={`p-3 rounded-lg text-sm ${msg.includes('hata') || msg.includes('yüklenemedi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {msg}
        </div>
      )}

      {/* Logo */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Mağaza Logosu</h2>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
            {logoSrc ? (
              <img src={logoSrc} alt="Logo" className="w-full h-full object-contain rounded-xl p-1" onError={(e) => { (e.target as HTMLImageElement).src = '/Logom.jpg'; }} />
            ) : (
              <Store size={32} className="text-gray-300" />
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
            >
              <Upload size={16} />
              {uploading ? 'Yükleniyor...' : 'Logo Yükle'}
            </button>
            {settings.logoPath && (
              <button
                onClick={handleLogoDelete}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
              >
                <Trash2 size={16} />
                Logoyu Kaldır
              </button>
            )}
            <p className="text-xs text-gray-400">JPG, PNG veya WebP. Maks 5 MB.</p>
          </div>
        </div>
      </div>

      {/* Mağaza bilgileri */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Mağaza Bilgileri</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mağaza Adı</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
            <input
              type="text"
              value={settings.address || ''}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="text"
              value={settings.phone || ''}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !settings.name.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Tema Rengi */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">Sidebar Rengi</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { color: '#1a1a2e', label: 'Varsayılan' },
            { color: '#1e293b', label: 'Koyu Gri' },
            { color: '#0f172a', label: 'Lacivert' },
            { color: '#14532d', label: 'Koyu Yeşil' },
            { color: '#7c2d12', label: 'Kahverengi' },
            { color: '#4c1d95', label: 'Mor' },
            { color: '#1e3a5f', label: 'Mavi' },
            { color: '#991b1b', label: 'Bordo' },
            { color: '#115e59', label: 'Turkuaz' },
            { color: '#3f3f46', label: 'Nötr' },
          ].map(({ color, label }) => (
            <button
              key={color}
              type="button"
              onClick={() => setSettings({ ...settings, themeColor: color })}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition ${
                (settings.themeColor || '#1a1a2e') === color
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: color }} />
              <span className="text-[10px] font-medium text-gray-500">{label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-4">
          <label htmlFor="customColor" className="text-xs font-medium text-gray-600">Özel Renk:</label>
          <input
            id="customColor"
            type="color"
            value={settings.themeColor || '#1a1a2e'}
            onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
            className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
          />
          <span className="text-xs text-gray-400 font-mono">{settings.themeColor || '#1a1a2e'}</span>
        </div>
      </div>
    </div>
  );
}
