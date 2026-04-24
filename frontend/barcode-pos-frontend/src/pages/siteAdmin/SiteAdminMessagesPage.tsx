import { useEffect, useState } from 'react';
import { siteAdminApi } from '@/api/siteAdmin';
import { Mail, MailOpen, Trash2, Phone, Building2, User, Calendar, Reply } from 'lucide-react';

interface ContactMsg {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  businessName?: string;
  subject: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export default function SiteAdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMsg | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data: res } = await siteAdminApi.getContactMessages({
        unreadOnly: filter === 'unread',
        pageSize: 100,
      });
      if (res.success && res.data) setMessages(res.data.items);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { loadMessages(); }, [filter]); // eslint-disable-line

  const handleOpen = async (msg: ContactMsg) => {
    setSelected(msg);
    if (!msg.isRead) {
      try {
        await siteAdminApi.markContactRead(msg.id);
        setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, isRead: true } : m));
      } catch { /* silent */ }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
    try {
      await siteAdminApi.deleteContactMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch { /* silent */ }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İletişim Mesajları</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Ziyaretçilerin iletişim formundan gönderdiği mesajlar
            {unreadCount > 0 && <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">{unreadCount} okunmamış</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'unread' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Okunmamış
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Message list */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <span className="text-xs font-semibold text-gray-500 uppercase">
              {messages.length} Mesaj
            </span>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Yükleniyor...</div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                <Mail size={24} className="mx-auto mb-2 opacity-50" />
                Henüz mesaj yok
              </div>
            ) : (
              messages.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleOpen(m)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                    selected?.id === m.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                  } ${!m.isRead ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {!m.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                        <p className="text-sm font-bold text-gray-900 truncate">{m.fullName}</p>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{m.email}</p>
                      <p className="text-xs text-gray-600 mt-1 truncate">{m.subject}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                      {new Date(m.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{selected.subject}</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(selected.createdAt).toLocaleString('tr-TR')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                  title="Sil"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">{selected.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  <a href={`mailto:${selected.email}`} className="text-sm text-primary-600 hover:underline">
                    {selected.email}
                  </a>
                </div>
                {selected.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <a href={`tel:${selected.phone}`} className="text-sm text-primary-600 hover:underline">
                      {selected.phone}
                    </a>
                  </div>
                )}
                {selected.businessName && (
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{selected.businessName}</span>
                  </div>
                )}
                {selected.readAt && (
                  <div className="flex items-center gap-2 col-span-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-xs text-gray-500">
                      Okundu: {new Date(selected.readAt).toLocaleString('tr-TR')}
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Mesaj</label>
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selected.message}
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 transition"
                >
                  <Reply size={16} />
                  E-posta ile Yanıtla
                </a>
                {selected.phone && (
                  <a
                    href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition"
                  >
                    WhatsApp ile Yanıtla
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <MailOpen size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400">Detayını görmek için bir mesaj seçin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
