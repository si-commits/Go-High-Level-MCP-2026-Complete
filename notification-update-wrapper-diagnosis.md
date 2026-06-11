# Notification Update Wrapper — Phase A Diagnosis (read-only)

> **CORRECTION (2026-06-11, post Phase C):** Section 1's conclusion that GHL never
> returns `body`/`subject` on GET is **WRONG**. Every specimen probed here had an
> empty body (booked notifications created empty; the in-person reminder whose body
> never actually saved), and GHL omits empty fields. When a body IS set via create,
> the singular GET returns `body` and `subject` in full. Body verification on read
> IS possible with the existing passthrough wrapper. Section 2's altType/altId
> hypothesis also did not hold: the PUT 422s regardless of altType/altId. See
> `notification-update-wrapper-extension.md` for the corrected findings.

Date: 2026-06-11. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox` (rebuilt dist).
Scope: read-only. One probe script (`scripts/notification-body-probe.js`, pure GET) plus source reads. No GHL writes except the agreed re-soft-delete of the in-person reminder to restore safe state (done before this diagnosis).

Two questions: (1) can notification `body`/`subject` be read back through any GHL endpoint, and (2) confirm the `altType`/`altId` requirement and exact field names for the PUT fix.

## 1. Body / subject visibility — NO read path exists

**Answer: GHL does not return `body` or `subject` through any reachable GET. The wrapper is not at fault. Verification must be UI-only.**

### The wrapper does not strip anything

`wrapResponse` (ghl-api-client.ts:452-457) is a pure passthrough: `return { success: true, data }`. It does not whitelist or drop fields. Therefore the MCP's `get_calendar_notification` output already equals GHL's raw `response.data`. The absence of `body`/`subject` in the MCP responses is GHL's actual payload, not a wrapper transform.

### Raw endpoint probe (scripts/notification-body-probe.js)

Hit candidate GET endpoints with raw axios (same auth as the client), dumping the full notification object:

| probe | endpoint | status | body/subject returned? |
|---|---|---|---|
| A | `GET /calendars/{cal}/notifications/{id}` (reminder, had a body written by the partial PUT) | 200 | **No** |
| B | `GET /calendars/{cal}/notifications/{id}` (booked, empty body) | 200 | **No** |
| C | `GET /calendars/{cal}/notifications?deleted=true` | 200 | **No** |
| D | `GET /calendars/notifications/{id}` (no calendarId, user suggestion) | 404 | endpoint does not exist |
| E | `GET /calendars/{cal}/notifications/{id}/preview` (guessed preview path) | 404 | endpoint does not exist |

Every notification object GHL returns carries exactly: `version, isActive, deleted, _id, receiverType, notificationType, channel, [beforeTime], altId, altType, createdAt, updatedAt, [traceId]`. Never `body`, never `subject`, never `templateId`.

Probe A is the decisive one: the in-person reminder had `body`/`subject` pushed into it by the Step 2 partial PUT, yet GHL's singular GET still omits them. So even a body-bearing record does not expose its body on read. The content is stored write-side only (the GHL UI and the actual email send read it; the public read API does not surface it).

### Consequence for Phase B

Surfacing `body`/`subject` on the read tools is **not implementable** — GHL gives us nothing to surface. Per the decision ("if no, document the gap and accept UI-only verification"), Phase B will make only the `altType`/`altId` fix. Body verification in Phase D will be: write succeeds cleanly (no 422, clean version bump), and the human confirms body text in the GHL UI. The smoke test (Phase C) can still prove a body round-trips by a different means if one exists; if not, it asserts write-success only and flags UI verification.

### Bonus finding (read path, in scope-adjacent)

Probe C shows `GET ...?deleted=true` returns ONLY soft-deleted records. So the list endpoint honors a `deleted` query filter, and `get_calendar_notifications` already exposes a `deleted` param. The earlier "soft-deletes not filtered" observation was because we filtered on `isActive: true`, not `deleted: false`. Correct usage is `deleted: false` to get the live set. This is a usage clarification, not a code change; logged to the follow-up tracker, not part of Phase B.

## 2. altType / altId — confirmed PUT requirement and field names

- GHL's update request type `GHLUpdateCalendarNotificationRequest` (ghl-types.ts:3152-3153) lists `altType?: 'calendar'` and `altId?: string`.
- Every notification record's data carries `altType: "calendar"` and `altId: "<calendarId>"` (seen in every probe above).
- The Step 2 PUT failed with 422 because the MCP `update_calendar_notification` schema (calendar-tools.ts:1307-1346) exposes no `altType`/`altId`, and the handler spreads params straight to the PUT body (calendar-tools.ts:2481-2482), so GHL received a body with neither. Create avoids this by inferring both from the URL; PUT validates them in the body.

**Exact fix:** in the `updateCalendarNotification` handler, inject `altType: "calendar"` and `altId: <calendarId>` into `updateData` before the client call. Both are derivable from existing params (`altId` = the `calendarId` arg). No new user-facing args. Backward compatible.

**Field names confirmed:** `altType` (string literal `"calendar"`), `altId` (string, the calendar ID).

Note: this is the leading and most likely sufficient cause. Whether GHL requires any further field on PUT will be proven by the Phase C smoke test. If the PUT still 422s after injecting altType/altId, that is the trigger (per the agreed constraint) to stop Phase D and run a focused wrapper polish pass.

## State after Phase A

In-person reminder `6a2a2a39b72e84c1892e4513`: re-soft-deleted, now `version 5, isActive: false, deleted: true`. Safe. Virtual reminder `6a2a2a3ecd4702a840ab4012`: still soft-deleted from the original Step 1. Both booked notifications per calendar and the 2 inApp defaults per calendar: untouched. No new records created in Phase A.

## Recommendation

Proceed to Phase B with the single required change (altType/altId auto-inject). Do not attempt body surfacing — there is no GHL data to surface. Carry UI-only body verification forward into Phase D.
