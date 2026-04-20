import { useState } from 'react';
import { MapPin, Phone, Mail, MessageCircle, Send } from 'lucide-react';
import FadeIn from '@/components/common/FadeIn';

const PHONE = '905427460197';

const contactInfo = [
  { icon: Phone, label: 'Telefon', value: '+90 542 746 0197', href: 'tel:+905427460197' },
  { icon: Mail, label: 'E-posta', value: 'destek@carisoft.app', href: 'mailto:destek@carisoft.app' },
  { icon: MessageCircle, label: 'WhatsApp', value: 'WhatsApp ile yazın', href: `https://wa.me/${PHONE}` },
  { icon: MapPin, label: 'Konum', value: 'Türkiye', href: '#' },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section className="pt-32 pb-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-semibold text-primary-600 tracking-wide uppercase">
              İletişim
            </span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Bizimle <span className="text-primary-600">iletişime geçin</span>
            </h1>
            <p className="mt-4 text-lg text-slate-500">
              Sorularınız veya talepleriniz için bize ulaşın. En kısa sürede yanıt vereceğiz.
            </p>
          </div>
        </FadeIn>

        <div className="grid lg:grid-cols-5 gap-12 max-w-6xl mx-auto">
          {/* Info cards */}
          <div className="lg:col-span-2 space-y-4">
            {contactInfo.map((c, i) => (
              <FadeIn key={c.label} delay={i * 0.08}>
                <a
                  href={c.href}
                  target={c.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all group"
                >
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                    <c.icon size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">{c.label}</div>
                    <div className="text-sm font-semibold text-slate-900">{c.value}</div>
                  </div>
                </a>
              </FadeIn>
            ))}
          </div>

          {/* Form */}
          <FadeIn className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8">
              {sent ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="text-emerald-500" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Mesajınız Gönderildi!</h3>
                  <p className="text-slate-500">En kısa sürede size dönüş yapacağız.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Ad Soyad</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                        placeholder="Adınız Soyadınız"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">E-posta</label>
                      <input
                        type="email"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                        placeholder="ornek@mail.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Konu</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                      placeholder="Konu başlığı"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mesaj</label>
                    <textarea
                      required
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all resize-none"
                      placeholder="Mesajınızı yazın..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25"
                  >
                    Gönder
                  </button>
                </form>
              )}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
