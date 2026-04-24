import { Check, X } from 'lucide-react';

const rows = [
  { feature: 'Kurulum süresi', cariSoft: '30 saniye', others: 'Günler' },
  { feature: 'Donanım gereksinimi', cariSoft: 'Sadece internet', others: 'Özel bilgisayar + yazarkasa' },
  { feature: 'Aylık maliyet', cariSoft: 'Başlangıç: Ücretsiz', others: '500₺ - 2000₺' },
  { feature: 'Mobil erişim', cariSoft: true, others: false },
  { feature: 'Gerçek zamanlı raporlar', cariSoft: true, others: false },
  { feature: 'Otomatik güncelleme', cariSoft: true, others: false },
  { feature: 'Bulut yedekleme', cariSoft: true, others: 'Ek ücret' },
  { feature: 'Çoklu cihaz desteği', cariSoft: true, others: false },
  { feature: '7/24 Türkçe destek', cariSoft: true, others: 'Mesai saatleri' },
];

function renderCell(value: boolean | string) {
  if (typeof value === 'boolean') {
    return value
      ? <Check size={22} className="text-green-500 mx-auto" strokeWidth={3} />
      : <X size={22} className="text-red-400 mx-auto" strokeWidth={3} />;
  }
  return <span className="text-sm font-medium text-slate-700">{value}</span>;
}

export default function WhyCariSoft() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-semibold mb-4">
            NEDEN CARİ SOFT?
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">
            Geleneksel POS'larla <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-violet-600">kıyasla</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Eski yazarkasa ve karmaşık POS yazılımlarına kıyasla Cari Soft'un avantajları
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
            <div className="p-4 text-sm font-bold text-slate-600 uppercase tracking-wide">
              Özellik
            </div>
            <div className="p-4 text-center bg-gradient-to-br from-primary-600 to-violet-600 text-white">
              <div className="text-xs opacity-90 uppercase tracking-wide">Bizim</div>
              <div className="text-lg font-black">Cari Soft</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wide">Diğerleri</div>
              <div className="text-lg font-bold text-slate-500">Geleneksel POS</div>
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 items-center border-b border-slate-100 last:border-b-0 ${
                i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
              }`}
            >
              <div className="p-4 text-sm font-semibold text-slate-700">
                {row.feature}
              </div>
              <div className="p-4 text-center bg-primary-50/30">
                {renderCell(row.cariSoft)}
              </div>
              <div className="p-4 text-center">
                {renderCell(row.others)}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <p className="text-slate-500 text-sm mb-4">
            İkna oldun mu? 14 gün ücretsiz dene, kredi kartı gerektirmez.
          </p>
        </div>
      </div>
    </section>
  );
}
