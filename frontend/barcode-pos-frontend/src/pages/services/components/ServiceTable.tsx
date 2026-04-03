import { useState } from 'react';
import {
  Eye, Trash2, MessageCircle, StickyNote, Printer,
  ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react';
import type { ServiceListItem } from '@/types';
import { fmt, fmtDateShort, statusOptions, priorityOptions, statusConfig, priorityConfig } from '../helpers';

type SortKey = 'serviceNumber' | 'customerName' | 'deviceName' | 'deviceBrand' | 'deviceModel' | 'status' | 'priority' | 'totalCost' | 'createdAt';
type SortDir = 'asc' | 'desc';

interface Props {
  items: ServiceListItem[];
  selectedId?: number;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onPriorityChange: (id: number, priority: string) => void;
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ServiceTable({
  items, selectedId, onSelect, onDelete, onStatusChange, onPriorityChange, loading, page, totalPages, onPageChange,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = sortKey
    ? [...items].sort((a, b) => {
        const aVal = (a as unknown as Record<string, unknown>)[sortKey];
        const bVal = (b as unknown as Record<string, unknown>)[sortKey];
        const cmp =
          typeof aVal === 'number' && typeof bVal === 'number'
            ? aVal - bVal
            : String(aVal ?? '').localeCompare(String(bVal ?? ''), 'tr');
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : items;

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-gray-300" />;
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="text-primary" />
      : <ArrowDown size={12} className="text-primary" />;
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-4 border-b border-gray-50 animate-pulse">
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-4 w-20 bg-gray-100 rounded flex-1" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  /* ── Empty ── */
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
          <Eye size={28} className="text-gray-300" />
        </div>
        <p className="text-sm text-gray-400 font-medium">Servis kaydı bulunamadı.</p>
        <p className="text-xs text-gray-300 mt-1">Filtre ayarlarını değiştirmeyi deneyin.</p>
      </div>
    );
  }

  /* ── Table ── */
  const thClass =
    'text-left px-3 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-600 transition-colors';

  /* action button helpers */
  const actionBtn = (color: string) =>
    `w-7 h-7 rounded-full flex items-center justify-center text-white shadow-sm transition-transform hover:scale-110 ${color}`;

  return (
    <div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className={thClass} onClick={() => handleSort('serviceNumber')}>
                  <span className="inline-flex items-center gap-1">Takip No <SortIcon col="serviceNumber" /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('customerName')}>
                  <span className="inline-flex items-center gap-1">Müşteri <SortIcon col="customerName" /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('deviceName')}>
                  <span className="inline-flex items-center gap-1">Cihaz Adı <SortIcon col="deviceName" /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('deviceBrand')}>
                  <span className="inline-flex items-center gap-1">Marka <SortIcon col="deviceBrand" /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('deviceModel')}>
                  <span className="inline-flex items-center gap-1">Model <SortIcon col="deviceModel" /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('createdAt')}>
                  <span className="inline-flex items-center gap-1">Alış Tarihi <SortIcon col="createdAt" /></span>
                </th>
                <th className={thClass}>Teslim Tarihi</th>
                <th className={thClass}>Servis</th>
                <th className={`${thClass} text-right`} onClick={() => handleSort('totalCost')}>
                  <span className="inline-flex items-center gap-1 justify-end">Ücret <SortIcon col="totalCost" /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('status')}>
                  <span className="inline-flex items-center gap-1">Durum <SortIcon col="status" /></span>
                </th>
                <th className={thClass} onClick={() => handleSort('priority')}>
                  <span className="inline-flex items-center gap-1">Aciliyet <SortIcon col="priority" /></span>
                </th>
                <th className="px-3 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>

            <tbody>
              {sorted.map((s) => {
                const isSelected = selectedId === s.id;
                return (
                  <tr
                    key={s.id}
                    className={`
                      group border-b border-gray-50 last:border-b-0 cursor-pointer transition-colors duration-150
                      ${isSelected
                        ? 'bg-primary/[0.06] ring-1 ring-inset ring-primary/15'
                        : 'even:bg-slate-50/40 hover:bg-gray-50/80'
                      }
                    `}
                  >
                    {/* Takip No */}
                    <td className="px-3 py-3">
                      <span className="font-mono text-xs font-bold text-primary">{s.serviceNumber}</span>
                    </td>

                    {/* Müşteri */}
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-800 text-xs">{s.customerName}</div>
                      {s.customerPhone && (
                        <div className="text-[10px] text-gray-400 mt-0.5">{s.customerPhone}</div>
                      )}
                    </td>

                    {/* Cihaz Adı */}
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-700">{s.deviceName}</span>
                    </td>

                    {/* Marka */}
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-600">{s.deviceBrand ?? '—'}</span>
                    </td>

                    {/* Model */}
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-600">{s.deviceModel ?? '—'}</span>
                    </td>

                    {/* Alış Tarihi */}
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-500">{fmtDateShort(s.createdAt)}</span>
                    </td>

                    {/* Teslim Tarihi */}
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-500">{fmtDateShort(s.deliveredDate ?? s.estimatedCompletionDate)}</span>
                    </td>

                    {/* Servis */}
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-600">{s.assignedUserName ?? '—'}</span>
                    </td>

                    {/* Ücret */}
                    <td className="px-3 py-3 text-right">
                      <span className="font-semibold text-xs text-gray-800 tabular-nums">₺{fmt(s.totalCost)}</span>
                    </td>

                    {/* Durum — inline dropdown */}
                    <td className="px-3 py-3">
                      <select
                        value={s.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { e.stopPropagation(); onStatusChange(s.id, e.target.value); }}
                        className={`text-[11px] font-bold px-2 py-1 rounded-full border-0 cursor-pointer appearance-none text-center ${statusConfig[s.status]?.bg ?? 'bg-gray-300'} text-white focus:outline-none focus:ring-2 focus:ring-primary/30`}
                        style={{ minWidth: 100 }}
                      >
                        {statusOptions.filter(o => o.value).map(o => (
                          <option key={o.value} value={o.value} className="text-gray-800 bg-white">{o.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Aciliyet — inline dropdown */}
                    <td className="px-3 py-3">
                      <select
                        value={s.priority}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { e.stopPropagation(); onPriorityChange(s.id, e.target.value); }}
                        className={`text-[11px] font-bold px-2 py-1 rounded-full border-0 cursor-pointer appearance-none text-center ${priorityConfig[s.priority]?.bg ?? 'bg-gray-300'} text-white focus:outline-none focus:ring-2 focus:ring-primary/30`}
                        style={{ minWidth: 80 }}
                      >
                        {priorityOptions.map(o => (
                          <option key={o.value} value={o.value} className="text-gray-800 bg-white">{o.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* İşlemler */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); onSelect(s.id); }} className={actionBtn('bg-blue-500')} title="Görüntüle">
                          <Eye size={13} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(s.id); }} className={actionBtn('bg-red-500')} title="Sil">
                          <Trash2 size={13} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${s.customerPhone?.replace(/\D/g, '')}`, '_blank'); }} className={actionBtn('bg-green-600')} title="WhatsApp">
                          <MessageCircle size={13} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onSelect(s.id); }} className={actionBtn('bg-yellow-500')} title="Not">
                          <StickyNote size={13} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); window.print(); }} className={actionBtn('bg-purple-500')} title="Yazdır">
                          <Printer size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-xs text-gray-400">
            Sayfa {page} / {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ←
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) {
                p = i + 1;
              } else if (page <= 4) {
                p = i + 1;
              } else if (page >= totalPages - 3) {
                p = totalPages - 6 + i;
              } else {
                p = page - 3 + i;
              }
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                    p === page
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
