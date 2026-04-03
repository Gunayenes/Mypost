import { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'dashboard',
    title: 'Dashboard',
    description: 'Mağazanızın genel durumunu burada görebilirsiniz. Günlük satışlar, ciro ve stok uyarıları tek bakışta.',
  },
  {
    target: 'pos',
    title: 'POS Satış',
    description: 'Barkod okutarak veya ürün arayarak hızlıca satış yapabilirsiniz. Nakit, kart ve havale ile ödeme alabilirsiniz.',
  },
  {
    target: 'products',
    title: 'Ürünler',
    description: 'Ürünlerinizi buradan yönetin. Barkod, fiyat, stok bilgilerini ekleyip düzenleyebilirsiniz. Excel ile toplu aktarım da yapabilirsiniz.',
  },
  {
    target: 'categories',
    title: 'Kategoriler',
    description: 'Ürünlerinizi kategorilere ayırarak daha düzenli bir yönetim sağlayabilirsiniz.',
  },
  {
    target: 'customers',
    title: 'Müşteriler',
    description: 'Cari müşterilerinizi takip edin. Veresiye satış yapıp tahsilat kaydı tutabilirsiniz.',
  },
  {
    target: 'sales',
    title: 'Satışlar',
    description: 'Tüm satış geçmişinizi burada görüntüleyebilir, fiş detaylarını inceleyebilirsiniz.',
  },
  {
    target: 'stock',
    title: 'Stok Hareketleri',
    description: 'Stok giriş-çıkışlarını takip edin. Manuel stok düzeltmesi ve sayım yapabilirsiniz.',
  },
  {
    target: 'reports',
    title: 'Raporlar',
    description: 'Günlük, dönemsel satış raporları, en çok satan ürünler ve kar analizlerini inceleyin.',
  },
];

const TOUR_STORAGE_KEY = 'onboarding_completed';

export default function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // İlk girişte otomatik başlat
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      // Sidebar'ın render olması için kısa bekle
      const timer = setTimeout(() => setActive(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Custom event ile tekrar başlatılabilir
  useEffect(() => {
    const handler = () => {
      setStep(0);
      setActive(true);
    };
    window.addEventListener('start-tour', handler);
    return () => window.removeEventListener('start-tour', handler);
  }, []);

  // Hedef elementi bul ve pozisyonunu al
  const updateTargetRect = useCallback(() => {
    if (!active) return;
    const currentStep = TOUR_STEPS[step];
    const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [active, step]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    return () => window.removeEventListener('resize', updateTargetRect);
  }, [updateTargetRect]);

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleClose = () => {
    setActive(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  };

  if (!active) return null;

  const currentStep = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  // Tooltip pozisyonu — hedefin sağında göster
  const tooltipStyle: React.CSSProperties = targetRect
    ? {
        position: 'fixed',
        top: Math.max(16, targetRect.top - 10),
        left: targetRect.right + 16,
        zIndex: 10002,
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10002,
      };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[10000] transition-opacity"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={handleClose}
      />

      {/* Highlight box */}
      {targetRect && (
        <div
          className="fixed z-[10001] rounded-lg ring-4 ring-primary ring-offset-2 pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Tooltip */}
      <div style={tooltipStyle} className="w-80">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-5 animate-in fade-in slide-in-from-left-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <span className="text-xs font-medium text-primary">
                {step + 1} / {TOUR_STEPS.length}
              </span>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition">
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <h3 className="text-lg font-bold text-gray-900 mb-1">{currentStep.title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{currentStep.description}</p>

          {/* Progress bar */}
          <div className="w-full h-1 bg-gray-100 rounded-full mb-4">
            <div
              className="h-1 bg-primary rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleClose}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              Rehberi Atla
            </button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <ChevronLeft size={14} /> Geri
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary-dark transition"
              >
                {isLast ? 'Tamamla' : 'Sonraki'} {!isLast && <ChevronRight size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
