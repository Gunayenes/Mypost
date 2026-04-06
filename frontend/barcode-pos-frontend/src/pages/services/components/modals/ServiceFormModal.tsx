import { useState, useEffect } from 'react';
import { customersApi } from '@/api/customers';
import type { Customer } from '@/types';
import { Search, UserPlus, X, User } from 'lucide-react';
import Modal, { FormField, inputClass, ModalActions } from './Modal';
import { priorityOptions } from '../../helpers';

interface FormData {
  customerId: string;
  assignedUserId: string;
  deviceName: string;
  deviceBrand: string;
  deviceModel: string;
  deviceSerial: string;
  deviceAccessories: string;
  deviceCondition: string;
  faultDescription: string;
  customerNote: string;
  priority: string;
  estimatedCompletionDate: string;
  laborCost: string;
}

interface Props {
  open: boolean;
  editingId: number | null;
  form: FormData;
  onChange: (form: FormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  loading: boolean;
}

export default function ServiceFormModal({ open, editingId, form, onChange, onSubmit, onClose, loading }: Props) {
  const set = (key: keyof FormData, value: string) => onChange({ ...form, [key]: value });

  // Müşteri arama
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searching, setSearching] = useState(false);

  // Yeni müşteri formu
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Modal açıldığında sıfırla
  useEffect(() => {
    if (open && !editingId) {
      setCustomerSearch('');
      setCustomerResults([]);
      setSelectedCustomer(null);
      setShowNewCustomer(false);
    }
  }, [open, editingId]);

  const searchCustomers = async (q: string) => {
    setCustomerSearch(q);
    if (q.trim().length < 2) { setCustomerResults([]); return; }
    setSearching(true);
    try {
      const { data: res } = await customersApi.getAll({ search: q.trim(), pageSize: 5 });
      if (res.success && res.data) setCustomerResults(res.data.items);
    } catch { /* */ }
    setSearching(false);
  };

  const selectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    set('customerId', c.id.toString());
    setCustomerSearch('');
    setCustomerResults([]);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    set('customerId', '');
  };

  const createNewCustomer = async () => {
    if (!newCustomerName.trim()) return;
    setCreatingCustomer(true);
    try {
      const { data: res } = await customersApi.create({
        fullName: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || undefined,
      });
      if (res.success && res.data) {
        selectCustomer(res.data);
        setShowNewCustomer(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
      }
    } catch { /* */ }
    setCreatingCustomer(false);
  };

  return (
    <Modal open={open} title={editingId ? 'Servis Kaydı Düzenle' : 'Yeni Servis Kaydı'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">

        {/* Müşteri Seçimi */}
        {!editingId && (
          <FormField label="Müşteri" required>
            {selectedCustomer ? (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <User size={16} className="text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-blue-900 truncate">{selectedCustomer.fullName}</p>
                    {selectedCustomer.phone && (
                      <p className="text-xs text-blue-600">{selectedCustomer.phone}</p>
                    )}
                  </div>
                </div>
                <button type="button" onClick={clearCustomer} title="Müşteriyi kaldır" className="text-blue-400 hover:text-red-500 transition">
                  <X size={16} />
                </button>
              </div>
            ) : showNewCustomer ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-green-800">Yeni Müşteri</span>
                  <button type="button" onClick={() => setShowNewCustomer(false)} title="İptal" className="text-green-400 hover:text-gray-500">
                    <X size={14} />
                  </button>
                </div>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Ad Soyad *"
                  className={inputClass}
                  autoFocus
                />
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="Telefon (opsiyonel)"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={createNewCustomer}
                  disabled={!newCustomerName.trim() || creatingCustomer}
                  className="w-full py-2 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {creatingCustomer ? 'Oluşturuluyor...' : 'Müşteri Oluştur'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => searchCustomers(e.target.value)}
                      placeholder="Müşteri ara (ad veya telefon)"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomer(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition shrink-0"
                  >
                    <UserPlus size={14} /> Yeni
                  </button>
                </div>
                {searching && <p className="text-xs text-gray-400 px-1">Aranıyor...</p>}
                {customerResults.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCustomer(c)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-blue-50 transition border-b border-gray-100 last:border-0"
                      >
                        <User size={14} className="text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{c.fullName}</p>
                          <p className="text-xs text-gray-500">{c.phone || 'Telefon yok'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Cihaz Adı" required>
            <input value={form.deviceName} onChange={(e) => set('deviceName', e.target.value)} required className={inputClass} />
          </FormField>
          <FormField label="Marka">
            <input value={form.deviceBrand} onChange={(e) => set('deviceBrand', e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Model">
            <input value={form.deviceModel} onChange={(e) => set('deviceModel', e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Seri No">
            <input value={form.deviceSerial} onChange={(e) => set('deviceSerial', e.target.value)} className={inputClass} />
          </FormField>
        </div>

        <FormField label="Aksesuarlar">
          <input value={form.deviceAccessories} onChange={(e) => set('deviceAccessories', e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="Cihaz Durumu">
          <input value={form.deviceCondition} onChange={(e) => set('deviceCondition', e.target.value)} className={inputClass} />
        </FormField>

        <FormField label="Arıza Açıklaması" required>
          <textarea value={form.faultDescription} onChange={(e) => set('faultDescription', e.target.value)} required rows={3} className={inputClass} />
        </FormField>
        <FormField label="Müşteri Notu">
          <textarea value={form.customerNote} onChange={(e) => set('customerNote', e.target.value)} rows={2} className={inputClass} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Öncelik">
            <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className={inputClass}>
              {priorityOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FormField>
          <FormField label="Tahmini Teslim Tarihi">
            <input type="date" value={form.estimatedCompletionDate} onChange={(e) => set('estimatedCompletionDate', e.target.value)} className={inputClass} />
          </FormField>
        </div>

        {editingId && (
          <FormField label="İşçilik Ücreti (₺)">
            <input type="number" step="0.01" value={form.laborCost} onChange={(e) => set('laborCost', e.target.value)} className={inputClass} />
          </FormField>
        )}

        <ModalActions onCancel={onClose} submitLabel="Kaydet" loading={loading} />
      </form>
    </Modal>
  );
}
