# BII Email Templates — Phase C Provisioned (Deliverable)

Date: 2026-06-11. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox` (extended fork, two-step create flow live).
Status: **All nine templates provisioned to GHL and body-verified. No Phase D wire-up performed (stopped here as instructed).**

## Result

All nine BII templates created clean, in numerical order, on the rebuilt `dist` (commit `447bb89` head, post wrapper fix). Each body was verified to persist by fetching the template's rendered `previewUrl` and asserting distinctive marker strings (the `get_email_templates` listing returns no body, so preview is the established read-back path). Every template passed an em-dash check (0 found) in addition to its content markers. No `templateId` 422s, no body-persistence failures, no GHL default boilerplate left behind.

## Template IDs

| # | Title | Template ID | Voice | Body verified |
|---|---|---|---|---|
| 1 | BII - Application Received | `6a2a692855fd109fc761571e` | Lo | PASS |
| 2 | BII - Approval | `6a2a6947dbcd44d274ab77cf` | Lo / Jenna signs | PASS |
| 3 | BII - Decline | `6a2a69652b8acb9bf509ae75` | Lo / Jenna signs | PASS |
| 4 | BII - Waitlist | `6a2a69852b8acb9bf509af67` | Lo / Jenna signs | PASS |
| 5 | BII - Booking Confirmation | `6a2a69a355fd109fc7615e65` | Lo | PASS |
| 6 | BII - Booking Notification (Jenna) | `6a2a69bddbcd44d274ab7c87` | internal (by design) | PASS |
| 7 | BII - Reminder 7-day | `6a2a69d455fd109fc76160dc` | Lo | PASS |
| 8 | BII - Reminder 24-hour | `6a2a69f02b8acb9bf509b626` | Lo | PASS |
| 9 | BII - Post-Session Follow-up | `6a2a6a0a55fd109fc76163c6` | Lo / Jenna signs | PASS |

All nine sit at the top level with the `BII - ` name prefix (folder placement is not exposed by the MCP, per Phase A diagnosis). No naming collisions. Top-level template total went from 3 to 12 (plus the 7 pre-existing folders).

## Verification evidence (per template)

Markers asserted present in each rendered preview, plus em-dash count = 0:

- **#1** "Your application landed", "2 to 3 business days", "Lo x"
- **#2** "applying to work with Lauren", "Three-session series: $5,200", "book your first session here", "Lo Rox Coach"
- **#3** "isn't a no forever", "care you put into it", "Lo Rox Coach"
- **#4** "real yes, just not a yet", "no open capacity", "Lo Rox Coach"
- **#5** "You're booked", "your intake form", "terms and conditions", `appointment.start_time` token preserved, "Lo x"
- **#6** "New booking", "Payment received. Intake form sent to client", `appointment.title`, `contact.email`
- **#7** "One week from now", "let your body know rest is coming", "land in your inbox the day before", "Lo x"
- **#8** "session with Lo is tomorrow", "exact studio address: confirm with Jenna", "Water if you like", "See you tomorrow"
- **#9** "good to have you in the studio", "long after you leave the table", "book your next session, just reply", "Lo Rox Coach"

## Voice compliance

Every template passed the voice pass before provisioning: somatic and body-first, calm, direct, US spelling, no em dashes, none of the forbidden words (embody, transform, optimize, journey, align, unlock, empower, wellness-as-noun). Lo signs `Lo x`; Jenna signs `Warmly, Jenna / Lo Rox Coach`; #6 is internal and intentionally unsigned.

**One compliance fix applied during provisioning:** the Phase B drafts carried em dashes inside two bracketed placeholders, `[what to wear — confirm with Jenna]` (#2, #8) and `[exact studio address — confirm with Jenna]` (#8). Em dashes are barred by the voice rules, so these were provisioned with a colon: `[what to wear: confirm with Jenna]`, `[exact studio address: confirm with Jenna]`. All real body copy was already em-dash-free.

## Placeholders still live (unchanged from Phase B, resolve before go-live)

| placeholder | in | needs |
|---|---|---|
| `[what to wear: confirm with Jenna]` | #2, #8 | women's / men's wear text |
| `[exact studio address: confirm with Jenna]` | #8 | real Santa Barbara studio address (revealed in 24-hour reminder) |
| `[BOOKING LINK]` | #2 | in-person calendar scheduling link |
| `[INTAKE FORM LINK]` | #5 | BII intake form URL |
| `[T&CS LINK]` | #5 | terms and conditions URL |
| `[eating guidance - confirm with Lo]` | #8 | eating guidance line |
| `[Jenna's phone - confirm if including]` | #8 | day-of contact number, or remove |
| `[Optional personal line ...]` | #2 | Jenna fills per applicant, or deletes |
| `[Optional: Lo's notes or a simple protocol ...]` | #9 | per-client protocol, or delete |

## Not done (deliberately, per instruction)

Phase D wire-up was **not** started. Outstanding for Phase D:

- Subjects are not stored on templates (body-only); apply the recommended subject lines at point-of-use (notification `subject` field, workflow Send Email action, or manual send).
- Calendar-fired templates (#5 contact confirmation, #6 Jenna notification, #7/#8 reminders) still need wiring on both BII calendars, either via `templateId` (needs the one live-fire test, still an open question from Phase A) or by pasting the body into the notification `body` field (known-good fallback).
- The 7-day (#7) vs 24-hour (#8) split still wants two separate `reminder` notification records per calendar (recommended in Phase B), since one record fires one body for both offsets.
- Jenna/workflow sends (#2, #3, #4, #9) need attaching to their triggers.
- Confirm exact appointment and custom-field merge tokens at wiring.
