# BII Calendars — Plan (no writes)

Date: 2026-06-10. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox` (extended fork).
This is a **planning document only. No calendars, event types, availability, or any writes were made.** Stopping for review before provisioning.

---

## 0. Headline findings (read these first)

1. **"Lo" is not a GHL user on this location.** The owner of every existing bodywork calendar is userId `UIChIX3a0wWAs7vdhdfM` = **Jenna Mather-Frueh** (`clients@laurenroxburgh.com`). There is no Lauren / Lo Roxburgh user account in the location's user list at all. So "Owner: Lo" needs a decision (use Jenna's user, or create a Lo user seat first). See open questions.
2. **A GHL "calendar" IS the bookable event type.** There is no separate event-type object nested inside a calendar. Each calendar has exactly one `slotDuration`. Calendar **groups** are optional containers (none exist today). Consequence: "one event type with adjustable duration" is **not natively supported**; different durations mean different calendars.
3. **The fork's `create_calendar` / `update_calendar` wrappers are thin.** They do NOT expose owner/team members, location, availability (openHours), timezone, eventType, slotInterval, booking form, or notifications-inline. A calendar created with the current wrapper would have **no owner and no location**, which is not a usable personal booking calendar. **To provision production-ready calendars via MCP, the wrapper must be extended first** (same pattern as the custom-fields extension, commit `5597aa3`). Alternative: build in the GHL UI. This is the central decision for order-of-operations.
4. **Overlap with existing calendars.** There are already 5 "Lo Rox Private Bodywork" booking calendars (Palm Beach, VIP Miami, Virtual, Montecito, Miami). The proposed **BII In-Person (Santa Barbara)** overlaps with the existing **Montecito** calendar (Montecito adjoins Santa Barbara; that calendar is live and has had real bookings), and **BII Virtual** overlaps with the existing **Lo Rox Private Bodywork – Virtual**. Decide: net-new BII calendars, or repurpose/rename the existing ones. See open questions.
5. **Dormant is achievable natively.** A calendar with `isActive: true` and **no availability** (no openHours, no date-specific availabilities) is visible but has zero bookable slots. Going live = add openHours (one setting flip). This is the cleanest "dormant" model and needs no special flag.

---

## 1. Diagnosis — existing calendars

`get_calendars` returned **6 calendars**, all `calendarType: "personal"`, all owned by Jenna's user (`UIChIX3a0wWAs7vdhdfM`), all `isActive: true`. No calendar groups exist (`get_calendar_groups` = 0).

| Calendar | ID | Duration | Location (meetingLocation) | Availability | BII-related? |
|---|---|---|---|---|---|
| Lo Rox Private Bodywork – Palm Beach | `8sKoGE3YOlh8UIiCCqBm` | 90 min | Palm Beach, FL | 1 date-specific day (Nov 14 2025) | Bodywork (precursor) |
| ⭐️ Lo Rox VIP Private Bodywork (Miami) | `998m9QYPzCDjZeiMJ3FD` | 90 min | The Well Gallery, Miami FL | 1 date-specific day (Nov 17 2025) | Bodywork (precursor) |
| Lo Rox Private Bodywork – Virtual | `iKfoiHPUXVEKJmbF2qow` | 90 min | "Virtual - Google Meet" | 1 date-specific day (Nov 20 2025) | **Overlaps proposed BII Virtual** |
| Lo Rox Private Bodywork – Montecito | `kmjFO2xGqm1mg25IgxVx` | 90 min | Montecito, CA (sessions at The Garden Cottage, 1033 Monte Cristo Lane) | 1 date-specific day (Nov 20 2025); has real past bookings | **Overlaps proposed BII In-Person (Santa Barbara)** |
| Lo Rox Private Bodywork – Miami | `shvAPWiCQKEt6fhBoE7G` | 90 min | The Well Gallery, Miami FL | 1 date-specific day (Nov 17 2025) | Bodywork (precursor) |
| Jenna Mather-Frueh's Personal Calendar | `u8qHoPYutvsclXL5sgeC` | 30 min | (none) | **Weekly openHours, Mon-Fri 08:00-17:00** | Internal / not BII |

Observations:
- The bodywork calendars use **date-specific `availabilities`** (one-off pop-up days), not recurring weekly hours. They read as pop-up booking events rather than ongoing availability.
- Jenna's personal calendar is the only one using **recurring weekly `openHours`** (Mon-Fri 08:00-17:00) — the pattern an ongoing BII calendar would follow.
- All bodywork calendars: `autoConfirm: true`, `allowReschedule: false`, `allowCancellation: false`, `eventTitle: "{{contact.name}} & {{location.name}} Private Bodywork Session"`, `formId: ""` (default booking form), and `formSubmitType: RedirectURL` pointing to an external intake (laurenroxburgh.com or a Typeform).
- **Naming conflict check:** no existing calendar is named "BII - In-Person Sessions" or "BII - Virtual Sessions". No exact conflict. The overlap above is conceptual, not a name collision.

---

## 2. Diagnosis — GHL calendar data model on this MCP

### Tool surface (verified via introspection)

| Need | Tool | Notes |
|---|---|---|
| List calendars | `get_calendars` | optional `groupId`, `showDrafted` |
| Get one calendar (full config) | `get_calendar` | returns the full object incl. teamMembers, openHours, availabilities, slotDuration |
| Create calendar | `create_calendar` | **thin** — see gaps below |
| Update calendar | `update_calendar` | **thin** — name, description, slotDuration, isActive, autoConfirm, allowReschedule, allowCancellation only |
| Calendar groups | `get_calendar_groups`, `create_calendar_group` | containers; none exist today |
| Notifications | `create_calendar_notifications` / `get_calendar_notifications` | separate call after calendar exists; channels email/inApp; types booked/confirmation/cancellation/reminder/followup/reschedule; receivers contact/guest/assignedUser/emails |
| User availability schedules | `official_calendars_createschedule`, `official_calendars_getallschedules` | user-level schedules (GET requires userId) |
| Block / free slots | `create_block_slot`, `get_free_slots`, `get_blocked_slots` | |
| Read events (for Notion sync) | `get_calendar_events` | by calendarId/groupId/userId + start/end |
| Appointment detail | `get_appointment`, `create_appointment`, `update_appointment` | |
| Resolve users | `official_users_get_user_by_location` | (`get_users` needs companyId and errored) |

### Calendar vs event type
On GHL, the **calendar is the bookable unit**. `calendarType` enum: `personal`, `event`, `round_robin`, `class_booking`, `collective`, `service_booking`. The existing bookable calendars are `personal` with internal `eventType: "RoundRobin_OptimizeForAvailability"` and a single team member. There is no separate "service/event type" record to create inside a calendar.

### Duration
**Per-calendar**, via `slotDuration` + `slotDurationUnit` (mins/hours), plus `slotInterval` (start-time granularity). There is no per-booking duration choice. To offer 90 and 120 minutes you need **two calendars**, or change a single calendar's `slotDuration`.

### Availability
Two native mechanisms on the calendar object:
- `openHours`: recurring weekly windows (`daysOfTheWeek` + `hours`) — used by Jenna's calendar.
- `availabilities`: date-specific overrides (a specific date + hours) — used by the pop-up bodywork calendars.
Plus user-level `schedules` via the official tools. **Neither `create_calendar` nor `update_calendar` exposes any of these**, so availability cannot be set through the current wrappers (needs the extended wrapper, the official schedule tools, or the GHL UI).

### Booking-form custom-field linkage
A calendar references a booking form via `formId` (a separate GHL **Form** object). The default form collects name/email/phone. To capture `bii_*` custom fields at booking, you would build a GHL Form containing those fields and set `formId` on the calendar. **Recommendation: keep the booking form minimal** (default name/email/phone) and populate `bii_*` fields via the application form, intake form, and post-booking automation. The booking step should be low-friction; the application/intake forms already collect the BII data. (The current `create_calendar` wrapper does not expose `formId` anyway.)

### Contact linkage
Bookings match an existing contact by email or create a new contact, and the appointment is tied to a `contactId`. Settings `stickyContact`, `shouldAssignContactToTeamMember`, `shouldSkipAssigningContactForExisting` control assignment. No manual linkage needed.

### Event metadata for the Notion sync (confirmed against real events)
`get_calendar_events` on the Montecito calendar returned real bookings. Each event carries:
`id` (appointment/event id), `calendarId`, `contactId`, `locationId`, `assignedUserId`, `startTime` and `endTime` (ISO 8601 **with the Pacific offset, e.g. `2025-11-20T10:15:00-08:00`**), `title`, `address` (the session location, populated on confirmed bookings), `appointmentStatus` (`confirmed` / `invalid` / etc.), `notes`/`description`, `isRecurring`, `createdBy.source` (e.g. `booking_widget`), `dateAdded`, `dateUpdated`, `deleted`.

That is enough to build a Notion **Session** row: start, end (with timezone already encoded), client (via `contactId` -> contact lookup for name/email), location (`address`), calendar (`calendarId`), event id (`id`), status, and owner (`assignedUserId`). The n8n layer would poll `get_calendar_events` per BII calendar over a rolling window, then resolve each `contactId` to a contact for the Notion Client link.

### Timezone
No per-calendar timezone is exposed by the wrappers; the calendar object in `get_calendars` did not surface an explicit timezone field (availability hours are local, and event times come back with the `-08:00` Pacific offset). Target is `America/Los_Angeles`. Setting/confirming timezone will require the extended wrapper or the GHL UI.

---

## 3. Proposed configuration

### Calendar 1 — BII In-Person Sessions (production)

| Setting | Proposed value | Notes |
|---|---|---|
| Name | `BII - In-Person Sessions` | Confirm, or align to existing style as `BII – In-Person (Santa Barbara)`. Your call. |
| calendarType | `personal` | Matches existing bodywork calendars (single owner, round-robin-optimize). |
| Owner (teamMembers) | **Jenna `UIChIX3a0wWAs7vdhdfM`** (recommended, matches all existing) OR a new Lo user | Decision needed — see Q1. |
| Timezone | `America/Los_Angeles` | |
| Location | Physical address of the Institute (Santa Barbara) | **Placeholder — you provide.** Set as `locationConfigurations.kind = custom`. Note overlap with existing Montecito address. |
| Duration / event types | **One event type, `slotDuration: 120` mins** (option a) | Recommended. In-person is where Lo wants more time; per-calendar duration means one 120-min calendar is simplest. Reject (b) two calendars (splits availability, more to manage) unless a 90-min in-person is genuinely offered; reject (c) adjustable (not natively supported). |
| slotInterval | `120` (back-to-back) or `30` (finer start times) | Propose 120 to avoid overlap; 30 if Lo wants flexible start times within a window. |
| Availability | **Blank in this plan** — Lo's weekly hours to be provided | Will be set as recurring `openHours` (Jenna-calendar pattern). |
| Booking form | Minimal default (name/email/phone) | Rely on application + intake forms + post-booking automation for `bii_*`. |
| Confirmation/notifications | `autoConfirm: true`; `allowReschedule: true`; `allowCancellation: false` | Propose reschedule on (reduces no-shows), cancellation off (high-value sessions, manual handling). Notifications: to **contact** — booked + confirmation + reminder (email); to **assignedUser** — booked. Adjustable. |
| Status | `isActive: true` | |

### Calendar 2 — BII Virtual Sessions (dormant)

| Setting | Proposed value | Notes |
|---|---|---|
| Name | `BII - Virtual Sessions` | Confirm or counter. |
| calendarType | `personal` | Same as in-person. |
| Owner | Same decision as Calendar 1 | |
| Timezone | `America/Los_Angeles` | |
| Location | Virtual meeting URL approach | **TBD — you decide** (Zoom personal link, GHL-native video, Google Meet). The existing virtual calendar used "Virtual - Google Meet". |
| Duration | **One event type, `slotDuration: 90` mins** | Matches the existing virtual session (90-min). |
| Availability | **Explicitly empty** (no openHours, no availabilities) | This is what makes it dormant. |
| Booking form | Minimal default | Same approach as in-person. |
| Confirmation/notifications | Same defaults as in-person | Configured now so going live is a pure availability flip. |
| Status | **`isActive: true` with empty availability** (recommended) | Visible but unbookable; going live = add openHours (one flip). Alternative: `isActive: false` (draft, fully hidden) — cleaner "off" but requires two flips to launch (activate + add hours). GHL has no dedicated "dormant" flag; the empty-availability approach is the closest to "settings flip not a build." |

---

## 4. Open questions for you (needed before any write)

1. **Owner.** "Lo" has no GHL user account on this location. Use **Jenna's user** (`UIChIX3a0wWAs7vdhdfM`, recommended, matches every existing calendar) as the BII calendar owner, or create a dedicated Lo user seat first? If the latter, I need Lo's name/email to invite.
2. **Net-new vs repurpose.** The existing **Montecito** calendar (`kmjFO2xGqm1mg25IgxVx`, live, has real bookings) and **Virtual** calendar (`iKfoiHPUXVEKJmbF2qow`) overlap with the two proposed BII calendars. Do we create fresh BII calendars, or repurpose/rename the existing ones? (Repurposing preserves history and existing booking links but mixes old bodywork branding with BII.)
3. **In-person physical address** of the Body Intelligence Institute (Santa Barbara). You said you'll provide. Is it the existing Montecito "Garden Cottage" address or a new Santa Barbara location?
4. **Virtual meeting approach** — Zoom personal link, GHL-native video, or Google Meet (existing used Google Meet)?
5. **Lo's availability windows** (days + hours, Pacific) for the in-person calendar — you'll provide after talking to her.
6. **Duration model** — confirm option (a): in-person = single 120-min calendar, virtual = single 90-min calendar. (My recommendation; your call.)
7. **slotInterval** for in-person — 120 (back-to-back) or 30 (flexible start times)?
8. **Reschedule/cancellation policy** — confirm reschedule on, cancellation off (or set your preference).
9. **Provisioning path** — extend the fork's calendar wrapper (Path A, repeatable via MCP) or build in the GHL UI (Path B, faster one-time). See order of operations.
10. **Dormant model for virtual** — confirm `isActive: true` + empty availability (one-flip launch), or `isActive: false` draft.

---

## 5. Order of operations (once decisions are locked)

The current `create_calendar` wrapper cannot set owner, location, availability, or timezone, so a usable calendar cannot be fully provisioned through it today. Two paths:

### Path A — extend the fork wrapper, then provision via MCP (recommended for repeatability)

**Step 0 (prerequisite build, mirrors commit `5597aa3`):** extend `create_calendar` (and `update_calendar`) to forward to GHL's `POST /calendars/` the fields the API already supports but the wrapper hides: `teamMembers` (with `userId` + `locationConfigurations`), `eventType`, `slotInterval`, `openHours`, `timezone`, `formId`, `eventTitle`. Rebuild (`npm run build`), restart the MCP, verify the new params appear in the tool schema. Then:

1. **(Optional) `create_calendar_group`** — name `Body Intelligence Institute` -> capture `groupId`. Groups keep the two BII calendars together in the UI. *(Dependency: must exist before calendars if we want them grouped at create time.)*
2. **`create_calendar`** (In-Person) — name, `calendarType: personal`, `slotDuration: 120`, `slotInterval`, `groupId`, owner `teamMembers`, `locationConfigurations` (physical address), `timezone: America/Los_Angeles`, `autoConfirm: true`, `allowReschedule: true`, `allowCancellation: false`, `openHours` (Lo's hours), `isActive: true` -> capture `calendarId` (In-Person). *(Dependency: needs owner decided + address + Lo's hours.)*
3. **`create_calendar`** (Virtual) — same but `slotDuration: 90`, virtual `locationConfigurations`, **no `openHours`** (dormant), `isActive: true` -> capture `calendarId` (Virtual).
4. **`create_calendar_notifications`** for each calendar — booked + confirmation + reminder to contact (email), booked to assignedUser. *(Dependency: calendar must exist first.)*
5. **Verify** — `get_calendar` on each id; confirm owner, location, duration, timezone, openHours (in-person populated; virtual empty), isActive. Then `get_calendars` to confirm both present and grouped. Reviewer agent confirms config matches this plan.

### Path B — build in the GHL UI, verify via MCP (faster one-time)

1. In GHL: Settings -> Calendars -> create group `Body Intelligence Institute`.
2. Create the In-Person calendar per the Calendar 1 table (owner, address, 120-min, Lo's hours, notifications, active).
3. Create the Virtual calendar per Calendar 2 (owner, virtual location, 90-min, **no availability**, notifications, active).
4. Verify via MCP: `get_calendars` and `get_calendar` to confirm IDs and config; record IDs for the Notion sync layer.

**Recommendation:** Path A if we want calendars to be reproducible/versioned and to keep extending the fork as the single provisioning surface (consistent with the custom-fields work). Path B if this is a one-and-done setup and Lo/Jenna are comfortable in the UI. Either way, the **two calendar IDs** are the handoff artifact the n8n Notion sync needs.

---

## 6. Dependencies summary

- Calendar group (if used) -> before calendars (for `groupId`).
- Owner decision + physical address + Lo's hours -> before In-Person calendar create.
- Virtual meeting approach -> before Virtual calendar create.
- Calendar exists -> before notifications and before any availability/event reads.
- Wrapper extension (Path A) -> before any MCP calendar create that needs owner/location/availability.

**Nothing has been created. Awaiting your decisions on the open questions before any provisioning.**
