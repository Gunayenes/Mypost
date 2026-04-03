import { priorityConfig } from '../helpers';

export default function PriorityIndicator({ priority, label }: { priority: string; label: string }) {
  const cfg = priorityConfig[priority] ?? priorityConfig.Dusuk;

  return (
    <span className={`inline-flex items-center justify-center text-[10px] font-bold px-3 py-1 rounded-md whitespace-nowrap uppercase tracking-wide ${cfg.bg} ${cfg.text} shadow-sm`}>
      {label}
    </span>
  );
}
