# Notification Update Wrapper — Phase B/C Result (fix did NOT resolve the 422)

Date: 2026-06-11. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox` (rebuilt dist).
Status: **The altType/altId fix was implemented and built, but the smoke test proves it does NOT fix the 422. Deeper probing shows GHL's notification PUT is non-functional for our payloads on every API version, and notification bodies are immutable after create. Phase D as planned cannot proceed. Stopping per the "last extension" constraint.**

This is an honest negative result. The original hypothesis (missing altType/altId causes the 422) was wrong.

## Phase B — what was implemented

Auto-inject `altType: "calendar"` and `altId: <calendarId>` into the notification PUT. Final location: the client method `updateCalendarNotification` (ghl-api-client.ts), so every caller (MCP handler, scripts) gets it. The handler (calendar-tools.ts) just spreads params and carries a comment pointing to the client. Tool description updated. `tsc --noEmit` clean, `npm run build` clean.

Commit `ac6df17` carried the first cut (injection in the handler). It was then moved to the client layer so the smoke test, which drives the client directly, would actually exercise it.

## Phase C — smoke results: FAIL

Drove the rebuilt dist directly (`scripts/notification-update-smoke.js`).

| test | result | detail |
|---|---|---|
| T1 update no-422 | **FAIL** | PUT still returns `422 UnprocessableEntityException` with altType/altId injected. |
| T2 idempotent retry | **FAIL** | Same 422. |
| T3 cleanup | PASS | Throwaway calendar created and deleted (cascade), confirmed gone. |

The fix did not work. So I diagnosed the actual 422 (`scripts/notification-update-422-probe.js`, `-shape-probe.js`, `-mutability-probe.js`).

## What the 422 actually is

The PUT 422s **independent of the body**. Every shape returns the identical generic `UnprocessableEntityException: Unprocessable Entity Exception` (no field detail), including:

- a body that mirrors the GET object exactly (all fields, with altType/altId),
- a minimal `{ subject }` body,
- `{ notifications: [...] }` and bare-array bodies,
- bodies with `_id`, `deleted`, `selectedUsers` added.

Route/method variants:

| attempt | result |
|---|---|
| `PUT /calendars/{cal}/notifications/{id}` (object, any fields) | 422 |
| `PUT` array body / `{notifications:[...]}` | 422 |
| `PATCH /calendars/{cal}/notifications/{id}` | 404 (method not routed) |
| `PUT /calendars/{cal}/notifications` (collection) | 404 |
| `POST /calendars/{cal}/notifications` array with `_id` | 201 but **returns the existing record unchanged** (upsert-by-type, payload ignored) |
| `PUT` with Version `2021-07-28` / `2021-04-15` | 422 / 422 |
| `PUT` with Version `2021-11-01` | 401 (invalid version) |

The endpoint exists (it 422s, not 404), but rejects everything. The bare exception name (no DTO validation detail) suggests GHL's controller throws `UnprocessableEntityException` from business logic, not field validation. **Conclusion: GHL's notification update PUT is effectively non-functional through this public API.** altType/altId was a red herring.

## Bigger finding — notification bodies are IMMUTABLE after create

`scripts/notification-mutability-probe.js` + an empty-body probe established:

- **Create on an empty type-slot sets `body`/`subject`/timing**, and the GET returns them. (verified: created reminder body `AAA`, GET returned `subject:"AAA", body:"<p>AAA</p>"`.)
- **POST onto an existing record never changes the body** — active collision keeps the old body; an empty-bodied record stays empty (no fill); version does not even bump.
- **Soft-delete + POST revives the original record with the original body** — soft-delete does not free the type-slot.
- **PUT is broken** (above).

So a notification body can be set **only at create time, and only on a type-slot that has no record at all (not even soft-deleted).** Once a record exists in a `(receiverType, notificationType, channel)` slot, its body is permanently fixed at whatever it was first created with (including empty).

### Consequence for the BII calendars

Every BII notification slot is already occupied with a locked body:

- Booked-to-contact and booked-to-assignedUser: **active, empty body** (created empty in the calendar phase). Cannot be populated.
- Reminder-to-contact: **soft-deleted** record occupying the slot. POST revives it unchanged; cannot be re-created with a body.

There is **no API path** to put the template bodies into these existing notifications. The original Phase D plan (update bodies in place) is not achievable.

## Correction to the Phase A diagnosis

Phase A (`notification-update-wrapper-diagnosis.md`) concluded GHL never returns `body`/`subject` on any GET, so body verification is UI-only. **That conclusion was wrong.** It was based on specimens that all had empty bodies (the booked notifications created empty, and the in-person reminder whose body never actually saved). When a body IS set via create, the singular GET returns `body` and `subject` in full. **Body verification on read IS possible**, with the existing passthrough wrapper, no code change. The Phase A doc has been annotated.

## Options for Phase D (your decision)

The template bodies (#5, #6, edited #8) are correct and verifiable. The blocker is getting them onto firing notifications. Paths:

1. **Recreate the two BII calendars** with their notifications created **with bodies from the start** (single create call per notification carrying body/subject/timing). Clean and fully verifiable, but the calendars get new IDs and the group/products/links references must be re-pointed and re-verified. Most thorough.
2. **Find a hard-delete** that truly removes a notification (frees the type-slot), then create-fresh-with-body in place on the existing calendars. Untested — the standard DELETE only soft-deletes. Worth one probe (e.g. DELETE variants, or whether GHL purges soft-deleted records after a period).
3. **Pivot to workflows for content.** Leave the calendar notifications minimal (or off) and deliver the actual styled emails via workflows triggered on appointment events, using the email templates already built and verified. Calendar fires the trigger; the workflow Send Email carries the body. Sidesteps the notification-body API entirely.

My recommendation: option 1 or 3. Option 1 keeps everything on calendar notifications and is clean if we accept recreating two calendars. Option 3 is the most robust against GHL's notification-API limitations and reuses the templates directly, but moves the mechanism into workflows.

## Status of the committed fix

The altType/altId injection is **inert** — necessary per GHL's request schema in theory, but the PUT fails regardless, so it changes nothing observable. It is harmless. Recommend either reverting it (the update path is unusable, so it has no purpose) or keeping it as a latent correctness item folded into the upcoming wrapper polish pass. Not pushed. Your call alongside the Phase D path.

## Follow-up tracker (accumulated, for the polish pass)

- **GHL notification PUT is non-functional** (422 on all payloads/versions). `update_calendar_notification` cannot work against live GHL as-is. Document the tool as create-only-effective, or remove it, pending any GHL fix.
- **Notification bodies are immutable post-create.** Document on `create_calendar_notifications` that body/subject/timing must be correct at create; they cannot be changed later.
- **`get_calendar_notifications` soft-delete filter:** pass `deleted: false` to exclude soft-deleted (the endpoint honors it). The `isActive` filter does not exclude them. Usage clarification.
- **Body/subject ARE readable** on GET when set (Phase A correction). No wrapper change needed for verification.
