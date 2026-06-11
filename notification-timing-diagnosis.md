# Notification Timing + Sibling Fixes, Gap Diagnosis (Phase A, read-only)

Date: 2026-06-11. Fork: `si-commits/Go-High-Level-MCP-2026-Complete`, branch `main`.
Scope: confirm the surface state of four wrapper items before a minimum-scope Phase B extension. **No code was changed. No GHL writes were made.** Source was read at all layers: MCP input schema, handler (`src/tools/calendar-tools.ts`), client method (`src/clients/ghl-api-client.ts`), request/param types (`src/types/ghl-types.ts`).

This supersedes one line in `calendar-wrapper-diagnosis.md` (line 18) which stated `create_calendar_notifications` is "complete, no extension needed". That is wrong: the timing fields exist on the request type but are not exposed in the tool schema, so a caller cannot set reminder offsets. See item 1.

---

## Headline

- **The notification timing fields already exist on the GHL request types.** `GHLCreateCalendarNotificationRequest` and `GHLUpdateCalendarNotificationRequest` both carry `beforeTime?: GHLScheduleDTO[]` and `afterTime?: GHLScheduleDTO[]` (`ghl-types.ts:3123-3124`, `3143-3144`). `GHLScheduleDTO = { timeOffset: number; unit: string }` (`ghl-types.ts:3092-3095`). The client and both handlers pass the notification objects through without an allow-list. **The only gap is the MCP tool schema**, which does not declare these fields, so the model is never told they exist. This makes the primary work the cheapest of the four: schema-only.
- **`validate_group_slug` uses the wrong HTTP method and path.** Client issues `GET /calendars/groups/slug/validate` (`ghl-api-client.ts:3332`). GHL returns 404 `Cannot GET /calendars/groups/slug/validate`. Fix is isolated to the client method.
- **`create_calendar_group` handler drops `isActive`.** It is in the schema (`calendar-tools.ts:813`) and the MCP type (`ghl-types.ts:3179`), and the client spreads `...groupData`, but the handler builds `groupData` from only `locationId/name/description/slug` (`calendar-tools.ts:1899-1904`). One-line handler fix.
- **`preBuffer` / `preBufferUnit` are read-only today.** They appear on the read type `GHLCalendar` (`ghl-types.ts:1185-1186`) and come back on `get_calendar`, but are absent from both request types, both MCP param types, both schemas, and the `create_calendar` handler allow-list. Needs all input layers.

---

## 1. Notification timing (PRIMARY)

### GHL field model (confirmed from the existing request/response types)

GHL expresses notification timing as two arrays on the notification record:

| Field | Purpose | Shape |
|---|---|---|
| `beforeTime` | fire N units **before** the appointment (reminders) | `GHLScheduleDTO[]` |
| `afterTime` | fire N units **after** the appointment (follow-ups) | `GHLScheduleDTO[]` |

`GHLScheduleDTO = { timeOffset: number; unit: string }` (`ghl-types.ts:3092-3095`). So a 7-day-before reminder is `beforeTime: [{ timeOffset: 7, unit: "<days-unit>" }]` and a 24-hour-before reminder is `beforeTime: [{ timeOffset: 24, unit: "<hours-unit>" }]`.

### Where the fields already live vs where they are missing

| Layer | Location | beforeTime / afterTime present? |
|---|---|---|
| GHL create request type | `GHLCreateCalendarNotificationRequest` (`ghl-types.ts:3115-3129`) | **Yes** (3123-3124) |
| GHL update request type | `GHLUpdateCalendarNotificationRequest` (`ghl-types.ts:3131-3147`) | **Yes** (3143-3144) |
| GHL read type | `GHLCalendarNotification` (`ghl-types.ts:3097-3113`) | **Yes** (3109-3110) |
| Client create | `createCalendarNotifications` (`ghl-api-client.ts:3588`): `payload = { notifications }`, POST as-is | passthrough, no allow-list |
| Client update | `updateCalendarNotification` (`ghl-api-client.ts:3623`): PUT `updateData` as-is | passthrough |
| Handler create | `createCalendarNotifications` (`calendar-tools.ts:2363-2378`): `{ calendarId, notifications }`, forwards array as-is | passthrough, no allow-list |
| Handler update | `updateCalendarNotification` (`calendar-tools.ts:2407-2422`): `const { calendarId, notificationId, ...updateData }` spread | passthrough |
| **MCP create schema** | item schema (`calendar-tools.ts:1219-1227`) | **No** |
| **MCP update schema** | `update_calendar_notification` schema (`calendar-tools.ts:1270-1278`) | **No** |

**Conclusion:** the Phase B notification work is **schema-only**. Add `beforeTime` and `afterTime` (each an array of `{ timeOffset: number, unit: string }`) to the `create_calendar_notifications` item schema and to the `update_calendar_notification` schema, with descriptions noting beforeTime = reminders, afterTime = follow-ups. Types and runtime plumbing already exist. No handler or client edit. Fully backward compatible (both optional).

### Answers to the four required diagnosis questions

