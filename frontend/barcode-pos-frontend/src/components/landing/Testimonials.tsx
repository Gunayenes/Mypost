import { Star } from 'lucide-react';
import FadeIn from '@/components/common/FadeIn';

const reviews = [
  {
    name: 'Ahmet Yılmaz',
    role: 'Market Sahibi',
    text: 'Cari Soft sayesinde satışlarımı ve stoğumu çok daha kolay takip ediyorum. Barkod okuyucu ile satış yapmak inanılmaz hızlı.',
    stars: 5,
  },
  {
    name: 'Fatma Demir',
    role: 'Kırtasiye İşletmecisi',
    text: 'Cari hesap takibi hayat kurtarıcı. Müşterilerimin borç durumunu anında görebiliyorum. Raporlama da çok detaylı.',
    stars: 5,
  },
  {
    name: 'Mehmet Kaya',
    role: 'Elektronik Mağazası',
    text: 'Daha önce birçok program denedim ama Cari Soft kadar kullanımı kolay olanı olmadı. Destek ekibi de çok ilgili.',
    stars: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-semibold text-primary-600 tracking-wide uppercase">
              Müşteri Yorumları
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              İşletme sahipleri ne diyor?
            </h2>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((r, i) => (
            <FadeIn key={r.name} delay={i * 0.1}>
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-shadow h-full flex flex-col">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: r.stars }).map((_, j) => (
                    <Star key={j} size={16} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-slate-600 leading-relaxed flex-1">"{r.text}"</p>

                <div className="mt-6 flex items-center gap-3 pt-6 border-t border-slate-200">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                    {r.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.role}</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
