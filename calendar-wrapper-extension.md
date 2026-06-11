# Calendar Wrapper Extension — Result + Smoke Test (Phases B & C)

Date: 2026-06-11. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox` (extended fork).
Phase B commit: **`ad7ee4d`**. Phase C commit: the commit that adds this file (see `git log`).

## Result

10 of the 12 new params pass cleanly (stored or meaningful behaviour confirmed). **Two need attention:**

- **`timezone` is rejected by GHL** on both create and update (`422: property timezone should not exist`). It is not a calendar field on this API version. Passthrough is proven (the param reaches GHL), but it cannot be stored, and worse, **passing it aborts the whole create/update with a 422**. Recommend removing `timezone` from the wrapper (it is a footgun as-is). See recommendation below.
- **Root-level `locationConfigurations` is silently dropped.** GHL accepts it without error but does not persist it at the calendar root. The working path is **`teamMembers[].locationConfigurations`**, which stores correctly. So meeting location must be set inside `teamMembers`, not at root.

The other 10 params are good. `formId`, `eventTitle`, `eventType`, `slotInterval`/`slotIntervalUnit`, `slotBuffer`/`slotBufferUnit`, `openHours`, `availabilities`, and `teamMembers` (incl. nested `locationConfigurations`) all store correctly.

## Method

Drove the COMPILED `dist` `CalendarTools.executeTool('create_calendar' | 'get_calendar' | 'update_calendar' | 'delete_calendar', ...)` directly (so the real handler, including the create whitelist, is exercised) against the live GHL API. The session's live MCP is still on the pre-rebuild process, so the MCP tool surface was not used. Two throwaway calendars, both `isActive: false`, both deleted with read-back verification.

## Per-param smoke results

| Param | Probe | API result | Stored on read-back | Verdict |
|---|---|---|---|---|
| `teamMembers` | Jenna `UIChIX3a0wWAs7vdhdfM`, priority 0.5, isPrimary, with nested locationConfiguration | 201 | `teamMembers[0].userId = UIChIX3a0wWAs7vdhdfM`, isPrimary true, nested locationConfig `SMOKE-MEMBER-LOC-9001` present | PASS |
| `teamMembers[].locationConfigurations` (nested) | `kind: custom, location: SMOKE-MEMBER-LOC-9001` | 201 | stored under the team member | PASS |
| `locationConfigurations` (root-level) | `kind: custom, location: SMOKE-ROOT-LOC-9002` | 201 (no error) | **`undefined` at root** — silently dropped | DROPPED — use `teamMembers[]` instead |
| `eventType` | `RoundRobin_OptimizeForAvailability` | 201 | `eventType = RoundRobin_OptimizeForAvailability` | PASS |
| `slotInterval` | `30` | 201 | `slotInterval = 30` | PASS |
| `slotIntervalUnit` | `mins` | 201 | `slotIntervalUnit = mins` | PASS |
| `slotBuffer` | `30` | 201 | `slotBuffer = 30` | PASS |
| `slotBufferUnit` | `mins` | 201 | `slotBufferUnit = mins` | PASS |
| `openHours` | Monday 09:00-17:00 (`daysOfTheWeek:[1]`) | 201 | stored exactly: `[{daysOfTheWeek:[1], hours:[{9:00-17:00}]}]` | PASS |
| `availabilities` | Date-specific 2026-09-14 10:00-12:00 | 201 | stored exactly; GHL assigned `_id` | PASS |
| `timezone` | `America/Los_Angeles` (create), then via update | **422 on create AND update**: `property timezone should not exist` | n/a | REJECTED by GHL (not a calendar field). Proven passthrough, but unusable + breaks the call. |
| `formId` | `smoke-test-form-id` (fake) | 201 | `formId = smoke-test-form-id` (GHL did not validate existence) | PASS |
| `eventTitle` | `Smoke test - {{contact.name}}` | 201 | `eventTitle = Smoke test - {{contact.name}}` | PASS |

### Notes on the two problem params

- **`timezone`**: GHL's `POST /calendars/` and `PUT /calendars/{id}` both use a strict whitelist validator and reject `timezone`. Calendars appear to inherit the location's timezone rather than carry their own. The 422 is fatal to the whole request, so any caller that passes `timezone` will fail to create/update the calendar. This is the one param that genuinely cannot be supported on this GHL API version.
- **Root `locationConfigurations`**: accepted silently but not persisted at root. All existing calendars on this location store meeting locations under `teamMembers[].locationConfigurations`, which is consistent with this behaviour. Provisioning should set the physical address / Zoom / Google Meet inside the team member entry, which is confirmed working.

## Pre-existing params confirmed available (Phase B verification)

`autoConfirm`, `allowReschedule`, and `allowCancellation` were **already exposed** on both `create_calendar` and `update_calendar` before this extension (schema + type + handler). They were on the original wish list but were not gaps. They are callable today — the BII calendars can set `autoConfirm: true`, `allowReschedule: false`, `allowCancellation: false` without any new work. Flagging so this is not re-investigated later.

## Cleanup

Both throwaway calendars deleted (`delete_calendar` -> 200), and deletion verified by read-back (`get_calendar` -> `400: The calendar is deleted`). No real BII calendar touched. Jenna's user assignment elsewhere was not modified (she was only referenced as a read-only owner on the throwaway test calendars). The temporary smoke-test script was removed.

## Rebuild-and-restart reminder

The fork's `dist` is rebuilt (Phase B). Any Claude Code session that wants to use the new calendar params **through the live MCP tool surface** must restart/reconnect the `ghl-lorox` MCP (it is a stdio server spawned per session; this session is still on the pre-rebuild process). The smoke test bypassed this by calling `dist` directly. After reconnect, `create_calendar` / `update_calendar` will expose the new params in their schema.

## Handler whitelist quirk (for future wrapper work)

`create_calendar` builds its request body from an **explicit allow-list object** (`calendarData` in the handler), not a spread. So adding a passthrough param to the type + schema is not enough — the field must also be added to that `calendarData` object, or it silently never reaches the client. (`update_calendar`, by contrast, spreads `{ calendarId, ...updateData }`, so type + schema is sufficient there.) When extending any whitelist-style handler in this fork, always add the field in three places: type, schema, and the handler's request object. This is the main structural difference from the custom-field extension (commit `5597aa3`), whose handler already spread.

## Recommendation (for your review before provisioning)

1. **Remove `timezone` from the wrapper** (revert that one param from create + update schema/type/handler). GHL rejects it with a fatal 422, so leaving it in is a footgun: any provisioning call that passes it will fail. Calendar timezone will come from the location setting / be handled in the GHL UI. This is a small follow-up commit if you approve.
2. **Document `locationConfigurations` as team-member-scoped.** Keep the root-level param (harmless, accepted), but provisioning must put the meeting location inside `teamMembers[].locationConfigurations`. I will use that path in the provisioning plan.
3. The other 10 params are production-ready.

Awaiting your decision on (1) before provisioning. No push yet.
