# BII T&Cs Acceptance: Calendar Consent Checkbox + Product Description

Status: **IMPLEMENTED via MCP on 2026-06-16.** This supersedes the earlier
custom-booking-form plan that previously lived in this file. The switch followed
the investigation in `tcs-lightweight-options-diagnosis.md`, which proved the
calendar's built-in consent checkbox is required-enforced, making a custom form
unnecessary for a required affirmative acceptance.

## What was implemented

### 1. Calendar consent checkbox (the required acceptance)

Both BII calendars now carry a Terms & Conditions acceptance as their booking-form
consent checkbox, set via `update_calendar`:

| calendar | id | new consentLabel |
|---|---|---|
| BII - In-Person Sessions | `9czE4WeZ4QbbDIHFxlOP` | I have read and agree to the Terms & Conditions (https://laurenroxburgh.com/terms-conditions). |
| BII - Virtual Sessions | `JzlzhxG86qNPAsiELNV2` | (same) |

The consent checkbox renders on the booking form and is required to complete a
booking (the rendered input carries `data-required="true"` / `aria-required="true"`,
confirmed in the investigation). The terms URL renders as plain text, not a
clickable link (a known limit of the consent label); the link becomes meaningful
once the T&Cs page exists (Phase 1 task 8), and even then it is not clickable from
the consent label, only readable.

### 2. Product descriptions (defense-in-depth notice at checkout)

Each of the three BII products now ends its description with a terms reference,
set via `ghl_update_product`. The notice shows at the payment step.

| product | id | appended sentence |
|---|---|---|
| BII Single Session | `6a2a1445af2123a4da1d1342` | By completing this purchase, you agree to our Terms & Conditions (https://laurenroxburgh.com/terms-conditions). |
| BII 3-Series | `6a2a145899eef43fed863e66` | (same) |
| BII 10-Series | `6a2a1469fc5f50dbbcfd51e7` | (same) |

The original marketing copy of each description was preserved; only the terms
sentence was appended.

## Verification

- **Calendars:** read back via `get_calendar`. Both show the new `consentLabel`,
  and all other config matches `bii-calendars.md` (teamMembers, groupId,
  slotDuration 90, slotInterval 30, slotBuffer 30 / 0, eventTitle, etc.).
- **Products:** read back via `ghl_get_product`. All three show the appended terms
  sentence with the original description intact, and name / SERVICE type /
  availableInStore preserved.
- **Required-enforcement** was established in the investigation by the rendered
  checkbox's `data-required="true"`. A belt-and-suspenders manual check (open a
  booking link, fill the form, leave the box unticked, click Schedule, confirm it
  blocks) can confirm it end to end if wanted.

## Incident and lesson: update_calendar resets slotDuration if omitted

During this build, the first pass sent a **minimal body** (`{ calendarId,
consentLabel }`) to each calendar, on the assumption (from the wrapper-polish
Probe 9) that `update_calendar` preserves all omitted fields. That assumption was
**wrong**: the minimal update **reset `slotDuration` from 90 to 30** on both
calendars (GHL's calendar PUT defaults `slotDuration` to 30 when it is absent from
the body), while preserving other fields like `teamMembers`, `slotBuffer`, and
`slotInterval`. This was caught immediately by comparing the read-back against the
authoritative `bii-calendars.md` (which records 90 mins) and **fixed** by
re-asserting `slotDuration: 90` together with the slot config and the new
`consentLabel` in a fuller update. Final state verified at 90 mins on both.

**Lesson for any future `update_calendar` call:** do not rely on a minimal body.
Always include `slotDuration` (and the other slot params you care about) in the
update, because GHL silently defaults `slotDuration` to 30 when it is omitted. The
earlier "minimal body is safe" note (wrapper-polish smoke, Probe 9) only held
because that probe used a default-config calendar where 30 was already correct; it
does not generalize.

## Out of scope (for later)

- **`bii_tcs_accepted_at` timestamp stamping:** GHL does not stamp a datetime when
  the consent box is ticked. Bake a "set `bii_tcs_accepted_at` to now" action into
  the Payment Received workflow when that is built next. Field already exists
  (`ZAn6aTP7fW6UX3FYvwu3`).
- **The actual T&Cs page** at `https://laurenroxburgh.com/terms-conditions`
  (Phase 1 task 8). Until it exists the URL 404s; the acceptance mechanism works
  regardless.

## Rollback

- **Calendars:** restore the prior consent text via `update_calendar`, including
  `slotDuration: 90` in the body to avoid the reset above. The prior consentLabel
  was the marketing line "I confirm that I want to receive content from this
  company using any contact information I provide."
- **Products:** remove the appended terms sentence from each description via
  `ghl_update_product` (send the original description text, plus name / productType
  SERVICE / availableInStore true). The original descriptions are recorded in
  `bii-calendars.md`.
