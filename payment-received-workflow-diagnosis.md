# BII Payment Received Workflow: Phase A Diagnosis (read-only)

Date: 2026-06-16. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox`.

Goal: settle the payment-trigger architecture and recipient setup before drafting
Template #11 and writing the workflow walkthrough. Evidence is **API-confirmed**
(this session) or **product behavior** (GHL workflow-builder behavior; the builder
is UI-only on this connection, as established in the application-workflow
diagnosis, so trigger and branching specifics are stated from product behavior and
flagged where they must be confirmed in-builder or by the test payment).

## API-confirmed checks

### Aya is an external email, not a team member (decides the notification setup)

`official_users_get_user_by_location` returned 9 team members on the location:
Ahmed Rahman, Angel Regner, Ashley Smith (`ashley@laurenroxburgh.com`), Jackie
Cahill, **Jenna Mather-Frueh** (`clients@laurenroxburgh.com`, id
`UIChIX3a0wWAs7vdhdfM`, the BII calendar owner), Kaileen Sherk, Leizel Abana, Nick
Cedarlund, Vivek Jain. **`aya@sishearer.com` is not among them.**

So Aya is an external address. The Internal Notification action must send to a
**custom email address** (`aya@sishearer.com`), not an Assigned User or a Specific
User pick. This mirrors the Lo + Jenna pattern in the application-submitted
workflow. (The user-lookup tools `get_users` / `filter_users_by_email` require a
`companyId` not available here; the location-scoped `official_users_get_user_by_location`
is the one that works.)

### No workflow name conflict

`ghl_list_workflows` returned 53 workflows. None is named `BII - Payment Received`.
The only BII workflows are `BII - Application Submitted - In-Person`
(`0c40ae17-d294-45c7-b112-15b60a2daa00`) and `BII - Application Submitted - Virtual`
(`a9e3c184-b50b-4625-b0e8-c51a4d7f9c38`). Clear to create.

Useful precedent: the location already runs payment/purchase-triggered workflows
(`5. Order Paid`, `VIP Bodywork Purchase`, `3. ORG_HFF - Body Reset Purchased`), so
order/payment triggers are known to work here.

### No Template #11 name conflict

The 10 BII email templates (#1 to #10) now live in the folder
`BII - In-person & Virtual` (`6a2f4e8217074317fb1e6bff`, childCount 10). None is
named `BII - Intake Delivery`, and there is no top-level template by that name. So
`BII - Intake Delivery` (Template #11) is free to create. (The known 10 are
Application Received, Approval, Decline, Waitlist, Booking Confirmation, Booking
Notification (Jenna), Reminder 7-day, Reminder 24-hour, Post-Session Follow-up,
Internal Application Notification.)

## Product behavior (builder is UI-only here)

### 1. Payment trigger types

GHL workflow triggers relevant to "a paid session":

- **Order Submitted** (the recommended one): fires when an order is submitted, which
  for a paid product means after the payment succeeded (the order exists because
  payment cleared). It supports a **Product** filter, so it can be scoped to the
  Single Session product. This matches the task's intent to filter by product id.
- **Customer Booked Appointment** (calendar trigger): fires when an appointment is
  booked; filters by calendar, not by product. If the calendar requires payment to
  book, this also effectively fires post-payment, but it cannot filter by product
  id, only by calendar.
- A dedicated **Payment Received / Order Paid** trigger exists in some GHL builds
  and, if present, is equivalent to Order Submitted for this purpose.

### 2. Which trigger fires reliably after payment, and filters by product

**Recommendation: Order Submitted, filtered to the Single Session product
(`6a2a1445af2123a4da1d1342`).** It fires after payment (no order without a cleared
payment), and it filters by product id, which is exactly what the task wants and
what makes the future 3-Series / 10-Series split clean (one more Order Submitted
trigger per product).

**The one thing to confirm at the test-payment step:** that a calendar-booking
payment on the In-Person calendar actually creates an order that the Order
Submitted trigger catches with the Single Session product on it. GHL calendar
payments do create order/transaction records, so this is expected, but the test
payment in the walkthrough is the proof. If Order Submitted does not catch the
calendar payment, the fallback is Customer Booked Appointment filtered to the
In-Person calendar (acceptable today because Single Session is the only paid
product booked on that calendar, though it loses the per-product filter).

### 3. Context available on the trigger

The Order Submitted trigger exposes the contact and the order, so the **product
id/name and the amount are available** to the workflow, alongside all contact
fields. That means later product routing (branch on which product was bought) is
possible. For today's single-product workflow, no branching is needed: the trigger
filter already guarantees it was the Single Session.

### 4. If/Else branching

GHL workflows support **If/Else** condition actions that branch on contact field
values, tags, or trigger data. So one workflow can route different products to
different actions. Confirmed as standard GHL behavior; used in the Future
Extensions plan below.

### 5. Multiple triggers on one workflow

GHL workflows support **multiple triggers**, all entering the same workflow body.
So when 3-Series and 10-Series come online, they can be added as additional Order
Submitted triggers (one per product) on this same workflow, with If/Else inside to
vary per-product actions. Confirmed standard behavior.

## Two mechanics to confirm in-builder (flagged, with fallbacks)

These affect the Phase D action list:

- **Setting `bii_tcs_accepted_at` to "now".** GHL's Update Contact Field action on a
  DATE field: the reliable way to stamp the current moment is the date "now" option
  or a `{{right_now}}`-style token if the builder offers it. If a literal "current
  timestamp" is not directly selectable for a custom DATE field, the fallback is to
  set it from a workflow date token or to use the trigger date. To confirm in the
  builder. The field exists: `bii_tcs_accepted_at` (`ZAn6aTP7fW6UX3FYvwu3`).
- **Conditional `bii_program_type` set (do not clobber a higher package).** GHL's
  Update Contact Field is **unconditional**: it overwrites whatever is there. For
  today's single-trigger workflow this is fine (the buyer bought a Single Session,
  so setting `Single Session` is correct). But when 3-Series / 10-Series are added,
  an unconditional set could overwrite a higher package if a client upgrades. The
  protection is an **If/Else** ("only set to Single Session if current
  `bii_program_type` is empty, TBD, or already Single Session"). Documented as a
  limitation now and built into the Future Extensions plan; not needed for the
  single-product version today.

## Net for Phase B and D

- Trigger architecture: **Order Submitted, filter = Single Session product**
  (`6a2a1445af2123a4da1d1342`), single trigger today; confirm calendar-payment
  catch at the test-payment step.
- Internal Notification to Aya: **custom email** `aya@sishearer.com` (she is not a
  team member).
- No name conflicts for the workflow or Template #11.
- Two builder mechanics to confirm: date "now" stamping, and the unconditional
  nature of Update Contact Field (with the If/Else protection reserved for the
  multi-product future).

Proceeding to Phase B (draft Template #11) on confirmation.
