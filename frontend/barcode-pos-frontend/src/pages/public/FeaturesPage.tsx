import {
  ScanBarcode, Package, Users, BarChart3, Tags, HardDrive,
  UserCog, Wrench, ShieldCheck, Zap, RefreshCw, Smartphone,
} from 'lucide-react';
import FadeIn from '@/components/common/FadeIn';
import CTASection from '@/components/landing/CTASection';

const sections = [
  {
    icon: ScanBarcode,
    title: 'Barkodlu Hızlı Satış',
    desc: 'USB veya Bluetooth barkod okuyucu ile ürünleri saniyeler içinde tarayın. Fiyat ve stok bilgisi anında ekrana gelir. Nakit, kredi kartı ve veresiye ödeme seçenekleri.',
    color: 'bg-blue-50 text-blue-600',
    features: ['Barkod ile anlık ürün tarama', 'Çoklu ödeme yöntemi', 'Hızlı satış ekranı', 'Fiş ve fatura yazdırma'],
  },
  {
    icon: Package,
    title: 'Stok Yönetimi',
    desc: 'Ürün stoklarınızı gerçek zamanlı takip edin. Minimum stok seviyelerine düştüğünde otomatik uyarı alın. Toplu stok girişi ve düzenleme desteği.',
    color: 'bg-emerald-50 text-emerald-600',
    features: ['Gerçek zamanlı stok takibi', 'Minimum stok uyarıları', 'Toplu stok güncelleme', 'Stok hareket geçmişi'],
  },
  {
    icon: Users,
    title: 'Müşteri & Cari Hesap',
    desc: 'Müşterilerinizin borç ve alacak durumlarını detaylı takip edin. Ödeme geçmişi, bakiye raporlama ve müşteri bazlı satış analizi.',
    color: 'bg-violet-50 text-violet-600',
    features: ['Borç / alacak takibi', 'Ödeme geçmişi', 'Müşteri bazlı raporlama', 'Toplu SMS bildirim'],
  },
  {
    icon: BarChart3,
    title: 'Detaylı Raporlama',
    desc: 'Günlük, haftalık ve aylık satış raporlarıyla işletmenizin nabzını tutun. Kâr/zarar analizi, en çok satılan ürünler ve daha fazlası.',
    color: 'bg-amber-50 text-amber-600',
    features: ['Satış ve kâr raporları', 'En çok satan ürünler', 'Dönemsel karşılaştırma', 'Excel dışa aktarma'],
  },
  {
    icon: Tags,
    title: 'Kategori Yönetimi',
    desc: 'Ürünlerinizi kategorilere ayırarak düzenli ve kolay erişilebilir tutun. Hiyerarşik kategori yapısı ve hızlı filtreleme.',
    color: 'bg-rose-50 text-rose-600',
    features: ['Sınırsız kategori', 'Hızlı filtreleme', 'Toplu kategori atama', 'Kategori bazlı raporlama'],
  },
  {
    icon: HardDrive,
    title: 'Yedekleme & Güvenlik',
    desc: 'Verileriniz her zaman güvende. Tek tıkla yerel yedekleme ve geri yükleme. Otomatik yedekleme zamanlayıcısı.',
    color: 'bg-cyan-50 text-cyan-600',
    features: ['Tek tıkla yedekleme', 'Otomatik yedekleme', 'Güvenli geri yükleme', 'Yerel veri saklama'],
  },
  {
    icon: UserCog,
    title: 'Kullanıcı Yönetimi',
    desc: 'Admin ve kasiyer rolleriyle her kullanıcıya özel yetkilendirme. Kullanıcı bazlı işlem logları.',
    color: 'bg-orange-50 text-orange-600',
    features: ['Rol bazlı yetkilendirme', 'Admin & kasiyer rolleri', 'İşlem logları', 'Güvenli oturum yönetimi'],
  },
  {
    icon: Wrench,
    title: 'Servis Takip',
    desc: 'Teknik servis, tamir ve bakım hizmeti veren işletmeler için servis kayıtlarını, parça takibini ve müşteri bilgilendirmesini tek yerden yönetin.',
    color: 'bg-indigo-50 text-indigo-600',
    features: ['Servis kaydı oluşturma', 'Parça ve işçilik takibi', 'Müşteri bilgilendirme', 'Servis durumu sorgulama'],
  },
];

const extras = [
  { icon: ShieldCheck, label: 'Güvenli Altyapı' },
  { icon: Zap, label: 'Yıldırım Hızında' },
  { icon: RefreshCw, label: 'Sürekli Güncelleme' },
  { icon: Smartphone, label: 'Responsive Tasarım' },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn>
            <span className="text-sm font-semibold text-primary-600 tracking-wide uppercase">
              Özellikler
            </span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              İşletmenize güç katan <span className="text-primary-600">tüm özellikler</span>
            </h1>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              Cari Soft, satış noktası yönetiminde ihtiyacınız olan her şeyi sunar.
            </p>
          </FadeIn>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            {extras.map((e) => (
              <FadeIn key={e.label} delay={0.1}>
                <div className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <e.icon size={18} className="text-primary-500" />
                  <span className="text-sm font-medium text-slate-700">{e.label}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Feature details */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {sections.map((s, i) => (
            <FadeIn key={s.title}>
              <div className={`flex flex-col lg:flex-row items-center gap-12 ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                {/* Icon card */}
                <div className="lg:w-5/12 flex justify-center">
                  <div className="w-64 h-64 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                    <div className={`w-24 h-24 rounded-2xl flex items-center justify-center ${s.color}`}>
                      <s.icon size={48} />
                    </div>
                  </div>
                </div>

                {/* Text */}
                <div className="lg:w-7/12">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{s.title}</h3>
                  <p className="text-slate-500 leading-relaxed mb-6">{s.desc}</p>
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {s.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <CTASection />
    </>
  );
}
