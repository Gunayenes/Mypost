import Modal, { FormField, inputClass, ModalActions } from './Modal';
import { statusOptions } from '../../helpers';

interface Props {
  open: boolean;
  form: { status: string; note: string; isInternal: boolean };
  onChange: (form: { status: string; note: string; isInternal: boolean }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function StatusUpdateModal({ open, form, onChange, onSubmit, onClose }: Props) {
  return (
    <Modal open={open} title="Durum Güncelle" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Yeni Durum" required>
          <select
            value={form.status}
            onChange={(e) => onChange({ ...form, status: e.target.value })}
            required
            className={inputClass}
          >
            <option value="">Seçin</option>
            {statusOptions.filter((o) => o.value).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Not">
          <textarea
            value={form.note}
            onChange={(e) => onChange({ ...form, note: e.target.value })}
            rows={2}
            className={inputClass}
          />
        </FormField>

        <label className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isInternal}
            onChange={(e) => onChange({ ...form, isInternal: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
          />
          İç not (müşteri görmez)
        </label>

        <ModalActions onCancel={onClose} submitLabel="Güncelle" />
      </form>
    </Modal>
  );
}
