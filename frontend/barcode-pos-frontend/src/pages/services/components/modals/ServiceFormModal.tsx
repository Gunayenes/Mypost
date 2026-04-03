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

  return (
    <Modal open={open} title={editingId ? 'Servis Kaydı Düzenle' : 'Yeni Servis Kaydı'} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        {!editingId && (
          <FormField label="Müşteri ID" required>
            <input type="number" value={form.customerId} onChange={(e) => set('customerId', e.target.value)} required className={inputClass} />
          </FormField>
        )}
        <FormField label="Atanan Teknisyen ID">
          <input type="number" value={form.assignedUserId} onChange={(e) => set('assignedUserId', e.target.value)} className={inputClass} />
        </FormField>

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
