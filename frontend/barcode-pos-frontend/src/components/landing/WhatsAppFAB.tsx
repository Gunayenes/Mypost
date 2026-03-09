import { MessageCircle } from 'lucide-react';

const PHONE = '905427460197';

export default function WhatsAppFAB() {
  return (
    <a
      href={`https://wa.me/${PHONE}?text=${encodeURIComponent('Merhaba, KasaPlus hakkında bilgi almak istiyorum.')}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-110"
      aria-label="WhatsApp ile iletişim"
    >
      <MessageCircle size={26} />
    </a>
  );
}
