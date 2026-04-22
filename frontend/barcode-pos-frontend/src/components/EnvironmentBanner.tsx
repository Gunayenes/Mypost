import { AlertTriangle } from 'lucide-react';

/**
 * Test ortamında üst banner olarak görünür.
 * Production'da görünmez (hostname kontrolü).
 */
export default function EnvironmentBanner() {
  const hostname = window.location.hostname;
  const isStaging = hostname.startsWith('test.') || hostname.includes('staging') || hostname.includes('localhost');

  if (!isStaging) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[10000] bg-amber-500 text-white text-center py-1.5 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-md">
      <AlertTriangle size={14} />
      <span>TEST ORTAMI — Canlı veriler etkilenmez</span>
    </div>
  );
}
