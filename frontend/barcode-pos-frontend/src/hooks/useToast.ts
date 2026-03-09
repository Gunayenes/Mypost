import { useCallback } from 'react';

export function useToast() {
  const show = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    window.dispatchEvent(new CustomEvent('toast', { detail: { type, message } }));
  }, []);

  return {
    success: (msg: string) => show('success', msg),
    error: (msg: string) => show('error', msg),
    info: (msg: string) => show('info', msg),
  };
}
