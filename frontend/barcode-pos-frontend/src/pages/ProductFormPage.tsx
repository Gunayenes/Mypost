import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsApi, exchangeRateApi } from '@/api/products';
import { categoriesApi } from '@/api/categories';
import { stockApi } from '@/api/stock';
import type { Product, Category, StockMovement } from '@/types';
import {
  ScanBarcode,
  Save,
  ArrowLeft,
  Package,
  Tag,
  AlertTriangle,
  TrendingUp,
  Percent,
  Info,
  CheckCircle,
  XCircle,
  Search,
  RotateCcw,
  DollarSign,
  Zap,
} from 'lucide-react';

interface ProductForm {
  barcode: string;
  name: string;
  description: string;
  categoryId: number;
  costPrice: number;
  salePrice: number;
  costPriceUsd: number;
  salePriceUsd: number;
  exchangeRate: number;
  taxRate: number;
  stockQuantity: number;
  minStockLevel: number;
}

type CurrencyMode = 'TRY' | 'USD';

const emptyForm: ProductForm = {
  barcode: '',
  name: '',
  description: '',
  categoryId: 0,
  costPrice: 0,
  salePrice: 0,
  costPriceUsd: 0,
  salePriceUsd: 0,
  exchangeRate: 0,
  taxRate: 18,
  stockQuantity: 0,
  minStockLevel: 5,
};

