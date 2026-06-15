# Lightweight T&Cs Acceptance Options: Investigation

Date: 2026-06-16. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox`.
Read-only investigation. No real calendars, products, or contacts were changed.

## Method

- API reads of both BII calendars and the three BII products.
- A throwaway probe calendar (`round_robin`, BII team member) created, its
  `consentLabel` set via `update_calendar` to a T&Cs string containing a URL, then
  its **live public booking widget driven through to the booking form** with
  browser automation to inspect the rendered consent checkbox (required state and
  link rendering). No booking was submitted (form inspected, not submitted, so no
  test contact was created). The throwaway calendar was deleted afterward.

## Findings by question

### 1. The existing consent checkbox (the key finding)

This corrects Phase A's "probably required but unverifiable". Concrete results:

- **`consentLabel` is settable via the API.** `update_calendar` set it to
  "I have read and agree to the Terms & Conditions at
  https://laurenroxburgh.com/terms-conditions" and it persisted. `update_calendar`
  merges (does not blank other fields), confirmed earlier this project.
- **The consent checkbox renders on the booking form whenever `consentLabel` is
  set.** No separate enable step was needed; it appeared on the form by default.
- **It is REQUIRED (enforced).** The rendered input is
  `<input type="checkbox" data-required="true" aria-required="true" ...>`. GHL's
  booking widget validation honors `data-required`, so the booker cannot complete
  the booking without ticking it. (It shows no visible asterisk, unlike the name
  and email fields, but that is cosmetic; the field is enforced.) This is the
  concrete evidence Phase A lacked: **the consent checkbox is a working required
  acceptance.**
- **The label is plain text. A URL does NOT become a clickable link.** The rendered
  label and `aria-label` contain the URL as plain text, and the container has
  **zero** anchor elements (`<a>` count = 0). So `consentLabel` cannot present a
  clickable Terms link; only plain text (the URL would have to be read or copied).
- It is a **single** checkbox. Repurposing it for T&Cs replaces the current
  marketing-consent wording. A combined line is possible, for example
  "I have read and agree to the Terms & Conditions and consent to be contacted."

### 2. Payment step configuration

- Calendar payment is enabled by attaching products and a payment mode (the
  calendar object exposes `isLivePaymentMode`, a boolean; it has **no** dedicated
  payment-text, pre-checkout, or order-summary-terms field).
- The text shown at the payment step comes from the **product** (its description,
  see item 3), not from a calendar-level terms field. No separate "payment terms"
  or "policy" toggle surfaced on the calendar object via the API.
- A full Stripe checkout was not driven (would need test-mode payment setup); the
  payment-step text carrier is the product description.

### 3. BII products

- All three products (`6a2a1445af2123a4da1d1342` single, `6a2a145899eef43fed863e66`
  3-series, `6a2a1469fc5f50dbbcfd51e7` 10-series) have a **`description`** field
  (currently marketing copy). The description displays at checkout. There is **no**
  dedicated terms or policy field on products.
- So a product description can carry a "By purchasing you agree to our Terms &
  Conditions" disclosure, shown at the payment step.

### 4. The calendar description

- **Confirmed: the calendar `description` renders at the top of the booking
  widget.** The probe calendar's description displayed live under the calendar name
  and the duration/date. So the description can carry passive disclosure such as
  "By booking, you agree to our Terms & Conditions: <url>". (Same linkify
  limitation: a URL in the description renders as plain text.)

## Options, ranked lightest to heaviest

### Option 1: passive notice (description / payment language)

- **Gets:** zero friction, no checkbox. Notice via the calendar description (booking
  widget, confirmed renders) and the product description (checkout). Acceptance is
  implicit by completing the booking/payment.
- **Costs:** lightest build; all text fields are API-settable.
- **Weakness:** legally the weakest (browsewrap-style: no affirmative action tied to
  the terms). Plain-text URL only.
- **Timestamp:** would need a Payment Received workflow to stamp `bii_tcs_accepted_at`.

### Option 2: repurpose the consent checkbox (RECOMMENDED)

- **Gets:** a **required, affirmative acceptance tick** at booking, now proven
  enforced (`data-required="true"`). This is proper clickwrap-style acceptance.
  Set entirely via **two `update_calendar` MCP calls** (one per calendar). No form
  build, no UI shuffle, no per-calendar widget editing.
- **Costs:** near zero (two non-destructive MCP calls to set `consentLabel`).
- **Weakness:** the terms reference is **plain text, not a clickable link**. Single
  checkbox, so it replaces or must combine with the marketing-consent wording. No
  visible asterisk (cosmetic only).
- **Timestamp:** GHL records the consent at submission; a queryable
  `bii_tcs_accepted_at` still needs a workflow.

### Option 3: custom booking form with a linked T&Cs checkbox (heaviest)

- **Gets:** required tick **plus a clickable link** to the terms (strongest
  clickwrap and best notice).
- **Costs:** build one form and attach it to both calendars (the prior plan), more
  build and maintenance.
- **When worth it:** if a clickable link at the point of acceptance is judged
  necessary for enforceability or brand polish.

### Hybrid

- Option 2 (required tick) plus Option 1 notice in the product description at
  checkout, for defense in depth. Still no clickable link anywhere.

## Recommendation

**Option 2 is the lightest mechanism that delivers proper (required, affirmative)
T&Cs acceptance.** The investigation upgraded it from "unverifiable" to "confirmed
required-enforced", and it is settable with two non-destructive `update_calendar`
calls, no UI work at all. The only real tradeoff versus Option 3 is the clickable
link: Option 2's terms URL renders as plain text.

Crucially, the T&Cs page itself does not exist yet (Phase 1 task 8) and the URL is a
placeholder, so the clickable-link advantage of Option 3 is moot today. Recommend
**Option 2 now** (set both calendars' consent checkbox to a combined T&Cs +
contact-consent line via `update_calendar`), and revisit Option 3 only if, once the
terms page is live, a clickable link at the point of acceptance is judged necessary.

If wanted, a defense-in-depth add is to also put a one-line terms disclosure in each
product description (shown at checkout), which is a couple more API edits.

### The decision for Si

Is a **required affirmative checkbox with a plain-text terms reference** acceptable
(Option 2, near-zero effort), or is a **clickable link** to the terms mandatory
(Option 3, build a form)? Everything else favors Option 2.

## Open unknowns

- The required-enforcement is evidenced by `data-required="true"` /
  `aria-required="true"` on the rendered checkbox, not by an observed blocked
  submission: a full submit test was not completed because reCAPTCHA and phone
  validation on the automated widget would confound the result. A 30-second manual
  check (fill the form, leave the box unticked, click Schedule) confirms it if
  wanted.
- Whether GHL stores a queryable "T&Cs accepted" flag or timestamp when the box is
  ticked (beyond the booking submission record) was not confirmed. The
  `bii_tcs_accepted_at` workflow remains the reliable timestamp path if Lo wants an
  explicit record.
- `consentLabel` length, newline, and HTML handling were not stress-tested; it is a
  plain string and the widget does not linkify, so treat it as plain text only.
