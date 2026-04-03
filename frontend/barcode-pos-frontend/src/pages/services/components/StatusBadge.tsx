import { statusConfig } from '../helpers';

export default function StatusBadge({ status, label }: { status: string; label: string }) {
  const cfg = statusConfig[status] ?? statusConfig.KayitAcildi;

  return (
    <span
      className={`inline-flex items-center justify-center gap-1 text-[10px] font-bold px-3 py-1 rounded-md whitespace-nowrap uppercase tracking-wide ${cfg.bg} ${cfg.text} shadow-sm`}
    >
      {label}
    </span>
  );
}
