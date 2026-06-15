# GHL Calendar Payment Product Surface: Investigation

Date: 2026-06-16. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox`.
Read-only. No changes made.

## Summary: Si's hypothesis is confirmed

Enabling payments on the In-Person calendar (`9czE4WeZ4QbbDIHFxlOP`) made GHL
**auto-create a calendar-bound product**, not link the calendar to our existing
global Single Session product. The Order Submitted trigger filtered to the global
product (`6a2a1445af2123a4da1d1342`) could not match, because the order carries the
auto-created product instead. Details and the recommended fix below.

## 1. Products on the location (10 total)

The three Phase 1 global products are intact and in store, plus a **new
auto-created calendar product** dated today:

| product | id | type | in store | note |
|---|---|---|---|---|
| **BII - In-Person Sessions (via calendars)** | `6a30859dca6c0f753888b687` | DIGITAL | No | **auto-created 16/06 when payments were enabled**; description = the calendar description |
| BII Single Session | `6a2a1445af2123a4da1d1342` | SERVICE | Yes | Phase 1 global product (not used by the calendar) |
| BII 3-Series | `6a2a145899eef43fed863e66` | SERVICE | Yes | Phase 1 global |
| BII 10-Series | `6a2a1469fc5f50dbbcfd51e7` | SERVICE | Yes | Phase 1 global |

The auto-created product follows GHL's standard pattern: the location already has
five other `... (via calendars)` products for the existing Lo Rox bodywork
calendars (Miami, Montecito, Virtual, VIP Miami, Palm Beach), all "Not Available"
in store. So **GHL creates one bound product per payment-enabled calendar, named
`<Calendar Name> (via calendars)`**, and there is no UI to point a calendar at an
existing global product (matching what Si saw: no product selector in the Payments
tab).

The auto product's price is $1,950 (the test orders show `subtotal: 1950`), so it
is the live Single Session payment binding.

## 2. The calendar payment config is not in the calendar data model

`get_calendar` on `9czE4WeZ4QbbDIHFxlOP` exposes **no** `productId`,
`paymentEnabled`, or `paymentAmount` field. The only payment-adjacent field is
`isLivePaymentMode` (currently `false`). The product-to-calendar binding lives on
the payment/product side (the auto-created product), not on the calendar object.

(Aside: Si has since edited the calendar in the UI: the description now contains a
Terms and Conditions link to `https://laurenroxburgh.com/terms-of-service`, the
consent label was tweaked, and `slotDuration` is correctly 90. None of that affects
this investigation.)

## 3. Calendar payments DO create orders (key evidence)

`list_orders` shows Si's two test bookings created real orders:

| order id | contact | amount | subtotal | discount | status | paymentStatus | liveMode | source |
|---|---|---|---|---|---|---|---|---|
| `6a30899ef6d1335534eb5dbd` | Simons Test (si+pay-test@sishearer.com) | 0 | 1950 | 1950 | completed | paid | false | calendar / meeting / `9czE4WeZ4QbbDIHFxlOP` |
| `6a30893ed8a0a24ca1e4c8b0` | Simons Test | 0 | 1950 | 1950 | completed | paid | false | calendar / meeting / `9czE4WeZ4QbbDIHFxlOP` |

Both are `sourceType: calendar`, `sourceSubType: meeting`, `status: completed`,
`paymentStatus: paid`, `totalProducts: 1` (the auto product). The location's older
live calendar payments (Montecito, Virtual, real $1,800 / $1,111 charges,
`liveMode: true`) are the same shape. **So calendar payments create completed, paid
orders**, which means an order-based trigger can in principle fire on them.

### Three reasons the test did not fire the workflow (ranked)

1. **Product filter mismatch (most likely):** the trigger filtered to the global
   product `6a2a1445af2123a4da1d1342`, but the order's product is the auto product
   `6a30859dca6c0f753888b687`. No match, no run.
2. **The order was $0 (confound):** the test used coupon `SITEST` for 100% off, so
   `amount: 0`. Some payment/order triggers do not fire on a zero-value order even
   when it is marked paid.
