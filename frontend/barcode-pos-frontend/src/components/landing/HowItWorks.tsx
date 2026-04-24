import { UserPlus, Package, TrendingUp } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    number: '01',
    title: 'Ücretsiz Kaydol',
    desc: 'Sadece 30 saniye. Kredi kartı gerekmez. E-posta ve telefonunla hemen hesap aç.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Package,
    number: '02',
    title: 'Ürünlerini Ekle',
    desc: 'Barkod okuyucuyla hızlıca veya Excel ile toplu ürün ekle. Kategoriler ve fiyatları yönet.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: TrendingUp,
    number: '03',
    title: 'Satış Yapmaya Başla',
    desc: 'POS ekranından barkod okut, satışını tamamla. Günlük raporları anında gör.',
    color: 'from-orange-500 to-red-500',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-primary-50 text-primary-600 rounded-full text-sm font-semibold mb-4">
            KOLAY KULLANIM
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">
            Sadece 3 adımda <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-violet-600">kullanmaya başla</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Karmaşık kurulum, eğitim, donanım gerektirmez. Bilgisayarın veya telefonun var mı? O zaman hazırsın.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-20 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-blue-300 via-violet-300 to-orange-300" />

          {steps.map((step) => (
            <div key={step.number} className="relative">
              <div className="relative bg-white">
                {/* Icon circle */}
                <div className={`relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl shadow-slate-900/10 mb-6`}>
                  <step.icon size={32} className="text-white" strokeWidth={2.2} />
                  <span className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center text-sm font-black shadow-lg border-2 border-slate-100">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
