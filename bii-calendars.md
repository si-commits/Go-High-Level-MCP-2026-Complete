# BII Calendar Surface — Provisioning Result

Date: 2026-06-11. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox`.
Status: **COMPLETE — calendar group, three payment products, two calendars, and six notifications provisioned and verified.**

This documents the full Body Intelligence Institute booking surface: the calendar group, the three session products customers pay for, the two session calendars (in-person live, virtual dormant), and the notification records on each. All IDs are live GHL-assigned values, read back from the API after creation.

## Calendar group

| field | value |
|---|---|
| **id** | `aVucRq17JSzOnUSPAuDW` |
| **name** | Body Intelligence Institute |
| **slug** | `body-intelligence-institute` |
| **description** | BII calendars: In-Person Sessions and Virtual Sessions (Lo Roxburgh / Body Intelligence Institute). |
| **isActive** | `true` |
| **created (dateAdded)** | 2026-06-11T01:34:00.788Z |

Both calendars below reference this group via `groupId`.

## Payment products

Three standalone products, each a one-time `SERVICE` with a single price. All three are published to the store (`availableInStore: true`). Amounts are US dollars; GHL stores price `amount` in cents internally.

| product | product ID | price ID | amount | price type | product type | in store |
|---|---|---|---|---|---|---|
| BII Single Session | `6a2a1445af2123a4da1d1342` | `6a2a144998a72beae5312211` | $1,950 | one-time (`one_time`) | SERVICE | yes |
| BII 3-Series | `6a2a145899eef43fed863e66` | `6a2a145c570ad31ff330bd78` | $5,200 | one-time (`one_time`) | SERVICE | yes |
| BII 10-Series | `6a2a1469fc5f50dbbcfd51e7` | `6a2a146d62197960060cf464` | $15,900 | one-time (`one_time`) | SERVICE | yes |

Descriptions (as stored):

- **BII Single Session:** One private session at the Body Intelligence Institute. Hands-on, one-to-one work on how you move, breathe, and carry tension. Book a single session to feel the work before committing to a series.
- **BII 3-Series:** Three private sessions at the Body Intelligence Institute. For people who want to build on the work session over session, not just dip in once. Sessions scheduled to suit you.
- **BII 10-Series:** Ten private sessions at the Body Intelligence Institute. The full course of work, for people committed to real, lasting change in how the body moves, breathes, and recovers. Best value per session.

## Calendar 1 — In-Person Sessions (LIVE)

**Calendar ID:** `9czE4WeZ4QbbDIHFxlOP` · group `aVucRq17JSzOnUSPAuDW` · location `1W01uH5EthLl1oJRj8Xq`

| field | value |
|---|---|
| name | BII - In-Person Sessions |
| description | Private 90-minute somatic bodywork sessions with Lo at the Body Intelligence Institute, Santa Barbara. |
| calendarType | personal |
| eventType | `RoundRobin_OptimizeForAvailability` |
| eventTitle | `{{contact.name}} — BII Private Session` |
| eventColor | `#039BE5` |
| slotDuration | 90 mins |
| slotInterval | 30 mins |
| slotBuffer | 30 mins (post-appointment) |
| preBuffer | 0 mins |
| appointmentPerSlot | 1 |
| autoConfirm | `true` |
| allowReschedule | `false` |
| allowCancellation | `false` |
| openHours | `{}` |
| availabilities | `[]` |
| guestType | collect_detail |
| isActive | `true` |
| owner (teamMembers) | Jenna, userId `UIChIX3a0wWAs7vdhdfM`, isPrimary `true`, priority `0.5` |
| meeting location | team-member-scoped `locationConfigurations`: `"Body Intelligence Institute, Santa Barbara — exact address shared via email after booking is confirmed"`, kind `custom` (placeholder address by design; exact address sent on confirmation) |

The 90-minute slot with a 30-minute post-buffer and a 30-minute slot interval is the agreed in-person pattern: each session occupies 90 minutes, the next bookable start is offset by the 30-minute interval, and the 30-minute buffer protects turnaround between clients.

## Calendar 2 — Virtual Sessions (DORMANT)

**Calendar ID:** `JzlzhxG86qNPAsiELNV2` · group `aVucRq17JSzOnUSPAuDW` · location `1W01uH5EthLl1oJRj8Xq`