3. **Test mode (confound):** `liveMode: false`. The trigger or the test environment
   may not fire on test orders.

A clean re-test must control for 2 and 3 (a real or partial-discount payment with
`amount > 0`, in the mode the workflow listens to).

## 4. Can update_calendar link the calendar to a global product?

**No.** The calendar object has no `productId` field, `update_calendar` exposes no
product param, and GHL's UI auto-creates the bound product with no selector. There
is no path, API or UI, to point this calendar at the global Single Session product.
Option (a) below is therefore not viable.

## 5. Order Submitted trigger context

The order created by a calendar payment contains the auto product, the contact, and
the amount. So an Order Submitted trigger filtered to the **auto product**
(`6a30859dca6c0f753888b687`) is the matching filter target. The one residual
unknown is whether GHL's Order Submitted trigger fires on `sourceType: calendar`
orders specifically (versus only funnel/store orders); the order exists and is paid,
so it is plausible, but the re-test is the proof. The location's `5. Order Paid`
workflow suggests order-paid automation is used here.

## 6. Recommended fix

| option | viable? | verdict |
|---|---|---|
| (a) Link the calendar to the global product | **No** | No `productId` on the calendar (API or UI). Rule out. |
| (b) Refilter the trigger to the auto product `6a30859dca6c0f753888b687` | **Yes, recommended** | Minimal change, keeps the Order Submitted architecture and per-product filtering. Re-test controlling for the $0 / test-mode confounds. |
| (c) Customer Booked Appointment filtered to the calendar | Yes, fallback | Most robust (fires on the booking regardless of order/product/amount), but loses per-product filtering. |

**Recommendation: (b).** Change the BII - Payment Received workflow's Order
Submitted trigger filter from the global Single Session product to the
auto-created **`BII - In-Person Sessions (via calendars)`**
(`6a30859dca6c0f753888b687`). The order evidence shows the calendar payment creates
a completed, paid order carrying that product, so the most likely failure was the
filter mismatch. Then re-test with a payment that has `amount > 0` (a partial
coupon, or a real small live charge) so the $0 and test-mode confounds are removed.

**If (b) still does not fire after refiltering** (i.e., Order Submitted genuinely
does not fire on calendar-source orders), fall back to **(c)**: trigger on Customer
Booked Appointment filtered to the In-Person calendar. That fires on the booking
itself and does not depend on the order, product, or amount. It cannot tell Single
from 3-Series / 10-Series, which is fine today (the In-Person calendar sells only
the single session), and the per-package distinction is handled by the calendar
architecture below.

## Architectural implications worth flagging

- **A payment calendar binds to exactly one auto product.** So the In-Person
  calendar sells one thing (Single Session, $1,950). The 3-Series and 10-Series
  cannot be sold as alternate products on this same calendar. When they go live they
  will each need **their own payment-enabled calendar** (each auto-creating its own
  `(via calendars)` product to filter on), or be sold through a store/funnel
  checkout using the global products. This changes the "add more Order Submitted
  triggers to one workflow" plan: the triggers would filter on per-calendar auto
  products, one per calendar.
- **The Phase 1 global products are orphaned from the calendar flow.** The
  calendar checkout uses the auto product, not `6a2a1445af2123a4da1d1342`. The
  global products still exist for store/funnel sales, but the calendar booking does
  not touch them.
- **The product-description T&Cs disclosure does not show at calendar checkout.**
  The defense-in-depth terms sentence added to the three global product descriptions
  (previous task) is not seen by a calendar booker, because the calendar uses the
  auto product, whose description is just the session blurb. The booking-form consent
  checkbox is still the real acceptance and is unaffected; only the secondary
  product-description notice is moot for calendar bookings. If that notice is wanted
  at calendar checkout, it would be added to the auto product's description.

## Net

Confirmed: GHL auto-creates a calendar-bound product (`6a30859dca6c0f753888b687`),
the calendar payment creates paid orders carrying it, and there is no way to link
the calendar to the global product. Recommended fix is (b): point the workflow's
Order Submitted trigger at the auto product and re-test with a non-$0 payment, with
(c) the appointment trigger as the fallback. No changes made; awaiting direction.
