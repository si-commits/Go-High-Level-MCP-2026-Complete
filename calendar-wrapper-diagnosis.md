# Calendar Wrapper — Gap Diagnosis (Phase A, read-only)

Date: 2026-06-11. Fork: `si-commits/Go-High-Level-MCP-2026-Complete`, branch `main`.
Scope: confirm what the calendar-related MCP tools currently expose vs what GHL's API accepts, to define the minimum Phase B extension. **No code was changed.**

## Method

Read both layers for each tool: the MCP input schema (introspection), the handler in `src/tools/calendar-tools.ts`, the client method in `src/clients/ghl-api-client.ts`, and the request/param types in `src/types/ghl-types.ts`. The important question per tool is whether the handler **spreads** params to the client (so type+schema additions suffice) or **whitelists** them (so the handler must change too).

---

## Headline

- **The nested types already exist** and are correct: `GHLTeamMember`, `GHLLocationConfiguration`, `GHLOpenHour`, `GHLAvailability`, `GHLHour` (`ghl-types.ts:1128-1161`). Most of the type plumbing for `teamMembers`, `locationConfigurations`, `openHours`, `availabilities` is already present on the GHL request interfaces.
- **`create_calendar` is the main work.** Its handler builds an explicit allow-list object (`calendar-tools.ts:1280-1293`), so new params must be added to the **type, the schema, AND the handler**. Notably it already wires `teamMembers` in the type+handler but the param is **not in the input schema**, so callers literally cannot pass it today.
- **`update_calendar` is cheap.** Its handler spreads (`const { calendarId, ...updateData } = params`, `calendar-tools.ts:1339`) and the client PUTs the body directly. So type + schema additions are enough; **no handler change**.
- **`create_calendar_group`** is sufficient for our needs (creates a container). Minor gap: handler drops `isActive`. Not blocking.
- **`create_calendar_notifications`** is complete. No extension needed (as the plan expected).
- **Payment product tools exist** (`ghl_create_product`, `ghl_create_price`, `ghl_list_products`, `ghl_get_product`, `ghl_update_product`, `ghl_delete_product`). The "no payment tools" wildcard does **not** apply. They are adequate for one-time priced products; recurring/subscription price config is thin. Recommend handling any product extension in the dedicated payment-products task, not here.

---

## 1. `create_calendar`

- **Client** (`ghl-api-client.ts:1957`): `POST /calendars/` with `{ ...calendarData, locationId }`. Passes the body through. Not a bottleneck.
- **Handler** (`calendar-tools.ts:1278-1310`): builds an explicit `calendarData` object. **Allow-list, not a spread.** Currently forwards: `name, description, calendarType, groupId, teamMembers, slotDuration, slotDurationUnit, autoConfirm, allowReschedule, allowCancellation, isActive` (+ injects `locationId`).
- **Type** `MCPCreateCalendarParams` (`ghl-types.ts:1360-1372`): has `name, description, calendarType, groupId, teamMembers, slotDuration, slotDurationUnit, autoConfirm, allowReschedule, allowCancellation, isActive`.
- **Schema** (`calendar-tools.ts:100`): exposes `name, calendarType, description, groupId, slotDuration, slotDurationUnit, autoConfirm, allowReschedule, allowCancellation, isActive`. **`teamMembers` is missing from the schema** despite being in the type and handler.
- **GHL request type** `GHLCreateCalendarRequest` (`ghl-types.ts:1206-1222`): already has `teamMembers, locationConfigurations, openHours, slug` plus the basics. Missing: `eventType, slotInterval, slotIntervalUnit, slotBuffer, slotBufferUnit, availabilities, timezone, formId, eventTitle`.

### Gaps (needed for production use)

| Param | In schema? | In MCP type? | In handler allow-list? | In GHL request type? | Action |
|---|---|---|---|---|---|
| `teamMembers` (owner) | No | Yes | Yes | Yes | add to **schema** only |
| `locationConfigurations` (root) | No | No | No | Yes | add to schema + type + handler |
| `openHours` | No | No | No | Yes | add to schema + type + handler |
| `availabilities` | No | No | No | No (create) | add to schema + type + handler + GHL req type |
| `eventType` | No | No | No | No | add everywhere |
| `slotInterval` / `slotIntervalUnit` | No | No | No | No | add everywhere |
| `slotBuffer` / `slotBufferUnit` | No | No | No | No | add everywhere |
| `timezone` | No | No | No | No | add everywhere |
| `formId` | No | No | No | No | add everywhere |
| `eventTitle` | No | No | No | No | add everywhere |

**Conclusion:** `create_calendar` needs changes in all three layers (type, schema, handler), plus a few fields added to `GHLCreateCalendarRequest`. The handler change is to add the new fields to the `calendarData` object (assigned from `params.X`; undefined when omitted, dropped by axios, so backward compatible).

---

## 2. `update_calendar`

- **Client** (`ghl-api-client.ts:1995`): `PUT /calendars/{id}` with `updates` body. Passes through.
- **Handler** (`calendar-tools.ts:1337-1356`): `const { calendarId, ...updateData } = params` then sends `updateData`. **Spread — no allow-list.** So any field present on the params object is forwarded.
- **Type** `MCPUpdateCalendarParams` (`ghl-types.ts:1374-1385`): `calendarId, name, description, groupId, teamMembers, slotDuration, autoConfirm, allowReschedule, allowCancellation, isActive`.
- **Schema** (`calendar-tools.ts:187`): exposes `calendarId, name, description, slotDuration, isActive, autoConfirm, allowReschedule, allowCancellation` (also missing `teamMembers`, `groupId`).
- **GHL request type** `GHLUpdateCalendarRequest` (`ghl-types.ts:1224-1238`): has `teamMembers, locationConfigurations, openHours, availabilities` plus basics. Missing: `eventType, slotInterval/Unit, slotBuffer/Unit, timezone, formId, eventTitle, slug`.

