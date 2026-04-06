import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { isElectron } from '@/utils/platform';
import {
  ScanBarcode,
  Package,
  BarChart3,
  Users,
  ShoppingCart,
  Wrench,
  ArrowRight,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

const features = [
  {
    icon: ScanBarcode,
    title: 'Hızlı Satış (POS)',
    desc: 'Barkod okutarak veya ürün arayarak saniyeler içinde satış yapın. Nakit, kart ve parçalı ödeme destekli.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Package,
    title: 'Ürün ve Stok Yönetimi',
    desc: 'Ürünlerinizi kategorilerle düzenleyin. Stok takibi, düşük stok uyarıları ve Excel ile toplu aktarım.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: Users,
    title: 'Müşteri ve Cari Takip',
    desc: 'Müşterilerinizi kaydedin, veresiye satış yapın ve tahsilat takibini kolayca yönetin.',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: BarChart3,
    title: 'Detaylı Raporlar',
    desc: 'Günlük, haftalık, aylık satış raporları. Kâr/zarar analizi ve en çok satan ürünler.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: ShoppingCart,
    title: 'Satış Geçmişi',
    desc: 'Tüm satışlarınızı fiş numarasıyla listeleyin. İade ve iptal işlemlerini kolayca yönetin.',
    color: 'bg-red-100 text-red-600',
  },
  {
    icon: Wrench,
    title: 'Servis Takip',
    desc: 'Teknik servis kayıtlarını oluşturun. Müşterilerinize WhatsApp ile takip linki gönderin.',
    color: 'bg-cyan-100 text-cyan-600',
  },
];

const steps = [
  'Örnek ürünler ve kategoriler mağazanıza eklendi',
  'Soldaki menüden tüm özelliklere erişebilirsiniz',
  'POS Satış ekranından ilk satışınızı yapabilirsiniz',
  'Mağaza Ayarları\'ndan logonuzu ve bilgilerinizi düzenleyin',
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  const basePath = isElectron() ? '/' : '/app';

  return (
    <div className={`min-h-screen bg-gradient-to-br from-primary-50 via-white to-violet-50 flex items-center justify-center p-4 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Sparkles size={16} /> Hoş Geldiniz!
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            Merhaba{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-gray-500 text-lg">
            Mağazanız hazır. İşte size sunduğumuz özellikler:
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${f.color} mb-3`}>
                <f.icon size={20} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Quick Start Steps */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-bold text-gray-900 mb-3">Hızlı Başlangıç</h2>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-600">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => navigate(basePath)}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-xl text-lg font-bold hover:bg-primary-dark transition shadow-lg shadow-primary/25"
          >
            Mağazama Git <ArrowRight size={20} />
          </button>
          <p className="text-xs text-gray-400 mt-3">
            İlk girişinizde size adım adım rehberlik edeceğiz.
          </p>
        </div>
      </div>
    </div>
  );
}
