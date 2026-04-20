export const fmt = (n: number) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleString('tr-TR') : '—';

export const fmtDateShort = (d?: string) =>
  d ? new Date(d).toLocaleDateString('tr-TR') : '—';

export function toast(type: 'success' | 'error', message: string) {
  window.dispatchEvent(new CustomEvent('toast', { detail: { type, message } }));
}

/* ── Durum ── */

export const statusOptions = [
  { value: '', label: 'Tüm Durumlar' },
  { value: 'KayitAcildi', label: 'Kayıt Açıldı' },
  { value: 'Incelemede', label: 'İncelemede' },
  { value: 'OnayBekliyor', label: 'Onay Bekliyor' },
  { value: 'ParcaBekliyor', label: 'Parça Bekliyor' },
  { value: 'Islemde', label: 'İşlemde' },
  { value: 'Tamamlandi', label: 'Tamamlandı' },
  { value: 'TeslimEdildi', label: 'Teslim Edildi' },
  { value: 'IptalEdildi', label: 'İptal Edildi' },
];

export const priorityOptions = [
  { value: 'Dusuk', label: 'Düşük' },
  { value: 'Orta', label: 'Orta' },
  { value: 'Yuksek', label: 'Yüksek' },
];

export type StatusKey =
  | 'KayitAcildi' | 'Incelemede' | 'OnayBekliyor' | 'ParcaBekliyor'
  | 'Islemde' | 'Tamamlandi' | 'TeslimEdildi' | 'IptalEdildi';

export const statusConfig: Record<string, { bg: string; text: string; iconName: string }> = {
  KayitAcildi:   { bg: 'bg-pink-500',       text: 'text-white',        iconName: 'FileText' },
  Incelemede:    { bg: 'bg-sky-500',        text: 'text-white',        iconName: 'Search' },
  OnayBekliyor:  { bg: 'bg-amber-400',      text: 'text-white',        iconName: 'Clock' },
  ParcaBekliyor: { bg: 'bg-orange-500',     text: 'text-white',        iconName: 'Package' },
  Islemde:       { bg: 'bg-green-500',      text: 'text-white',        iconName: 'Wrench' },
  Tamamlandi:    { bg: 'bg-emerald-600',    text: 'text-white',        iconName: 'CheckCircle' },
  TeslimEdildi:  { bg: 'bg-teal-500',       text: 'text-white',        iconName: 'PackageCheck' },
  IptalEdildi:   { bg: 'bg-red-500',        text: 'text-white',        iconName: 'XCircle' },
};

export const priorityConfig: Record<string, { text: string; dot: string; bg: string }> = {
  Dusuk:  { text: 'text-white',  dot: 'bg-slate-300',  bg: 'bg-slate-400' },
  Orta:   { text: 'text-white',  dot: 'bg-amber-400',  bg: 'bg-amber-400' },
  Yuksek: { text: 'text-white',  dot: 'bg-rose-500',   bg: 'bg-red-500' },
};
