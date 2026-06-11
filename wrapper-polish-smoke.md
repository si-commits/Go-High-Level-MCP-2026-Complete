# Wrapper Polish Pass: Phase C Smoke Probes

Date: 2026-06-12. Driven against the live `ghl-lorox` MCP (location
`1W01uH5EthLl1oJRj8Xq`). Three backfill probes for behaviour added earlier but
never tested. All throwaway calendars were created with `isActive: false` and
deleted at the end of each probe.

Note: the live MCP server is running the pre-build `dist`, so its tool
descriptions are the older text. This does not affect probe behaviour, which
tests data round-trips, not description copy.

## Probe 8: afterTime / followup notification round-trip — PASS

Steps and results:

1. Created throwaway calendar `Uk3w6T7zrMIGA7Kmhj7h` (`event`, `isActive: false`).
2. Created a notification: `receiverType: contact`, `notificationType: followup`,
   `channel: email`, `afterTime: [{ timeOffset: 2, unit: "hours" }]`,
   `subject: "AFTERTIME-PROBE"`, `body: "<p>aftertime probe</p>"`, `isActive: true`.
   Returned notification id `6a2b32c57633a8fb441a5537`.
3. Read back via `get_calendar_notification` (single) and via
   `get_calendar_notifications` (listing, `deleted: false`).

Verified:

- `afterTime` stored exactly as sent: `[{ timeOffset: 2, unit: "hours" }]`, on
  both the single-get and the listing. Offset and unit correct.
- `subject` and `body` both returned on read (`"AFTERTIME-PROBE"` /
  `"<p>aftertime probe</p>"`). This confirms the Phase A correction: GHL returns
  body and subject on GET when they were set at create.
- The notification carried `altType: "calendar"`, `altId` = the calendarId, and
  `deleted: false`.

4. Deleted throwaway calendar `Uk3w6T7zrMIGA7Kmhj7h`. Clean.

Conclusion: the afterTime / followup path works end to end. No finding.

## Probe 9: formId passthrough persistence on update — PASS

Steps and results:

1. Created throwaway calendar `Z5TjtQUzenit7qb6Rjk8` (`event`, `isActive: false`)
   with a fake `formId: "PROBE-FORM-9001"`. Create response echoed
   `formId: "PROBE-FORM-9001"` (GHL stored the fake value without validating it,
   consistent with prior observations).
2. `get_calendar` read-back: `formId: "PROBE-FORM-9001"`. Confirmed.
3. Updated an unrelated field only (`name` changed to
   "FORMID-PROBE-CAL (throwaway, renamed)"), did NOT pass `formId`.
4. Fresh `get_calendar` read-back after the update: `name` is the renamed value
   AND `formId` is still `"PROBE-FORM-9001"`.

Conclusion: a spread-based `update_calendar` that omits `formId` does not clear
it. formId persists through unrelated updates. No finding.

5. Deleted throwaway calendar `Z5TjtQUzenit7qb6Rjk8`. Clean.

## Probe 10: inApp notification cascade on calendar delete — FINDING (soft-cascade, records survive)

This is the probe flagged as the one where an unexpected outcome matters most.
Outcome: the inApp notifications survive their parent calendar's deletion as
soft-deleted records that remain individually resolvable by id.

Steps and results:

1. Created throwaway calendar `eUMtFHOp6nNF4mJTQrUj` (`event`, `isActive: false`).
2. Captured its 2 auto-created inApp default notifications:
   - booked: `6a2b32f2ea5cb4642f986a50` (`channel: inApp`, `receiverType:
     assignedUser`, `version: 1`, `isActive: true`, `deleted: false`).
   - confirmation: `6a2b32f2ea5cb455f1986a4f` (same shape).
3. Deleted the calendar via `delete_calendar` (`success: true`).
4. Attempted to read both captured notification ids directly via
   `get_calendar_notification` (passing the now-deleted calendarId + each id).

