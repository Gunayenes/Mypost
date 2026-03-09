import { useState } from 'react';
import { reportsApi } from '@/api/dashboard';
import {
  BarChart3, Download, TrendingUp, TrendingDown, DollarSign, Percent,
  ShoppingCart, Package, AlertTriangle, CreditCard, Loader2,
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

type TabKey = 'sales' | 'profit' | 'top-products' | 'payment' | 'low-stock';

function toast(type: 'success' | 'error', message: string) {
  window.dispatchEvent(new CustomEvent('toast', { detail: { type, message } }));
}

const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const defaultEndDate = new Date().toISOString().split('T')[0];

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [activeTab, setActiveTab] = useState<TabKey>('sales');
  const [loading, setLoading] = useState(false);

  // Veri state'leri
  const [report, setReport] = useState<ReportData | null>(null);
  const [profitReport, setProfitReport] = useState<ProfitData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[] | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary[] | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[] | null>(null);

  const [profitSubTab, setProfitSubTab] = useState<'summary' | 'daily' | 'category' | 'products'>('summary');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [salesRes, profitRes, topRes, payRes, lowRes] = await Promise.all([
        reportsApi.salesReport(startDate, endDate),
        reportsApi.profitReport(startDate, endDate),
        reportsApi.topProducts(startDate, endDate),
        reportsApi.paymentSummary(startDate, endDate),
        reportsApi.lowStock(),
      ]);
      if (salesRes.data.success) setReport(salesRes.data.data);
      if (profitRes.data.success) setProfitReport(profitRes.data.data);
      if (topRes.data.success) setTopProducts(topRes.data.data);
      if (payRes.data.success) setPaymentSummary(payRes.data.data);
      if (lowRes.data.success) setLowStock(lowRes.data.data);
    } catch {
      toast('error', 'Raporlar yüklenirken hata oluştu.');
    }
    setLoading(false);
  };

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
      case 'profit': return 'profit';
      case 'top-products': return 'top-products';
      case 'low-stock': return 'low-stock';
      default: return 'sales';
    }
  };

  const fmt = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const tabs: { key: TabKey; label: string; icon: typeof BarChart3; color: string }[] = [
    { key: 'sales', label: 'Satış Raporu', icon: BarChart3, color: 'blue' },
    { key: 'profit', label: 'Kâr / Zarar', icon: DollarSign, color: 'green' },
    { key: 'top-products', label: 'En Çok Satanlar', icon: ShoppingCart, color: 'purple' },
    { key: 'payment', label: 'Ödeme Dağılımı', icon: CreditCard, color: 'indigo' },
    { key: 'low-stock', label: 'Düşük Stok', icon: AlertTriangle, color: 'red' },
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
          {tabs.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition ${
                activeTab === key
                  ? `bg-${color}-500 text-white`
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={activeTab === key ? { backgroundColor: `var(--color-${color}, '')` } : undefined}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

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
      </div>
    </div>
  );
}
