# BII T&Cs Booking Checkbox: Phase A Diagnosis (read-only)

Date: 2026-06-15. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox`.

Goal: confirm how to add a required Terms & Conditions acceptance checkbox to the
two BII calendar booking forms before writing the walkthrough. Evidence is labeled
**API-confirmed** (read this session) or **product behavior** (GHL builder
behavior, not API-probeable here).

## Current state of the two calendars (API-confirmed)

Read via `get_calendar` on both:

| field | In-Person `9czE4WeZ4QbbDIHFxlOP` | Virtual `JzlzhxG86qNPAsiELNV2` |
|---|---|---|
| `formId` | `""` (empty: uses the default booking form) | empty (default booking form) |
| `consentLabel` | "I confirm that I want to receive content from this company using any contact information I provide." | same |
| `groupId` | `aVucRq17JSzOnUSPAuDW` | `aVucRq17JSzOnUSPAuDW` (same group) |
| `guestType` | `collect_detail` | (default) |

So both calendars currently use GHL's **default booking form** (standard contact
fields) and already carry a **built-in consent checkbox** (the `consentLabel`
string), currently set to a marketing-consent message, not a T&Cs acceptance.

## 1. Booking form structure and access path (product behavior)

The booking form is configured per calendar in the GHL UI: Calendar then Edit then
the **"Forms"** tab (in some GHL versions "Forms & Payment"). There you can:

- select the form the booking widget uses (Default, or a custom form built in
  Sites then Forms, which is what the `formId` field points at when set), and
- toggle and edit the **Consent Checkbox** (the `consentLabel` text).

The default form collects the standard contact fields (Name, Email, Phone). There
is no rich "additional custom questions" editor on the default form itself on this
setup (the object shows `formId: ""`); to add an arbitrary required field you
either use the consent checkbox or attach a custom form.

## 2. Checkbox, Required, and link-in-label: the deciding finding

There are two viable ways to get a T&Cs acceptance, and they differ exactly on the
two things that matter (guaranteed-required, and a clickable link):

### Option A: repurpose the built-in Consent Checkbox (simplest)

Change each calendar's Consent Checkbox text (the `consentLabel`) to a T&Cs
acceptance line. One toggle per calendar, no separate form.

- **Required enforcement:** GHL's calendar consent checkbox, when enabled, normally
  must be ticked to complete a booking (it blocks submission). This is product
  behavior I cannot API-verify here; it should be confirmed by testing.
- **Link in the label:** the `consentLabel` is a **plain-text string** in the data
  model (no `termsUrl` or rich-text field alongside it). So a clickable link in the
  consent label is **unlikely to render**; the realistic fallback is plain text
  with the URL spelled out (for example "... agree to the Terms & Conditions at
  laurenroxburgh.com/terms-conditions"), which is not clickable.
- **Semantics:** it is nominally a marketing-consent field being repurposed, which
  is acceptable but not purpose-built for T&Cs.

### Option B: custom booking form with a Terms & Conditions field (robust)

Build one form in Sites then Forms ("BII - Booking Form") containing the standard
fields (Name, Email, Phone) plus a checkbox for T&Cs acceptance, then attach it to
both calendars (each calendar's Forms tab, or via `update_calendar`'s `formId`
param). In the form builder you can either:

- use a checkbox whose **label contains an inline clickable link** (GHL form
  builders generally allow a link in a checkbox/terms label), giving a single
  "I have read and agree to the [Terms & Conditions]" element, OR
- if the inline link will not render, use the **text-element + checkbox combo**: a
  Text element with the clickable link above a plain "I have read and agree to the
  Terms & Conditions" checkbox.

Either way the checkbox has an explicit **Required toggle**, so booking-without-
acceptance is **guaranteed** blocked, and a real clickable link is achievable. One
form serves both calendars.

### The decision (label-with-link is the hinge, as flagged)

Because the task's core requirement is a hard block on booking without acceptance,
and a clickable link is wanted, **Option B (custom booking form) is the robust
recommendation**: it guarantees Required and supports a real link, whereas Option
A's required-enforcement is unverifiable and its label almost certainly cannot hold
a clickable link (plain string in the model). Option A is the lighter path if a
non-clickable, plain-text terms line and the (likely) consent-required behavior are
acceptable.

My recommendation: **Option B**, one shared "BII - Booking Form" with a required
Terms checkbox, attached to both calendars. The walkthrough would cover the
inline-link-label as primary and the text-element + checkbox combo as the inline
fallback (so it is self-contained for whichever the builder supports).

## 3. MCP coverage (API-confirmed + product behavior)

- **Read:** `get_calendar` exposes `formId` and `consentLabel`, so the booking-form
  config is readable (done above).
- **Attach a form:** `update_calendar` exposes a `formId` param, so a custom
  booking form can be attached to each calendar via MCP once the form exists.
- **Build the form / edit fields / set the consent text:** UI. There is no MCP tool
  to construct a booking form's fields or a Terms checkbox. So this is a **UI
  build**, the same conclusion as the calendar-notification and form work. (Setting
  `consentLabel` text might pass through `update_calendar`'s spread, but the
  required-enforcement and link cannot be set that way, so it does not change the
  UI-build conclusion.)

## 4. Timestamp stamping (note only, out of scope)

GHL does **not** auto-stamp a timestamp when a checkbox is ticked. Capturing a
"T&Cs accepted at" datetime would require a **workflow** action (on booking, set
the field to now). The field for this already exists: `bii_tcs_accepted_at` (DATE,
`ZAn6aTP7fW6UX3FYvwu3`, in the BII folder). Not built in this task; noted so the
field is not forgotten when the acceptance-timestamp workflow is wanted.

## 5. Single vs per-calendar config (API-confirmed structure)

- The two calendars share a group (`aVucRq17JSzOnUSPAuDW`) but **booking-form and
  consent config is per calendar** (each has its own `formId` and `consentLabel`).
- **Option A** must be configured on **each calendar** (2x).
- **Option B** builds **one** form and attaches it to **each calendar** (1 form, 2
  attachments). The form content is shared, so a future edit to the terms text is a
  single edit.

## Net for Phase B

UI build either way. The one decision before writing the walkthrough is Option A vs
Option B, and it turns on the link-in-label capability exactly as flagged: Option A
cannot reliably give a clickable link and its required-enforcement is unverifiable;
Option B (recommended) guarantees Required and supports a real link via one shared
custom booking form attached to both calendars. Confirm the option and I will write
the walkthrough to match.

Placeholder terms URL for the label (page is Phase 1 task 8, not yet built):
`https://laurenroxburgh.com/terms-conditions`. The checkbox is functional before
the page exists; the link will 404 until the page is built.
