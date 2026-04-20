import { useEffect, useRef, useState } from 'react';
import FadeIn from '@/components/common/FadeIn';

function useCountUp(target: number, duration = 2000) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
}

interface StatDef {
  target: number;
  suffix: string;
  label: string;
}

function StatItem({ stat, delay }: { stat: StatDef; delay: number }) {
  const { value, ref } = useCountUp(stat.target);
  const display =
    stat.target >= 1000
      ? value >= 1000
        ? `${Math.round(value / 1000)}K`
        : `${value}`
      : `${value}`;

  return (
    <FadeIn delay={delay}>
      <div ref={ref} className="text-center">
        <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          {display}
          {value >= stat.target && stat.suffix}
        </div>
        <div className="mt-2 text-sm text-indigo-200 font-medium">{stat.label}</div>
      </div>
    </FadeIn>
  );
}

const stats: StatDef[] = [
  { target: 500, suffix: '+', label: 'Aktif İşletme' },
  { target: 50000, suffix: '+', label: 'Günlük Satış' },
  { target: 120000, suffix: '+', label: 'Kayıtlı Ürün' },
  { target: 99, suffix: '%', label: 'Müşteri Memnuniyeti' },
];

export default function StatsBar() {
  return (
    <section className="py-16 bg-gradient-to-r from-primary-700 via-violet-700 to-fuchsia-700 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2230%22%20height%3D%2230%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%222%22%20cy%3D%222%22%20r%3D%220.8%22%20fill%3D%22rgba(255%2C255%2C255%2C0.06)%22%2F%3E%3C%2Fsvg%3E')]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((s, i) => (
            <StatItem key={s.label} stat={s} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}
