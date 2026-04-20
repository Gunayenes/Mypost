# 📡 FAZ 2-G: useBarcodeScanner Hook

> Önkoşul: POS satış ekranı iskeleti hazır olmalı.

---

```plaintext
Generate a production-ready React hook called useBarcodeScanner for USB barcode scanners.

═══════════════════════════════════════
HOW USB BARCODE SCANNERS WORK
═══════════════════════════════════════

A USB barcode scanner acts as a keyboard input device:
- It types characters very rapidly (each keystroke < 30ms apart)
- After the barcode string, it sends an Enter key
- Normal human typing has > 100ms between keystrokes

The challenge: distinguish scanner input from keyboard input.

═══════════════════════════════════════
TIMING STRATEGY
═══════════════════════════════════════

- Maintain a character buffer
- Track time between keystrokes
- If gap between keys > maxDelay (default: 50ms):
  → Reset buffer (this was manual keyboard input)
- If key is Enter:
  → If buffer length >= minLength (default: 4):
    → This is a barcode scan → call onScan(barcode)
  → Reset buffer
- Only add printable characters (key.length === 1) to buffer

═══════════════════════════════════════
HOOK API
═══════════════════════════════════════

interface UseBarcodeOptions {
  onScan: (barcode: string) => void;
  minLength?: number;    // Minimum barcode length (default: 4)
  maxDelay?: number;     // Max ms between keystrokes (default: 50)
  enabled?: boolean;     // Enable/disable scanning (default: true)
}

function useBarcodeScanner(options: UseBarcodeOptions): void

═══════════════════════════════════════
IMPLEMENTATION REQUIREMENTS
═══════════════════════════════════════

- Use useEffect for event listener lifecycle
- Use useRef for buffer and timestamp (no re-renders)
- Use useCallback for stable handler reference
- Clean up event listener on unmount
- Support enabled/disabled toggle (when modal is open, disable scanner)
- Prevent Enter default behavior when barcode is detected
- Do not interfere with normal input field typing
- Handle edge cases:
  - Very short barcodes (< minLength) → ignore
  - Scanner sending special characters → ignore non-printable
  - Multiple rapid scans → process each Enter separately

═══════════════════════════════════════
USAGE EXAMPLE IN POS SCREEN
═══════════════════════════════════════

// PosPage.tsx
const handleBarcodeScan = useCallback(async (barcode: string) => {
  try {
    const product = await productService.getByBarcode(barcode);
    cartStore.addItem(product);
    toast.success(`${product.name} eklendi`);
  } catch {
    toast.error(`Ürün bulunamadı: ${barcode}`);
  }
}, []);

useBarcodeScanner({
  onScan: handleBarcodeScan,
  minLength: 4,
  maxDelay: 50,
  enabled: !isModalOpen,  // disable when modal is showing
});

═══════════════════════════════════════
TESTING NOTES
═══════════════════════════════════════

To test without a physical scanner:
- Open browser console
- Dispatch rapid keydown events programmatically
- Or use a barcode scanner simulator app

Output:
1. hooks/useBarcodeScanner.ts — complete hook code
2. Usage example integrated into POS page
3. Explanation of timing strategy as code comments
4. Edge case handling notes
```
