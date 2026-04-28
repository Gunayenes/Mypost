import { useState, useEffect } from 'react';
import { reportsApi } from '@/api/dashboard';
import { servicesApi } from '@/api/services';
import type { ServiceListItem } from '@/types';
import {
  BarChart3, Download, TrendingUp, TrendingDown, DollarSign, Percent,
  ShoppingCart, Package, AlertTriangle, CreditCard, Loader2,
  Calendar, Banknote, Wallet, Clock, Users, Wrench,
} from 'lucide-react';

// ── Tipler ──

interface DailyBreakdown {
  date: string;
  saleCount: number;
  total: number;
}

interface ReportData {
  dateFrom: string;
  dateTo: string;
  totalSales: number;
  totalSaleCount: number;
  dailyBreakdown: DailyBreakdown[];
}

interface DailyProfit { date: string; revenue: number; cost: number; profit: number; saleCount: number; }
interface CategoryProfit { categoryName: string; revenue: number; cost: number; profit: number; profitMargin: number; itemsSold: number; }
interface ProductProfit { barcode: string; productName: string; categoryName: string; quantitySold: number; revenue: number; cost: number; profit: number; profitMargin: number; }

interface ProfitData {
  dateFrom: string;
  dateTo: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossProfitMargin: number;
  totalItemsSold: number;
  dailyBreakdown: DailyProfit[];
  categoryBreakdown: CategoryProfit[];
  topProfitProducts: ProductProfit[];
}

interface TopProduct { productId: number; barcode: string; productName: string; categoryName: string; totalQuantity: number; totalRevenue: number; totalProfit: number; }
interface LowStockItem { productId: number; barcode: string; name: string; categoryName: string; stockQuantity: number; minStockLevel: number; deficit: number; }
interface PaymentSummary { paymentType: string; paymentTypeName: string; count: number; total: number; percentage: number; }

interface HourlySales { hour: number; hourLabel: string; saleCount: number; total: number; itemCount: number; }
interface CashierSales { userId: number; fullName: string; saleCount: number; total: number; cashTotal: number; cardTotal: number; creditTotal: number; }

interface DailyClosingData {
  date: string;
  grandTotal: number;
  subTotal: number;
  taxTotal: number;
  discountTotal: number;
  saleCount: number;
  totalItemsSold: number;
  averageBasket: number;
  cashTotal: number;
  cashCount: number;
  cardTotal: number;
  cardCount: number;
  creditTotal: number;
  creditCount: number;
  cancelCount: number;
  cancelTotal: number;
  returnCount: number;
  returnTotal: number;
  totalCost: number;
  grossProfit: number;
  grossProfitMargin: number;
  serviceRevenue: number;
  serviceCount: number;
  combinedTotal: number;
  hourlyBreakdown: HourlySales[];
  cashierBreakdown: CashierSales[];
  topProducts: TopProduct[];
}

type TabKey = 'daily-closing' | 'sales' | 'profit' | 'top-products' | 'payment' | 'low-stock' | 'services';

function toast(type: 'success' | 'error', message: string) {
  window.dispatchEvent(new CustomEvent('toast', { detail: { type, message } }));
}

