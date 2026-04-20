import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/* ── POS Ekranı Önizleme ── */
function POSPreview() {
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-6 bg-gradient-to-r from-primary-500/15 via-violet-500/15 to-fuchsia-500/15 rounded-[2rem] blur-3xl" />

      <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-900/10 overflow-hidden border border-slate-200/70">
        {/* Browser bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100/80 border-b border-slate-200/60">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex-1 mx-3">
            <div className="w-52 h-5 bg-white rounded border border-slate-200 px-2 flex items-center">
              <svg className="w-2.5 h-2.5 text-slate-300 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              <span className="text-[8px] text-slate-400">carisoft.app/pos</span>
            </div>
          </div>
        </div>

        {/* POS Screenshot */}
        <img
          src="/pos-screenshot.png"
          alt="Cari Soft POS Satış Ekranı"
          className="w-full h-auto"
          loading="lazy"
        />
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* BG */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-violet-200/20 rounded-full blur-[100px] -z-10" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary-200/15 rounded-full blur-[120px] -z-10" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2232%22%20height%3D%2232%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%221%22%20cy%3D%221%22%20r%3D%220.6%22%20fill%3D%22rgba(99%2C102%2C241%2C0.07)%22%2F%3E%3C%2Fsvg%3E')]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-slate-900 leading-[1.08] tracking-tight">
              İşletmeniz için{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-violet-600 to-fuchsia-500">
                akıllı satış
              </span>{' '}
              ve stok takip yazılımı
            </h1>

            <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-lg">
              Barkod okuyucu ile hızlı satış, gerçek zamanlı stok takibi, cari hesap yönetimi ve
              detaylı raporlama — hepsi tek ekranda.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                to="/kayit"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-primary-600 to-violet-600 rounded-2xl hover:from-primary-700 hover:to-violet-700 transition-all shadow-xl shadow-primary-600/20 hover:shadow-primary-600/35 hover:-translate-y-0.5"
              >
                Ücretsiz Deneyin
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/ozellikler"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-slate-700 bg-white/80 backdrop-blur border border-slate-200 rounded-2xl hover:bg-white transition-all hover:-translate-y-0.5 shadow-sm"
              >
                Tüm Özellikler
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <span className="flex items-center gap-2"><CheckIcon /> 14 gün ücretsiz</span>
              <span className="flex items-center gap-2"><CheckIcon /> Kredi kartı gerektirmez</span>
              <span className="flex items-center gap-2"><CheckIcon /> Kurulum gerektirmez</span>
            </div>
          </motion.div>

          {/* Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <POSPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
