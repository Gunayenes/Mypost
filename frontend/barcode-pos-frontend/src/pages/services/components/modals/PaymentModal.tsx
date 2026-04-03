import Modal, { FormField, inputClass, ModalActions } from './Modal';
import { fmt } from '../../helpers';

interface Props {
  open: boolean;
  form: { amount: string; note: string };
  onChange: (form: { amount: string; note: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  remaining: number;
}

export default function PaymentModal({ open, form, onChange, onSubmit, onClose, remaining }: Props) {
  return (
    <Modal open={open} title="Ödeme Ekle" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="bg-gray-50/80 rounded-xl p-3.5 flex items-center justify-between">
          <span className="text-xs text-gray-500">Kalan Tutar</span>
          <span className="text-base font-bold text-gray-800 tabular-nums">₺{fmt(remaining)}</span>
        </div>

        <FormField label="Tutar (₺)" required>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => onChange({ ...form, amount: e.target.value })}
            required
            className={inputClass}
          />
        </FormField>

        <FormField label="Not">
          <input
            value={form.note}
            onChange={(e) => onChange({ ...form, note: e.target.value })}
            className={inputClass}
          />
        </FormField>

        <ModalActions onCancel={onClose} submitLabel="Ödeme Al" />
      </form>
    </Modal>
  );
}