Result: **both ids still resolve.** Each returns `success: true` with the record:

| field | booked id | confirmation id |
| --- | --- | --- |
| `_id` | 6a2b32f2ea5cb4642f986a50 | 6a2b32f2ea5cb455f1986a4f |
| `version` | 2 (was 1) | 2 (was 1) |
| `isActive` | false (was true) | false (was true) |
| `deleted` | true (was false) | true (was false) |
| `updatedAt` | bumped to delete time | bumped to delete time |

So the calendar delete DID touch the inApp notifications: it bumped their
version, set `isActive: false` and `deleted: true`, and updated `updatedAt`. But
it did NOT purge them. The records persist after the parent calendar is gone and
are still addressable by id.

### Classification

This is outcome #2 from the plan ("returned with `deleted: true` but the ids
still resolvable") = soft-cascade. It falls inside the stop-and-surface
condition: the notifications survive parent deletion in a resolvable form.

## Finding: GHL calendar notifications are effectively append-only via the API

This probe is the third independent observation of the same underlying GHL model,
and the three line up into one coherent picture. Future-Si: read these together,
not in isolation.

Three-way consistency:

1. **Soft-delete does not free the type-slot.** From the notification update
   diagnostics (`notification-update-wrapper-extension.md`): soft-deleting a
   notification then POSTing a replacement of the same type revives the original
   record with the original body, rather than creating a clean new one. The slot
   stays occupied by the old record.
2. **No API path hard-deletes a notification.** From the hard-delete probe
   (`91044d4`, `notification-hard-delete-probe.md`): every delete route the API
   exposes only soft-deletes (`deleted: true`); none purges the row.
3. **Calendar delete cascades flag-only.** From this probe: deleting the parent
   calendar flips its child inApp notifications to `deleted: true` /
   `isActive: false` (version bumped), but leaves the rows in place, still
   resolvable by direct id GET after the calendar is gone.

Taken together: a notification record, once created, is never reclaimed by the
API under any operation we have tried (soft-delete, re-POST, parent-calendar
delete). The API surface is **append-only with a soft-delete flag**. State can be
flipped (active/deleted), but rows are immutable-in-existence and bodies are
immutable-after-create.

Practical implication: **clean reprovisioning of notifications is not achievable
through the API.** Any "delete and recreate cleanly" path will leave orphaned
soft-deleted residue, and a same-type recreate may revive the stale record
instead of taking the new body. The only paths to a genuinely clean notification
state are the GHL UI, or accepting the orphans and filtering them out with
`deleted: false` on read.

### Practical implications for tomorrow's hard-delete probe work on the live BII calendars

- Deleting a calendar does not orphan *active* inApp notifications: the cascade
  correctly flips them to `deleted: true` / `isActive: false`, so they will not
  fire. A `get_calendar_notifications` with `deleted: false` will not surface
  them. Functionally safe.
- But the rows are not reclaimed and remain resolvable by direct id GET, so any
  audit that counts notification records by id (rather than filtering on
  `deleted: false`) will still see them. The `deleted: false` filter documented in
  this pass (item 5) is the correct lens.
- There is still no API route to hard-delete these residual records, so if the
  BII work needs a truly clean slate (zero residual notification rows under a
  deleted calendar), that is not achievable through the current tool surface and
  would need the GHL UI or a GHL-side fix.

### Cleanup

The parent calendar `eUMtFHOp6nNF4mJTQrUj` is deleted. The 2 inApp records remain
as soft-deleted residue (no API path to purge them; this is the finding itself,
not a cleanup gap).

## Summary

| Probe | Result |
| --- | --- |
| 8: afterTime round-trip | PASS, no finding |
| 9: formId update persistence | PASS, no finding |
| 10: inApp cascade on delete | FINDING: soft-cascade. Records survive as `deleted: true`, still resolvable by id; no hard-delete path. Consistent with `91044d4`. |
