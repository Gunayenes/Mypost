import { create } from 'zustand';
import { storeSettingsApi, type StoreSettings } from '@/api/storeSettings';

interface StoreSettingsState {
  settings: StoreSettings | null;
  loaded: boolean;
  fetch: () => Promise<void>;
  update: (settings: Partial<StoreSettings>) => void;
}

export const useStoreSettings = create<StoreSettingsState>((set, get) => ({
  settings: null,
  loaded: false,

  fetch: async () => {
    if (get().loaded) return;
    try {
      const res = await storeSettingsApi.get();
      if (res.data.success && res.data.data) {
        set({ settings: res.data.data, loaded: true });
      }
    } catch {
      // auth yoksa sessizce geç
    }
  },

  update: (partial) => {
    const current = get().settings;
    if (current) {
      set({ settings: { ...current, ...partial } });
    }
  },
}));