const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const defaultEndDate = new Date().toISOString().split('T')[0];

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [activeTab, setActiveTab] = useState<TabKey>('daily-closing');
  const [loading, setLoading] = useState(false);

  // Veri state'leri
  const [dailyClosing, setDailyClosing] = useState<DailyClosingData | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [profitReport, setProfitReport] = useState<ProfitData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[] | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary[] | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[] | null>(null);
  const [serviceItems, setServiceItems] = useState<ServiceListItem[] | null>(null);

  const [profitSubTab, setProfitSubTab] = useState<'summary' | 'daily' | 'category' | 'products'>('summary');
  const [dailySubTab, setDailySubTab] = useState<'summary' | 'hourly' | 'cashier' | 'products'>('summary');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [closingRes, salesRes, profitRes, topRes, payRes, lowRes] = await Promise.all([
        reportsApi.dailyClosingReport(endDate),
        reportsApi.salesReport(startDate, endDate),
        reportsApi.profitReport(startDate, endDate),
        reportsApi.topProducts(startDate, endDate),
        reportsApi.paymentSummary(startDate, endDate),
        reportsApi.lowStock(),
      ]);
      if (closingRes.data.success) setDailyClosing(closingRes.data.data);
      if (salesRes.data.success) setReport(salesRes.data.data);
      if (profitRes.data.success) setProfitReport(profitRes.data.data);
      if (topRes.data.success) setTopProducts(topRes.data.data);
      if (payRes.data.success) setPaymentSummary(payRes.data.data);
      if (lowRes.data.success) setLowStock(lowRes.data.data);

      // Servis raporu
      try {
        const sRes = await servicesApi.getAll({ dateFrom: startDate, dateTo: endDate, pageSize: 100 });
        if (sRes.data.success && sRes.data.data) setServiceItems(sRes.data.data.items);
      } catch { /* silent */ }
    } catch {
      toast('error', 'Raporlar yüklenirken hata oluştu.');
    }
    setLoading(false);
  };

  // İlk açılışta otomatik yükle
  useEffect(() => { loadAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const exportExcel = async (type: string) => {
    try {
      const res = await reportsApi.exportExcel(startDate, endDate, type);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-raporu-${startDate}-${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast('error', 'Excel indirilemedi.');
    }
  };

  const getExportType = (): string => {
    switch (activeTab) {
      case 'daily-closing': return 'daily-closing';
      case 'profit': return 'profit';
      case 'top-products': return 'top-products';
      case 'low-stock': return 'low-stock';
      case 'services': return 'sales';
      default: return 'sales';
    }
  };

  const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const tabs: { key: TabKey; label: string; icon: typeof BarChart3; activeClass: string }[] = [
    { key: 'daily-closing', label: 'Günlük Rapor', icon: Calendar, activeClass: 'bg-emerald-500 text-white' },
    { key: 'sales', label: 'Satış Raporu', icon: BarChart3, activeClass: 'bg-blue-500 text-white' },
    { key: 'profit', label: 'Kâr / Zarar', icon: DollarSign, activeClass: 'bg-green-500 text-white' },
    { key: 'top-products', label: 'En Çok Satanlar', icon: ShoppingCart, activeClass: 'bg-purple-500 text-white' },
    { key: 'payment', label: 'Ödeme Dağılımı', icon: CreditCard, activeClass: 'bg-indigo-500 text-white' },
    { key: 'low-stock', label: 'Düşük Stok', icon: AlertTriangle, activeClass: 'bg-red-500 text-white' },
    { key: 'services', label: 'Servis Raporu', icon: Wrench, activeClass: 'bg-cyan-500 text-white' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>

      {/* Tarih seçimi + butonlar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Başlangıç</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bitiş</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <button onClick={loadAll} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {loading ? 'Yükleniyor...' : 'Rapor Getir'}
          </button>
          <button onClick={() => exportExcel(getExportType())} className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
            <Download size={14} /> Excel
          </button>
        </div>

        {/* Tab butonları */}
        <div className="flex flex-wrap gap-1 border-b border-gray-200 mb-4">
          {tabs.map(({ key, label, icon: Icon, activeClass }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition ${
                activeTab === key
                  ? activeClass
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* ── Günlük Rapor (Gün Sonu / Z Raporu) ── */}
        {activeTab === 'daily-closing' && dailyClosing && (
          <>
            {/* Ana Özet Kartları */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={16} className="opacity-80" />
                  <span className="text-xs font-semibold uppercase opacity-80">Toplam Ciro</span>
                </div>
                <p className="text-2xl font-black tabular-nums">₺{fmt(dailyClosing.grandTotal)}</p>
                <p className="text-xs opacity-70 mt-1">{dailyClosing.saleCount} satış · {dailyClosing.totalItemsSold} ürün</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <Banknote size={16} className="opacity-80" />
                  <span className="text-xs font-semibold uppercase opacity-80">Nakit</span>
                </div>
                <p className="text-2xl font-black tabular-nums">₺{fmt(dailyClosing.cashTotal)}</p>
                <p className="text-xs opacity-70 mt-1">{dailyClosing.cashCount} işlem</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard size={16} className="opacity-80" />
                  <span className="text-xs font-semibold uppercase opacity-80">Kredi Kartı / POS</span>
                </div>
                <p className="text-2xl font-black tabular-nums">₺{fmt(dailyClosing.cardTotal)}</p>
                <p className="text-xs opacity-70 mt-1">{dailyClosing.cardCount} işlem</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet size={16} className="opacity-80" />
                  <span className="text-xs font-semibold uppercase opacity-80">Veresiye</span>
                </div>
                <p className="text-2xl font-black tabular-nums">₺{fmt(dailyClosing.creditTotal)}</p>
                <p className="text-xs opacity-70 mt-1">{dailyClosing.creditCount} işlem</p>
              </div>
            </div>

            {/* Servis + Toplam Ciro */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <Wrench size={16} className="opacity-80" />
                  <span className="text-xs font-semibold uppercase opacity-80">Servis Geliri (Teslim Edilen)</span>
                </div>
                <p className="text-2xl font-black tabular-nums">₺{fmt(dailyClosing.serviceRevenue)}</p>
                <p className="text-xs opacity-70 mt-1">{dailyClosing.serviceCount} servis kaydı</p>
              </div>
              <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={16} className="opacity-80" />
                  <span className="text-xs font-semibold uppercase opacity-80">Toplam Günlük Gelir (Satış + Servis)</span>
                </div>
                <p className="text-2xl font-black tabular-nums">₺{fmt(dailyClosing.combinedTotal)}</p>
                <p className="text-xs opacity-70 mt-1">
                  Satış ₺{fmt(dailyClosing.grandTotal)} · Servis ₺{fmt(dailyClosing.serviceRevenue)}
                </p>
              </div>
            </div>

            {/* Detay Kartları */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-[11px] text-gray-500 font-semibold uppercase">KDV Hariç</p>
                <p className="text-base font-bold text-gray-900 tabular-nums mt-0.5">₺{fmt(dailyClosing.subTotal)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-[11px] text-gray-500 font-semibold uppercase">KDV Toplamı</p>
                <p className="text-base font-bold text-gray-900 tabular-nums mt-0.5">₺{fmt(dailyClosing.taxTotal)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-[11px] text-gray-500 font-semibold uppercase">İndirim</p>
                <p className="text-base font-bold text-gray-900 tabular-nums mt-0.5">₺{fmt(dailyClosing.discountTotal)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-[11px] text-gray-500 font-semibold uppercase">Ort. Sepet</p>
                <p className="text-base font-bold text-gray-900 tabular-nums mt-0.5">₺{fmt(dailyClosing.averageBasket)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <p className="text-[11px] text-red-600 font-semibold uppercase">İptal</p>
                <p className="text-base font-bold text-red-700 tabular-nums mt-0.5">{dailyClosing.cancelCount} · ₺{fmt(dailyClosing.cancelTotal)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <p className="text-[11px] text-orange-600 font-semibold uppercase">İade</p>
                <p className="text-base font-bold text-orange-700 tabular-nums mt-0.5">{dailyClosing.returnCount} · ₺{fmt(dailyClosing.returnTotal)}</p>
              </div>
            </div>

            {/* Kâr Özeti */}
            <div className={`rounded-xl p-4 mb-4 border ${dailyClosing.grossProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {dailyClosing.grossProfit >= 0 ? <TrendingUp size={24} className="text-green-600" /> : <TrendingDown size={24} className="text-red-600" />}
                  <div>
                    <p className={`text-xs font-semibold uppercase ${dailyClosing.grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      Günlük Brüt {dailyClosing.grossProfit >= 0 ? 'Kâr' : 'Zarar'}
                    </p>
                    <p className={`text-2xl font-black tabular-nums ${dailyClosing.grossProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                      ₺{fmt(Math.abs(dailyClosing.grossProfit))}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Maliyet: ₺{fmt(dailyClosing.totalCost)}</p>
                  <p className="text-xs text-gray-500">Marj: %{dailyClosing.grossProfitMargin.toFixed(1)}</p>
                </div>
              </div>
            </div>

            {/* Alt Tab'lar */}
            <div className="flex gap-1 mb-4">
              {(['summary', 'hourly', 'cashier', 'products'] as const).map((tab) => (
                <button key={tab} onClick={() => setDailySubTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition ${dailySubTab === tab ? 'bg-emerald-100 text-emerald-800' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {tab === 'summary' && <><BarChart3 size={12} /> Ödeme Özeti</>}
                  {tab === 'hourly' && <><Clock size={12} /> Saatlik Dağılım</>}
                  {tab === 'cashier' && <><Users size={12} /> Kasiyer Bazlı</>}
                  {tab === 'products' && <><Package size={12} /> Günün Ürünleri</>}
                </button>
              ))}
            </div>

            {/* Ödeme Özeti */}
            {dailySubTab === 'summary' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Nakit', total: dailyClosing.cashTotal, count: dailyClosing.cashCount, color: 'green', icon: Banknote },
                  { label: 'Kredi Kartı / POS', total: dailyClosing.cardTotal, count: dailyClosing.cardCount, color: 'purple', icon: CreditCard },
                  { label: 'Veresiye', total: dailyClosing.creditTotal, count: dailyClosing.creditCount, color: 'amber', icon: Wallet },
                ].map((item) => {
                  const pct = dailyClosing.grandTotal > 0 ? (item.total / dailyClosing.grandTotal * 100) : 0;
                  return (
                    <div key={item.label} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <item.icon size={16} className="text-gray-500" />
                          <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.count} işlem</span>
                      </div>
                      <p className="text-2xl font-black text-gray-900 tabular-nums">₺{fmt(item.total)}</p>
                      <div className="mt-3">
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className={`h-full bg-${item.color}-500 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-right">%{pct.toFixed(1)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Saatlik Dağılım */}
            {dailySubTab === 'hourly' && (
              <div className="space-y-3">
                {/* Grafik barları */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-end gap-1" style={{ height: 160 }}>
                    {dailyClosing.hourlyBreakdown.map((h) => {
                      const maxTotal = Math.max(...dailyClosing.hourlyBreakdown.map(x => x.total), 1);
                      const barHeight = maxTotal > 0 ? (h.total / maxTotal * 100) : 0;
                      return (
                        <div key={h.hour} className="flex-1 flex flex-col items-center gap-1" title={`${h.hourLabel} — ₺${fmt(h.total)} (${h.saleCount} satış)`}>
                          <div className="w-full flex flex-col justify-end" style={{ height: 120 }}>
                            <div
                              className={`w-full rounded-t transition-all ${h.saleCount > 0 ? 'bg-emerald-500' : 'bg-gray-200'}`}
                              style={{ height: `${Math.max(barHeight, 2)}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-gray-400 font-mono">{h.hour}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Tablo */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Saat</th>
                        <th className="text-right px-4 py-2 font-semibold text-gray-600">Satış</th>
                        <th className="text-right px-4 py-2 font-semibold text-gray-600">Ürün</th>
                        <th className="text-right px-4 py-2 font-semibold text-gray-600">Tutar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyClosing.hourlyBreakdown.filter(h => h.saleCount > 0).map((h) => (
                        <tr key={h.hour} className="border-b border-gray-100">
                          <td className="px-4 py-2 font-mono text-gray-700">{h.hourLabel}</td>
                          <td className="px-4 py-2 text-right">{h.saleCount}</td>
                          <td className="px-4 py-2 text-right">{h.itemCount}</td>
                          <td className="px-4 py-2 text-right font-semibold">₺{fmt(h.total)}</td>
                        </tr>
                      ))}
                      {dailyClosing.hourlyBreakdown.filter(h => h.saleCount > 0).length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Bu tarihte satış bulunmuyor.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Kasiyer Bazlı */}
            {dailySubTab === 'cashier' && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold text-gray-600">Kasiyer</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Satış</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Toplam</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Nakit</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Kart</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Veresiye</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyClosing.cashierBreakdown.map((c) => (
                      <tr key={c.userId} className="border-b border-gray-100">
                        <td className="px-4 py-2 font-medium">{c.fullName}</td>
                        <td className="px-4 py-2 text-right">{c.saleCount}</td>
                        <td className="px-4 py-2 text-right font-bold">₺{fmt(c.total)}</td>
                        <td className="px-4 py-2 text-right text-green-700">₺{fmt(c.cashTotal)}</td>
                        <td className="px-4 py-2 text-right text-purple-700">₺{fmt(c.cardTotal)}</td>
                        <td className="px-4 py-2 text-right text-amber-700">₺{fmt(c.creditTotal)}</td>
                      </tr>
                    ))}
                    {dailyClosing.cashierBreakdown.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Bu tarihte satış bulunmuyor.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Günün En Çok Satan Ürünleri */}
            {dailySubTab === 'products' && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold text-gray-600">#</th>
                      <th className="text-left px-4 py-2 font-semibold text-gray-600">Ürün</th>
                      <th className="text-left px-4 py-2 font-semibold text-gray-600">Kategori</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Adet</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Gelir</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Kâr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyClosing.topProducts.map((p, i) => (
                      <tr key={p.productId} className="border-b border-gray-100">
                        <td className="px-4 py-2 text-gray-400 font-mono">{i + 1}</td>
                        <td className="px-4 py-2">
                          <div className="font-medium">{p.productName}</div>
                          <div className="text-xs text-gray-400">{p.barcode}</div>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{p.categoryName}</td>
                        <td className="px-4 py-2 text-right font-semibold">{p.totalQuantity}</td>
                        <td className="px-4 py-2 text-right">₺{fmt(p.totalRevenue)}</td>
                        <td className={`px-4 py-2 text-right font-semibold ${p.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>₺{fmt(p.totalProfit)}</td>
                      </tr>
                    ))}
                    {dailyClosing.topProducts.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Bu tarihte satış bulunmuyor.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'daily-closing' && !dailyClosing && !loading && (
          <p className="text-center text-gray-400 py-8">Tarih seçip "Rapor Getir" butonuna basın.</p>
        )}

        {/* ── Satış Raporu ── */}
        {activeTab === 'sales' && report && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600">Toplam Satış</p>
                <p className="text-2xl font-bold text-blue-900">₺{fmt(report.totalSales)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Satış Adedi</p>
                <p className="text-2xl font-bold text-green-900">{report.totalSaleCount}</p>
              </div>
            </div>
            <h3 className="font-semibold mb-3">Günlük Dağılım</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Tarih</th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-600">Satış Adedi</th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-600">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {report.dailyBreakdown.map((d) => (
                    <tr key={d.date} className="border-b border-gray-100">
                      <td className="px-4 py-2">{new Date(d.date).toLocaleDateString('tr-TR')}</td>
                      <td className="px-4 py-2 text-right">{d.saleCount}</td>
                      <td className="px-4 py-2 text-right font-medium">₺{fmt(d.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'sales' && !report && !loading && (
          <p className="text-center text-gray-400 py-8">Tarih aralığı seçip "Rapor Getir" butonuna basın.</p>
        )}

        {/* ── Kâr / Zarar Raporu ── */}
        {activeTab === 'profit' && profitReport && (
          <>
            {/* Özet kartları */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-blue-600 font-semibold uppercase">Toplam Gelir</p>
                <p className="text-xl font-black text-blue-900 tabular-nums mt-1">₺{fmt(profitReport.totalRevenue)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-xs text-red-600 font-semibold uppercase">Toplam Maliyet</p>
                <p className="text-xl font-black text-red-900 tabular-nums mt-1">₺{fmt(profitReport.totalCost)}</p>
              </div>
              <div className={`rounded-lg p-4 ${profitReport.grossProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className={`text-xs font-semibold uppercase ${profitReport.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitReport.grossProfit >= 0 ? 'Brüt Kâr' : 'Brüt Zarar'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {profitReport.grossProfit >= 0 ? <TrendingUp size={18} className="text-green-600" /> : <TrendingDown size={18} className="text-red-600" />}
                  <p className={`text-xl font-black tabular-nums ${profitReport.grossProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                    ₺{fmt(Math.abs(profitReport.grossProfit))}
                  </p>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-xs text-purple-600 font-semibold uppercase">Kâr Marjı</p>
                <div className="flex items-center gap-2 mt-1">
                  <Percent size={18} className="text-purple-600" />
                  <p className="text-xl font-black text-purple-900 tabular-nums">{profitReport.grossProfitMargin.toFixed(1)}%</p>
                </div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-xs text-amber-600 font-semibold uppercase">Satılan Ürün</p>
                <div className="flex items-center gap-2 mt-1">
                  <Package size={18} className="text-amber-600" />
                  <p className="text-xl font-black text-amber-900 tabular-nums">{profitReport.totalItemsSold}</p>
                </div>
              </div>
            </div>

            {/* Kâr alt tab'ları */}
            <div className="flex gap-1 mb-4">
              {(['summary', 'daily', 'category', 'products'] as const).map((tab) => (
                <button key={tab} onClick={() => setProfitSubTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${profitSubTab === tab ? 'bg-green-100 text-green-800' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {tab === 'summary' && 'Genel Özet'}
                  {tab === 'daily' && 'Günlük Kırılım'}
                  {tab === 'category' && 'Kategori Bazlı'}
                  {tab === 'products' && 'Ürün Bazlı'}
                </button>
              ))}
            </div>

            {/* Özet bar */}
            {profitSubTab === 'summary' && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Maliyet</span>
                  <span>Gelir</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  {profitReport.totalRevenue > 0 && (
                    <div
                      className={`h-full rounded-full transition-all ${profitReport.grossProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, (profitReport.totalCost / profitReport.totalRevenue) * 100)}%` }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>₺{fmt(profitReport.totalCost)}</span>
                  <span>₺{fmt(profitReport.totalRevenue)}</span>
                </div>
              </div>
            )}

            {/* Günlük kırılım */}
            {profitSubTab === 'daily' && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold text-gray-600">Tarih</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Satış</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Gelir</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Maliyet</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Kâr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitReport.dailyBreakdown.map((d) => (
                      <tr key={d.date} className="border-b border-gray-100">
                        <td className="px-4 py-2">{new Date(d.date).toLocaleDateString('tr-TR')}</td>
                        <td className="px-4 py-2 text-right">{d.saleCount}</td>
                        <td className="px-4 py-2 text-right">₺{fmt(d.revenue)}</td>
                        <td className="px-4 py-2 text-right text-red-600">₺{fmt(d.cost)}</td>
                        <td className={`px-4 py-2 text-right font-semibold ${d.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>₺{fmt(d.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Kategori bazlı */}
            {profitSubTab === 'category' && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold text-gray-600">Kategori</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Adet</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Gelir</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Maliyet</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Kâr</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Marj</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitReport.categoryBreakdown.map((c) => (
                      <tr key={c.categoryName} className="border-b border-gray-100">
                        <td className="px-4 py-2 font-medium">{c.categoryName}</td>
                        <td className="px-4 py-2 text-right">{c.itemsSold}</td>
                        <td className="px-4 py-2 text-right">₺{fmt(c.revenue)}</td>
                        <td className="px-4 py-2 text-right text-red-600">₺{fmt(c.cost)}</td>
                        <td className={`px-4 py-2 text-right font-semibold ${c.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>₺{fmt(c.profit)}</td>
                        <td className="px-4 py-2 text-right">%{c.profitMargin.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Ürün bazlı */}
            {profitSubTab === 'products' && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold text-gray-600">Ürün</th>
                      <th className="text-left px-4 py-2 font-semibold text-gray-600">Kategori</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Adet</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Gelir</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Maliyet</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Kâr</th>
                      <th className="text-right px-4 py-2 font-semibold text-gray-600">Marj</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitReport.topProfitProducts.map((p) => (
                      <tr key={p.barcode} className="border-b border-gray-100">
                        <td className="px-4 py-2">
                          <div className="font-medium">{p.productName}</div>
                          <div className="text-xs text-gray-400">{p.barcode}</div>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{p.categoryName}</td>
                        <td className="px-4 py-2 text-right">{p.quantitySold}</td>
                        <td className="px-4 py-2 text-right">₺{fmt(p.revenue)}</td>
                        <td className="px-4 py-2 text-right text-red-600">₺{fmt(p.cost)}</td>
                        <td className={`px-4 py-2 text-right font-semibold ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>₺{fmt(p.profit)}</td>
                        <td className="px-4 py-2 text-right">%{p.profitMargin.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'profit' && !profitReport && !loading && (
          <p className="text-center text-gray-400 py-8">Tarih aralığı seçip "Rapor Getir" butonuna basın.</p>
        )}

        {/* ── En Çok Satanlar ── */}
        {activeTab === 'top-products' && topProducts && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">#</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Ürün</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Kategori</th>
                  <th className="text-right px-4 py-2 font-semibold text-gray-600">Satış Adedi</th>
                  <th className="text-right px-4 py-2 font-semibold text-gray-600">Gelir</th>
                  <th className="text-right px-4 py-2 font-semibold text-gray-600">Kâr</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.productId} className="border-b border-gray-100">
                    <td className="px-4 py-2 text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-4 py-2">
                      <div className="font-medium">{p.productName}</div>
                      <div className="text-xs text-gray-400">{p.barcode}</div>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{p.categoryName}</td>
                    <td className="px-4 py-2 text-right font-semibold">{p.totalQuantity}</td>
                    <td className="px-4 py-2 text-right">₺{fmt(p.totalRevenue)}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${p.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>₺{fmt(p.totalProfit)}</td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Bu tarih aralığında satış bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'top-products' && !topProducts && !loading && (
          <p className="text-center text-gray-400 py-8">Tarih aralığı seçip "Rapor Getir" butonuna basın.</p>
        )}

        {/* ── Ödeme Dağılımı ── */}
        {activeTab === 'payment' && paymentSummary && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {paymentSummary.map((ps) => (
                <div key={ps.paymentType} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">{ps.paymentTypeName}</span>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{ps.count} işlem</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 tabular-nums">₺{fmt(ps.total)}</p>
                  {/* Yüzde barı */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${ps.percentage}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">%{ps.percentage.toFixed(1)}</p>
                  </div>
                </div>
              ))}
              {paymentSummary.length === 0 && (
                <p className="text-gray-400 col-span-full text-center py-8">Bu tarih aralığında satış bulunamadı.</p>
              )}
            </div>
          </>
        )}

        {activeTab === 'payment' && !paymentSummary && !loading && (
          <p className="text-center text-gray-400 py-8">Tarih aralığı seçip "Rapor Getir" butonuna basın.</p>
        )}

        {/* ── Düşük Stok ── */}
        {activeTab === 'low-stock' && lowStock && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Ürün</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-600">Kategori</th>
                  <th className="text-right px-4 py-2 font-semibold text-gray-600">Stok</th>
                  <th className="text-right px-4 py-2 font-semibold text-gray-600">Min Stok</th>
                  <th className="text-right px-4 py-2 font-semibold text-gray-600">Eksik</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item) => (
                  <tr key={item.productId} className="border-b border-gray-100">
                    <td className="px-4 py-2">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.barcode}</div>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{item.categoryName}</td>
                    <td className="px-4 py-2 text-right">
                      <span className={`font-semibold ${item.stockQuantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                        {item.stockQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">{item.minStockLevel}</td>
                    <td className="px-4 py-2 text-right">
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">-{item.deficit}</span>
                    </td>
                  </tr>
                ))}
                {lowStock.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Tüm ürünlerin stoku yeterli seviyede. 👍</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'low-stock' && !lowStock && !loading && (
          <p className="text-center text-gray-400 py-8">"Rapor Getir" butonuna basarak düşük stoklu ürünleri görüntüleyin.</p>
        )}

        {/* ── Servis Raporu ── */}
        {activeTab === 'services' && serviceItems && (
          <div className="space-y-4">
            {/* Özet kartları */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-4 text-white">
                <span className="text-xs font-semibold uppercase opacity-80">Toplam Servis</span>
                <p className="text-2xl font-black tabular-nums mt-1">{serviceItems.length}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                <span className="text-xs font-semibold uppercase opacity-80">Tamamlanan</span>
                <p className="text-2xl font-black tabular-nums mt-1">{serviceItems.filter(s => s.status === 'Tamamlandi' || s.status === 'TeslimEdildi').length}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
                <span className="text-xs font-semibold uppercase opacity-80">Devam Eden</span>
                <p className="text-2xl font-black tabular-nums mt-1">{serviceItems.filter(s => !['Tamamlandi','TeslimEdildi','IptalEdildi'].includes(s.status)).length}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <span className="text-xs font-semibold uppercase opacity-80">Toplam Ücret</span>
                <p className="text-2xl font-black tabular-nums mt-1">₺{fmt(serviceItems.reduce((a,s) => a + s.totalCost, 0))}</p>
              </div>
            </div>

            {/* Tablo */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Takip No</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Müşteri</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Cihaz</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Durum</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Öncelik</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Teknisyen</th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-600">Ücret</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Ödeme</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceItems.map((s) => (
                    <tr key={s.id} className="border-b border-gray-100">
                      <td className="px-4 py-2 font-mono text-xs font-bold text-primary">{s.serviceNumber}</td>
                      <td className="px-4 py-2">
                        <div className="font-medium text-gray-800">{s.customerName}</div>
                        {s.customerPhone && <div className="text-xs text-gray-400">{s.customerPhone}</div>}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{s.deviceName} {s.deviceBrand ? `(${s.deviceBrand})` : ''}</td>
                      <td className="px-4 py-2"><span className="text-xs font-semibold">{s.statusName}</span></td>
                      <td className="px-4 py-2"><span className="text-xs font-semibold">{s.priorityName}</span></td>
                      <td className="px-4 py-2 text-gray-600">{s.assignedUserName ?? '—'}</td>
                      <td className="px-4 py-2 text-right font-semibold tabular-nums">₺{fmt(s.totalCost)}</td>
                      <td className="px-4 py-2"><span className="text-xs font-semibold">{s.paymentStatusName}</span></td>
                      <td className="px-4 py-2 text-gray-500 text-xs">{new Date(s.createdAt).toLocaleDateString('tr-TR')}</td>
                    </tr>
                  ))}
                  {serviceItems.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Bu tarih aralığında servis kaydı bulunamadı.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'services' && !serviceItems && !loading && (
          <p className="text-center text-gray-400 py-8">Tarih aralığı seçip "Rapor Getir" butonuna basın.</p>
        )}
      </div>
    </div>
  );
}
