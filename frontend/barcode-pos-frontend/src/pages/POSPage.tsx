import { useState, useRef, useEffect, useCallback } from 'react';
import { productsApi } from '@/api/products';
import { categoriesApi } from '@/api/categories';
import { customersApi } from '@/api/customers';
import { salesApi } from '@/api/sales';
import { useCartStore } from '@/store/cartStore';
import { useStoreSettings } from '@/store/storeSettingsStore';
import { playBeep, playErrorBeep } from '@/utils/beep';
import type { Product, Category, Customer } from '@/types';
import {
  ScanBarcode,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Wallet,
  Search,
  Printer,
  Clock,
  X,
  CheckCircle,
  ShoppingBag,
  Tag,
  User,
  UserPlus,
  Split,
} from 'lucide-react';

export default function POSPage() {
  const [barcode, setBarcode] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [processing, setProcessing] = useState(false);
  const [now, setNow] = useState(new Date());
  const inputRef = useRef<HTMLInputElement>(null);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeyTimeRef = useRef<number>(0);

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const storeSettings = useStoreSettings((s) => s.settings);
  const [splitCash, setSplitCash] = useState(0);
  const [splitCard, setSplitCard] = useState(0);
  const [priceView, setPriceView] = useState<{ name: string; price: number; tax: number; barcode: string } | null>(null);

  const {
    items,
    customerId,
    paymentType,
    paidAmount,
    roundingAmount,
    discountTotal,
    setCustomerId,
    setPaymentType,
    setPaidAmount,
    setRoundingAmount,
    setDiscountTotal,
    addProduct,
    removeItem,
    updateQuantity,
    clearCart,
    getSubTotal,
    getTaxTotal,
    getGrandTotal,
    getRoundedGrandTotal,
    getChange,
    getItemCount,
  } = useCartStore();

  // Saat güncelle
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Kategorileri yükle
  useEffect(() => {
    categoriesApi.getAll().then((res) => {
      if (res.data.success && res.data.data) {
        setCategories(res.data.data);
      }
    });
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Kategori ürünlerini yükle
  const loadCategoryProducts = useCallback(async (categoryId: number) => {
    setActiveCategory(categoryId);
    try {
      const { data: res } = await productsApi.getAll({ categoryId });
      if (res.success && res.data) {
        setCategoryProducts(res.data.items ?? []);
      }
    } catch {
      setCategoryProducts([]);
    }
  }, []);

  // Barkod / arama
  const handleBarcodeScan = async (value?: string) => {
    // Bekleyen otomatik tarama zamanlayıcısını temizle (çift tetiklenmeyi önle)
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    const code = (value ?? barcode).trim();
    if (!code) return;
    setError('');
    setSearchResults([]);
    setActiveCategory(null);
    setCategoryProducts([]);

    try {
      const { data: res } = await productsApi.getByBarcode(code);
      if (res.success && res.data) {
        playBeep();
        addProduct(res.data);
        setBarcode('');
        inputRef.current?.focus();
        return;
      }
    } catch { /* barkod bulunamadı */ }

    try {
      const { data: res } = await productsApi.search(code);
      if (res.success && res.data && res.data.length > 0) {
        setSearchResults(res.data);
      } else {
        playErrorBeep();
          setError('Ürün bulunamadı.');
          setTimeout(() => setError(''), 3000);
      }
    } catch {
      setError('Arama hatası.');
      setTimeout(() => setError(''), 3000);
    }
    setBarcode('');
    inputRef.current?.focus();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleBarcodeScan();
  };

  // Barkod okuyucu algılama: hızlı ardışık giriş + duraksama → otomatik arama
  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcode(value);

    const now = Date.now();
    const timeSinceLastKey = now - lastKeyTimeRef.current;
    lastKeyTimeRef.current = now;

    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);

    // Okuyucu çok hızlı yazar (<50ms arası). Metin ≥4 karakter ve
    // son tuş hızlı geldiyse, kısa bir duraksama sonrası otomatik tetikle.
    if (value.length >= 4 && timeSinceLastKey < 50) {
      scanTimerRef.current = setTimeout(() => {
        handleBarcodeScan(value);
      }, 150);
    }
  };

  const handleSelectProduct = (product: Product) => {
    playBeep();
    addProduct(product);
    setSearchResults([]);
    inputRef.current?.focus();
  };

  // Müşteri arama
  const handleCustomerSearch = async (query: string) => {
    setCustomerSearch(query);
    if (query.trim().length < 2) {
      setCustomerResults([]);
      return;
    }
    try {
      const { data: res } = await customersApi.getAll({ search: query.trim(), pageSize: 10 });
      if (res.success && res.data) {
        setCustomerResults(res.data.items ?? []);
      }
    } catch {
      setCustomerResults([]);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerId(customer.id);
    setCustomerSearch('');
    setCustomerResults([]);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerId(null);
    setCustomerSearch('');
    setCustomerResults([]);
  };

  const handleCompleteSale = async () => {
    if (items.length === 0) return;
    const total = getRoundedGrandTotal();

    // Nakit/Kart ödemede ödenen tutar kontrolü
    if (paymentType !== 'Veresiye' && paidAmount < total) {
      setError('Ödenen tutar yetersiz.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Veresiye ise müşteri zorunlu
    if (paymentType === 'Veresiye' && !customerId) {
      setError('Veresiye satışında müşteri seçimi zorunludur.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setProcessing(true);
    setError('');
    try {
      const { data: res } = await salesApi.create({
        customerId,
        paymentType,
        paidAmount: paymentType === 'Parcali' ? splitCash + splitCard : paidAmount,
        paidCash: paymentType === 'Parcali' ? splitCash : 0,
        paidCard: paymentType === 'Parcali' ? splitCard : 0,
        discountTotal: roundingAmount + discountTotal,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          discountAmount: i.discountAmount,
        })),
      });
      if (res.success) {
        setSuccessMsg(`✓ Satış tamamlandı! Fiş: ${res.data?.receiptNumber}`);
        clearCart();
        setSplitCash(0);
        setSplitCard(0);
        handleClearCustomer();
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setError(res.message ?? 'Satış başarısız.');
      }
    } catch {
      setError('Satış işlemi sırasında hata oluştu.');
    } finally {
      setProcessing(false);
      inputRef.current?.focus();
    }
  };

  // Klavye kısayolları
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F8') { e.preventDefault(); setPaymentType('Nakit'); }
      if (e.key === 'F9') { e.preventDefault(); setPaymentType('Kart'); }
      if (e.key === 'F10') { e.preventDefault(); setPaymentType('Veresiye'); }
      if (e.key === 'F11') { e.preventDefault(); setPaymentType('Parcali'); setSplitCash(0); setSplitCard(0); }
      if (e.key === 'F12') { e.preventDefault(); handleCompleteSale(); }
      if (e.key === 'Escape') { clearCart(); handleClearCustomer(); inputRef.current?.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [items, paymentType]);

  const grandTotal = getRoundedGrandTotal();

  const printReceipt = () => {
    if (items.length === 0) { setError('Sepet boş.'); return; }
    const storeName = storeSettings?.name || 'Cari Soft';
    const storePhone = storeSettings?.phone || '';
    const storeAddress = storeSettings?.address || '';
    const date = new Date();
    const dateStr = date.toLocaleDateString('tr-TR');
    const timeStr = date.toLocaleTimeString('tr-TR');
    const subTotal = getSubTotal();
    const taxTotal = getTaxTotal();
    const disc = discountTotal;

    const rows = items.map((item, i) => `
      <tr>
        <td style="text-align:left;padding:3px 0;font-size:12px;">${i + 1}. ${item.name}</td>
        <td style="text-align:center;font-size:12px;">${item.quantity}</td>
        <td style="text-align:right;font-size:12px;">${item.unitPrice.toFixed(2)}</td>
        <td style="text-align:right;font-size:12px;">${(item.unitPrice * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fiş</title>
    <style>
      @page { margin: 0; size: 80mm auto; }
      body { font-family: 'Courier New', monospace; width: 72mm; margin: 4mm auto; font-size: 12px; color: #000; }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .line { border-top: 1px dashed #000; margin: 6px 0; }
      table { width: 100%; border-collapse: collapse; }
      th { text-align: left; font-size: 11px; border-bottom: 1px solid #000; padding: 2px 0; }
      .right { text-align: right; }
      .total-row { font-size: 14px; font-weight: bold; }
    </style></head><body>
      <div class="center bold" style="font-size:16px;margin-bottom:2px;">${storeName}</div>
      ${storeAddress ? `<div class="center" style="font-size:10px;">${storeAddress}</div>` : ''}
      ${storePhone ? `<div class="center" style="font-size:10px;">Tel: ${storePhone}</div>` : ''}
      <div class="line"></div>
      <div style="display:flex;justify-content:space-between;font-size:11px;">
        <span>${dateStr}</span><span>${timeStr}</span>
      </div>
      ${selectedCustomer ? `<div style="font-size:11px;">Müşteri: ${selectedCustomer.fullName}</div>` : ''}
      <div class="line"></div>
      <table>
        <tr><th>Ürün</th><th style="text-align:center;">Ad.</th><th class="right">Fiyat</th><th class="right">Tutar</th></tr>
        ${rows}
      </table>
      <div class="line"></div>
      <table>
        <tr><td>Ara Toplam</td><td class="right">${subTotal.toFixed(2)} ₺</td></tr>
        <tr><td>KDV</td><td class="right">${taxTotal.toFixed(2)} ₺</td></tr>
        ${disc > 0 ? `<tr><td>İndirim</td><td class="right">-${disc.toFixed(2)} ₺</td></tr>` : ''}
        ${roundingAmount !== 0 ? `<tr><td>Yuvarlama</td><td class="right">${roundingAmount > 0 ? '-' : '+'}${Math.abs(roundingAmount).toFixed(2)} ₺</td></tr>` : ''}
      </table>
      <div class="line"></div>
      <div style="display:flex;justify-content:space-between;" class="total-row">
        <span>TOPLAM</span><span>${grandTotal.toFixed(2)} ₺</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:4px;">
        <span>Ödeme: ${paymentType === 'Parcali' ? 'Parçalı' : paymentType === 'Kart' ? 'Kredi Kartı' : paymentType}</span>
        <span>Ödenen: ${paidAmount.toFixed(2)} ₺</span>
      </div>
      ${paymentType === 'Parcali' ? `<div style="font-size:11px;">Nakit: ${splitCash.toFixed(2)} ₺ | Kart: ${splitCard.toFixed(2)} ₺</div>` : ''}
      ${paidAmount > grandTotal ? `<div style="font-size:12px;"><b>Para Üstü: ${(paidAmount - grandTotal).toFixed(2)} ₺</b></div>` : ''}
      <div class="line"></div>
      <div class="center" style="font-size:10px;margin-top:6px;">Bizi tercih ettiğiniz için teşekkürler!</div>
      <div class="center" style="font-size:9px;color:#888;margin-top:2px;">Cari Soft POS</div>
    </body></html>`;

    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => { printWindow.print(); printWindow.close(); };
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -m-6">
      {/* ═══ ÜST BAR — Barkod + Tutar Göstergeleri ═══ */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        {/* Barkod arama satırı */}
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2 mb-3">
          <div className="relative flex-1 min-w-0">
            <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            <input
              ref={inputRef}
              type="text"
              value={barcode}
              onChange={handleBarcodeChange}
              placeholder="Barkod veya ürün adı..."
              className="w-full pl-10 pr-4 py-3 border-2 border-blue-400 rounded-lg focus:border-blue-600 outline-none text-base font-medium"
              autoComplete="off"
            />
          </div>
          <button type="submit" title="Ara" className="flex items-center justify-center gap-1.5 px-3 xl:px-5 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition shrink-0">
            <Search size={18} /> <span className="hidden xl:inline">Ara</span>
          </button>
          <button
            type="button"
            title="Fiyat Gör"
            onClick={async () => {
              if (!barcode.trim()) { setError('Barkod giriniz.'); return; }
              try {
                const { data: res } = await productsApi.getByBarcode(barcode.trim());
                if (res.success && res.data) {
                  setError('');
                  setPriceView({ name: res.data.name, price: res.data.salePrice, tax: res.data.taxRate, barcode: res.data.barcode });
                } else { setError('Ürün bulunamadı.'); }
              } catch { setError('Ürün bulunamadı.'); }
            }}
            className="flex items-center justify-center gap-1.5 px-3 xl:px-4 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition shrink-0"
          >
            <Tag size={18} /> <span className="hidden xl:inline">Fiyat Gör</span>
          </button>
          <button
            type="button"
            title="Yazdır"
            onClick={printReceipt}
            className="flex items-center justify-center gap-1.5 px-3 xl:px-4 py-3 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition shrink-0"
          >
            <Printer size={18} /> <span className="hidden xl:inline">Yazdır</span>
          </button>
        </form>

        {/* Ödenen / Tutar / Para Üstü göstergeleri */}
        <div className="grid grid-cols-3 gap-2 xl:gap-3">
          <div className="border-2 border-gray-300 rounded-lg p-2 xl:p-3">
            <span className="text-[10px] xl:text-xs font-semibold text-gray-500 uppercase tracking-wide">Ödenen</span>
            <p className="text-lg xl:text-2xl 2xl:text-3xl font-black text-gray-900 tabular-nums">
              ₺{paidAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="border-2 border-red-300 rounded-lg p-2 xl:p-3 bg-red-50/50">
            <span className="text-[10px] xl:text-xs font-semibold text-red-500 uppercase tracking-wide">Tutar</span>
            <p className="text-lg xl:text-2xl 2xl:text-3xl font-black text-red-600 tabular-nums">
              ₺{grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="border-2 border-gray-300 rounded-lg p-2 xl:p-3">
            <span className="text-[10px] xl:text-xs font-semibold text-gray-500 uppercase tracking-wide">Para Üstü</span>
            <p className="text-lg xl:text-2xl 2xl:text-3xl font-black text-gray-900 tabular-nums">
              ₺{getChange().toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Arama sonuçları overlay */}
      {searchResults.length > 0 && (
        <div className="absolute top-32 left-4 right-4 z-40 bg-white border-2 border-blue-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b">
            <span className="text-sm font-semibold text-blue-700">Arama Sonuçları ({searchResults.length})</span>
            <button onClick={() => setSearchResults([])} className="p-1 hover:bg-blue-100 rounded"><X size={16} /></button>
          </div>
          {searchResults.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectProduct(p)}
              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-100 last:border-0 flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-gray-500">{p.barcode} · {p.categoryName} · Stok: {p.stockQuantity}</p>
              </div>
              <span className="font-bold text-blue-600 text-sm">₺{p.salePrice.toFixed(2)}</span>
            </button>
          ))}
        </div>
      )}

      {/* ═══ ANA İÇERİK — Sol: Ürün Tablosu / Sağ: Ödeme Paneli ═══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ─── SOL PANEL: Ürün Listesi ─── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Ürün header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-blue-600" />
              <span className="font-bold text-base text-gray-700">
                Ürünler ({getItemCount()} kalem)
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Ara Toplam: <b className="text-gray-800 text-base">₺{getSubTotal().toFixed(2)}</b></span>
              <span>KDV: <b className="text-gray-800 text-base">₺{getTaxTotal().toFixed(2)}</b></span>
            </div>
          </div>

          {/* Tablo header */}
          <div className="grid grid-cols-[40px_1fr_120px_70px_120px_130px_40px] gap-1 px-3 py-3 bg-white border-b text-sm font-bold text-gray-500 uppercase tracking-wider">
            <span className="text-center">#</span>
            <span>Ürün</span>
            <span className="text-center">Miktar</span>
            <span className="text-center">KDV%</span>
            <span className="text-right">Fiyat</span>
            <span className="text-right">Tutar</span>
            <span />
          </div>

          {/* Tablo body */}
          <div className="flex-1 overflow-y-auto bg-white">
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ScanBarcode size={48} strokeWidth={1} className="mb-3 text-gray-300" />
                <p className="text-sm">Barkod okutarak veya ürün arayarak ürün ekleyin</p>
                <p className="text-xs mt-1">Hızlı ürün seçimi için alt kısımdaki kategorileri kullanın</p>
              </div>
            )}
            {items.map((item, idx) => (
              <div
                key={item.productId}
                className={`grid grid-cols-[40px_1fr_120px_70px_120px_130px_40px] gap-1 px-3 py-3 items-center border-b border-gray-100 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                } hover:bg-blue-50/50 transition-colors`}
              >
                <span className="text-center text-base text-gray-400 font-black">{idx + 1}</span>
                <div className="min-w-0" title={`Alış: ₺${item.costPrice.toFixed(2)} | Kâr: ₺${((item.unitPrice - item.costPrice) * item.quantity).toFixed(2)}`}>
                  <p className="font-black text-lg text-gray-900 truncate">{item.name}</p>
                  <p className="text-sm text-gray-400 font-mono">{item.barcode}</p>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-red-100 rounded-lg text-gray-600 hover:text-red-600 transition"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.productId, Math.max(1, +e.target.value || 1))}
                    className="w-12 text-center font-black text-base border-2 border-gray-300 rounded-lg py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-green-100 rounded-lg text-gray-600 hover:text-green-600 transition"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="text-center text-sm text-gray-500 font-medium">%{item.taxRate}</span>
                <span className="text-right text-base font-bold tabular-nums">₺{item.unitPrice.toFixed(2)}</span>
                <span className="text-right text-lg font-black text-gray-900 tabular-nums">
                  ₺{(item.unitPrice * item.quantity).toFixed(2)}
                </span>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Kategori hızlı seçim */}
          <div className="border-t border-gray-200 bg-gray-50 p-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => loadCategoryProducts(cat.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {/* Kategori ürünleri */}
            {categoryProducts.length > 0 && (
              <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                {categoryProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { playBeep(); addProduct(p); inputRef.current?.focus(); }}
                    className="shrink-0 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition text-left"
                  >
                    <p className="text-xs font-semibold text-gray-800 truncate max-w-[120px]">{p.name}</p>
                    <p className="text-[10px] text-blue-600 font-bold">₺{p.salePrice.toFixed(2)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── SAĞ PANEL: Ödeme ─── */}
        <div className="w-64 xl:w-72 2xl:w-80 border-l border-gray-200 bg-white flex flex-col shrink-0">
          {/* Tarih/Saat */}
          <div className="px-3 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2 text-sm text-gray-500">
            <Clock size={16} />
            <span className="tabular-nums font-bold">
              {now.toLocaleDateString('tr-TR')} {now.toLocaleTimeString('tr-TR')}
            </span>
          </div>

          {/* Ödenen Tutar */}
          <div className="px-3 py-3 border-b border-gray-200">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ödenen Tutar</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">₺</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={paidAmount || ''}
                  onChange={(e) => setPaidAmount(Math.max(0, +e.target.value || 0))}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-3 border-2 border-gray-300 rounded-lg text-lg font-black text-right tabular-nums focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <button
                onClick={() => setPaidAmount(grandTotal)}
                className="px-5 py-3 bg-blue-600 text-white rounded-lg text-sm font-black hover:bg-blue-700 transition shrink-0"
              >
                Tam
              </button>
            </div>
            {paidAmount > 0 && paidAmount >= grandTotal && grandTotal > 0 && (
              <div className="mt-1.5 text-right text-sm font-bold text-green-600">
                Para Üstü: ₺{(paidAmount - grandTotal).toFixed(2)}
              </div>
            )}
          </div>

          {/* Ödeme tipi butonları */}
          <div className="px-3 py-3 border-b border-gray-200 space-y-2">
            <div className="grid grid-cols-2 2xl:grid-cols-4 gap-1.5">
              <button
                onClick={() => setPaymentType('Nakit')}
                className={`flex flex-col items-center gap-0.5 py-2.5 rounded-lg text-[11px] font-bold transition border-2 ${
                  paymentType === 'Nakit'
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <Banknote size={18} />
                <span>NAKİT</span>
                <span className="text-[9px] font-normal opacity-70">F8</span>
              </button>
              <button
                onClick={() => setPaymentType('Kart')}
                className={`flex flex-col items-center gap-0.5 py-2.5 rounded-lg text-[11px] font-bold transition border-2 ${
                  paymentType === 'Kart'
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <CreditCard size={18} />
                <span>POS</span>
                <span className="text-[9px] font-normal opacity-70">F9</span>
              </button>
              <button
                onClick={() => setPaymentType('Veresiye')}
                className={`flex flex-col items-center gap-0.5 py-2.5 rounded-lg text-[11px] font-bold transition border-2 ${
                  paymentType === 'Veresiye'
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-orange-300 hover:bg-orange-50'
                }`}
              >
                <Wallet size={18} />
                <span>VERESİYE</span>
                <span className="text-[9px] font-normal opacity-70">F10</span>
              </button>
              <button
                onClick={() => { setPaymentType('Parcali'); setSplitCash(0); setSplitCard(0); }}
                className={`flex flex-col items-center gap-0.5 py-2.5 rounded-lg text-[11px] font-bold transition border-2 ${
                  paymentType === 'Parcali'
                    ? 'border-purple-500 bg-purple-500 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                <Split size={18} />
                <span>PARÇALI</span>
                <span className="text-[9px] font-normal opacity-70">F11</span>
              </button>
            </div>

            {/* Parçalı ödeme detayları */}
            {paymentType === 'Parcali' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Banknote size={14} className="text-green-600 shrink-0" />
                  <span className="text-xs font-semibold text-gray-600 w-14">Nakit</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₺</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={splitCash || ''}
                      onChange={(e) => {
                        const cash = Math.max(0, +e.target.value || 0);
                        setSplitCash(cash);
                        setPaidAmount(cash + splitCard);
                      }}
                      placeholder="0.00"
                      className="w-full pl-6 pr-2 py-2 border border-purple-300 rounded-lg text-sm font-bold text-right focus:border-purple-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard size={14} className="text-blue-600 shrink-0" />
                  <span className="text-xs font-semibold text-gray-600 w-14">Kart</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₺</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={splitCard || ''}
                      onChange={(e) => {
                        const card = Math.max(0, +e.target.value || 0);
                        setSplitCard(card);
                        setPaidAmount(splitCash + card);
                      }}
                      placeholder="0.00"
                      className="w-full pl-6 pr-2 py-2 border border-purple-300 rounded-lg text-sm font-bold text-right focus:border-purple-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-purple-200">
                  <span className="text-purple-700 font-semibold">Toplam Ödenen</span>
                  <span className="font-black text-purple-800">₺{(splitCash + splitCard).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Müşteri Seçimi — Veresiye seçilince veya müşteri atanmışsa göster */}
          {(paymentType === 'Veresiye' || selectedCustomer) && (
            <div className="px-3 py-2.5 border-b border-gray-200">
              {selectedCustomer ? (
                <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <User size={14} className="text-orange-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-orange-800 truncate">{selectedCustomer.fullName}</p>
                      {selectedCustomer.phone && (
                        <p className="text-[10px] text-orange-600">{selectedCustomer.phone}</p>
                      )}
                      <p className="text-[10px] text-orange-600">
                        Bakiye: ₺{selectedCustomer.balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClearCustomer}
                    className="p-1 hover:bg-orange-100 rounded text-orange-500 hover:text-orange-700 transition shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <UserPlus className="absolute left-2.5 top-1/2 -translate-y-1/2 text-orange-400" size={14} />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => handleCustomerSearch(e.target.value)}
                      placeholder="Müşteri ara (ad veya telefon)..."
                      className="w-full pl-8 pr-3 py-2 border border-orange-300 rounded-lg text-xs focus:border-orange-500 outline-none bg-orange-50/50"
                    />
                  </div>
                  {customerResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-orange-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {customerResults.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className="w-full text-left px-3 py-2 hover:bg-orange-50 border-b border-gray-100 last:border-0"
                        >
                          <p className="text-xs font-semibold text-gray-800">{c.fullName}</p>
                          <p className="text-[10px] text-gray-500">
                            {c.phone && `${c.phone} · `}Bakiye: ₺{c.balance.toFixed(2)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bildirimler */}
          {error && (
            <div className="mx-3 mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 font-medium">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mx-3 mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700 font-medium flex items-center gap-1">
              <CheckCircle size={14} /> {successMsg}
            </div>
          )}

          {/* Alt toplam */}
          <div className="mt-auto border-t border-gray-200">
            <div className="px-3 py-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span className="font-medium">Ara Toplam</span>
                <span className="tabular-nums font-bold text-gray-800">₺{getSubTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span className="font-medium">KDV</span>
                <span className="tabular-nums font-bold text-gray-800">₺{getTaxTotal().toFixed(2)}</span>
              </div>
              {/* İndirim */}
              {items.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-500">İndirim</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-red-400">-₺</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={discountTotal || ''}
                      onChange={(e) => setDiscountTotal(Math.max(0, +e.target.value || 0))}
                      placeholder="0.00"
                      className="w-24 text-right text-sm font-bold tabular-nums border border-gray-200 rounded-md px-2 py-1 focus:border-red-400 focus:ring-1 focus:ring-red-200 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              )}
              {roundingAmount !== 0 && (
                <div className="flex justify-between text-amber-600">
                  <span className="font-medium">Yuvarlama</span>
                  <span className="tabular-nums font-bold">
                    {roundingAmount > 0 ? '-' : '+'}₺{Math.abs(roundingAmount).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Yuvarlama butonları */}
            {items.length > 0 && (
              <div className="px-3 pb-2 flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase shrink-0">Yuvarla:</span>
                {[0.5, 1, 5, 10].map((step) => {
                  const raw = getGrandTotal();
                  const rounded = Math.round(raw / step) * step;
                  const diff = Math.round((raw - rounded) * 100) / 100;
                  const isActive = roundingAmount !== 0 && Math.abs(roundingAmount - diff) < 0.005;
                  return (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setRoundingAmount(isActive ? 0 : diff)}
                      className={`px-2 py-1 rounded text-[11px] font-bold transition border ${
                        isActive
                          ? 'border-amber-500 bg-amber-500 text-white'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-amber-50 hover:border-amber-300'
                      }`}
                      title={`₺${rounded.toFixed(2)}'ye yuvarla`}
                    >
                      {step < 1 ? `${step * 100}kr` : `${step}₺`}
                    </button>
                  );
                })}
                {roundingAmount !== 0 && (
                  <button
                    type="button"
                    onClick={() => setRoundingAmount(0)}
                    className="px-2 py-1 rounded text-[11px] font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            <div className="px-4 py-4 bg-slate-800 flex justify-between items-center">
              <span className="text-white text-lg font-black">TOPLAM</span>
              <span className="text-white text-3xl font-black tabular-nums">
                ₺{grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Satış tamamla / temizle */}
            <div className="p-3 space-y-2">
              <button
                onClick={handleCompleteSale}
                disabled={items.length === 0 || processing}
                className="w-full py-4 bg-green-600 text-white rounded-lg font-black text-base hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <CheckCircle size={22} />
                )}
                {processing ? 'İşleniyor...' : 'SATIŞ TAMAMLA (F12)'}
              </button>
              <button
                onClick={() => { clearCart(); handleClearCustomer(); inputRef.current?.focus(); }}
                disabled={items.length === 0}
                className="w-full py-2.5 border border-gray-300 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-40"
              >
                Sepeti Temizle (ESC)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fiyat Gör Overlay */}
      {priceView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setPriceView(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-6xl mb-6">🏷️</div>
            <p className="text-sm text-gray-400 font-mono mb-2">{priceView.barcode}</p>
            <h2 className="text-3xl font-black text-gray-900 mb-6">{priceView.name}</h2>
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl py-8 px-6 mb-6">
              <p className="text-white text-lg font-medium mb-1">Satış Fiyatı</p>
              <p className="text-white text-6xl font-black tabular-nums">
                ₺{priceView.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-white/70 text-sm mt-2">KDV %{priceView.tax} dahil</p>
            </div>
            <button
              onClick={() => setPriceView(null)}
              className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl text-lg font-bold hover:bg-gray-200 transition"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
