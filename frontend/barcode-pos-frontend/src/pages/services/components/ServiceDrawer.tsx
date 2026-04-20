import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Wrench,
  RefreshCw,
  Plus,
  DollarSign,
  MessageSquarePlus,
  ChevronUp,
  ChevronDown,
  Trash2,
  User,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import type { ServiceRecord } from '@/types';
import StatusBadge from './StatusBadge';
import PriorityIndicator from './PriorityIndicator';
import { fmt, fmtDate, fmtDateShort } from '../helpers';

interface Props {
  detail: ServiceRecord | null;
  loading: boolean;
  onClose: () => void;
  onEdit: () => void;
  onStatusUpdate: () => void;
  onAddPart: () => void;
  onAddPayment: () => void;
  onAddLog: () => void;
  onRemovePart: (partId: number) => void;
}

export default function ServiceDrawer({
  detail, loading, onClose, onEdit, onStatusUpdate, onAddPart, onAddPayment, onAddLog, onRemovePart,
}: Props) {
  return (
    <AnimatePresence>
      {detail && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[520px] bg-white shadow-2xl flex flex-col"
          >
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full" />
              </div>
            ) : (
              <>
                {/* ── Header ── */}
                <div className="shrink-0 border-b border-gray-100 px-6 py-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-lg font-bold text-gray-900">{detail.serviceNumber}</span>
                        <StatusBadge status={detail.status} label={detail.statusName} />
                        <PriorityIndicator priority={detail.priority} label={detail.priorityName} />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User size={14} />
                        <span className="font-medium text-gray-700">{detail.customerName}</span>
                        {detail.customerPhone && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span>{detail.customerPhone}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 -m-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6 space-y-6">
                    {/* Cihaz Bilgisi */}
                    <Section icon={<Smartphone size={15} />} title="Cihaz Bilgisi">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <InfoItem label="Cihaz" value={detail.deviceName} />
                        <InfoItem label="Marka / Model" value={[detail.deviceBrand, detail.deviceModel].filter(Boolean).join(' ') || '—'} />
                        <InfoItem label="Seri No" value={detail.deviceSerial ?? '—'} />
                        <InfoItem label="Aksesuarlar" value={detail.deviceAccessories ?? '—'} />
                        <InfoItem label="Cihaz Durumu" value={detail.deviceCondition ?? '—'} />
                        <InfoItem label="Teknisyen" value={detail.assignedUserName ?? '—'} />
                        <InfoItem label="Teslim Alan" value={detail.receivedByUserName} />
                        <InfoItem label="Tahmini Teslim" value={fmtDateShort(detail.estimatedCompletionDate)} />
                      </div>
                    </Section>

                    {/* Arıza */}
                    <div className="bg-gray-50/80 rounded-xl p-4 space-y-2">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Arıza Açıklaması</div>
                      <p className="text-sm text-gray-700 leading-relaxed">{detail.faultDescription}</p>
                      {detail.customerNote && (
                        <>
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Müşteri Notu</div>
                          <p className="text-sm text-gray-600 leading-relaxed">{detail.customerNote}</p>
                        </>
                      )}
                    </div>

                    {/* Maliyet / Ödeme */}
                    <Section icon={<CreditCard size={15} />} title="Maliyet & Ödeme">
                      <div className="grid grid-cols-4 gap-3">
                        <CostItem label="İşçilik" value={fmt(detail.laborCost)} />
                        <CostItem label="Parça" value={fmt(detail.partsCost)} />
                        <CostItem label="Toplam" value={fmt(detail.totalCost)} bold />
                        <div>
                          <div className="text-[11px] text-gray-400 mb-0.5">Ödenen</div>
                          <div className="text-sm font-semibold text-gray-700 tabular-nums">₺{fmt(detail.paidAmount)}</div>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                            detail.paymentStatus === 'Odendi'
                              ? 'bg-emerald-50 text-emerald-600'
                              : detail.paymentStatus === 'KismiOdendi'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-rose-50 text-rose-600'
                          }`}>
                            {detail.paymentStatusName}
                          </span>
                        </div>
                      </div>
                    </Section>

                    {/* Parçalar */}
                    <CollapsibleSection title={`Parçalar (${detail.parts.length})`}>
                      {detail.parts.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2">Henüz parça eklenmemiş.</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-400 border-b border-gray-100">
                              <th className="text-left py-2 font-medium">Parça</th>
                              <th className="text-center py-2 font-medium">Adet</th>
                              <th className="text-right py-2 font-medium">Birim</th>
                              <th className="text-right py-2 font-medium">Toplam</th>
                              <th className="w-8" />
                            </tr>
                          </thead>
                          <tbody>
                            {detail.parts.map((p) => (
                              <tr key={p.id} className="border-b border-gray-50 last:border-0">
                                <td className="py-2.5 text-gray-700">
                                  {p.partName}
                                  {p.deductedFromStock && (
                                    <span className="ml-1.5 text-[10px] font-medium text-blue-500 bg-blue-50 px-1 py-0.5 rounded">(stok)</span>
                                  )}
                                </td>
                                <td className="text-center py-2.5 text-gray-600">{p.quantity}</td>
                                <td className="text-right py-2.5 text-gray-600 tabular-nums">₺{fmt(p.unitCost)}</td>
                                <td className="text-right py-2.5 font-medium text-gray-800 tabular-nums">₺{fmt(p.totalCost)}</td>
                                <td className="text-center py-2.5">
                                  <button
                                    onClick={() => onRemovePart(p.id)}
                                    className="p-1 rounded text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </CollapsibleSection>

                    {/* İşlem Geçmişi / Notlar */}
                    <CollapsibleSection title={`İşlem Geçmişi (${detail.logs.length})`}>
                      {detail.logs.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2">Henüz kayıt yok.</p>
                      ) : (
                        <div className="relative space-y-0 max-h-72 overflow-y-auto pr-1">
                          {/* Timeline çizgisi */}
                          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-100" />

                          {detail.logs.map((log) => (
                            <div key={log.id} className="relative flex gap-3 py-2.5">
                              {/* Dot */}
                              <div className={`relative z-10 w-[15px] h-[15px] rounded-full border-2 mt-0.5 shrink-0 ${
                                log.oldStatusName ? 'bg-blue-500 border-blue-500' : log.isInternal ? 'bg-amber-400 border-amber-400' : 'bg-gray-300 border-gray-300'
                              }`} />
                              {/* Content */}
                              <div className={`flex-1 text-xs rounded-xl p-2.5 ${
                                log.isInternal ? 'bg-amber-50/60 border border-amber-100' : 'bg-gray-50/80'
                              }`}>
                                <div className="flex justify-between text-gray-400 mb-0.5">
                                  <span className="font-medium text-gray-600">{log.userName}</span>
                                  <span className="text-[10px]">{fmtDate(log.createdAt)}</span>
                                </div>
                                {log.oldStatusName && log.newStatusName && (
                                  <div className="text-blue-600 font-medium mb-0.5">{log.oldStatusName} → {log.newStatusName}</div>
                                )}
                                <p className="text-gray-600 leading-relaxed">{log.description}</p>
                                {log.isInternal && (
                                  <span className="text-[10px] font-medium text-amber-500 mt-1 inline-block">[İç not]</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleSection>
                  </div>
                </div>

                {/* ── Sticky Footer Actions ── */}
                <div className="shrink-0 border-t border-gray-100 px-6 py-4 bg-gray-50/50">
                  <div className="flex flex-wrap gap-2">
                    <DrawerAction onClick={onEdit} icon={<Wrench size={14} />} label="Düzenle" />
                    <DrawerAction onClick={onStatusUpdate} icon={<RefreshCw size={14} />} label="Durum" />
                    <DrawerAction onClick={onAddPart} icon={<Plus size={14} />} label="Parça" />
                    <DrawerAction onClick={onAddPayment} icon={<DollarSign size={14} />} label="Ödeme" variant="success" />
                    <DrawerAction onClick={onAddLog} icon={<MessageSquarePlus size={14} />} label="Not" />
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Sub-components ── */

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm text-gray-700">{value}</div>
    </div>
  );
}

function CostItem({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-gray-400 mb-0.5">{label}</div>
      <div className={`text-sm tabular-nums ${bold ? 'font-bold text-gray-900 text-base' : 'font-semibold text-gray-700'}`}>₺{value}</div>
    </div>
  );
}

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 w-full transition-colors"
      >
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {title}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function DrawerAction({
  onClick, icon, label, variant,
}: {
  onClick: () => void; icon: React.ReactNode; label: string; variant?: 'success';
}) {
  const cls = variant === 'success'
    ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300'
    : 'border-gray-200 text-gray-600 hover:border-primary/30 hover:text-primary hover:bg-primary/5';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border rounded-xl transition-all ${cls}`}
    >
      {icon} {label}
    </button>
  );
}
