import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createHold,
  getCheckoutTotals,
  listHolds,
  prolongHold,
  purchase,
  removeHold,
} from '../../services/regiondoCheckoutService';
import type { RegiondoCartItem, RegiondoPurchaseInput } from '../../types/regiondoCheckout';
import {
  REGIONDO_DEFAULT_OFFLINE_PAYMENT,
  REGIONDO_PURCHASE_PAYMENT_OPTIONS,
  buildRegiondoPurchasePayment,
  isExclusivePaymentSubOptions,
} from '../../constants/regiondoOfflinePayments';
import { buildBuyerDataFromContact } from '../../lib/regiondoPurchaseBuyerData';
import {
  parseCurrencyFromTotalsResponse,
  parseGrandTotalFromTotalsResponse,
  parsePaymentsAvailable,
} from '../../lib/regiondoCheckoutResponse';
import { CalendarPlus, ChevronDown, Loader2, Timer, Trash2, ShoppingCart } from 'lucide-react';

function toRegiondoDateTime(datetimeLocal: string): string {
  if (!datetimeLocal) return '';
  const [d, t] = datetimeLocal.split('T');
  if (!d || !t) return datetimeLocal;
  const [hh, mm] = t.split(':');
  return `${d} ${hh}:${mm || '00'}:00`;
}

const REGIONDO_SOURCE_POS = 1;

function cartFromForm(
  productId: string,
  optionId: string,
  qty: string,
  datetimeLocal: string,
  reservationCode: string
): RegiondoCartItem {
  const item: RegiondoCartItem = {
    product_id: Number(productId),
    qty: Math.max(1, Number.parseInt(qty, 10) || 1),
    source_type: REGIONDO_SOURCE_POS,
  };
  if (optionId.trim()) item.option_id = Number(optionId);
  const dt = toRegiondoDateTime(datetimeLocal);
  if (dt) item.date_time = dt;
  if (reservationCode.trim()) item.reservation_code = reservationCode.trim();
  return item;
}

type ParsedPayments = ReturnType<typeof parsePaymentsAvailable>;

interface TotalsSnapshot {
  payments: ParsedPayments;
  grandTotal: number | undefined;
  currency: string | undefined;
  contactDataRequired: string[];
  buyerDataRequired: unknown[];
  raw: unknown;
}