1. **Field for "N units before" on reminders:** `beforeTime: [{ timeOffset: N, unit: "<unit>" }]`.
2. **Does the same structure apply to follow-ups (fire after)?** Yes, mirror field `afterTime: [{ timeOffset: N, unit }]`, same `GHLScheduleDTO` shape.
3. **Valid on all `notificationType` values or only reminders/follow-ups?** The type permits the fields on every notificationType, but semantically `beforeTime` is meaningful only for `reminder` and `afterTime` only for `followup`. `booked`, `confirmation`, `cancellation`, `reschedule` are event-triggered and fire immediately with no offset. **To confirm empirically in Phase C:** whether GHL ignores or rejects an offset supplied on an event-triggered type.
4. **Different timing semantics per type?** Yes. Three classes: event-triggered/immediate (`booked`, `confirmation`, `cancellation`, `reschedule`), offset-before (`reminder` via `beforeTime`), offset-after (`followup` via `afterTime`).

### Open items to confirm empirically in Phase C (not blockers, do not change scope)

- Exact accepted **`unit` strings**. Candidates: `"days"` / `"hours"` / `"mins"` versus singular or `"minutes"`. The DTO types `unit` only as `string`, so GHL is the authority. Probe both reminders with the two units we need (days and hours) and read back.
- Whether **multiple offsets** belong in one record (a multi-element `beforeTime` array) or as **one record per offset**. Our spec is two separate reminder notifications, so the plan is one record each with a single-element `beforeTime`. Phase C will confirm GHL stores them distinctly.

---

## 2. `validate_group_slug` (sibling: wrong endpoint, 404)

- **Client** `validateCalendarGroupSlug` (`ghl-api-client.ts:3324-3340`): `GET /calendars/groups/slug/validate` with query `{ locationId, slug }`.
- **Observed:** GHL returns `404 Cannot GET /calendars/groups/slug/validate` (seen live during Step 1).
- **Expected (GHL Calendars API v2):** `POST /calendars/groups/validate-slug` with JSON body `{ locationId, slug }`, response `{ available: boolean }`. The existing response type `GHLValidateGroupSlugResponse` already models `available`, and the handler already reads `response.data.available` (`calendar-tools.ts:1938`), so only the transport changes.
- **Fix scope:** client method only. Change `.get('/calendars/groups/slug/validate', { params })` to `.post('/calendars/groups/validate-slug', { locationId, slug })`. Schema, handler, and types unchanged.
- **Confirm in Phase C:** the corrected path/method is non-mutating, safe to probe directly after the fix to verify a `200 { available }`.

---

## 3. `create_calendar_group` (sibling: handler drops isActive)

- **Schema:** `isActive` present, default true (`calendar-tools.ts:813`).
- **MCP type:** `MCPCreateCalendarGroupParams.isActive?` present (`ghl-types.ts:3179`).
- **Client:** `createCalendarGroup` spreads `{ ...groupData, locationId }` (`ghl-api-client.ts:1912-1917`), so it forwards anything in groupData.
- **Handler:** `createCalendarGroup` (`calendar-tools.ts:1899-1904`) builds `groupData` from only `locationId/name/description/slug`. **`isActive` is dropped here.**
- **Fix scope:** handler only. Thread `params.isActive` into `groupData` when defined. One line. No schema/type/client change.

---

## 4. `preBuffer` / `preBufferUnit` (sibling: not exposed as input)

- **Read type:** `GHLCalendar.preBuffer` / `preBufferUnit` present (`ghl-types.ts:1185-1186`); they return on `get_calendar` (seen on both BII calendars, `preBuffer: 0`).
- **Create request type** `GHLCreateCalendarRequest` (`ghl-types.ts:1206-1230`): **absent**.
- **Update request type** `GHLUpdateCalendarRequest` (`ghl-types.ts:1232-1253`): **absent**.
- **MCP types** `MCPCreateCalendarParams` (`ghl-types.ts:1375-1397`) and `MCPUpdateCalendarParams` (`1399-1420`): **absent**.
- **Schemas:** create buffer block (`calendar-tools.ts:206-214`) and update block (`394-401`) expose `slotBuffer`/`slotBufferUnit` only.
- **Handlers:** `create_calendar` builds an explicit allow-list `calendarData` (`calendar-tools.ts:1516-1539`), so it must be edited. `update_calendar` spreads `...updateData`, so schema+type suffice there.
- **Fix scope:**
  - create_calendar: `GHLCreateCalendarRequest` + `MCPCreateCalendarParams` + create schema + create handler allow-list.
  - update_calendar: `GHLUpdateCalendarRequest` + `MCPUpdateCalendarParams` + update schema (no handler change, it spreads).

---

## Phase B change matrix (summary, for the focused commit)

| Item | GHL req type | MCP param type | Tool schema | Handler | Client |
|---|---|---|---|---|---|
| 1. Notification `beforeTime`/`afterTime` (create + update) | already present | n/a (uses GHL req type) | **add** (both schemas) | no change (passthrough) | no change |
| 2. `validate_group_slug` endpoint | n/a | n/a | no change | no change | **fix** (POST validate-slug) |
| 3. `create_calendar_group` isActive | n/a | already present | no change | **add** (thread isActive) | no change |
| 4. `preBuffer`/`preBufferUnit` (create) | **add** | **add** | **add** | **add** (allow-list) | no change |
| 4. `preBuffer`/`preBufferUnit` (update) | **add** | **add** | **add** | no change (spread) | no change |

All additions optional, undefined-when-omitted, dropped by axios. Backward compatible. Minimum scope: only these four items, no other notification quirks (no `additionalEmailIds`, `selectedUsers`, `fromAddress`, `fromName` exposure, even though the type carries them, unless a later task needs them).

**Phase A complete. No code changed, no writes made. Awaiting confirmation before Phase B.**
