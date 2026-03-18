import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import FadeIn from '@/components/common/FadeIn';

interface Plan {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: { text: string; included: boolean }[];
  cta: string;
  href: string;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Demo',
    price: 'Ücretsiz',
    period: '14 gün',
    desc: 'Tüm özellikleri keşfedin',
    features: [
      { text: '14 gün tam erişim', included: true },
      { text: '50 ürün limiti', included: true },
      { text: '1 kullanıcı', included: true },
      { text: 'Temel raporlar', included: true },
      { text: 'E-posta destek', included: false },
      { text: 'Otomatik yedekleme', included: false },
      { text: 'Otomatik güncelleme', included: false },
    ],
    cta: 'Ücretsiz Başla',
    href: '/kayit',
  },
  {
    name: 'Profesyonel',
    price: '599₺',
    period: '/ay',
    desc: 'Büyüyen işletmeler için',
    popular: true,
    features: [
      { text: 'Sınırsız kullanım', included: true },
      { text: 'Sınırsız ürün', included: true },
      { text: '3 kullanıcı', included: true },
      { text: 'Tüm raporlar + Excel', included: true },
      { text: 'E-posta destek', included: true },
      { text: 'Otomatik yedekleme', included: true },
      { text: 'Otomatik güncelleme', included: true },
    ],
    cta: 'Hemen Başla',
    href: '/kayit?plan=pro',
  },
  {
    name: 'Kurumsal',
    price: 'İletişim',
    period: '',
    desc: 'Çoklu şube ve özel ihtiyaçlar',
    features: [
      { text: 'Sınırsız kullanım', included: true },
      { text: 'Sınırsız ürün', included: true },
      { text: 'Sınırsız kullanıcı', included: true },
      { text: 'Tüm raporlar + Excel', included: true },
      { text: 'Öncelikli destek', included: true },
      { text: 'Otomatik yedekleme', included: true },
      { text: 'Özel geliştirme', included: true },
    ],
    cta: 'Bize Ulaşın',
    href: '/iletisim',
  },
];

export default function PricingCards() {
  return (
    <section className="py-24 lg:py-32 bg-slate-50" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-semibold text-primary-600 tracking-wide uppercase">
              Fiyatlandırma
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              İşletmenize uygun planı seçin
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              14 gün ücretsiz deneme ile başlayın. Kredi kartı gerektirmez.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <FadeIn key={p.name} delay={i * 0.1}>
              <div
                className={`relative flex flex-col rounded-2xl p-8 h-full transition-all duration-300 hover:-translate-y-1 ${
                  p.popular
                    ? 'bg-white shadow-2xl shadow-primary-500/10 border-2 border-primary-500 ring-1 ring-primary-500/20'
                    : 'bg-white shadow-lg shadow-slate-200/50 border border-slate-200'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-600 text-white text-xs font-bold rounded-full shadow-lg">
                    En Popüler
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{p.desc}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-slate-900">{p.price}</span>
                  {p.period && <span className="text-slate-500 ml-1">{p.period}</span>}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-3 text-sm">
                      {f.included ? (
                        <Check size={16} className="text-emerald-500 shrink-0" />
                      ) : (
                        <X size={16} className="text-slate-300 shrink-0" />
                      )}
                      <span className={f.included ? 'text-slate-700' : 'text-slate-400'}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={p.href}
                  className={`block text-center py-3.5 rounded-xl font-semibold text-sm transition-all ${
                    p.popular
                      ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/25'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
