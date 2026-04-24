import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Ücretsiz deneme süresi var mı?',
    a: '14 gün boyunca tüm özelliklere ücretsiz erişim sağlıyoruz. Kredi kartı gerekmiyor, istediğin zaman iptal edebilirsin.',
  },
  {
    q: 'Kurulum karmaşık mı?',
    a: 'Hiçbir kurulum gerekmiyor. Tarayıcıdan giriş yap, 30 saniyede hesap aç, kullanmaya başla. Bilgisayar, tablet veya telefonda çalışır.',
  },
  {
    q: 'Verilerim güvende mi?',
    a: 'Tüm veriler SSL ile şifreli sunucularımızda saklanır. Düzenli yedekleme alınır. KVKK uyumludur.',
  },
  {
    q: 'Birden fazla cihazdan aynı anda giriş yapabilir miyim?',
    a: 'Evet. Kasada bilgisayar, depoda tablet, yönetici ofiste telefon — hepsi aynı anda çalışır. Satışlar gerçek zamanlı senkronize olur.',
  },
  {
    q: 'Barkod okuyucu çalışır mı?',
    a: 'Evet, tüm USB barkod okuyucularla uyumlu. Telefonun kamerasıyla da barkod okuyabilirsin.',
  },
  {
    q: 'Fiş ve fatura yazdırabilir miyim?',
    a: '80mm termal yazıcılar ve normal A4 yazıcılarla fiş yazdırabilirsin. Mağaza adın, logosu ve bilgilerin otomatik basılır.',
  },
  {
    q: 'Veresiye satış takibi var mı?',
    a: 'Evet, müşterilerin cari hesaplarını tutar, veresiye satış yapıp tahsilat kaydı tutabilirsin. Müşteriye detaylı hesap ekstresi verebilirsin.',
  },
  {
    q: 'İptal etmek istersem ne olur?',
    a: 'İstediğin zaman iptal edebilirsin. Verilerinin tamamını Excel olarak dışarı aktarabilirsin. Herhangi bir taahhüt yoktur.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold mb-4">
            SIKÇA SORULAN SORULAR
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">
            Aklındaki her sorunun <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-violet-600">cevabı burada</span>
          </h2>
          <p className="text-lg text-slate-500">
            Bulamadığın bir soru olursa bize <a href="/iletisim" className="text-primary-600 font-semibold hover:underline">ulaşabilirsin</a>
          </p>
        </div>

        {/* FAQ items */}
        <div className="space-y-3">
          {faqs.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`bg-white rounded-xl border transition-all ${
                  isOpen ? 'border-primary-200 shadow-md shadow-primary-500/5' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className={`text-base font-semibold pr-4 ${isOpen ? 'text-primary-700' : 'text-slate-800'}`}>
                    {item.q}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-primary-600' : ''}`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
