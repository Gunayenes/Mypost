import {
  ScanBarcode,
  Package,
  Users,
  BarChart3,
  Tags,
  HardDrive,
  UserCog,
  Monitor,
} from 'lucide-react';
import FadeIn from '@/components/common/FadeIn';

const features = [
  {
    icon: ScanBarcode,
    title: 'Barkodlu Satış',
    desc: 'Barkod okuyucu ile hızlı satış. Ürünleri anında tarayın, fiyatları otomatik çekin.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: Package,
    title: 'Stok Yönetimi',
    desc: 'Anlık stok takibi, minimum stok uyarıları ve toplu stok güncelleme desteği.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Users,
    title: 'Cari Hesap',
    desc: 'Müşteri bazlı borç/alacak takibi, ödeme geçmişi ve bakiye raporlama.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    icon: BarChart3,
    title: 'Detaylı Raporlama',
    desc: 'Günlük, haftalık, aylık satış raporları. Kâr/zarar analizi ve Excel dışa aktarma.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Tags,
    title: 'Kategori Yönetimi',
    desc: 'Ürünlerinizi kategorilere ayırın, filtreleme ve arama ile hızla bulun.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: HardDrive,
    title: 'Otomatik Yedekleme',
    desc: 'Verilerinizi güvenle saklayın. Tek tıkla yedekleme ve geri yükleme.',
    color: 'bg-cyan-50 text-cyan-600',
  },
  {
    icon: UserCog,
    title: 'Çoklu Kullanıcı',
    desc: 'Admin ve kasiyer rolleri. Her kullanıcıya özel yetkilendirme sistemi.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Monitor,
    title: 'Masaüstü Uygulama',
    desc: 'Windows masaüstü uygulaması. İnternet olmadan da çalışır, otomatik güncelleme.',
    color: 'bg-indigo-50 text-indigo-600',
  },
];

export default function FeaturesGrid() {
  return (
    <section className="py-24 lg:py-32 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-semibold text-primary-600 tracking-wide uppercase">
              Özellikler
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              İşletmenize güç katan her şey{' '}
              <span className="text-primary-600">tek platformda</span>
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Satıştan stok takibine, raporlamadan müşteri yönetimine kadar tüm ihtiyaçlarınız tek çatı altında.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.06}>
              <div className="group relative bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-200 transition-all duration-300 hover:-translate-y-1 h-full">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