| field | value |
|---|---|
| name | BII - Virtual Sessions |
| description | Virtual somatic coaching sessions with Lo (currently dormant — virtual program returns later). |
| calendarType | personal |
| eventType | `RoundRobin_OptimizeForAvailability` |
| eventTitle | `{{contact.name}} — BII Virtual Session` |
| eventColor | `#039BE5` |
| slotDuration | 90 mins |
| slotInterval | 30 mins |
| slotBuffer | 0 mins (no buffer) |
| preBuffer | 0 mins |
| appointmentPerSlot | 1 |
| autoConfirm | `true` |
| allowReschedule | `false` |
| allowCancellation | `false` |
| openHours | `{}` (empty — dormant) |
| availabilities | `[]` (empty — dormant) |
| guestType | collect_detail |
| isActive | `true` |
| owner (teamMembers) | Jenna, userId `UIChIX3a0wWAs7vdhdfM`, isPrimary `true`, priority `0.5` |
| meeting location | team-member-scoped `locationConfigurations`: `"Virtual session — meeting link will be shared via email"`, kind `custom` |

**Dormant by design:** the calendar has no `openHours` and no `availabilities`, so it surfaces no bookable slots. The structure (owner, products association path, notifications) is fully in place. When the virtual program returns, the only change required is to populate availability; notifications then fire automatically with no further build pass.

## Notifications

### Six user-created records (three per calendar)

Created this round via `create_calendar_notifications`, each read back via `get_calendar_notifications` and confirmed exact.

**In-Person `9czE4WeZ4QbbDIHFxlOP`:**

| # | notification ID | receiverType | notificationType | channel | timing | isActive |
|---|---|---|---|---|---|---|
| 1 | `6a2a2a39b72e8439ef2e4512` | contact | booked | email | immediate (no timing) | `true` |
| 2 | `6a2a2a39b72e84c1892e4513` | contact | reminder | email | `beforeTime: [{7, days}, {24, hours}]` | `true` |
| 3 | `6a2a2a39b72e84a40f2e4514` | assignedUser | booked | email | immediate (no timing) | `true` |

**Virtual `JzlzhxG86qNPAsiELNV2`:**

| # | notification ID | receiverType | notificationType | channel | timing | isActive |
|---|---|---|---|---|---|---|
| 1 | `6a2a2a3ecd470245aeab4011` | contact | booked | email | immediate (no timing) | `true` |
| 2 | `6a2a2a3ecd4702a840ab4012` | contact | reminder | email | `beforeTime: [{7, days}, {24, hours}]` | `true` |
| 3 | `6a2a2a3ecd47024a3aab4013` | assignedUser | booked | email | immediate (no timing) | `true` |

Reminder `beforeTime` read back with both elements in exact order on both calendars: `[{ timeOffset: 7, unit: "days" }, { timeOffset: 24, unit: "hours" }]`. Order preserved, no normalisation.

### Pre-existing inApp notifications (left in place — intentional)

Each calendar also carries **two `inApp` notifications that were NOT created in this round.** They were auto-created by GHL default behaviour during calendar provisioning (the prior phase). They are documented here so a future reader knows they exist and that leaving them is a deliberate decision, not a missed cleanup.

| calendar | notification ID | receiverType | notificationType | channel |
|---|---|---|---|---|
| In-Person `9czE4WeZ4QbbDIHFxlOP` | `6a2a175ffd6d71392aaa9982` | assignedUser | booked | inApp |
| In-Person `9czE4WeZ4QbbDIHFxlOP` | `6a2a175ffd6d712834aa9981` | assignedUser | confirmation | inApp |
| Virtual `JzlzhxG86qNPAsiELNV2` | `6a2a1be3942c37e6a6fa9160` | assignedUser | booked | inApp |
| Virtual `JzlzhxG86qNPAsiELNV2` | `6a2a1be3942c37f47afa915f` | assignedUser | confirmation | inApp |

**Why left in place:** they are functionally additive (in-app alerts to Jenna, alongside the email notifications we configured) and carry zero operational downside. Deleting GHL-default records risks side effects we cannot predict for no gain. Source: GHL default behaviour on calendar provisioning. Each `get_calendar_notifications` read therefore returns **5 records per calendar** (3 created here + 2 pre-existing), which is expected.

## Verification — 11 calendar wrapper params per calendar

The fork's `create_calendar` / `update_calendar` extension forwards 11 optional params. Both calendars read back with every one stored as sent. `formId` was intentionally not supplied on either calendar (booking uses the inline `collect_detail` guest flow, not an attached form).

| # | wrapper param | In-Person `9czE4WeZ4QbbDIHFxlOP` | Virtual `JzlzhxG86qNPAsiELNV2` |
|---|---|---|---|
| 1 | `teamMembers` | Jenna `UIChIX3a0wWAs7vdhdfM`, isPrimary true | Jenna `UIChIX3a0wWAs7vdhdfM`, isPrimary true |
| 2 | `locationConfigurations` (team-member-scoped) | "Body Intelligence Institute, Santa Barbara …" kind custom | "Virtual session — meeting link …" kind custom |
| 3 | `eventType` | `RoundRobin_OptimizeForAvailability` | `RoundRobin_OptimizeForAvailability` |
| 4 | `slotInterval` | 30 | 30 |
| 5 | `slotIntervalUnit` | mins | mins |
| 6 | `slotBuffer` | 30 | 0 |
| 7 | `slotBufferUnit` | mins | mins |
| 8 | `openHours` | `{}` | `{}` |
| 9 | `availabilities` | `[]` | `[]` |
| 10 | `formId` | (not set) | (not set) |
| 11 | `eventTitle` | `{{contact.name}} — BII Private Session` | `{{contact.name}} — BII Virtual Session` |

