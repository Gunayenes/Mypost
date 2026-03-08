import { useState, useRef, useCallback, useEffect } from 'react';
import { useCartStore } from '../store/cartStore';
import { salesApi } from '../api/salesApi';
import { PaymentType } from '../types';
import type { SaleResponseDto, CartItem } from '../types';

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PAYMENT_LABELS: Record<PaymentType, string> = {
  [PaymentType.Nakit]: 'Nakit',
  [PaymentType.Kart]: 'Kart',
  [PaymentType.Veresiye]: 'Veresiye',
};

// ─── component ──────────────────────────────────────────────────────────────

export default function POSPage() {
  const {
    items,
    customerId,
    customerName,
    paymentType,
    paidAmount,
    subTotal,
    taxTotal,
    discountTotal,
    grandTotal,
    addItem,
    removeItem,
    updateQuantity,
    setPaymentType,
    setPaidAmount,
    clearCart,
  } = useCartStore();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScannedName, setLastScannedName] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [receipt, setReceipt] = useState<SaleResponseDto | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus barcode input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── barcode / search ──────────────────────────────────────────────────────

  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      try {
        const res = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!res.ok) {
          setErrorMsg(`Ürün bulunamadı: ${barcode}`);
          return;
        }
        const product = await res.json();
        addItem(product);
        setLastScannedName(product.name);
        setErrorMsg(null);
      } catch {
        setErrorMsg('Bağlantı hatası');
      }
    },
    [addItem]
  );

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (code) {
      void handleBarcodeScan(code);
      setBarcodeInput('');
    }
  };

  // ── payment flow ──────────────────────────────────────────────────────────

  const handlePaymentClick = (type: PaymentType) => {
    if (items.length === 0) return;
    setPaymentType(type);
    // For cash, pre-fill paidAmount with grandTotal so cashier just adjusts
    if (type === PaymentType.Nakit) {
      setPaidAmount(parseFloat(grandTotal().toFixed(2)));
    }
    setShowConfirm(true);
  };

  /**
   * handleCompleteSale — submits the sale to the backend.
   *
   * Fixes applied:
   * 1. `paidAmount` is read from cartStore and included in the request payload.
   * 2. For cash payments, we validate that `paidAmount >= grandTotal` before
   *    sending the request — insufficient payment is rejected with a clear error.
   * 3. `customerId` is read from cartStore (set when the cashier selects a
   *    customer), never hard-coded to null.
   */
  const handleCompleteSale = async () => {
    if (!paymentType) return;

    const total = grandTotal();

    // ── Fix 2: payment validation for cash ──────────────────────────────────
    if (paymentType === PaymentType.Nakit && paidAmount < total) {
      setErrorMsg(
        `Yetersiz ödeme: ödenen ₺${fmt(paidAmount)}, gereken ₺${fmt(total)}`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const sale = await salesApi.create({
        // ── Fix 3: use customerId from cartStore, not a hard-coded null ──────
        customerId,
        paymentType,
        // ── Fix 1: include paidAmount in the request ──────────────────────
        paidAmount,
        discountTotal: parseFloat(discountTotal().toFixed(2)),
        items: items.map((i: CartItem) => ({
          productId: i.productId,
          quantity: i.quantity,
          discountAmount: i.discountAmount,
        })),
      });

      setReceipt(sale);
      setShowConfirm(false);
      clearCart();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Satış tamamlanamadı. Lütfen tekrar deneyin.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* ─── Left panel ─────────────────────────────────────────────────── */}
      <div style={{ flex: '0 0 60%', padding: '1rem', borderRight: '1px solid #ccc' }}>
        <h2>POS Satış Ekranı</h2>

        {/* Barcode input */}
        <form onSubmit={handleBarcodeSubmit} style={{ marginBottom: '1rem' }}>
          <input
            ref={inputRef}
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Barkod / Ürün Ara…"
            style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
          />
        </form>

        {lastScannedName && (
          <div style={{ padding: '0.5rem', background: '#e8f5e9', marginBottom: '0.5rem' }}>
            ✅ Son eklenen: <strong>{lastScannedName}</strong>
          </div>
        )}

        {errorMsg && (
          <div style={{ padding: '0.5rem', background: '#ffebee', color: '#c62828', marginBottom: '0.5rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}
      </div>

      {/* ─── Right panel (cart) ──────────────────────────────────────────── */}
      <div style={{ flex: '0 0 40%', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
        <h3>Sepet</h3>

        {/* Cart items */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
          {items.length === 0 ? (
            <p style={{ color: '#999' }}>Sepet boş</p>
          ) : (
            items.map((item) => (
              <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                <div>
                  <strong>{item.name}</strong>
                  <div style={{ fontSize: '0.85rem', color: '#555' }}>
                    {item.quantity} × ₺{fmt(item.unitPrice)} = ₺{fmt(item.lineTotal)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>−</button>
                  <span style={{ minWidth: '2ch', textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                  <button onClick={() => removeItem(item.productId)} style={{ color: 'red' }}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        <div style={{ borderTop: '1px solid #ccc', paddingTop: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Ara Toplam</span><span>₺{fmt(subTotal())}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>KDV</span><span>₺{fmt(taxTotal())}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>İndirim</span><span>-₺{fmt(discountTotal())}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
            <span>TOPLAM</span><span>₺{fmt(grandTotal())}</span>
          </div>
        </div>

        {/* Payment buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <button
            onClick={() => handlePaymentClick(PaymentType.Nakit)}
            style={{ flex: 1, padding: '0.75rem', background: '#4caf50', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            NAKİT
          </button>
          <button
            onClick={() => handlePaymentClick(PaymentType.Kart)}
            style={{ flex: 1, padding: '0.75rem', background: '#2196f3', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            KART
          </button>
          <button
            onClick={() => handlePaymentClick(PaymentType.Veresiye)}
            style={{ flex: 1, padding: '0.75rem', background: '#ff9800', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            VERESİYE
          </button>
        </div>

        <button
          onClick={clearCart}
          style={{ width: '100%', padding: '0.5rem', background: '#f44336', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          🗑️ Sepeti Temizle
        </button>
      </div>

      {/* ─── Payment confirmation modal ──────────────────────────────────── */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', minWidth: '320px' }}>
            <h3>Ödeme Onayı</h3>
            <p>Toplam: <strong>₺{fmt(grandTotal())}</strong></p>
            <p>Ödeme: <strong>{paymentType !== null ? PAYMENT_LABELS[paymentType] : ''}</strong></p>

            {paymentType === PaymentType.Veresiye && (
              <p>Müşteri: <strong>{customerName ?? '(seçilmedi)'}</strong></p>
            )}

            {/* Cash: allow cashier to enter tendered amount */}
            {paymentType === PaymentType.Nakit && (
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="paidAmount" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Ödenen Tutar (₺)
                </label>
                <input
                  id="paidAmount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
                />
                {paidAmount >= grandTotal() && (
                  <p style={{ color: '#388e3c' }}>
                    Para Üstü: ₺{fmt(paidAmount - grandTotal())}
                  </p>
                )}
                {paidAmount > 0 && paidAmount < grandTotal() && (
                  <p style={{ color: '#c62828' }}>
                    Eksik: ₺{fmt(grandTotal() - paidAmount)}
                  </p>
                )}
              </div>
            )}

            {errorMsg && (
              <p style={{ color: '#c62828' }}>⚠️ {errorMsg}</p>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                onClick={handleCompleteSale}
                disabled={isSubmitting}
                style={{ flex: 1, padding: '0.75rem', background: '#4caf50', color: '#fff', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
              >
                {isSubmitting ? 'İşleniyor…' : 'Onayla'}
              </button>
              <button
                onClick={() => { setShowConfirm(false); setErrorMsg(null); }}
                style={{ flex: 1, padding: '0.75rem', background: '#9e9e9e', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Receipt modal ───────────────────────────────────────────────── */}
      {receipt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', minWidth: '360px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3>🧾 Fiş — {receipt.receiptNumber}</h3>
            <p>Kasiyer: {receipt.cashierName}</p>
            <p>Tarih: {new Date(receipt.saleDate).toLocaleString('tr-TR')}</p>
            {receipt.customerName && <p>Müşteri: {receipt.customerName}</p>}
            <hr />
            {receipt.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>{item.productName} x{item.quantity}</span>
                <span>₺{fmt(item.lineTotal)}</span>
              </div>
            ))}
            <hr />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Toplam</span><span>₺{fmt(receipt.grandTotal)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ödeme</span><span>{receipt.paymentType}</span></div>
            {receipt.paidAmount > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ödenen</span><span>₺{fmt(receipt.paidAmount)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Para Üstü</span><span>₺{fmt(receipt.changeAmount)}</span></div>
              </>
            )}
            <button
              onClick={() => setReceipt(null)}
              style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', background: '#2196f3', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              Yeni Satış
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
