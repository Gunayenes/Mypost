import {
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  Package,
  PackageCheck,
  Layers,
} from 'lucide-react';
import type { ServiceSummary } from '@/types';

interface Props {
  summary: ServiceSummary;
  activeStatus: string;
  onStatusClick: (status: string) => void;
}

const tabs = [
  { key: '',              label: 'Tüm Cihazlar',    countKey: 'totalCount',       icon: Layers,       color: 'bg-slate-600' },
  { key: 'KayitAcildi',  label: 'İşleme Alınacak', countKey: 'kayitAcildiCount', icon: FileText,     color: 'bg-pink-500' },
  { key: 'Incelemede',   label: 'İncelemede',       countKey: 'incelemedeCount',  icon: Search,       color: 'bg-sky-500' },
  { key: 'OnayBekliyor', label: 'Onay Bekleyen',    countKey: 'onayBekliyorCount', icon: Clock,       color: 'bg-amber-400' },
  { key: 'ParcaBekliyor',label: 'Parça Bekliyor',   countKey: 'parcaBekliyorCount', icon: Package,    color: 'bg-orange-500' },
  { key: 'Islemde',      label: 'Tamirde',          countKey: 'islemdeCount',     icon: Wrench,       color: 'bg-green-500' },
  { key: 'Tamamlandi',   label: 'Tamir Edildi',     countKey: 'tamamlandiCount',  icon: CheckCircle,  color: 'bg-emerald-600' },
  { key: 'TeslimEdildi', label: 'Teslim Edildi',    countKey: 'teslimEdildiCount', icon: PackageCheck, color: 'bg-teal-500' },
  { key: 'IptalEdildi',  label: 'İptal / İade',     countKey: 'iptalEdildiCount', icon: XCircle,      color: 'bg-red-500' },
] as const;

export default function SummaryCards({ summary, activeStatus, onStatusClick }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(({ key, label, countKey, icon: Icon, color }) => {
        const count = (summary as unknown as Record<string, number>)[countKey] ?? 0;
        const isActive = activeStatus === key;

        return (
          <button
            key={key}
            onClick={() => onStatusClick(key)}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200
              ${isActive
                ? `${color} text-white shadow-md scale-[1.03]`
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:shadow-sm'
              }
            `}
          >
            <Icon size={14} />
            <span>{label}</span>
            <span className={`
              ml-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold
              ${isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}
            `}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
