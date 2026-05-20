import { Monitor, Shield, Zap, Download } from 'lucide-react';
import FadeIn from '@/components/common/FadeIn';

const requirements = [
  'Windows 10 / 11 (64-bit)',
  '4 GB RAM (8 GB önerilir)',
  '200 MB disk alanı',
  '1280×720 minimum ekran çözünürlüğü',
];

const steps = [
  { n: '1', title: 'İndirin', desc: 'Aşağıdaki butona tıklayarak kurulum dosyasını indirin.' },
  { n: '2', title: 'Kurun', desc: 'İndirilen dosyayı çalıştırın ve kurulum sihirbazını takip edin.' },
  { n: '3', title: 'Kullanın', desc: 'Masaüstündeki Cari Soft ikonuna tıklayarak başlayın.' },
];

export default function DownloadPage() {
  return (
    <>
      <section className="pt-32 pb-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-sm font-semibold text-primary-600 tracking-wide uppercase">
                Masaüstü Uygulaması
              </span>
              <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                Cari Soft'ı <span className="text-primary-600">indirin</span>
              </h1>
              <p className="mt-4 text-lg text-slate-500">
                Windows masaüstü uygulaması ile internet olmadan da satış yapın.
              </p>
            </div>
          </FadeIn>

          {/* Download card */}
          <FadeIn>
            <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8 text-center mb-20">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Monitor className="text-primary-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Cari Soft v1.0.0</h2>
              <p className="text-sm text-slate-500 mb-6">Windows 10/11 · 64-bit</p>
              <a
                href="https://wa.me/905427460197?text=Merhaba%2C%20Cari%20Soft%20masa%C3%BCst%C3%BC%20uygulamas%C4%B1n%C4%B1%20talep%20ediyorum."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full px-8 py-4 text-base font-semibold text-white bg-primary-600 rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40"
              >
                <Download size={20} />
                İndirme Talebi (WhatsApp)
              </a>
              <p className="mt-4 text-xs text-slate-400">
                Lisanslı kullanıcılarımıza özel — WhatsApp üzerinden iletişime geçin.
              </p>
              <p className="mt-2 text-xs text-emerald-600 font-medium">
                ✓ İnternet olmadan da çalışır · ✓ SQLite veritabanı dahil · ✓ Otomatik güncellemeler
              </p>
            </div>
          </FadeIn>

          {/* Steps */}
          <FadeIn>
            <h3 className="text-2xl font-bold text-slate-900 text-center mb-10">Nasıl Kurulur?</h3>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-20">
            {steps.map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.1}>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                    {s.n}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h4>
                  <p className="text-sm text-slate-500">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Requirements */}
          <FadeIn>
            <div className="max-w-xl mx-auto bg-slate-50 rounded-2xl border border-slate-200 p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Zap size={20} className="text-amber-500" />
                Sistem Gereksinimleri
              </h3>
              <ul className="space-y-3">
                {requirements.map((r) => (
                  <li key={r} className="flex items-center gap-3 text-sm text-slate-600">
                    <Shield size={14} className="text-emerald-500 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
