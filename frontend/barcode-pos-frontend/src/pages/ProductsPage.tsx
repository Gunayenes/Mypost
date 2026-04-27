import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsApi } from '@/api/products';
import type { BulkImportResult } from '@/api/products';
import { categoriesApi } from '@/api/categories';
import type { Product, Category } from '@/types';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, Filter, Upload, Download, Loader2, X, Check } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/hooks/useToast';

type RowEdit = { costPrice?: number; salePrice?: number; stockQuantity?: number };

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const toast = useToast();

  // Inline edit & seçim state'leri
  const [edits, setEdits] = useState<Record<number, RowEdit>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Toplu içe aktarma state'leri
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      productsApi.getAll({ search: search || undefined, categoryId: filterCategory || undefined, isActive: true, pageSize: 100 }),
      categoriesApi.getAll(),
    ]).then(([pRes, cRes]) => {
      if (pRes.data.success) setProducts(pRes.data.data?.items ?? []);
      if (cRes.data.success) setCategories(cRes.data.data ?? []);
      setLoading(false);
      setEdits({});
      setSelected(new Set());
    });
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { data: res } = await productsApi.delete(deleteTarget.id);
      if (res.success) {
        toast.success(`"${deleteTarget.name}" başarıyla silindi.`);
        load();
      } else {
        toast.error(res.message ?? 'Silme başarısız.');
      }
    } catch {
      toast.error('Silme işlemi sırasında hata oluştu.');
    }
    setDeleteTarget(null);
  };

  // ── Inline edit yardımcıları ──
  const setEdit = (id: number, patch: RowEdit) =>
    setEdits((s) => ({ ...s, [id]: { ...s[id], ...patch } }));

  const cancelEdit = (id: number) =>
    setEdits((s) => {
      const n = { ...s };
      delete n[id];
      return n;
    });

  const hasEdit = (id: number) => {
    const e = edits[id];
    if (!e) return false;
    return e.costPrice !== undefined || e.salePrice !== undefined || e.stockQuantity !== undefined;
  };

  const saveInline = async (p: Product) => {
    const e = edits[p.id];
    if (!e) return;
    const newCost = e.costPrice ?? p.costPrice;
    const newSale = e.salePrice ?? p.salePrice;
    if (newSale <= 0) { toast.error('Satış fiyatı 0\'dan büyük olmalıdır.'); return; }
    if (newCost < 0) { toast.error('Alış fiyatı 0 veya üzeri olmalıdır.'); return; }
    setSavingId(p.id);
    try {
      const { data: res } = await productsApi.update(p.id, {
        categoryId: p.categoryId,
        barcode: p.barcode,
        name: p.name,
        description: p.description ?? null,
        costPrice: newCost,
        salePrice: newSale,
        costPriceUsd: p.costPriceUsd ?? null,
        salePriceUsd: p.salePriceUsd ?? null,
        exchangeRate: p.exchangeRate ?? null,
        taxRate: p.taxRate,
        minStockLevel: p.minStockLevel,
        stockQuantity: e.stockQuantity !== undefined && e.stockQuantity !== p.stockQuantity ? e.stockQuantity : null,
      });
      if (res.success && res.data) {
        setProducts((list) => list.map((x) => (x.id === p.id ? res.data! : x)));
        cancelEdit(p.id);
        toast.success(`"${p.name}" güncellendi.`);
      } else {
        toast.error(res.message ?? 'Güncelleme başarısız.');
      }
    } catch {
      toast.error('Güncelleme sırasında hata oluştu.');
    } finally {
      setSavingId(null);
    }
  };

  // ── Seçim yardımcıları ──
  const toggleOne = (id: number) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const allSelected = products.length > 0 && products.every((p) => selected.has(p.id));
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p.id)));
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selected);
    let okCount = 0;
    let failCount = 0;
    for (const id of ids) {
      try {
        const { data: res } = await productsApi.delete(id);
        if (res.success) okCount++; else failCount++;
      } catch {
        failCount++;
      }
    }
    setBulkDeleting(false);
    setBulkDeleteOpen(false);
    if (okCount > 0) toast.success(`${okCount} ürün silindi.`);
    if (failCount > 0) toast.error(`${failCount} ürün silinemedi.`);
    load();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.xlsx')) {
      toast.error('Sadece .xlsx dosyaları kabul edilir.');
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const { data: res } = await productsApi.bulkImport(file);
      if (res.success && res.data) {
        setImportResult(res.data);
        if (res.data.successCount > 0) {
          toast.success(`${res.data.successCount} ürün başarıyla eklendi.`);
          load();
        }
        if (res.data.errorCount > 0) {
          toast.error(`${res.data.errorCount} satırda hata var.`);
        }
      } else {
        toast.error(res.message ?? 'İçe aktarma başarısız.');
      }
    } catch {
      toast.error('İçe aktarma sırasında hata oluştu.');
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ürünler</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => productsApi.exportProducts()}
            className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
            title="Mevcut ürünleri Excel'e aktar"
          >
            <Download size={14} /> Dışa Aktar
          </button>
          <button
            onClick={() => productsApi.downloadTemplate()}
            className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
            title="Boş içe aktarma şablonu indir"
          >
            <Download size={14} /> Boş Şablon
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx" onChange={handleImport} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {importing ? 'Yükleniyor...' : 'Excel İçe Aktar'}
          </button>
          <button
            onClick={() => navigate('new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition"
          >
            <Plus size={16} /> Yeni Ürün Ekle
          </button>
        </div>
      </div>

      {/* İçe aktarma sonuç paneli */}
      {importResult && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">İçe Aktarma Sonucu</h3>
            <button onClick={() => setImportResult(null)} className="p-1 hover:bg-gray-100 rounded"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Toplam Satır</p>
              <p className="text-lg font-bold">{importResult.totalRows}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-green-600">Başarılı</p>
              <p className="text-lg font-bold text-green-700">{importResult.successCount}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-xs text-amber-600">Atlanan</p>
              <p className="text-lg font-bold text-amber-700">{importResult.skippedCount}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-xs text-red-600">Hatalı</p>
              <p className="text-lg font-bold text-red-700">{importResult.errorCount}</p>
            </div>
          </div>
          {importResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="text-xs font-semibold text-red-700 mb-1">Hata Detayları:</p>
              {importResult.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-600">
                  Satır {err.row}{err.barcode ? ` (${err.barcode})` : ''}: {err.message}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ürün adı veya barkod ile arayın..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-primary outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value === '' ? '' : +e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="px-5 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition">
            Ara
          </button>
        </form>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><Package size={18} className="text-blue-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Toplam Ürün</p>
            <p className="text-lg font-bold">{products.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg"><Package size={18} className="text-green-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Aktif</p>
            <p className="text-lg font-bold">{products.filter((p) => p.isActive).length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg"><AlertTriangle size={18} className="text-red-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Düşük Stok</p>
            <p className="text-lg font-bold text-red-600">
              {products.filter((p) => p.stockQuantity <= p.minStockLevel).length}
            </p>
          </div>
        </div>
      </div>

      {/* Toplu seçim toolbar'ı */}
      {selected.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-blue-900">
            <span className="font-semibold">{selected.size} ürün seçildi</span>
            <button onClick={() => setSelected(new Set())} className="text-xs text-blue-600 hover:underline">
              Seçimi temizle
            </button>
          </div>
          <button
            onClick={() => setBulkDeleteOpen(true)}
            disabled={bulkDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
          >
            {bulkDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Seçilenleri Sil ({selected.size})
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    aria-label={allSelected ? 'Seçimi kaldır' : 'Tümünü seç'}
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title={allSelected ? 'Seçimi kaldır' : 'Tümünü seç'}
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Barkod</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Ürün Adı</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Kategori</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Alış</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Satış</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">KDV</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Stok</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Durum</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const e = edits[p.id] ?? {};
                const cost = e.costPrice ?? p.costPrice;
                const sale = e.salePrice ?? p.salePrice;
                const stock = e.stockQuantity ?? p.stockQuantity;
                const lowStock = stock <= p.minStockLevel;
                const dirty = hasEdit(p.id);
                const isSelected = selected.has(p.id);
                const saving = savingId === p.id;
                return (
                  <tr key={p.id} className={`border-b border-gray-100 transition-colors ${
                    isSelected ? 'bg-blue-50/40' : 'hover:bg-gray-50'
                  } ${dirty ? 'ring-1 ring-amber-300' : ''}`}>
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        aria-label={`${p.name} seç`}
                        checked={isSelected}
                        onChange={() => toggleOne(p.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{p.barcode}</td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => navigate(`${p.id}/edit`)}
                        className="font-medium text-gray-900 hover:text-blue-600 transition text-left"
                      >
                        {p.name}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {p.categoryName}
                      </span>
                    </td>
                    {/* Alış (inline) */}
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          aria-label={`${p.name} alış fiyatı`}
                          title="Alış fiyatı (₺)"
                          step="0.01"
                          min={0}
                          value={cost}
                          onChange={(ev) => setEdit(p.id, { costPrice: +ev.target.value })}
                          className={`w-24 px-2.5 py-1.5 border rounded-md text-sm text-right tabular-nums shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 ${
                            e.costPrice !== undefined
                              ? 'border-amber-400 bg-amber-50 text-amber-900 font-semibold'
                              : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-white hover:border-gray-300'
                          }`}
                        />
                        <span className="text-xs text-gray-400 select-none">₺</span>
                      </div>
                    </td>
                    {/* Satış (inline) */}
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          aria-label={`${p.name} satış fiyatı`}
                          title="Satış fiyatı (₺)"
                          step="0.01"
                          min={0}
                          value={sale}
                          onChange={(ev) => setEdit(p.id, { salePrice: +ev.target.value })}
                          className={`w-24 px-2.5 py-1.5 border rounded-md text-sm text-right font-semibold tabular-nums shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 ${
                            e.salePrice !== undefined
                              ? 'border-amber-400 bg-amber-50 text-amber-900'
                              : 'border-gray-200 bg-gray-50 text-gray-900 hover:bg-white hover:border-gray-300'
                          }`}
                        />
                        <span className="text-xs text-gray-400 select-none">₺</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center text-xs text-gray-500">%{p.taxRate}</td>
                    {/* Stok (inline) */}
                    <td className="px-3 py-2">
                      <div className="flex justify-end">
                        <input
                          type="number"
                          aria-label={`${p.name} stok adedi`}
                          title="Stok adedi"
                          min={0}
                          value={stock}
                          onChange={(ev) => setEdit(p.id, { stockQuantity: +ev.target.value })}
                          className={`w-20 px-2.5 py-1.5 border rounded-md text-sm text-right font-bold tabular-nums shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 ${
                            e.stockQuantity !== undefined
                              ? 'border-amber-400 bg-amber-50 text-amber-900'
                              : lowStock
                                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-white hover:border-red-300'
                                : 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-white hover:border-gray-300'
                          }`}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {p.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {dirty ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveInline(p)}
                              disabled={saving}
                              className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition disabled:opacity-50"
                              title="Kaydet"
                            >
                              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              Kaydet
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelEdit(p.id)}
                              disabled={saving}
                              className="p-1.5 hover:bg-gray-100 rounded text-gray-500 transition"
                              title="İptal"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => navigate(`${p.id}/edit`)}
                              className="p-1.5 hover:bg-blue-50 rounded text-blue-500 transition"
                              title="Detaylı Düzenle"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(p)}
                              className="p-1.5 hover:bg-red-50 rounded text-red-500 transition"
                              title="Sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-400 text-sm">
                    Ürün bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Ürün Sil"
        message={`"${deleteTarget?.name ?? ''}" ürünü kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmModal
        open={bulkDeleteOpen}
        title="Seçili Ürünleri Sil"
        message={`${selected.size} ürün kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Hepsini Sil"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