### Gaps

Same target field set as create. Because the handler spreads, **only the schema and `MCPUpdateCalendarParams` type need the additions** (plus a few fields on `GHLUpdateCalendarRequest` for type-correctness). No handler change.

---

## 3. `create_calendar_group`

- **Schema** (`calendar-tools.ts:569`): `name, description, slug, isActive` (name/description/slug required).
- **Handler** (`calendar-tools.ts:1651-1675`): forwards `locationId, name, description, slug` only. **Drops `isActive`** even though the schema accepts it.
- **Verdict:** sufficient to create the `Body Intelligence Institute` container (name/description/slug). Minor gap: `isActive` not forwarded; GHL group API also supports `calendarIds`. **Not required for BII** (calendars reference `groupId` at their own create time). Optional one-line handler fix if we want `isActive` honored; otherwise leave as-is. **Out of minimum scope.**

---

## 4. `create_calendar_notifications`

- **Schema** (`calendar-tools.ts:973`): `calendarId` + `notifications[]` with `receiverType` (contact/guest/assignedUser/emails), `channel` (email/inApp), `notificationType` (booked/confirmation/cancellation/reminder/followup/reschedule), `subject`, `body`, `templateId`, `isActive`.
- **Handler** (`calendar-tools.ts:2117`): forwards `calendarId` + `notifications` to the client.
- **Verdict:** **complete. No extension needed.** Covers the booked/confirmation/reminder defaults the calendar plan calls for.

---

## 5. Payment products (the wildcard)

Payment product tools **exist** in the fork. Not UI-only.

| Tool | Current params | Notable gaps vs GHL API |
|---|---|---|
| `ghl_create_product` | `name, productType (DIGITAL/PHYSICAL/SERVICE/PHYSICAL-DIGITAL), description, image, slug, availableInStore, locationId` | no `medias`, `statementDescriptor`, taxes/`isTaxesEnabled`, SEO. Fine for a basic SERVICE product. |
| `ghl_create_price` | `productId, name, type (one_time/recurring), currency, amount (cents), compareAtPrice, locationId` | **recurring config is thin**: `type` can be `recurring` but there are no `interval`, `intervalCount`, `trialPeriod`, `setupFee`, or `totalCycles` params. So subscription/installment pricing cannot be fully expressed. One-time pricing is fully covered. |
| `ghl_list_products` / `ghl_get_product` / `ghl_update_product` / `ghl_delete_product` / `ghl_bulk_edit_products` | present | adequate for read/manage |

Two findings to flag for the payment task (not this one):
1. **Recurring/installment price config is not exposed.** If BII programs (3-Series, 10-Series) bill as subscriptions or installments rather than a single charge, `ghl_create_price` needs extending with the recurring sub-object. If they are one-time charges, current tools suffice.
2. **Calendar-to-product payment linkage is not exposed by the calendar tools.** GHL calendars carry payment settings (`isLivePaymentMode` was visible in the live data), but neither `create_calendar` nor `update_calendar` exposes payment/deposit/product config. Per the calendar plan, pricing is "handled at the payment product level, not on the calendar," so this is likely intentional and out of scope, but worth confirming when the payment flow is designed.

**Recommendation:** keep payment products **out of this calendar-wrapper extension**. Resolve the recurring-price question in the dedicated payment-products task once the BII pricing model (one-time vs recurring) is decided.

---

## 6. Proposed Phase B scope (minimum, for your approval)

Extend **`create_calendar`** and **`update_calendar`** only. Add these optional passthrough params to both (type + schema; handler allow-list for create; handler already spreads for update):

`teamMembers`, `locationConfigurations`, `eventType`, `slotInterval`, `slotIntervalUnit`, `slotBuffer`, `slotBufferUnit`, `openHours`, `availabilities`, `timezone`, `formId`, `eventTitle`.

Supporting work:
- Add the missing fields (`eventType, slotInterval, slotIntervalUnit, slotBuffer, slotBufferUnit, timezone, formId, eventTitle, availabilities`) to `GHLCreateCalendarRequest`; add the same plus `slug` to `GHLUpdateCalendarRequest` where absent.
- Reuse existing nested types (`GHLTeamMember`, `GHLLocationConfiguration`, `GHLOpenHour`, `GHLAvailability`); no new nested types required.
- Update the tool description on both tools so introspection surfaces the new capability.
- `tsc --noEmit` and `npm run build` clean.

Out of scope (minimum-scope discipline): `create_calendar_group` (`isActive` forward), payment product tools, any update/delete/list improvements, notifications (already complete).

### Handler-change note (differs from commit 5597aa3)

The custom-field extension needed no handler change because that handler spread params. **`create_calendar` does not spread — it whitelists** — so this extension *does* require editing the handler's `calendarData` object. `update_calendar` does spread, so it does not. This is the one structural difference from the field-extension pattern, and the pattern to follow for any future whitelist-style handler.

---

## 7. Stop

Phase A complete. **No writes, no code changes.** Awaiting your confirmation of the Phase B scope above before implementing.
