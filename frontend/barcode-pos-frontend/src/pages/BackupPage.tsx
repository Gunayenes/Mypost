import { useEffect, useState, useRef } from 'react';
import { backupApi } from '@/api/backup';
import type { BackupInfo } from '@/api/backup';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Database, Download, RotateCcw, Trash2, Upload, Plus, Loader2 } from 'lucide-react';

function toast(type: 'success' | 'error', message: string) {
  window.dispatchEvent(new CustomEvent('toast', { detail: { type, message } }));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  // Onay modal state'leri
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [confirmUpload, setConfirmUpload] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const res = await backupApi.getList();
      if (res.data.success) setBackups(res.data.data ?? []);
    } catch {
      toast('error', 'Yedek listesi alınamadı.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBackups(); }, []);

  // ── Yedek Oluştur ──
  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await backupApi.create();
      if (res.data.success) {
        toast('success', res.data.data?.message ?? 'Yedek oluşturuldu.');
        await loadBackups();
      } else {
        toast('error', res.data.message ?? 'Yedek oluşturulamadı.');
      }
    } catch {
      toast('error', 'Yedek oluşturulurken hata oluştu.');
    } finally {
      setCreating(false);
    }
  };

  // ── İndir ──
  const handleDownload = async (fileName: string) => {
    setDownloadingFile(fileName);
    try {
      await backupApi.download(fileName);
    } catch {
      toast('error', 'Dosya indirilemedi.');
    } finally {
      setDownloadingFile(null);
    }
  };

  // ── Listeden Geri Yükle ──
  const handleRestoreExisting = async (fileName: string) => {
    setRestoring(true);
    try {
      const res = await backupApi.restoreFromExisting(fileName);
      if (res.data.success) {
        toast('success', res.data.data?.message ?? 'Geri yükleme başarılı.');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast('error', res.data.message ?? 'Geri yükleme başarısız.');
      }
    } catch {
      toast('error', 'Geri yükleme sırasında hata oluştu.');
    } finally {
      setRestoring(false);
      setConfirmRestore(null);
    }
  };

  // ── Dosyadan Geri Yükle ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.db')) {
      toast('error', 'Sadece .db uzantılı dosyalar kabul edilir.');
      return;
    }
    setConfirmUpload(file);
    // Input'u sıfırla (aynı dosya tekrar seçilebilsin)
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRestoreUpload = async (file: File) => {
    setRestoring(true);
    try {
      const res = await backupApi.restoreFromUpload(file);
      if (res.data.success) {
        toast('success', res.data.data?.message ?? 'Geri yükleme başarılı.');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast('error', res.data.message ?? 'Geri yükleme başarısız.');
      }
    } catch {
      toast('error', 'Geri yükleme sırasında hata oluştu.');
    } finally {
      setRestoring(false);
      setConfirmUpload(null);
    }
  };

  // ── Sil ──
  const handleDelete = async (fileName: string) => {
    setDeletingFile(fileName);
    try {
      const res = await backupApi.delete(fileName);
      if (res.data.success) {
        toast('success', 'Yedek silindi.');
        await loadBackups();
      } else {
        toast('error', res.data.message ?? 'Yedek silinemedi.');
      }
    } catch {
      toast('error', 'Yedek silinirken hata oluştu.');
    } finally {
      setDeletingFile(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Başlık ve Aksiyonlar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Veritabanı Yedekleme</h1>
            <p className="text-sm text-gray-500">Veritabanınızı yedekleyin veya geri yükleyin</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            disabled={creating || restoring}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Yeni Yedek Oluştur
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".db"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={restoring}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            <Upload size={16} />
            Dosyadan Geri Yükle
          </button>
        </div>
      </div>

      {/* Yedek Listesi */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : backups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Database size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">Henüz yedek bulunmuyor.</p>
          <p className="text-gray-400 text-sm mt-1">Yukarıdaki butona tıklayarak ilk yedeğinizi oluşturun.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Dosya Adı</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Boyut</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Tarih</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.fileName} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Database size={16} className="text-gray-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-900 truncate">{b.fileName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{formatBytes(b.fileSizeBytes)}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{formatDate(b.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleDownload(b.fileName)}
                        disabled={downloadingFile === b.fileName}
                        title="İndir"
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition disabled:opacity-50"
                      >
                        {downloadingFile === b.fileName ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      </button>
                      <button
                        onClick={() => setConfirmRestore(b.fileName)}
                        disabled={restoring}
                        title="Bu yedekten geri yükle"
                        className="p-2 hover:bg-amber-50 rounded-lg text-amber-600 transition disabled:opacity-50"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(b.fileName)}
                        disabled={deletingFile === b.fileName}
                        title="Sil"
                        className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition disabled:opacity-50"
                      >
                        {deletingFile === b.fileName ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Silme Onay Modalı */}
      <ConfirmModal
        open={confirmDelete !== null}
        title="Yedeği Sil"
        message={`"${confirmDelete}" dosyasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        danger
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Geri Yükleme Onay Modalı (listeden) */}
      <ConfirmModal
        open={confirmRestore !== null}
        title="Veritabanını Geri Yükle"
        message={`"${confirmRestore}" yedeğinden geri yüklemek istediğinize emin misiniz? Mevcut veriler bu yedeğin durumuyla değiştirilecektir. Geri yükleme öncesi otomatik yedek alınacaktır.`}
        confirmLabel="Geri Yükle"
        cancelLabel="Vazgeç"
        danger
        onConfirm={() => confirmRestore && handleRestoreExisting(confirmRestore)}
        onCancel={() => setConfirmRestore(null)}
      />

      {/* Geri Yükleme Onay Modalı (dosyadan) */}
      <ConfirmModal
        open={confirmUpload !== null}
        title="Dosyadan Geri Yükle"
        message={`"${confirmUpload?.name}" dosyasından geri yüklemek istediğinize emin misiniz? Mevcut veriler bu dosyadaki verilerle değiştirilecektir. Geri yükleme öncesi otomatik yedek alınacaktır.`}
        confirmLabel="Geri Yükle"
        cancelLabel="Vazgeç"
        danger
        onConfirm={() => confirmUpload && handleRestoreUpload(confirmUpload)}
        onCancel={() => setConfirmUpload(null)}
      />
    </div>
  );
}