export function RegiondoCreateBookingPanel() {
  const [productId, setProductId] = useState('');
  const [optionId, setOptionId] = useState('');
  const [qty, setQty] = useState('1');
  const [datetimeLocal, setDatetimeLocal] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [comment, setComment] = useState('');
  const [reservationCode, setReservationCode] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [syncTickets, setSyncTickets] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>(REGIONDO_DEFAULT_OFFLINE_PAYMENT);

  const [holdLoading, setHoldLoading] = useState(false);
  const [holdsLoading, setHoldsLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [prolongLoading, setProlongLoading] = useState(false);
  const [holdsJson, setHoldsJson] = useState<string>('');
  const [lastPurchase, setLastPurchase] = useState<string>('');
  const [totalsPreview, setTotalsPreview] = useState<string>('');
  const [paymentsFromTotals, setPaymentsFromTotals] = useState([] as ParsedPayments);
  const [lastGrandTotal, setLastGrandTotal] = useState<number | undefined>(undefined);
  const [lastCurrency, setLastCurrency] = useState<string | undefined>(undefined);
  const [contactDataRequired, setContactDataRequired] = useState<string[]>([]);
  const [paymentSubOptionName, setPaymentSubOptionName] = useState('');
  const [totalsLoading, setTotalsLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  /** Native `<details>` can confuse React reconciliation — use controlled panels instead. */
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
  const [holdSectionOpen, setHoldSectionOpen] = useState(false);

  const itemValid = productId.trim() && qty.trim();

  const selectedPaymentFromTotals = paymentsFromTotals.find((p) => p.code === paymentMethod);
  const exclusivePaymentSubOptions =
    selectedPaymentFromTotals?.payment_options &&
    isExclusivePaymentSubOptions(selectedPaymentFromTotals.payment_options)
      ? selectedPaymentFromTotals.payment_options
      : null;

  useEffect(() => {
    if (!exclusivePaymentSubOptions?.length) return;
    setPaymentSubOptionName((prev) => {
      if (prev && exclusivePaymentSubOptions.some((o) => o.name === prev)) return prev;
      const paidCash = exclusivePaymentSubOptions.find((o) => o.name === 'paid_cash');
      return paidCash?.name ?? exclusivePaymentSubOptions[0]?.name ?? '';
    });
  }, [paymentMethod, exclusivePaymentSubOptions]);

  function applyTotalsSnapshot(s: TotalsSnapshot): void {
    setPaymentsFromTotals(s.payments);
    setLastGrandTotal(s.grandTotal);
    setLastCurrency(s.currency);
    setContactDataRequired(s.contactDataRequired);
    setTotalsPreview(JSON.stringify(s.raw, null, 2));
  }

  function parseTotalsResponse(data: unknown): TotalsSnapshot | null {
    if (data === null || data === undefined) return null;
    const root = data as Record<string, unknown>;
    const inner =
      root?.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : root;
    if (!inner || typeof inner !== 'object') return null;
    let parsed = parsePaymentsAvailable(inner);
    if (
      parsed.length === 0 &&
      inner.totals != null &&
      typeof inner.totals === 'object'
    ) {
      parsed = parsePaymentsAvailable(inner.totals);
    }
    return {
      payments: parsed,
      grandTotal: parseGrandTotalFromTotalsResponse(data),
      currency: parseCurrencyFromTotalsResponse(data),
      contactDataRequired: Array.isArray(inner.contact_data_required)
        ? (inner.contact_data_required as string[])
        : [],
      buyerDataRequired: Array.isArray(inner.buyer_data_required) ? inner.buyer_data_required : [],
      raw: data,
    };
  }

  async function fetchTotalsSnapshot(): Promise<TotalsSnapshot | null> {
    if (!itemValid) {
      toast.error('Enter product ID and quantity.');
      return null;
    }
    setTotalsLoading(true);
    try {
      const item = cartFromForm(productId, optionId, qty, datetimeLocal, reservationCode);
      const data = await getCheckoutTotals({ items: [item], source_type: REGIONDO_SOURCE_POS });
      const snap = parseTotalsResponse(data);
      if (!snap) {
        toast.error('Invalid totals response.');
        return null;
      }
      applyTotalsSnapshot(snap);
      if (snap.payments.length) {
        const codes = new Set(snap.payments.map((p) => p.code));
        if (!codes.has(paymentMethod)) {
          setPaymentMethod(snap.payments[0].code);
        }
      }
      return snap;
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Could not load pricing.');
      return null;
    } finally {
      setTotalsLoading(false);
    }
  }

  const handleRefreshPrice = async () => {
    const snap = await fetchTotalsSnapshot();
    if (snap) toast.success('Price updated');
  };

  const handleCompleteBooking = async () => {
    if (!itemValid || !firstname.trim() || !lastname.trim() || !email.trim()) {
      toast.error('Fill in product, quantity, first name, last name, and email.');
      return;
    }
    if (!optionId.trim() || !datetimeLocal) {
      toast.error('Option ID and date/time are required for this booking.');
      return;
    }

    setPurchaseLoading(true);
    setLastPurchase('');
    try {
      const snap = await fetchTotalsSnapshot();
      if (!snap) return;

      let paymentCode = paymentMethod;
      if (snap.payments.length && !snap.payments.some((p) => p.code === paymentCode)) {
        paymentCode = snap.payments[0].code;
        setPaymentMethod(paymentCode);
      }
      const selectedPayment = snap.payments.find((p) => p.code === paymentCode);

      if (paymentCode !== 'api_external' && snap.grandTotal == null) {
        toast.error('Could not read order total. Try again or contact support.');
        return;
      }

      let subOption = paymentSubOptionName.trim();
      if (
        selectedPayment?.payment_options &&
        isExclusivePaymentSubOptions(selectedPayment.payment_options)
      ) {
        const opts = selectedPayment.payment_options;
        if (!subOption || !opts.some((o) => o.name === subOption)) {
          subOption =
            opts.find((o) => o.name === 'paid_cash')?.name ?? opts[0]?.name ?? '';
        }
        if (!subOption) {
          toast.error('Select how the customer paid (cash, card, etc.).');
          return;
        }
      }

      const phoneRequired = snap.contactDataRequired.includes('telephone');
      if (phoneRequired && !telephone.trim()) {
        toast.error('Phone number is required.');
        return;
      }

      const item = cartFromForm(productId, optionId, qty, datetimeLocal, reservationCode);
      const buyer_data = buildBuyerDataFromContact(snap.buyerDataRequired, {
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim(),
        telephone: telephone.trim(),
      });

      const body: RegiondoPurchaseInput = {
        items: [item],
        contact_data: {
          firstname: firstname.trim(),
          lastname: lastname.trim(),
          email: email.trim(),
          telephone: telephone.trim() || undefined,
          comment: comment.trim() || undefined,
        },
        buyer_data: buyer_data.length > 0 ? buyer_data : undefined,
        payment: buildRegiondoPurchasePayment(paymentCode, {
          paymentMethodFromTotals: selectedPayment,
          grandTotal: snap.grandTotal,
          paymentSubOptionName: subOption || undefined,
        }),
        source_type: REGIONDO_SOURCE_POS,
        skip_customer_validation: false,
      };

      const res = await purchase(body, {
        store_locale: 'de-AT',
        sync_tickets_processing: syncTickets,
        send_confirmation_email: sendEmail,
        currency: snap.currency,
      });

      const summary = res.order_number
        ? `Order ${res.order_number} (ID ${res.order_id ?? '—'})`
        : JSON.stringify(res);
      setLastPurchase(summary);
      toast.success('Booking completed');
      console.log('[purchase]', res);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const isSubmitting = totalsLoading || purchaseLoading;

  const handleHold = async () => {
    if (!itemValid) {
      toast.error('Enter product ID and quantity.');
      return;
    }
    setHoldLoading(true);
    try {
      const item = cartFromForm(productId, optionId, qty, datetimeLocal, '');
      const res = await createHold(item, { store_locale: 'de-AT', reserve_minutes: 20 });
      const code = res.reservation_data?.[0]?.reservation_code;
      if (code) setReservationCode(code);
      toast.success(code ? `Hold created: ${code}` : 'Hold created');
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Hold failed');
    } finally {
      setHoldLoading(false);
    }
  };

  const handleRemoveHold = async () => {
    if (!reservationCode.trim()) {
      toast.error('Enter reservation code.');
      return;
    }
    setRemoveLoading(true);
    try {
      await removeHold(reservationCode.trim());
      toast.success('Hold released');
      setReservationCode('');
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Could not remove hold');
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleListHolds = async () => {
    setHoldsLoading(true);
    try {
      const data = await listHolds('de-AT');
      setHoldsJson(JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Could not list holds');
      setHoldsJson('');
    } finally {
      setHoldsLoading(false);
    }
  };

  const handleProlong = async () => {
    if (!reservationCode.trim()) {
      toast.error('Enter reservation code.');
      return;
    }
    setProlongLoading(true);
    try {
      await prolongHold(reservationCode.trim(), 20);
      toast.success('Hold extended');
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Could not extend hold');
    } finally {
      setProlongLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-heading font-semibold text-brand-primary flex items-center gap-2 mb-1">
          <ShoppingCart className="w-5 h-5" />
          New booking
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter the event details and guest details, choose payment, then complete the booking. Pricing is loaded automatically when you submit.
        </p>

        <div className="space-y-6">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Event</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Product ID *</label>
                <input
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g. 23941"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Option ID *</label>
                <input
                  value={optionId}
                  onChange={(e) => setOptionId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g. 1549178"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date &amp; time *</label>
                <input
                  type="datetime-local"
                  value={datetimeLocal}
                  onChange={(e) => setDatetimeLocal(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Guest</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First name *</label>
                <input
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last name *</label>
                <input
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Phone{contactDataRequired.includes('telephone') ? ' *' : ''}
                </label>
                <input
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  placeholder={contactDataRequired.includes('telephone') ? 'Required for this product' : 'If required by product'}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Comment</label>
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                placeholder="Optional"
              />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Payment</h3>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full max-w-xl p-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  {paymentsFromTotals.length > 0 ? (
                    paymentsFromTotals.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.title ? `${p.title} (${p.code})` : p.code}
                      </option>
                    ))
                  ) : (
                    REGIONDO_PURCHASE_PAYMENT_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.label}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {exclusivePaymentSubOptions && exclusivePaymentSubOptions.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">How paid</label>
                  <select
                    value={paymentSubOptionName}
                    onChange={(e) => setPaymentSubOptionName(e.target.value)}
                    className="w-full max-w-xl p-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {exclusivePaymentSubOptions.map((o) => (
                      <option key={o.name} value={o.name}>
                        {o.title ?? o.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {lastGrandTotal != null && (
                <p className="text-sm text-gray-800">
                  <span className="font-medium">Total:</span>{' '}
                  {lastCurrency ? `${lastGrandTotal} ${lastCurrency}` : String(lastGrandTotal)}
                </p>
              )}
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting || !itemValid}
              onClick={() => void handleCompleteBooking()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
            >
              <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarPlus className="h-4 w-4" />
                )}
              </span>
              <span>{isSubmitting ? 'Processing…' : 'Complete booking'}</span>
            </button>
            <button
              type="button"
              disabled={totalsLoading || !itemValid}
              onClick={() => void handleRefreshPrice()}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {totalsLoading ? '…' : 'Update price'}
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
            Send confirmation email to guest
          </label>

          {lastPurchase && (
            <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg p-3">
              {lastPurchase}
            </p>
          )}

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setMoreOptionsOpen((o) => !o)}
              aria-expanded={moreOptionsOpen}
              className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${moreOptionsOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
              More options
            </button>
            {moreOptionsOpen ? (
              <div className="space-y-4 border-t border-gray-100 px-4 pb-4 pt-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={syncTickets}
                    onChange={(e) => setSyncTickets(e.target.checked)}
                  />
                  Generate tickets synchronously (wait for full response)
                </label>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Reservation code (only if you already have a hold)
                  </label>
                  <input
                    value={reservationCode}
                    onChange={(e) => setReservationCode(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2 font-mono text-xs"
                    placeholder="Optional"
                  />
                </div>
                {totalsPreview ? (
                  <div>
                    <p className="mb-1 text-xs font-medium text-gray-600">Last pricing response (debug)</p>
                    <pre className="max-h-40 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-[11px] text-gray-800">
                      {totalsPreview}
                    </pre>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm">
        <button
          type="button"
          onClick={() => setHoldSectionOpen((o) => !o)}
          aria-expanded={holdSectionOpen}
          className="flex w-full items-center gap-2 px-6 py-4 text-left text-sm font-medium text-gray-900"
        >
          <Timer className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
          <span className="flex-1">Reservation hold (optional)</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-amber-800/70 transition-transform ${holdSectionOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
        {holdSectionOpen ? (
          <div className="space-y-4 border-t border-amber-200/60 px-6 pb-6 pt-0">
            <p className="pt-4 text-xs text-gray-600">
              Hold stock before completing payment. Not required for a normal in-store booking.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={holdLoading || !itemValid}
                onClick={() => void handleHold()}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm hover:bg-amber-100 disabled:opacity-50"
              >
                {holdLoading ? '…' : 'Create hold'}
              </button>
              <button
                type="button"
                disabled={removeLoading || !reservationCode.trim()}
                onClick={() => void handleRemoveHold()}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                {removeLoading ? '…' : 'Release hold'}
              </button>
              <button
                type="button"
                disabled={prolongLoading || !reservationCode.trim()}
                onClick={() => void handleProlong()}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm hover:bg-amber-100 disabled:opacity-50"
              >
                {prolongLoading ? '…' : 'Extend hold'}
              </button>
              <button
                type="button"
                disabled={holdsLoading}
                onClick={() => void handleListHolds()}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                {holdsLoading ? '…' : 'List active holds'}
              </button>
            </div>
            {holdsJson ? (
              <pre className="max-h-40 overflow-auto rounded-lg border border-gray-200 bg-white p-3 text-[10px] text-gray-700">
                {holdsJson}
              </pre>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
