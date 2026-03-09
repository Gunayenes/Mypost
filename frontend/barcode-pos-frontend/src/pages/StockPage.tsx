import { useEffect, useState } from 'react';
import { stockApi } from '@/api/stock';
import { productsApi } from '@/api/products';
import type { StockMovement, Product } from '@/types';
import { Plus, X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function StockPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ productId: 0, type: 'In', quantity: 1, note: '' });

  const load = () => {
    setLoading(true);
    Promise.all([
      stockApi.getAll(),
      productsApi.getAll(),
    ]).then(([sRes, pRes]) => {
      if (sRes.data.success) setMovements(sRes.data.data?.items ?? []);
      if (pRes.data.success) setProducts(pRes.data.data?.items ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await stockApi.create(form);
    setShowModal(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Stok Hareketleri</h1>
        <button onClick={() => { setForm({ productId: products[0]?.id ?? 0, type: 'In', quantity: 1, note: '' }); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition">
          <Plus size={16} /> Stok Hareketi
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tarih</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ürün</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tür</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Miktar</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Sonraki Stok</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Not</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Kullanıcı</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{new Date(m.createdAt).toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-3 font-medium">{m.productName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      m.type === 'In' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {m.type === 'In' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                      {m.typeName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{m.quantity}</td>
                  <td className="px-4 py-3 text-right">{m.stockAfter}</td>
                  <td className="px-4 py-3 text-gray-500">{m.note || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{m.userFullName}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Stok hareketi bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Yeni Stok Hareketi</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ürün</label>
                <select value={form.productId} onChange={(e) => setForm({ ...form, productId: +e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.barcode})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hareket Türü</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="In">Giriş</option>
                    <option value="Out">Çıkış</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Miktar</label>
                  <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Not</label>
                <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">İptal</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
