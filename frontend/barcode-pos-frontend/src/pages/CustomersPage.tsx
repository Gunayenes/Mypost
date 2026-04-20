import { useEffect, useState } from 'react';
import { customersApi } from '@/api/customers';
import type { CustomerBalance, CustomerTransaction } from '@/api/customers';
import type { Customer } from '@/types';
import { Plus, Edit, X, Phone, Mail, Wallet, ArrowDownCircle, ArrowUpCircle, ChevronRight, Loader2 } from 'lucide-react';

function toast(type: 'success' | 'error', message: string) {
  window.dispatchEvent(new CustomEvent('toast', { detail: { type, message } }));
}
const fmt = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', address: '' });

  // Detay paneli
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [balance, setBalance] = useState<CustomerBalance | null>(null);
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Tahsilat
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const load = () => {
    setLoading(true);
    customersApi.getAll({ pageSize: 200 }).then((res) => {
      if (res.data.success) setCustomers(res.data.data?.items ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ fullName: '', phone: '', email: '', address: '' });
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ fullName: c.fullName, phone: c.phone ?? '', email: c.email ?? '', address: c.address ?? '' });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await customersApi.update(editing.id, form);
    } else {
      await customersApi.create(form);
    }
    setShowModal(false);
    load();
  };

  // Detay paneli aç
  const openDetail = async (id: number) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const [balRes, txRes] = await Promise.all([
        customersApi.getBalance(id),
        customersApi.getTransactions(id),
      ]);
      if (balRes.data.success) setBalance(balRes.data.data ?? null);
      if (txRes.data.success) setTransactions(txRes.data.data?.items ?? []);
    } catch {
      toast('error', 'Müşteri detayı yüklenemedi.');
    }
    setDetailLoading(false);
  };

  const closeDetail = () => {
    setSelectedId(null);
    setBalance(null);
    setTransactions([]);
  };

  // Tahsilat
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast('error', 'Geçerli bir tutar girin.');
      return;
    }
    setPaymentLoading(true);
    try {
      const { data: res } = await customersApi.collectPayment(selectedId, {
        amount,
        note: paymentNote || undefined,
      });
      if (res.success) {
        toast('success', res.message ?? 'Tahsilat başarılı.');
        setShowPayment(false);
        setPaymentAmount('');
        setPaymentNote('');
        await openDetail(selectedId);
        load();
      } else {
        toast('error', res.message ?? 'Tahsilat başarısız.');
      }
    } catch {
      toast('error', 'Tahsilat sırasında hata oluştu.');
    }
    setPaymentLoading(false);
  };

  const selectedCustomer = customers.find((c) => c.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Müşteriler</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition">
          <Plus size={16} /> Yeni Müşteri
        </button>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><Wallet size={18} className="text-blue-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Toplam Müşteri</p>
            <p className="text-lg font-bold">{customers.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg"><ArrowDownCircle size={18} className="text-red-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Toplam Veresiye</p>
            <p className="text-lg font-bold text-red-600">₺{fmt(customers.filter(c => c.balance > 0).reduce((s, c) => s + c.balance, 0))}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg"><Wallet size={18} className="text-amber-600" /></div>
          <div>
            <p className="text-xs text-gray-500">Borçlu Müşteri</p>
            <p className="text-lg font-bold text-amber-600">{customers.filter(c => c.balance > 0).length}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Müşteri Tablosu */}
        <div className={`${selectedId ? 'w-1/2' : 'w-full'} transition-all`}>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Ad Soyad</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Telefon</th>
                    {!selectedId && <th className="text-left px-4 py-3 font-semibold text-gray-600">E-posta</th>}
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Bakiye</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => openDetail(c.id)}
                      className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition ${selectedId === c.id ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium">{c.fullName}</td>
                      <td className="px-4 py-3 text-gray-500">
                        <span className="flex items-center gap-1"><Phone size={12} />{c.phone || '—'}</span>
                      </td>
                      {!selectedId && (
                        <td className="px-4 py-3 text-gray-500">
                          <span className="flex items-center gap-1"><Mail size={12} />{c.email || '—'}</span>
                        </td>
                      )}
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${c.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₺{fmt(c.balance)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); openEdit(c); }} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Edit size={14} /></button>
                          <ChevronRight size={14} className="text-gray-300" />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Müşteri bulunamadı.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detay Paneli */}
        {selectedId && (
          <div className="w-1/2 bg-white rounded-xl border border-gray-200 p-5 space-y-4 sticky top-4 self-start">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{selectedCustomer?.fullName}</h2>
              <button onClick={closeDetail} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : balance && (
              <>
                {/* Bakiye Kartları */}
                <div className="grid grid-cols-3 gap-2">
                  <div className={`rounded-lg p-3 text-center ${balance.balance > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                    <p className="text-[10px] font-semibold uppercase text-gray-500">Bakiye</p>
                    <p className={`text-lg font-black tabular-nums ${balance.balance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                      ₺{fmt(balance.balance)}
                    </p>
                  </div>
                  <div className="bg-red-50/50 rounded-lg p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase text-gray-500">Toplam Borç</p>
                    <p className="text-lg font-black tabular-nums text-red-600">₺{fmt(balance.totalDebt)}</p>
                  </div>
                  <div className="bg-green-50/50 rounded-lg p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase text-gray-500">Toplam Ödeme</p>
                    <p className="text-lg font-black tabular-nums text-green-600">₺{fmt(balance.totalPayment)}</p>
                  </div>
                </div>

                {/* Tahsilat Butonu + Formu */}
                {balance.balance > 0 && !showPayment && (
                  <button
                    onClick={() => setShowPayment(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
                  >
                    <ArrowUpCircle size={16} /> Tahsilat Al
                  </button>
                )}

                {showPayment && (
                  <form onSubmit={handlePayment} className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-green-800">Tahsilat</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={balance.balance}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="Tutar (₺)"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(balance.balance.toString())}
                        className="px-2 py-2 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 whitespace-nowrap"
                      >
                        Tamamı
                      </button>
                    </div>
                    <input
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="Not (isteğe bağlı)"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setShowPayment(false); setPaymentAmount(''); setPaymentNote(''); }} className="flex-1 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
                        İptal
                      </button>
                      <button type="submit" disabled={paymentLoading} className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                        {paymentLoading ? 'Kaydediliyor...' : 'Tahsil Et'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Hareket Geçmişi */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Hesap Hareketleri</h3>
                  {transactions.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Henüz işlem yok.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                      {transactions.map((tx) => (
                        <div key={tx.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${tx.type === 'Borc' ? 'bg-red-50/50 border-red-100' : 'bg-green-50/50 border-green-100'}`}>
                          {tx.type === 'Borc'
                            ? <ArrowDownCircle size={16} className="text-red-500 shrink-0" />
                            : <ArrowUpCircle size={16} className="text-green-500 shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-semibold ${tx.type === 'Borc' ? 'text-red-700' : 'text-green-700'}`}>
                                {tx.type === 'Borc' ? '+' : '-'}₺{fmt(tx.amount)}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(tx.createdAt).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 truncate">
                                {tx.typeName}{tx.saleId ? ` (Fiş #${tx.saleId})` : ''}{tx.note ? ` — ${tx.note}` : ''}
                              </span>
                              <span className="text-[10px] text-gray-400 shrink-0">
                                Bakiye: ₺{fmt(tx.balanceAfter)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Müşteri Oluştur/Düzenle Modalı */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editing ? 'Müşteri Düzenle' : 'Yeni Müşteri'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad</label>
                <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">E-posta</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Adres</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
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