This round's calendar fix also added `preBuffer` / `preBufferUnit` passthrough; both read back as `0` / `mins` on each calendar (no pre-appointment buffer configured).

All values above were taken from a live `get_calendar` read-back per calendar, not from the create response.

## Rollback

Exact MCP calls in reverse dependency order. All on location `1W01uH5EthLl1oJRj8Xq` via MCP `ghl-lorox`. Only run if intentionally tearing down the BII booking surface.

### 1. Delete the six user-created notifications

`delete_calendar_notification` requires the calendar ID and the notification ID.

```
delete_calendar_notification  calendarId=9czE4WeZ4QbbDIHFxlOP  notificationId=6a2a2a39b72e8439ef2e4512   # contact / booked
delete_calendar_notification  calendarId=9czE4WeZ4QbbDIHFxlOP  notificationId=6a2a2a39b72e84c1892e4513  # contact / reminder
delete_calendar_notification  calendarId=9czE4WeZ4QbbDIHFxlOP  notificationId=6a2a2a39b72e84a40f2e4514  # assignedUser / booked
delete_calendar_notification  calendarId=JzlzhxG86qNPAsiELNV2  notificationId=6a2a2a3ecd470245aeab4011  # contact / booked
delete_calendar_notification  calendarId=JzlzhxG86qNPAsiELNV2  notificationId=6a2a2a3ecd4702a840ab4012  # contact / reminder
delete_calendar_notification  calendarId=JzlzhxG86qNPAsiELNV2  notificationId=6a2a2a3ecd47024a3aab4013  # assignedUser / booked
```

The two pre-existing `inApp` notifications per calendar do **not** need explicit deletion here: they are children of their parent calendar and are removed when the calendar is deleted in step 2 (assumed from GHL's parent-child notification model; not destructively confirmed). If a calendar were ever kept while clearing notifications, those four IDs (listed in the pre-existing table above) would need separate deletes.

### 2. Delete both calendars

```
delete_calendar  calendarId=9czE4WeZ4QbbDIHFxlOP   # BII - In-Person Sessions
delete_calendar  calendarId=JzlzhxG86qNPAsiELNV2   # BII - Virtual Sessions
```

### 3. Delete the three products (removes their prices)

There is **no dedicated price-delete tool** on this connection (`ghl_create_price` and `ghl_list_prices` exist, but no `ghl_delete_price`). Deleting the product removes the product and its attached price together, so a single `ghl_delete_product` per product is the full teardown.

```
ghl_delete_product  productId=6a2a1445af2123a4da1d1342   # BII Single Session (price 6a2a144998a72beae5312211)
ghl_delete_product  productId=6a2a145899eef43fed863e66   # BII 3-Series      (price 6a2a145c570ad31ff330bd78)
ghl_delete_product  productId=6a2a1469fc5f50dbbcfd51e7   # BII 10-Series     (price 6a2a146d62197960060cf464)
```

### 4. Delete the calendar group

A delete tool exists on this connection: `delete_calendar_group`. Delete the group only after both calendars are removed (step 2), so it is not deleting a non-empty group.

```
delete_calendar_group  groupId=aVucRq17JSzOnUSPAuDW   # Body Intelligence Institute
```

> Tool availability surfaced for this rollback: `delete_calendar_notification` (yes), `delete_calendar` (yes), `ghl_delete_product` (yes), `delete_calendar_group` (yes). No `ghl_delete_price` (product delete covers it).

## Follow-up tracker — next wrapper polish

- **Smoke-test `update_calendar_notification`.** Only the create path (`create_calendar_notifications`) was exercised this round. The update path is untested against live GHL; verify `beforeTime` / `afterTime` survive an update before relying on it.
- **`afterTime` / followup not yet exercised live.** This round provisioned only `booked` and `reminder` (`beforeTime`) types. The `followup` + `afterTime` path is schema-verified but has not been round-tripped against GHL.
- **`formId` passthrough unexercised.** Neither calendar set `formId`; the param is forwarded by the wrapper but has not been confirmed to persist on a live calendar.
- **Pre-existing inApp notification model unconfirmed.** The assumption that deleting a calendar cascades its `inApp` notifications (rollback step 1 note) was not destructively tested. Confirm if a low-risk way appears.
