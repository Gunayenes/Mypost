import Modal, { FormField, inputClass, ModalActions } from './Modal';

interface Props {
  open: boolean;
  form: { description: string; isInternal: boolean };
  onChange: (form: { description: string; isInternal: boolean }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function LogModal({ open, form, onChange, onSubmit, onClose }: Props) {
  return (
    <Modal open={open} title="Not Ekle" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Açıklama" required>
          <textarea
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            required
            rows={3}
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

        <ModalActions onCancel={onClose} submitLabel="Ekle" />
      </form>
    </Modal>
  );
}