type Tab = 'info' | 'details';

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const barcodeSearchRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('TRY');
  const [categories, setCategories] = useState<Category[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [tab, setTab] = useState<Tab>('info');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [barcodeStatus, setBarcodeStatus] = useState<'idle' | 'waiting' | 'found' | 'new'>('idle');
  const [generatingBarcode, setGeneratingBarcode] = useState(false);
  const [fetchingRate, setFetchingRate] = useState(false);

  // USD seçildiğinde ve kur yoksa otomatik çek
  const fetchExchangeRate = useCallback(async () => {
    setFetchingRate(true);
    try {
      const { data: res } = await exchangeRateApi.getRate();
      if (res.success && res.data) {
        const rate = Math.round(res.data.usdTry * 100) / 100;
        setForm(f => ({
          ...f,
          exchangeRate: rate,
          costPrice: f.costPriceUsd > 0 && rate > 0 ? Math.round(f.costPriceUsd * rate * 100) / 100 : f.costPrice,
          salePrice: f.salePriceUsd > 0 && rate > 0 ? Math.round(f.salePriceUsd * rate * 100) / 100 : f.salePrice,
        }));
      }
    } catch { /* sessiz */ }
    setFetchingRate(false);
  }, []);

  // Kategorileri yükle
  useEffect(() => {
    categoriesApi.getAll().then((res) => {
      if (res.data.success && res.data.data) {
        setCategories(res.data.data);
        if (!isEdit && res.data.data.length > 0) {
          setForm((f) => ({ ...f, categoryId: res.data.data![0].id }));
        }
      }
    });
  }, [isEdit]);

  // Düzenleme modunda ürünü yükle
  useEffect(() => {
    if (!id) {
      setBarcodeStatus('waiting');
      setTimeout(() => barcodeSearchRef.current?.focus(), 100);
      return;
    }
    setLoading(true);
    productsApi.getById(+id).then((res) => {
      if (res.data.success && res.data.data) {
        const p = res.data.data;
        setExistingProduct(p);
        setForm({
          barcode: p.barcode,
          name: p.name,
          description: p.description ?? '',
          categoryId: p.categoryId,
          costPrice: p.costPrice,
          salePrice: p.salePrice,
          costPriceUsd: p.costPriceUsd ?? 0,
          salePriceUsd: p.salePriceUsd ?? 0,
          exchangeRate: p.exchangeRate ?? 0,
          taxRate: p.taxRate,
          stockQuantity: p.stockQuantity,
          minStockLevel: p.minStockLevel,
        });
        if (p.exchangeRate && p.exchangeRate > 0) setCurrencyMode('USD');
        setBarcodeStatus('found');
        setBarcodeSearch(p.barcode);
        loadMovements(p.id);
      }
      setLoading(false);
    });
  }, [id]);

  const loadMovements = useCallback(async (productId: number) => {
    try {
      const { data: res } = await stockApi.getAll({ productId, pageSize: 100 });
      if (res.success && res.data) {
        setMovements(res.data.items ?? []);
      }
    } catch { /* ignore */ }
  }, []);

  // Barkod ile ürün ara
  const handleBarcodeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeSearch.trim()) return;
    setError('');

    try {
      const { data: res } = await productsApi.getByBarcode(barcodeSearch.trim());
      if (res.success && res.data) {
        // Mevcut ürün bulundu — düzenleme moduna geç
        const p = res.data;
        setExistingProduct(p);
        setForm({
          barcode: p.barcode,
          name: p.name,
          description: p.description ?? '',
          categoryId: p.categoryId,
          costPrice: p.costPrice,
          salePrice: p.salePrice,
          costPriceUsd: p.costPriceUsd ?? 0,
          salePriceUsd: p.salePriceUsd ?? 0,
          exchangeRate: p.exchangeRate ?? 0,
          taxRate: p.taxRate,
          stockQuantity: p.stockQuantity,
          minStockLevel: p.minStockLevel,
        });
        if (p.exchangeRate && p.exchangeRate > 0) setCurrencyMode('USD');
        setBarcodeStatus('found');
        loadMovements(p.id);
        return;
      }
    } catch {
      // Ürün bulunamadı — yeni ürün moduna geç
    }

    setExistingProduct(null);
    setMovements([]);
    setForm({ ...emptyForm, barcode: barcodeSearch.trim(), categoryId: categories[0]?.id ?? 0 });
    setBarcodeStatus('new');
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  };

  // Otomatik barkod oluştur
  const handleGenerateBarcode = async () => {
    setError('');
    setGeneratingBarcode(true);
    try {
      const { data: res } = await productsApi.generateBarcode();
      if (res.success && res.data) {
        const barcode = res.data;
        setBarcodeSearch(barcode);
        setExistingProduct(null);
        setMovements([]);
        setForm({ ...emptyForm, barcode, categoryId: categories[0]?.id ?? 0 });
        setBarcodeStatus('new');
        setTimeout(() => barcodeInputRef.current?.focus(), 100);
      } else {
        setError(res.message ?? 'Barkod oluşturulamadı.');
      }
    } catch {
      setError('Barkod oluşturulurken hata oluştu.');
    } finally {
      setGeneratingBarcode(false);
    }
  };

  // Formu sıfırla
  const handleReset = () => {
    setForm(emptyForm);
    setCurrencyMode('TRY');
    setExistingProduct(null);
    setMovements([]);
    setBarcodeSearch('');
    setBarcodeStatus('waiting');
    setError('');
    setSuccess('');
    setTimeout(() => barcodeSearchRef.current?.focus(), 100);
  };

  // Kaydet
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.salePrice || form.salePrice <= 0) {
      setError('Satış fiyatı girilmelidir.');
      return;
    }
    if (!form.costPrice || form.costPrice <= 0) {
      setError('Alış fiyatı girilmelidir.');
      return;
    }

    setSaving(true);

    try {
      if (existingProduct) {
        // Güncelle
        const { data: res } = await productsApi.update(existingProduct.id, {
          categoryId: form.categoryId,
          barcode: form.barcode,
          name: form.name,
          description: form.description || null,
          costPrice: form.costPrice,
          salePrice: form.salePrice,
          costPriceUsd: currencyMode === 'USD' && form.costPriceUsd > 0 ? form.costPriceUsd : null,
          salePriceUsd: currencyMode === 'USD' && form.salePriceUsd > 0 ? form.salePriceUsd : null,
          exchangeRate: currencyMode === 'USD' && form.exchangeRate > 0 ? form.exchangeRate : null,
          taxRate: form.taxRate,
          minStockLevel: form.minStockLevel,
        });
        if (res.success) {
          setSuccess('Ürün başarıyla güncellendi!');
          setExistingProduct(res.data!);
        } else {
          setError(res.message ?? 'Güncelleme başarısız.');
        }
      } else {
        // Yeni oluştur
        const { data: res } = await productsApi.create({
          categoryId: form.categoryId,
          barcode: form.barcode,
          name: form.name,
          description: form.description || null,
          costPrice: form.costPrice,
          salePrice: form.salePrice,
          costPriceUsd: currencyMode === 'USD' && form.costPriceUsd > 0 ? form.costPriceUsd : null,
          salePriceUsd: currencyMode === 'USD' && form.salePriceUsd > 0 ? form.salePriceUsd : null,
          exchangeRate: currencyMode === 'USD' && form.exchangeRate > 0 ? form.exchangeRate : null,
          taxRate: form.taxRate,
          stockQuantity: form.stockQuantity,
          minStockLevel: form.minStockLevel,
        });
        if (res.success) {
          setSuccess('Ürün başarıyla oluşturuldu!');
          setExistingProduct(res.data!);
          setBarcodeStatus('found');
        } else {
          setError(res.message ?? 'Kayıt başarısız.');
        }
      }
    } catch {
      setError('İşlem sırasında hata oluştu.');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(''), 4000);
    }
  };

  // Hesaplamalar
  const profitMargin = form.salePrice > 0 && form.costPrice > 0
    ? ((form.salePrice - form.costPrice) / form.costPrice * 100).toFixed(1)
    : '0.0';
  const salePriceWithTax = form.salePrice * (1 + form.taxRate / 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ═══ Üst Bar ═══ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Ürün Düzenle' : 'Ürün Detayı'}
          </h1>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <RotateCcw size={14} /> Sıfırla
        </button>
      </div>

      {/* ═══ Barkod Arama Barı ═══ */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleBarcodeSearch} className="flex items-center gap-3">
          <div className="relative flex-1">
            <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              ref={barcodeSearchRef}
              type="text"
              value={barcodeSearch}
              onChange={(e) => setBarcodeSearch(e.target.value)}
              placeholder="Ürün barkodunu okutunuz..."
              className="w-full pl-10 pr-4 py-3 border-2 border-blue-400 rounded-lg focus:border-blue-600 outline-none text-base font-medium"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
          >
            <Search size={18} /> Ürünü Getir
          </button>
          <button
            type="button"
            onClick={handleGenerateBarcode}
            disabled={generatingBarcode}
            className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition disabled:opacity-50 whitespace-nowrap"
            title="Barkodsuz ürün için otomatik barkod oluştur"
          >
            {generatingBarcode ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Zap size={18} />
            )}
            Barkod Oluştur
          </button>
        </form>

        {/* Barkod durumu */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">BARKOD:</span>
          {barcodeStatus === 'waiting' && (
            <span className="text-xs px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full font-medium animate-pulse">
              Barkod numarası bekleniyor
            </span>
          )}
          {barcodeStatus === 'found' && (
            <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium flex items-center gap-1">
              <CheckCircle size={12} /> {form.barcode} — Mevcut ürün yüklendi
            </span>
          )}
          {barcodeStatus === 'new' && (
            <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-medium flex items-center gap-1">
              <Info size={12} /> {form.barcode} — {form.barcode.startsWith('20') && form.barcode.length === 13 ? 'Otomatik barkod oluşturuldu' : 'Yeni ürün oluşturulacak'}
            </span>
          )}
        </div>
      </div>

      {/* ═══ Bildirimler ═══ */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <XCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* ═══ Form Alanı ═══ */}
      {(barcodeStatus === 'found' || barcodeStatus === 'new') && (
        <form onSubmit={handleSave}>
          {/* Tab Header */}
          <div className="flex gap-0.5 mb-0">
            <button
              type="button"
              onClick={() => setTab('info')}
              className={`px-6 py-2.5 rounded-t-lg text-sm font-semibold transition ${
                tab === 'info'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Ürün Bilgisi
            </button>
            <button
              type="button"
              onClick={() => setTab('details')}
              className={`px-6 py-2.5 rounded-t-lg text-sm font-semibold transition ${
                tab === 'details'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Diğer Detaylar
            </button>
          </div>

          <div className="bg-white rounded-b-xl rounded-tr-xl border border-gray-200 p-6">
            {tab === 'info' && (
              <div className="space-y-5">
                {/* Satır 1: Ürün Adı, Stok, Kritik Stok */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_160px_160px] gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                      <Tag size={13} /> Ürün Adı
                    </label>
                    <input
                      ref={barcodeInputRef}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ürün adını giriniz"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                      <Package size={13} /> Kalan Stok
                    </label>
                    {existingProduct ? (
                      <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 tabular-nums">
                        {existingProduct.stockQuantity}
                      </div>
                    ) : (
                      <input
                        type="number"
                        value={form.stockQuantity || ''}
                        onChange={(e) => setForm({ ...form, stockQuantity: +e.target.value })}
                        placeholder="0"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:border-blue-500 outline-none"
                        min={0}
                      />
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                      <AlertTriangle size={13} /> Kritik Stok
                    </label>
                    <input
                      type="number"
                      value={form.minStockLevel || ''}
                      onChange={(e) => setForm({ ...form, minStockLevel: +e.target.value })}
                      placeholder="0"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:border-blue-500 outline-none"
                      min={0}
                    />
                  </div>
                </div>

                {/* Satır 2: Para Birimi Seçimi + Fiyatlar */}
                <div className="space-y-4">
                  {/* Para Birimi Toggle */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-600">Para Birimi:</span>
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrencyMode('TRY');
                          setForm(f => ({ ...f, costPriceUsd: 0, salePriceUsd: 0, exchangeRate: 0 }));
                        }}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${
                          currencyMode === 'TRY'
                            ? 'bg-white text-blue-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        ₺ TL
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrencyMode('USD');
                          if (form.exchangeRate <= 0) fetchExchangeRate();
                        }}
                        className={`flex items-center gap-1 px-4 py-1.5 rounded-md text-xs font-bold transition ${
                          currencyMode === 'USD'
                            ? 'bg-white text-green-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <DollarSign size={12} /> USD
                      </button>
                    </div>
                    {currencyMode === 'USD' && form.exchangeRate > 0 && (
                      <span className="text-xs text-gray-500">
                        1$ = {form.exchangeRate.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </span>
                    )}
                  </div>

                  {/* Dolar Kuru ve USD Fiyatları */}
                  {currencyMode === 'USD' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-green-800 mb-1.5">
                            <DollarSign size={13} /> Döviz Kuru (1 USD)
                          </label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-green-500">₺</span>
                              <input
                                type="number"
                                step="0.0001"
                                value={form.exchangeRate || ''}
                                onChange={(e) => {
                                  const rate = +e.target.value;
                                  setForm(f => ({
                                    ...f,
                                    exchangeRate: rate,
                                    costPrice: f.costPriceUsd > 0 && rate > 0 ? Math.round(f.costPriceUsd * rate * 100) / 100 : f.costPrice,
                                    salePrice: f.salePriceUsd > 0 && rate > 0 ? Math.round(f.salePriceUsd * rate * 100) / 100 : f.salePrice,
                                  }));
                                }}
                                placeholder="38.50"
                                className="w-full pl-7 pr-3 py-2.5 border border-green-300 rounded-lg text-sm font-medium focus:border-green-500 outline-none bg-white"
                                min={0}
                                required
                              />
                            </div>
                            <button
                              type="button"
                              onClick={fetchExchangeRate}
                              disabled={fetchingRate}
                              className="px-3 py-2.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition disabled:opacity-50 shrink-0"
                              title="Güncel kuru çek"
                            >
                              {fetchingRate ? <RotateCcw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-green-800 mb-1.5 block">
                            Satış Fiyatı (USD)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-green-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={form.salePriceUsd || ''}
                              onChange={(e) => {
                                const usd = +e.target.value;
                                setForm(f => ({
                                  ...f,
                                  salePriceUsd: usd,
                                  salePrice: usd > 0 && f.exchangeRate > 0 ? Math.round(usd * f.exchangeRate * 100) / 100 : f.salePrice,
                                }));
                              }}
                              placeholder="0.00"
                              className="w-full pl-7 pr-3 py-2.5 border border-green-300 rounded-lg text-sm font-medium focus:border-green-500 outline-none bg-white"
                              min={0}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-green-800 mb-1.5 block">
                            Alış Fiyatı (USD)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-green-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={form.costPriceUsd || ''}
                              onChange={(e) => {
                                const usd = +e.target.value;
                                setForm(f => ({
                                  ...f,
                                  costPriceUsd: usd,
                                  costPrice: usd > 0 && f.exchangeRate > 0 ? Math.round(usd * f.exchangeRate * 100) / 100 : f.costPrice,
                                }));
                              }}
                              placeholder="0.00"
                              className="w-full pl-7 pr-3 py-2.5 border border-green-300 rounded-lg text-sm font-medium focus:border-green-500 outline-none bg-white"
                              min={0}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TL Fiyatları */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                        Satış Fiyatı (KDV Hariç) {currencyMode === 'USD' && '— Hesaplanan'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₺</span>
                        <input
                          type="number"
                          step="0.01"
                          value={form.salePrice || ''}
                          onChange={(e) => setForm({ ...form, salePrice: +e.target.value })}
                          placeholder="0.00"
                          className={`w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:border-blue-500 outline-none ${
                            currencyMode === 'USD' ? 'bg-gray-50 text-gray-700' : ''
                          }`}
                          min={0}
                          required
                          readOnly={currencyMode === 'USD'}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                        Alış Fiyatı (KDV Hariç) {currencyMode === 'USD' && '— Hesaplanan'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₺</span>
                        <input
                          type="number"
                          step="0.01"
                          value={form.costPrice || ''}
                          onChange={(e) => setForm({ ...form, costPrice: +e.target.value })}
                          placeholder="0.00"
                          className={`w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:border-blue-500 outline-none ${
                            currencyMode === 'USD' ? 'bg-gray-50 text-gray-700' : ''
                          }`}
                          min={0}
                          required
                          readOnly={currencyMode === 'USD'}
                        />
                      </div>
                    </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5">
                      <TrendingUp size={13} /> Kâr Oranı
                    </label>
                    <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold tabular-nums flex items-center gap-1">
                      <Percent size={13} className="text-gray-400" />
                      <span className={+profitMargin > 0 ? 'text-green-600' : 'text-red-600'}>
                        {profitMargin}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                      KDV Oranı
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                        <input
                          type="number"
                          value={form.taxRate || ''}
                          onChange={(e) => setForm({ ...form, taxRate: +e.target.value })}
                          placeholder="0"
                          className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:border-blue-500 outline-none"
                          min={0}
                        />
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* KDV Dahil gösterge */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-700">KDV Dahil Satış Fiyatı</span>
                    <span className="text-lg font-black text-blue-800 tabular-nums">
                      ₺{salePriceWithTax.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Satır 3: Kategori, Barkod */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Ürün Grubu (Kategori)</label>
                    <select
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: +e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:border-blue-500 outline-none bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Barkod Numarası</label>
                    <input
                      value={form.barcode}
                      onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono font-medium focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {tab === 'details' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Açıklama</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Ürün açıklaması (opsiyonel)"
                    rows={4}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none resize-none"
                  />
                </div>
                {existingProduct && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[11px] text-gray-500 font-semibold">Ürün ID</p>
                      <p className="text-sm font-bold">{existingProduct.id}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[11px] text-gray-500 font-semibold">Durum</p>
                      <p className="text-sm font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${existingProduct.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {existingProduct.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[11px] text-gray-500 font-semibold">Oluşturulma</p>
                      <p className="text-sm font-bold">{new Date(existingProduct.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[11px] text-gray-500 font-semibold">Son Güncelleme</p>
                      <p className="text-sm font-bold">
                        {existingProduct.updatedAt
                          ? new Date(existingProduct.updatedAt).toLocaleDateString('tr-TR')
                          : '—'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Kaydet butonu */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-500 text-white rounded-lg font-semibold text-sm hover:bg-green-600 transition disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? 'Kaydediliyor...' : 'Ürünü Kaydet'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ═══ Ürüne Ait Stok Hareketleri ═══ */}
      {existingProduct && movements.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="text-sm font-bold text-gray-700">
              Ürüne Ait Son İşlemler ({movements.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Sıra</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Tür</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Tarih</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">İşlemi Yapan</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Miktar</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Sonrası</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Not</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m, idx) => (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.type === 'Giris' ? 'bg-green-100 text-green-700'
                          : m.type === 'Satis' ? 'bg-blue-100 text-blue-700'
                          : m.type === 'Iade' ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {m.typeName}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600 tabular-nums">
                      {new Date(m.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600">{m.userFullName}</td>
                    <td className={`px-4 py-2 text-right font-bold text-xs tabular-nums ${
                      m.quantity > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-gray-700 font-medium tabular-nums">
                      {m.stockAfter}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500 max-w-[200px] truncate">
                      {m.note ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
