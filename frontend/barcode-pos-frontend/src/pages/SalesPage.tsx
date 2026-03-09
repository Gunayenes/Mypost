import { useEffect, useState } from 'react';
import { salesApi } from '@/api/sales';
import type { SaleListItem, SaleDetail } from '@/types';
import { Eye, X, Ban, RotateCcw } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/hooks/useToast';

export default function SalesPage() {
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<SaleDetail | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'cancel' | 'return'; id: number; receipt: string } | null>(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    salesApi.getAll().then((res) => {
      if (res.data.success) setSales(res.data.data?.items ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const viewDetail = async (id: number) => {
    const { data: res } = await salesApi.getById(id);
    if (res.success && res.data) setDetail(res.data);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      const { data: res } = confirmAction.type === 'cancel'
        ? await salesApi.cancel(confirmAction.id)
        : await salesApi.return(confirmAction.id);
      if (res.success) {
        toast.success(`${confirmAction.receipt} ${confirmAction.type === 'cancel' ? 'iptal edildi' : 'iade edildi'}.`);
        load();
      } else {
        toast.error(res.message ?? 'İşlem başarısız.');
      }
    } catch {
      toast.error('İşlem sırasında hata oluştu.');
    }
    setConfirmAction(null);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Satışlar</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Fiş No</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tarih</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Kasiyer</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ödeme</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Durum</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Tutar</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => {
                const isCompleted = s.statusName === 'Tamamlandı';
                return (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{s.receiptNumber}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(s.saleDate).toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-3">{s.cashierName}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s.paymentTypeName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.statusName === 'Tamamlandı' ? 'bg-green-50 text-green-700'
                          : s.statusName === 'İptal' ? 'bg-red-50 text-red-700'
                          : s.statusName === 'İade' ? 'bg-orange-50 text-orange-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>{s.statusName}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">₺{s.grandTotal.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => viewDetail(s.id)}
                          className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition"
                          title="Detay"
                        >
                          <Eye size={14} />
                        </button>
                        {isCompleted && (
                          <>
                            <button
                              onClick={() => setConfirmAction({ type: 'cancel', id: s.id, receipt: s.receiptNumber })}
                              className="p-1.5 hover:bg-red-50 rounded text-red-500 transition"
                              title="İptal Et"
                            >
                              <Ban size={14} />
                            </button>
                            <button
                              onClick={() => setConfirmAction({ type: 'return', id: s.id, receipt: s.receiptNumber })}
                              className="p-1.5 hover:bg-orange-50 rounded text-orange-500 transition"
                              title="İade Et"
                            >
                              <RotateCcw size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sales.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Satış bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detay Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Satış Detayı — {detail.receiptNumber}</h2>
              <button onClick={() => setDetail(null)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <div className="text-sm space-y-2 mb-4">
              <p><span className="text-gray-500">Tarih:</span> {new Date(detail.saleDate).toLocaleString('tr-TR')}</p>
              <p><span className="text-gray-500">Kasiyer:</span> {detail.cashierName}</p>
              <p><span className="text-gray-500">Ödeme:</span> {detail.paymentTypeName}</p>
              <p><span className="text-gray-500">Durum:</span> {detail.statusName}</p>
              {detail.customerName && <p><span className="text-gray-500">Müşteri:</span> {detail.customerName}</p>}
            </div>
            <table className="w-full text-sm mb-4">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">Ürün</th>
                  <th className="text-center px-3 py-2">Adet</th>
                  <th className="text-right px-3 py-2">Birim</th>
                  <th className="text-right px-3 py-2">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="px-3 py-2">{item.productName}</td>
                    <td className="px-3 py-2 text-center">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">₺{item.unitPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-medium">₺{item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Ara Toplam</span><span>₺{detail.subTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">KDV</span><span>₺{detail.taxTotal.toFixed(2)}</span></div>
              {detail.discountTotal > 0 && <div className="flex justify-between"><span className="text-gray-500">İndirim</span><span>-₺{detail.discountTotal.toFixed(2)}</span></div>}
              <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Genel Toplam</span><span className="text-primary">₺{detail.grandTotal.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* İptal / İade Onay Modal */}
      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.type === 'cancel' ? 'Satış İptal' : 'Satış İade'}
        message={`${confirmAction?.receipt ?? ''} numaralı satış ${confirmAction?.type === 'cancel' ? 'iptal edilecek' : 'iade edilecek ve stoklar geri yüklenecek'}. Devam etmek istiyor musunuz?`}
        confirmLabel={confirmAction?.type === 'cancel' ? 'İptal Et' : 'İade Et'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
