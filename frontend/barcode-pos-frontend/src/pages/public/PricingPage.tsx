import PricingCards from '@/components/landing/PricingCards';
import FadeIn from '@/components/common/FadeIn';
import CTASection from '@/components/landing/CTASection';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    q: 'Demo sürümünde ne kadar süre kullanabilirim?',
    a: '14 gün boyunca tüm özellikleri ücretsiz kullanabilirsiniz. Kredi kartı bilgisi gerektirmez.',
  },
  {
    q: 'Ödeme yöntemleri nelerdir?',
    a: 'Kredi kartı, banka havalesi/EFT ve Papara ile ödeme kabul ediyoruz.',
  },
  {
    q: 'İstediğim zaman iptal edebilir miyim?',
    a: 'Evet, herhangi bir taahhüt yoktur. İstediğiniz zaman aboneliğinizi iptal edebilirsiniz.',
  },
  {
    q: 'Verilerim güvende mi?',
    a: 'Evet, tüm verileriniz şifreli olarak yerel veritabanında saklanır. Otomatik yedekleme ile veri kaybı riski minimuma indirilir.',
  },
  {
    q: 'Masaüstü uygulaması internet olmadan çalışır mı?',
    a: 'Evet, masaüstü uygulaması yerel veritabanı ile çalışır. İnternet bağlantısı sadece güncelleme ve lisans doğrulama için gerekir.',
  },
  {
    q: 'Kaç cihazda kullanabilirim?',
    a: 'Her lisans tek bir cihaza bağlıdır. Birden fazla cihaz için ek lisans satın almanız gerekir.',
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="pt-32 pb-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <span className="text-sm font-semibold text-primary-600 tracking-wide uppercase">
              Fiyatlandırma
            </span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Şeffaf ve uygun fiyatlandırma
            </h1>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              Gizli maliyet yok. İhtiyacınıza en uygun planı seçin ve hemen başlayın.
            </p>
          </FadeIn>
        </div>
      </section>

      <PricingCards />

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="text-primary-600" size={24} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Sıkça Sorulan Sorular
              </h2>
            </div>
          </FadeIn>

          <div className="space-y-4">
            {faqs.map((f, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <details className="group bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                  <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors list-none">
                    {f.q}
                    <svg
                      className="w-5 h-5 text-slate-400 shrink-0 transition-transform group-open:rotate-180"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-5 text-sm text-slate-500 leading-relaxed">{f.a}</div>
                </details>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
