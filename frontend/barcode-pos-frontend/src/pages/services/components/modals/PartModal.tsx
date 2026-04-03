import Modal, { FormField, inputClass, ModalActions } from './Modal';

interface Props {
  open: boolean;
  form: { partName: string; quantity: string; unitCost: string; productId: string };
  onChange: (form: { partName: string; quantity: string; unitCost: string; productId: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function PartModal({ open, form, onChange, onSubmit, onClose }: Props) {
  return (
    <Modal open={open} title="Parça Ekle" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Stok Ürün ID (opsiyonel)">
          <input
            type="number"
            value={form.productId}
            onChange={(e) => onChange({ ...form, productId: e.target.value })}
            className={inputClass}
            placeholder="Stoktan düşmek için doldurun"
          />
        </FormField>

        <FormField label="Parça Adı" required>
          <input
            value={form.partName}
            onChange={(e) => onChange({ ...form, partName: e.target.value })}
            required
            className={inputClass}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Adet">
            <input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => onChange({ ...form, quantity: e.target.value })}
              className={inputClass}
            />
          </FormField>
          <FormField label="Birim Maliyet (₺)">
            <input
              type="number"
              step="0.01"
              value={form.unitCost}
              onChange={(e) => onChange({ ...form, unitCost: e.target.value })}
              required
              className={inputClass}
            />
          </FormField>
        </div>

        <ModalActions onCancel={onClose} submitLabel="Ekle" />
      </form>
    </Modal>
  );
}
