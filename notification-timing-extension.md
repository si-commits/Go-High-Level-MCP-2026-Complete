# Notification Timing + Sibling Fixes, Extension Result + Smoke Test (Phases B & C)

Date: 2026-06-11. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox` (extended fork).
Phase B commit: **`e4ca391`** (four items). Phase C commit: the commit that adds this file (client body fix + handler return + this doc).

## Result

All four planned items work. **Phase C also uncovered a real bug that the schema-only change did not cover:** the notifications client wrapped the body as `{ notifications: [...] }`, which GHL answers with a 500. GHL wants the **raw array** as the body. Fixed in Phase C. Without that fix every notification create fails, so the timing schema additions alone were not enough.

Two findings materially shape Phase D provisioning:

1. **A reminder with multiple offsets must be ONE record with a multi-element `beforeTime`, not separate records.** GHL returns **400** if a single POST contains two records of the same `notificationType` (two `reminder` rows). It stores a single reminder carrying `beforeTime: [{7,days},{24,hours}]` cleanly.
2. **Body must be the raw array.** `[ {...}, {...} ]`, not `{ notifications: [ ... ] }`.

## Method

Drove the COMPILED `dist` directly: `CalendarTools.executeTool(...)` for the tool path, and raw `axios` (same base URL, Bearer, Version headers) for payload-shape probing. The live session MCP is still on the pre-rebuild process, so the tool surface was not used. Every test object was a throwaway calendar (`isActive: false`) or throwaway group, each deleted with read-back verification. Post-run sweep confirmed zero `ZZZ/SMOKE/DBG/CONF` calendars or groups remain; the two real BII calendars and the BII group were untouched.

## Per-item smoke results

| Item | Probe | Result | Verdict |
|---|---|---|---|
| `preBuffer` / `preBufferUnit` (create_calendar) | sent `preBuffer: 15, preBufferUnit: mins` | read-back `preBuffer: 15, preBufferUnit: mins` | PASS |
| `validate_group_slug` endpoint | `POST /calendars/groups/validate-slug` via tool | `201`, `{ available: true }` (was 404 on the old GET path) | PASS |
| `create_calendar_group` `isActive` | created group with `isActive: false` | read-back `isActive: false` (previously dropped, always defaulted true) | PASS |
| notification `beforeTime` (reminder) | single reminder `beforeTime: [{7,days},{24,hours}]` | stored both elements verbatim | PASS |
| notification `afterTime` (followup) | followup `afterTime: [{2,hours}]` | stored verbatim | PASS |
| notification body shape | `{ notifications: [...] }` vs raw array | wrapped = **500**; raw array = **201** | FIXED (client now sends raw array) |

## The two Phase C questions, answered

### Q1. Array shape: multi-element array on one record, or separate records?

**One record with a multi-element `beforeTime` array.** Separate records do not work.

- Single reminder, `beforeTime: [{timeOffset:7,unit:"days"},{timeOffset:24,unit:"hours"}]` -> **201**, both offsets stored on one record.
- Two separate `reminder` records in one POST -> **400** (GHL rejects duplicate `notificationType` in a single request); only the first persisted.

Consequence for BII: the originally specified "reminder 7-day" + "reminder 24-hour" as two notifications **must be modeled as a single reminder record** carrying `beforeTime: [{timeOffset:7,unit:"days"},{timeOffset:24,unit:"hours"}]`. Functionally identical (fires at both 7 days and 24 hours); just one record, not two.

### Q2. Unit strings

`"days"`, `"hours"`, and `"mins"` are all accepted and stored **verbatim, no normalisation**. Confirmed: 7 `days`, 24 `hours`, 30 `mins`, 2 `hours` (follow-up) all round-tripped exactly as sent.

## Working call pattern for the BII set (validated through the tool path)

A single `create_calendar_notifications` POST of three records succeeds (mixed `notificationType`, and the two `booked` rows differ by `receiverType`, so no duplicate-type conflict):

```
create_calendar_notifications(calendarId, [
  { receiverType: 'contact',      channel: 'email', notificationType: 'booked',   isActive: true },
  { receiverType: 'contact',      channel: 'email', notificationType: 'reminder', isActive: true,
    beforeTime: [{ timeOffset: 7, unit: 'days' }, { timeOffset: 24, unit: 'hours' }] },
  { receiverType: 'assignedUser', channel: 'email', notificationType: 'booked',   isActive: true },
])
```

Both "single POST of three" and "three separate POSTs" were verified to produce the same stored set. Single POST is preferred for Phase D (one call per calendar). This is **three records per calendar**, six across both BII calendars, replacing the original "four per calendar / eight total" because the two reminders collapse into one record.

Note: GHL auto-creates default `booked` and `confirmation` notifications to `assignedUser` on channel `inApp` at calendar-creation time. The records above are additive email notifications and coexist with those defaults.

## Code changes in Phase C (beyond the Phase B commit)

- `ghl-api-client.ts` `createCalendarNotifications`: POST the raw `notifications` array instead of `{ notifications }`. Added a comment documenting the 500-on-wrapped and 400-on-duplicate-type behaviours.
- `calendar-tools.ts` `createCalendarNotifications` handler: return the created notification records (`notifications: response.data`) and a count in the message, for easier verification by callers.

## Rebuild-and-restart reminder

The fork `dist` is rebuilt (Phase B + Phase C). To use the new params and the notification fix **through the live MCP tool surface**, the `ghl-lorox` MCP must be reconnected (stdio server spawned per session; this session is still on the pre-rebuild process). The smoke tests bypassed this by calling `dist` directly.

## Cleanup

All throwaway calendars (`delete_calendar` -> 200, read-back `400 The calendar is deleted`) and the throwaway group (`delete_calendar_group` -> 200, absent on re-list) were removed. Temporary smoke/debug scripts deleted. Location left at 8 calendars (6 original + 2 BII) and 1 group (BII).

**Phase C complete. Awaiting MCP reconnect, then Phase D provisioning with the three-record-per-calendar pattern above.**
