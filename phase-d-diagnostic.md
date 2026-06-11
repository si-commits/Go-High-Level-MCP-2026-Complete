# Phase D Diagnostic — Notification Write Response Shape and Uniqueness Model

Date: 2026-06-11. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox` (rebuilt dist, notification timing extension live).
Scope: two targeted diagnostics on the in-person calendar `9czE4WeZ4QbbDIHFxlOP` only. Virtual `JzlzhxG86qNPAsiELNV2` untouched (stays as Step 1 left it). No architectural fix applied. Not pushed.

## Diagnostic 1 — Write response shape: does create/update return body and subject?

**Answer: No. Neither the create response nor any read endpoint returned `body` or `subject`.** The fields exist in the type but GHL does not populate them in these responses.

### Evidence

The `create_calendar_notifications` response object (captured from the failed Step 2 create and re-confirmed by the Diagnostic 2 probe) contained exactly these fields:

```
version, isActive, deleted, _id, receiverType, notificationType, channel, beforeTime, altId, altType, createdAt, updatedAt
```

No `body`. No `subject`. No `templateId`.

### Source corroboration

- The response type `GHLCalendarNotification` (ghl-types.ts:3117-3133) DOES declare `body?: string` and `subject?: string` as optional fields. So the wrapper is not stripping them — they are simply absent from GHL's actual response payload on these endpoints.
- The wrapper passes GHL's raw `response.data` straight through (ghl-api-client.ts:3619-3624 for create, 3650-3656 for update). No field filtering on our side.
- `updateCalendarNotification` is a `PUT` returning the same `GHLCalendarNotification` type (ghl-api-client.ts:3650). Its live response shape was NOT exercised this session (no update was run, per the diagnostic's read-only scope). Given it shares the type and the same raw-passthrough, the expectation is it behaves like create (omits body/subject), but that is inference, not an observation. **To confirm, the first Step 3 update must write one body and then attempt to read it back.**

### Singular GET path

There is a single-record read tool `get_calendar_notification` (GET `/calendars/{id}/notifications/{notificationId}`, ghl-api-client.ts:3634). Tested against the resurrected reminder record: it returned the full object but ALSO with no `body`/`subject`. However that record has no body set (it was created with an empty body in the prior calendar phase), so this is inconclusive for a populated body. **Body read-back remains unproven: no notification on either calendar currently carries a body, so no endpoint has yet been observed returning one.**

### Consequence

There is currently **no demonstrated path to verify a notification body byte-for-byte** through the MCP, at write time or read time. This is the key open risk for any Step 3. Before certifying any body wiring, the first action must be: PUT one body, then read it back via `get_calendar_notification`, and confirm whether GHL returns the populated body at all. If it does not, body verification needs a different mechanism (e.g., a wrapper polish to surface body, or accepting write-success without read-back proof).

## Diagnostic 2 — Uniqueness model: A or B?

**Answer: Model B. `(calendar, receiverType, notificationType, channel)` is unique. Only one reminder of a given type/channel/receiver can exist per calendar.**

### Probe

On in-person `9czE4WeZ4QbbDIHFxlOP`, with the original reminder record `6a2a2a39b72e84c1892e4513` resurrected (deleted:false, isActive:false, beforeTime `[{7,days},{24,hours}]`), attempted a second create:

- receiverType `contact`, notificationType `reminder`, channel `email`
- beforeTime `[{ timeOffset: 24, unit: "hours" }]` (distinct from the resurrected record)
- subject `DIAGNOSTIC PROBE - DELETE ME`, body `<p>diagnostic probe</p>`, isActive `true`

### Outcome

The create returned the **same `_id`** `6a2a2a39b72e84c1892e4513` — not a new record. A plural read-back confirmed still exactly one `contact/reminder/email` record on the calendar. **No second record was created.** Model A (two can coexist) is disproven.

The returned record kept its original `beforeTime` `[{7,days},{24,hours}]`, `isActive: false`, version 3, and `updatedAt` unchanged (08:35:59.591Z). My probe's beforeTime, subject, body, and isActive were all ignored.

### Source corroboration

ghl-api-client.ts:3614-3618 already documents this:

> "GHL rejects a POST that contains more than one record of the same notificationType (400); a reminder with multiple offsets must use a multi-element `beforeTime` array on a single record, not separate records."

### Two POST sub-behaviors observed (worth noting)

The POST-to-existing-type path behaves as an upsert-locate, not a true create, and does NOT overwrite payload fields:

1. **Existing record is soft-deleted** (the failed Step 2 create): POST revived it (deleted `true` to `false`), bumped version (2 to 3), but did NOT apply the POSTed beforeTime/body/subject/isActive.
2. **Existing record already live-but-inactive** (this probe): POST returned it completely unchanged (no version bump, no field change).

In both cases the POSTed body/subject/timing were discarded. To change those fields you must use `update_calendar_notification` (PUT), not create.

## Current state of the in-person calendar after the diagnostics

No probe record was created, so no cleanup delete was needed. The reminder record sits in a half-state created by the failed Step 2 create (not by this probe):

| field | value |
|---|---|
| `_id` | `6a2a2a39b72e84c1892e4513` |
| receiverType / notificationType / channel | contact / reminder / email |
| beforeTime | `[{7,days},{24,hours}]` (original, intact) |
| isActive | `false` |
| deleted | `false` (was `true` after Step 1; the failed Step 2 create revived it) |
| version | 3 |

It will not fire (inactive). It is NOT in the Step-1-verified state (which was deleted:true). The other four in-person records (2 booked-email, 2 inApp) are correct and untouched. Virtual calendar untouched.

**Open choice:** re-soft-delete `6a2a2a39b72e84c1892e4513` to restore the clean Step-1 state, or keep it and repurpose it (it is the only reminder slot available, given model B). Deferred to the architecture decision.

## Other behaviors worth noting

- **Soft-delete is not a filter-excluded state.** `get_calendar_notifications` with `isActive: true` still returned the soft-deleted record. Downstream code should filter on `deleted: false` explicitly. (Carried as a follow-up tracker item: either default-filter soft-deletes in `get_calendar_notifications` with an opt-in flag, or document it in the tool description.)
- **POST is a revive-or-return upsert keyed by type, not an overwrite.** It will un-delete a soft-deleted record of the same type but will not apply the new payload. Field changes require PUT.

## Architectural implication (for your review, not yet acted on)

The "two separate reminder records, one per offset, distinct bodies" design is **not achievable** through calendar notifications: model B allows only one `contact/reminder/email` record per calendar, and it carries a single body. To deliver distinct 7-day and 24-hour copy, the options narrow to:

1. **Single reminder record, combined body, multi-element beforeTime** `[{7,days},{24,hours}]` — one body fires at both offsets (loses the deliberate hold-back-logistics split).
2. **One reminder on the calendar + the other via workflow** (workflow Send Email on an appointment-relative delay) — preserves distinct copy, splits the mechanism across two systems.
3. Some hybrid using a different receiver/channel for a second message — semantically constrained (the second reminder must still reach the contact by email), likely not viable.

Plus the unresolved body-verification gap from Diagnostic 1, which applies to whichever path is chosen.

Awaiting your architecture decision before any further writes.

## Addendum (2026-06-11, post-decision Step 2) — update_calendar_notification returns 422 but partially persists

Decision taken: single combined reminder (template #8, edited), multi-element `beforeTime`. Step 1 (template #8 edit + #7 unused-note) succeeded and verified. Step 2 attempted to configure the in-person reminder `6a2a2a39b72e84c1892e4513` via `update_calendar_notification`. **It failed, and left the record in an uncertain state.**

### What happened

Two PUT attempts, both returned `GHL API Error (500): GHL API Error (422): UnprocessableEntityException`:

1. Attempt 1: full payload incl. `deleted: false`.
2. Attempt 2: same minus `deleted` (single-variable isolation).

Both errored. But a read-back afterward showed the record had **mutated despite the errors**: `version` 3 → 4, `isActive` false → **true**, `updatedAt` advanced to 09:56:55. So at least one PUT persisted a partial change (isActive flipped on) and then returned 422. `beforeTime` still reads `[{7,days},{24,hours}]`; `body`/`subject` are **not returned by any read endpoint**, so whether the body/subject were applied is unverifiable through the MCP.

### Root-cause hypothesis

The `update_calendar_notification` MCP schema (calendar-tools.ts:1307-1346) exposes no `altType`/`altId`. The handler spreads params straight into GHL's PUT body (calendar-tools.ts:2481-2482). GHL's notification PUT expects `altType: "calendar"` and `altId: "<calendarId>"` in the body (they appear on `GHLUpdateCalendarNotificationRequest`, ghl-types.ts:3152-3153). Missing them is the leading 422 candidate. Create avoids this by GHL inferring altType/altId from the URL; PUT appears to validate them in the body. The partial-persist-then-422 suggests GHL saves some fields before the failing validation, or a post-save step throws. Either way the tool cannot send altType/altId today, so the update path cannot be driven to success as built. Consistent with the bii-calendars.md tracker: "update path untested against live GHL."

### Two compounding gaps

1. **Write fails but mutates** — a 422 is not a clean no-op here. Any retry logic or assumption of atomicity is unsafe.
2. **Body/subject unreadable via API** — neither singular nor plural GET returns them, and the write response omits them too. There is currently no MCP path to verify a notification body at all. Verification would have to be done in the GHL UI by a human, or the wrapper extended to surface body on read.

### Current live state of the in-person reminder (uncertain)

`6a2a2a39b72e84c1892e4513`: version 4, `isActive: true`, `deleted: false`, `beforeTime: [{7,days},{24,hours}]`, body/subject unverifiable. It is now ACTIVE on the live in-person calendar. No appointments exist yet (pre-launch), so nothing will fire imminently, but the record is not in a verified-good state.

### Proposed fix (needs your approval — code change + rebuild + reconnect)

Extend `update_calendar_notification` to auto-inject `altType: "calendar"` and `altId: calendarId` into the PUT body (no new user-facing params needed; both are always derivable). Optionally also surface `body`/`subject` on the notification read path so bodies can be verified. Rebuild dist, reconnect, then re-run Step 2 as the clean body-verification gate. Until then, Step 2 cannot be certified.

Stopped. No further writes pending your call.
