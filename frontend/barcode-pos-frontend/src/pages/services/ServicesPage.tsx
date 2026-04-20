import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { servicesApi } from '@/api/services';
import type { ServiceListItem, ServiceSummary } from '@/types';
import { toast } from './helpers';
import SummaryCards from './components/SummaryCards';
import FilterBar from './components/FilterBar';
import ServiceTable from './components/ServiceTable';
import ServiceFormModal from './components/modals/ServiceFormModal';

export default function ServicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.endsWith('/') ? location.pathname : location.pathname + '/';
  /* ── Liste state ── */
  const [items, setItems] = useState<ServiceListItem[]>([]);
  const [summary, setSummary] = useState<ServiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* ── Filtreler ── */
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const hasActiveFilters = !!(search || statusFilter || priorityFilter || dateFrom || dateTo);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  /* ── Form (create only) ── */
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customerId: '', assignedUserId: '', deviceName: '', deviceBrand: '',
    deviceModel: '', deviceSerial: '', deviceAccessories: '', deviceCondition: '',
    faultDescription: '', customerNote: '', priority: 'Dusuk', estimatedCompletionDate: '', laborCost: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  /* ═══════════════ Data Loading ═══════════════ */

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const { data: res } = await servicesApi.getAll(params);
      if (res.success && res.data) {
        setItems(res.data.items);
        setTotalPages(res.data.totalPages);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Servis listesi yüklenemedi:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, priorityFilter, dateFrom, dateTo]);

  const loadSummary = async () => {
    try {
      const { data: res } = await servicesApi.getSummary();
      if (res.success && res.data) setSummary(res.data);
    } catch { /* silent */ }
  };

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { loadSummary(); }, []);

  /* ═══════════════ Form (Create) ═══════════════ */

  const openCreate = () => {
    setForm({
      customerId: '', assignedUserId: '', deviceName: '', deviceBrand: '',
      deviceModel: '', deviceSerial: '', deviceAccessories: '', deviceCondition: '',
      faultDescription: '', customerNote: '', priority: 'Dusuk', estimatedCompletionDate: '', laborCost: '',
    });
    setShowForm(true);
  };

  const handleFormSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload: Record<string, unknown> = {
        customerId: Number(form.customerId),
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
      };
      if (form.assignedUserId) payload.assignedUserId = Number(form.assignedUserId);

      const { data: res } = await servicesApi.create(payload);
      if (res.success) {
        toast('success', 'Servis kaydı oluşturuldu.');
        setShowForm(false);
        loadList();
        loadSummary();
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

  /* ═══════════════ Inline Status / Priority ═══════════════ */

  const handleInlineStatusChange = async (id: number, status: string) => {
    try {
      const { data: res } = await servicesApi.updateStatus(id, { status });
      if (res.success) {
        toast('success', 'Durum güncellendi.');
        loadList();
        loadSummary();
      } else {
        toast('error', res.message ?? 'Hata.');
      }
    } catch { toast('error', 'Durum güncellenemedi.'); }
  };

  const handleInlinePriorityChange = async (id: number, priority: string) => {
    try {
      const { data: res } = await servicesApi.updatePriority(id, { priority });
      if (res.success) {
        toast('success', 'Öncelik güncellendi.');
        loadList();
      } else {
        toast('error', res.message ?? 'Hata.');
      }
    } catch { toast('error', 'Öncelik güncellenemedi.'); }
  };

  /* ═══════════════ Delete ═══════════════ */

  const handleDelete = async (id: number) => {
    if (!confirm('Bu servis kaydını silmek istediğinize emin misiniz?')) return;
    try {
      const { data: res } = await servicesApi.delete(id);
      if (res.success) {
        toast('success', 'Servis kaydı silindi.');
        loadList();
        loadSummary();
      } else {
        toast('error', res.message ?? 'Silinemedi.');
      }
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string } } };
      toast('error', axErr.response?.data?.message ?? 'Silme işlemi başarısız.');
    }
  };

  /* ═══════════════ RENDER ═══════════════ */

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Servis Yönetimi</h1>
          <p className="text-sm text-gray-400 mt-0.5">Tüm servis kayıtlarını yönetin</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all active:scale-[0.98]"
        >
          <Plus size={16} />
          Yeni Servis
        </button>
      </div>

      {/* ── Summary Cards (Status Filter Bar) ── */}
      {summary && (
        <SummaryCards
          summary={summary}
          activeStatus={statusFilter}
          onStatusClick={(v: string) => { setStatusFilter(v); setPage(1); }}
        />
      )}

      {/* ── Filter Bar ── */}
      <FilterBar
        search={search}
        onSearchChange={(v: string) => { setSearch(v); setPage(1); }}
        statusFilter={statusFilter}
        onStatusChange={(v: string) => { setStatusFilter(v); setPage(1); }}
        priorityFilter={priorityFilter}
        onPriorityChange={(v: string) => { setPriorityFilter(v); setPage(1); }}
        dateFrom={dateFrom}
        onDateFromChange={(v: string) => { setDateFrom(v); setPage(1); }}
        dateTo={dateTo}
        onDateToChange={(v: string) => { setDateTo(v); setPage(1); }}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
        onSearch={loadList}
      />

      {/* ── Table ── */}
      <ServiceTable
        items={items}
        onSelect={(id: number) => navigate(`${basePath}${id}`)}
        onDelete={handleDelete}
        onStatusChange={handleInlineStatusChange}
        onPriorityChange={handleInlinePriorityChange}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* ── Create Modal ── */}
      <ServiceFormModal
        open={showForm}
        editingId={null}
        form={form}
        onChange={setForm}
        onSubmit={handleFormSave}
        onClose={() => setShowForm(false)}
        loading={formLoading}
      />
    </div>
  );
}
