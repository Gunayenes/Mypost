import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

/* ── POS Satış Ekranı Mockup ── */
function POSMockup() {
  const cartItems = [
    { name: 'Tam Yağlı Süt 1L', price: '25.00', qty: 2 },
    { name: 'Tam Buğday Ekmek', price: '8.50', qty: 1 },
    { name: 'Doğal Kaynak Suyu', price: '5.00', qty: 3 },
  ];
  const products = [
    { name: 'Süt 1L', price: '₺25', color: 'bg-blue-100 text-blue-600' },
    { name: 'Ekmek', price: '₺8.50', color: 'bg-amber-100 text-amber-600' },
    { name: 'Su 0.5L', price: '₺5', color: 'bg-cyan-100 text-cyan-600' },
    { name: 'Kaşar Peynir', price: '₺32', color: 'bg-orange-100 text-orange-600' },
    { name: 'Yoğurt 1kg', price: '₺18', color: 'bg-emerald-100 text-emerald-600' },
    { name: 'Tereyağı', price: '₺45', color: 'bg-rose-100 text-rose-600' },
  ];

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
              <span className="text-[8px] text-slate-400">kasaplus.app/pos</span>
            </div>
          </div>
        </div>

        {/* POS Layout */}
        <div className="flex h-[280px]">
          {/* Left — Products */}
          <div className="flex-1 p-3 bg-slate-50/60">
            {/* Search */}
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
              <svg className="w-3.5 h-3.5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m10 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
              <span className="text-[9px] text-slate-400">Barkod okutun veya ürün arayın...</span>
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-3 gap-2">
              {products.map((p, i) => (
                <div key={i} className="bg-white rounded-lg p-2 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className={`w-full h-7 rounded ${p.color} flex items-center justify-center mb-1.5`}>
                    <span className="text-[8px] font-bold">{p.price}</span>
                  </div>
                  <div className="text-[8px] font-medium text-slate-700 truncate">{p.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Cart */}
          <div className="w-[42%] border-l border-slate-200 flex flex-col bg-white">
            {/* Cart header */}
            <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-800">🛒 Sepet</span>
              <span className="text-[8px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full font-bold">3 ürün</span>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-hidden px-3 py-2 space-y-1.5">
              {cartItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-dashed border-slate-100 last:border-0">
                  <div>
                    <div className="text-[8px] font-medium text-slate-700">{item.name}</div>
                    <div className="text-[7px] text-slate-400">{item.qty} adet</div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-800">₺{item.price}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-slate-200 px-3 py-2 bg-slate-50/80">
              <div className="flex justify-between text-[8px] text-slate-500 mb-0.5">
                <span>Ara Toplam</span><span>₺73.50</span>
              </div>
              <div className="flex justify-between text-[8px] text-slate-500 mb-1.5">
                <span>KDV (%10)</span><span>₺7.35</span>
              </div>
              <div className="flex justify-between text-[10px] font-extrabold text-slate-900 mb-2">
                <span>Toplam</span><span>₺80.85</span>
              </div>
              <button className="w-full py-1.5 bg-gradient-to-r from-primary-600 to-violet-600 text-white text-[9px] font-bold rounded-lg shadow-md">
                💳 Ödeme Al
              </button>
            </div>
          </div>
        </div>
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-violet-50 border border-primary-100/60 text-primary-700 rounded-full text-sm font-medium mb-8">
              <Sparkles size={14} className="text-primary-500" />
              Yeni — Barkodlu satış sistemi v1.0
            </div>

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
            <POSMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
