import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import FadeIn from '@/components/common/FadeIn';

export default function CTASection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* BG */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-primary-950 to-violet-950" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%222%22%20cy%3D%222%22%20r%3D%220.6%22%20fill%3D%22rgba(255%2C255%2C255%2C0.04)%22%2F%3E%3C%2Fsvg%3E')]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-500/10 rounded-full blur-[120px]" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <FadeIn>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            İşletmenizi büyütmeye
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 via-violet-400 to-fuchsia-400">
              bugün başlayın
            </span>
          </h2>

          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
            14 gün ücretsiz deneyin, kredi kartı gerektirmez. Kurulum bile gerekmez —
            hemen kaydolun ve satış yapmaya başlayın.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/kayit"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-primary-900 bg-white rounded-2xl hover:bg-slate-100 transition-all shadow-xl hover:-translate-y-0.5"
            >
              Ücretsiz Deneyin
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/iletisim"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white border border-white/20 rounded-2xl hover:bg-white/10 transition-all"
            >
              Bize Ulaşın
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
