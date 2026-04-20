export function isElectron(): boolean {
  return !!(window as unknown as { electronAPI?: { isElectron: boolean } }).electronAPI
    ?.isElectron;
}
