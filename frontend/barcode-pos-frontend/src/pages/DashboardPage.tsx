import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, reportsApi } from '@/api/dashboard';
import type { DashboardData } from '@/types';
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Wallet,
  Receipt,
} from 'lucide-react';

interface PaymentSummary { paymentTypeName: string; total: number; percentage: number; count: number; }

const fmt = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0);

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const STATUS_COLORS: Record<string, string> = {
  'Tamamlandı': 'bg-green-100 text-green-700',
  'İptal': 'bg-red-100 text-red-700',
  'İade': 'bg-amber-100 text-amber-700',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentSummary[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    Promise.all([
      dashboardApi.get(),
      reportsApi.paymentSummary(weekAgo, today),
    ]).then(([dashRes, payRes]) => {
      if (dashRes.data.success) setData(dashRes.data.data!);
      if (payRes.data.success) setPaymentData(payRes.data.data ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-500">Dashboard verileri yüklenemedi.</p>;
  }

  const stats = [
    { label: 'Bugünkü Satış', value: `₺${fmt(data.todayTotal)}`, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
    { label: 'Satış Adedi', value: data.todaySaleCount, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
    { label: 'Düşük Stok', value: data.lowStockCount, icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
    { label: 'Veresiye Bakiye', value: `₺${fmt(data.totalCreditBalance)}`, icon: Wallet, color: 'bg-orange-50 text-orange-600' },
  ];

  const yesterdayDiff = data.yesterdayTotal > 0
    ? ((data.todayTotal - data.yesterdayTotal) / data.yesterdayTotal * 100).toFixed(1)
    : null;

  // 30 günlük grafik verisi
  const monthly = data.monthlyTrend ?? [];
  const monthMax = Math.max(...monthly.map((d) => d.total), 1);

  // Pasta grafik
  const paymentTotal = paymentData.reduce((s, p) => s + p.total, 0);
  const conicSegments = paymentData.reduce<Array<PaymentSummary & { color: string; start: number; end: number }>>((acc, p, i) => {
    const start = acc.length > 0 ? acc[acc.length - 1].end : 0;
    const end = start + p.percentage;
    acc.push({ ...p, color: PIE_COLORS[i % PIE_COLORS.length], start, end });
    return acc;
  }, []);
  const conicGradient = conicSegments.length > 0
    ? conicSegments.map((s) => `${s.color} ${s.start}% ${s.end}%`).join(', ')
    : '#e5e7eb 0% 100%';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${s.color}`}><s.icon size={20} /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Dünkü Karşılaştırma */}
      {yesterdayDiff !== null && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">
            Dün: <span className="font-medium">₺{fmt(data.yesterdayTotal)}</span>
            {' · '}
            <span className={Number(yesterdayDiff) >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
              {Number(yesterdayDiff) >= 0 ? '↑' : '↓'} {Math.abs(Number(yesterdayDiff))}%
            </span>
          </p>
        </div>
      )}

      {/* ── 30 Günlük Satış Grafiği (alan grafik) ── */}
      {monthly.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">30 Günlük Satış Trendi</h2>
            <span className="text-xs text-gray-400">
              Toplam: ₺{fmt(monthly.reduce((s, d) => s + d.total, 0))}
            </span>
          </div>
          <div className="relative">
            {/* Y ekseni etiketleri */}
            <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between text-[10px] text-gray-400 text-right pr-2">
              <span>₺{fmtShort(monthMax)}</span>
              <span>₺{fmtShort(monthMax / 2)}</span>
              <span>₺0</span>
            </div>
            {/* Grafik alanı */}
            <div className="ml-12">
              <svg viewBox={`0 0 ${monthly.length * 20} 120`} className="w-full h-40" preserveAspectRatio="none">
                {/* Grid çizgileri */}
                <line x1="0" y1="0" x2={monthly.length * 20} y2="0" stroke="#f3f4f6" strokeWidth="0.5" />
                <line x1="0" y1="60" x2={monthly.length * 20} y2="60" stroke="#f3f4f6" strokeWidth="0.5" />
                <line x1="0" y1="120" x2={monthly.length * 20} y2="120" stroke="#f3f4f6" strokeWidth="0.5" />
                {/* Alan dolgu */}
                <polygon
                  points={
                    `0,120 ` +
                    monthly.map((d, i) => `${i * 20 + 10},${120 - (d.total / monthMax) * 110}`).join(' ') +
                    ` ${(monthly.length - 1) * 20 + 10},120`
                  }
                  fill="url(#areaGradient)"
                />
                {/* Çizgi */}
                <polyline
                  points={monthly.map((d, i) => `${i * 20 + 10},${120 - (d.total / monthMax) * 110}`).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {/* Noktalar */}
                {monthly.map((d, i) => (
                  <circle
                    key={i}
                    cx={i * 20 + 10}
                    cy={120 - (d.total / monthMax) * 110}
                    r={i === monthly.length - 1 ? 3.5 : 0}
                    fill="#3b82f6"
                  />
                ))}
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
              </svg>
              {/* X ekseni */}
              <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
                <span>{new Date(monthly[0].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                <span>{new Date(monthly[Math.floor(monthly.length / 2)].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                <span>{new Date(monthly[monthly.length - 1].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Son Satışlar ── */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Receipt size={18} /> Son Satışlar</h2>
            <button onClick={() => navigate('/sales')} className="text-xs text-primary hover:underline">Tümünü Gör →</button>
          </div>
          {(data.recentSales?.length ?? 0) > 0 ? (
            <div className="space-y-2">
              {data.recentSales.map((sale) => (
                <div key={sale.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => navigate(`/sales`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <ShoppingCart size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{sale.receiptNumber}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[sale.statusName] ?? 'bg-gray-100 text-gray-600'}`}>
                          {sale.statusName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <span>{new Date(sale.saleDate).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                        <span>·</span>
                        <span>{sale.itemCount} ürün</span>
                        {sale.customerName && <><span>·</span><span>{sale.customerName}</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 tabular-nums">₺{fmt(sale.grandTotal)}</p>
                    <p className="text-[10px] text-gray-400">{sale.paymentTypeName}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8 text-sm">Henüz satış yok.</p>
          )}
        </div>

        {/* ── Ödeme Dağılımı Pasta Grafik ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-4">Ödeme Dağılımı (7 gün)</h2>
          {paymentTotal > 0 ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-36 h-36 rounded-full" style={{ background: `conic-gradient(${conicGradient})` }}>
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center">
                      <span className="text-xs text-gray-500">Toplam</span>
                      <span className="text-sm font-bold text-gray-900">₺{fmtShort(paymentTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {conicSegments.map((s) => (
                  <div key={s.paymentTypeName} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-gray-700">{s.paymentTypeName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">₺{fmt(s.total)}</span>
                      <span className="text-xs text-gray-400 ml-1">(%{s.percentage.toFixed(0)})</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-gray-400 py-8 text-sm">Son 7 günde satış yok.</p>
          )}
        </div>
      </div>
    </div>
  );
}
