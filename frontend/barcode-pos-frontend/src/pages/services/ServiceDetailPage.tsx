import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wrench, RefreshCw, Plus, DollarSign, MessageSquarePlus,
  Trash2, User, Smartphone, CreditCard, ChevronUp, ChevronDown,
} from 'lucide-react';
import { servicesApi } from '@/api/services';
import type { ServiceRecord } from '@/types';
import StatusBadge from './components/StatusBadge';
import PriorityIndicator from './components/PriorityIndicator';
import { fmt, fmtDate, fmtDateShort, toast } from './helpers';
import ServiceFormModal from './components/modals/ServiceFormModal';
import StatusUpdateModal from './components/modals/StatusUpdateModal';
import PartModal from './components/modals/PartModal';
import PaymentModal from './components/modals/PaymentModal';
import LogModal from './components/modals/LogModal';

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ServiceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── Form (edit) ── */
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customerId: '', assignedUserId: '', deviceName: '', deviceBrand: '',
    deviceModel: '', deviceSerial: '', deviceAccessories: '', deviceCondition: '',
    faultDescription: '', customerNote: '', priority: 'Dusuk', estimatedCompletionDate: '', laborCost: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  /* ── Status modal ── */
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', note: '', isInternal: false });

  /* ── Part modal ── */
  const [showPartModal, setShowPartModal] = useState(false);
  const [partForm, setPartForm] = useState({ partName: '', quantity: '1', unitCost: '', productId: '' });

  /* ── Payment modal ── */
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', note: '' });

  /* ── Log modal ── */
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({ description: '', isInternal: false });

  /* ── Delete confirm ── */
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: res } = await servicesApi.getById(Number(id));
      if (res.success && res.data) setDetail(res.data);
    } catch {
      toast('error', 'Servis detayı yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  /* ── Edit ── */
  const openEdit = () => {
    if (!detail) return;
    setForm({
      customerId: String(detail.customerId),
      assignedUserId: detail.assignedUserId ? String(detail.assignedUserId) : '',
      deviceName: detail.deviceName,
      deviceBrand: detail.deviceBrand ?? '',
      deviceModel: detail.deviceModel ?? '',
      deviceSerial: detail.deviceSerial ?? '',
      deviceAccessories: detail.deviceAccessories ?? '',
      deviceCondition: detail.deviceCondition ?? '',
      faultDescription: detail.faultDescription,
      customerNote: detail.customerNote ?? '',
      priority: detail.priority,
      estimatedCompletionDate: detail.estimatedCompletionDate?.slice(0, 10) ?? '',
      laborCost: String(detail.laborCost),
    });
    setShowForm(true);
  };

  const handleFormSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    setFormLoading(true);
    try {
      const payload: Record<string, unknown> = {
        deviceName: form.deviceName,
        deviceBrand: form.deviceBrand || undefined,
        deviceModel: form.deviceModel || undefined,
        deviceSerial: form.deviceSerial || undefined,
        deviceAccessories: form.deviceAccessories || undefined,
        deviceCondition: form.deviceCondition || undefined,
        faultDescription: form.faultDescription,
        customerNote: form.customerNote || undefined,
        priority: form.priority,
        estimatedCompletionDate: form.estimatedCompletionDate || undefined,
        laborCost: Number(form.laborCost) || 0,
      };
      if (form.assignedUserId) payload.assignedUserId = Number(form.assignedUserId);

      const { data: res } = await servicesApi.update(detail.id, payload);
      if (res.success) {
        toast('success', 'Servis kaydı güncellendi.');
        setShowForm(false);
        if (res.data) setDetail(res.data);
      } else {
        toast('error', res.message ?? 'İşlem başarısız.');
      }
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string } } };
      toast('error', axErr.response?.data?.message ?? 'Hata oluştu.');
    } finally {
      setFormLoading(false);
    }
  };

  /* ── Status ── */
  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    try {
      const { data: res } = await servicesApi.updateStatus(detail.id, statusForm);
      if (res.success) {
        toast('success', 'Durum güncellendi.');
        setShowStatusModal(false);
        loadDetail();
      } else {
        toast('error', res.message ?? 'Hata.');
      }
    } catch { toast('error', 'Hata oluştu.'); }
  };

  /* ── Parts ── */
  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    try {
      const payload: Record<string, unknown> = {
        partName: partForm.partName,
        quantity: Number(partForm.quantity) || 1,
        unitCost: Number(partForm.unitCost) || 0,
      };
      if (partForm.productId) payload.productId = Number(partForm.productId);
      const { data: res } = await servicesApi.addPart(detail.id, payload);
      if (res.success) {
        toast('success', 'Parça eklendi.');
        setShowPartModal(false);
        loadDetail();
      } else { toast('error', res.message ?? 'Hata.'); }
    } catch { toast('error', 'Hata oluştu.'); }
  };

  const handleRemovePart = async (partId: number) => {
    if (!detail) return;
    try {
      const { data: res } = await servicesApi.removePart(detail.id, partId);
      if (res.success) { toast('success', 'Parça silindi.'); loadDetail(); }
      else { toast('error', res.message ?? 'Hata.'); }
    } catch { toast('error', 'Hata oluştu.'); }
  };

  /* ── Payment ── */
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    try {
      const { data: res } = await servicesApi.addPayment(detail.id, {
        amount: Number(paymentForm.amount),
        note: paymentForm.note || undefined,
      });
      if (res.success) {
        toast('success', 'Ödeme eklendi.');
        setShowPaymentModal(false);
        if (res.data) setDetail(res.data);
      } else { toast('error', res.message ?? 'Hata.'); }
    } catch { toast('error', 'Hata oluştu.'); }
  };

  /* ── Log ── */
  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    try {
      const { data: res } = await servicesApi.addLog(detail.id, logForm);
      if (res.success) {
        toast('success', 'Not eklendi.');
        setShowLogModal(false);
        loadDetail();
      } else { toast('error', res.message ?? 'Hata.'); }
    } catch { toast('error', 'Hata oluştu.'); }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!detail) return;
    try {
      const { data: res } = await servicesApi.delete(detail.id);
      if (res.success) {
        toast('success', 'Servis kaydı silindi.');
        navigate(-1);
      } else { toast('error', res.message ?? 'Silinemedi.'); }
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string } } };
      toast('error', axErr.response?.data?.message ?? 'Silme işlemi başarısız.');
    }
    setShowDeleteConfirm(false);
  };

  /* ── LOADING ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-10 h-10 border-[3px] border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Servis kaydı bulunamadı.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary text-sm font-medium hover:underline">
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xl font-bold text-gray-900">{detail.serviceNumber}</span>
              <StatusBadge status={detail.status} label={detail.statusName} />
              <PriorityIndicator priority={detail.priority} label={detail.priorityName} />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
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
        </div>
        <div className="flex gap-2">
          <ActionBtn onClick={openEdit} icon={<Wrench size={14} />} label="Düzenle" />
          <ActionBtn onClick={() => { setStatusForm({ status: '', note: '', isInternal: false }); setShowStatusModal(true); }} icon={<RefreshCw size={14} />} label="Durum" />
          <ActionBtn onClick={() => { setPartForm({ partName: '', quantity: '1', unitCost: '', productId: '' }); setShowPartModal(true); }} icon={<Plus size={14} />} label="Parça" />
          <ActionBtn onClick={() => { setPaymentForm({ amount: '', note: '' }); setShowPaymentModal(true); }} icon={<DollarSign size={14} />} label="Ödeme" variant="success" />
          <ActionBtn onClick={() => { setLogForm({ description: '', isInternal: false }); setShowLogModal(true); }} icon={<MessageSquarePlus size={14} />} label="Not" />
          <ActionBtn onClick={() => setShowDeleteConfirm(true)} icon={<Trash2 size={14} />} label="Sil" variant="danger" />
        </div>
      </div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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

        {/* Maliyet & Ödeme */}
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
      </div>

      {/* ── Arıza ── */}
      <div className="bg-gray-50/80 rounded-xl p-5 space-y-2">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Arıza Açıklaması</div>
        <p className="text-sm text-gray-700 leading-relaxed">{detail.faultDescription}</p>
        {detail.customerNote && (
          <>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Müşteri Notu</div>
            <p className="text-sm text-gray-600 leading-relaxed">{detail.customerNote}</p>
          </>
        )}
      </div>

      {/* ── Parçalar ── */}
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
                    <button onClick={() => handleRemovePart(p.id)}
                      className="p-1 rounded text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CollapsibleSection>

      {/* ── İşlem Geçmişi ── */}
      <CollapsibleSection title={`İşlem Geçmişi (${detail.logs.length})`}>
        {detail.logs.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">Henüz kayıt yok.</p>
        ) : (
          <div className="relative space-y-0 max-h-96 overflow-y-auto pr-1">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-100" />
            {detail.logs.map((log) => (
              <div key={log.id} className="relative flex gap-3 py-2.5">
                <div className={`relative z-10 w-[15px] h-[15px] rounded-full border-2 mt-0.5 shrink-0 ${
                  log.oldStatusName ? 'bg-blue-500 border-blue-500' : log.isInternal ? 'bg-amber-400 border-amber-400' : 'bg-gray-300 border-gray-300'
                }`} />
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

      {/* ── Delete Confirm ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Servis Kaydını Sil</h3>
            <p className="text-sm text-gray-500 mb-5">
              <strong>{detail.serviceNumber}</strong> numaralı servis kaydı kalıcı olarak silinecektir. Devam etmek istiyor musunuz?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition">
                İptal
              </button>
              <button onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition">
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <ServiceFormModal
        open={showForm} editingId={detail.id} form={form} onChange={setForm}
        onSubmit={handleFormSave} onClose={() => setShowForm(false)} loading={formLoading}
      />
      <StatusUpdateModal
        open={showStatusModal} form={statusForm} onChange={setStatusForm}
        onSubmit={handleStatusUpdate} onClose={() => setShowStatusModal(false)}
      />
      <PartModal
        open={showPartModal} form={partForm} onChange={setPartForm}
        onSubmit={handleAddPart} onClose={() => setShowPartModal(false)}
      />
      <PaymentModal
        open={showPaymentModal} form={paymentForm} onChange={setPaymentForm}
        onSubmit={handleAddPayment} onClose={() => setShowPaymentModal(false)}
        remaining={detail.totalCost - detail.paidAmount}
      />
      <LogModal
        open={showLogModal} form={logForm} onChange={setLogForm}
        onSubmit={handleAddLog} onClose={() => setShowLogModal(false)}
      />
    </div>
  );
}

/* ── Sub-components ── */

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 w-full transition-colors">
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {title}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function ActionBtn({
  onClick, icon, label, variant,
}: {
  onClick: () => void; icon: React.ReactNode; label: string; variant?: 'success' | 'danger';
}) {
  const cls = variant === 'success'
    ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300'
    : variant === 'danger'
      ? 'border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300'
      : 'border-gray-200 text-gray-600 hover:border-primary/30 hover:text-primary hover:bg-primary/5';
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border rounded-xl transition-all ${cls}`}>
      {icon} {label}
    </button>
  );
}
