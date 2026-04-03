import { Search, X } from 'lucide-react';
import { statusOptions, priorityOptions } from '../helpers';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  priorityFilter: string;
  onPriorityChange: (v: string) => void;
  dateFrom: string;
  onDateFromChange: (v: string) => void;
  dateTo: string;
  onDateToChange: (v: string) => void;
  onClear: () => void;
  onSearch: () => void;
  hasActiveFilters: boolean;
}

const selectClass =
  'px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white appearance-none cursor-pointer transition-all';

const dateClass =
  'px-3 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all w-[140px]';

export default function FilterBar({
  search, onSearchChange,
  statusFilter, onStatusChange,
  priorityFilter, onPriorityChange,
  dateFrom, onDateFromChange,
  dateTo, onDateToChange,
  onClear, onSearch, hasActiveFilters,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
          <input
            type="text"
            placeholder="Servis no, müşteri adı, telefon..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
          />
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-8 bg-gray-100" />

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className={selectClass}
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Priority */}
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value)}
          className={selectClass}
        >
          <option value="">Tüm Öncelikler</option>
          {priorityOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Divider */}
        <div className="hidden lg:block w-px h-8 bg-gray-100" />

        {/* Date range */}
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className={dateClass}
          />
          <span className="text-gray-300 text-xs select-none">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className={dateClass}
          />
          <button
            onClick={onSearch}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 shadow-sm transition-all active:scale-[0.98] shrink-0"
          >
            <Search size={14} />
            Ara
          </button>
        </div>

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors shrink-0"
          >
            <X size={14} />
            Temizle
          </button>
        )}
      </div>
    </div>
  );
}
