# BII Email Templates — Phase B Drafts

Date: 2026-06-11. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox`.
Status: **DRAFT for review. Nothing written to GHL yet.**

Nine templates. Eight in Lo's voice, one (#6) internal operational. Body is HTML (`isPlainText: false`). Subjects are recommended values carried here; they are applied at point-of-use (notification `subject` field, workflow Send Email action, or Jenna's manual send), since GHL templates store no subject.

**Voice rules applied:** somatic and body-first, calm, direct, short sentences, US spelling, no em dashes, no forbidden words (embody, transform, optimize, journey, align, unlock, empower, wellness-as-noun). Lo signs `Lo x`. Jenna signs `Warmly, Jenna` / `Jenna, Lo Rox Coach`.

**Merge fields:** standard GHL syntax. `{{contact.first_name}}`, `{{contact.name}}`, `{{contact.email}}` are confirmed-standard. `{{appointment.start_time}}` and `{{appointment.title}}` are the appointment tokens for calendar-fired emails; exact appointment/custom-field tokens to be confirmed at wiring (per Phase A diagnosis).

**Placeholders that need real values before go-live** (full list at the bottom):
- `[what to wear — confirm with Jenna]` (templates #2, #8)
- `[exact studio address — confirm with Jenna]` (template #8)
- `[BOOKING LINK]`, `[INTAKE FORM LINK]`, `[T&CS LINK]` (links)
- Optional personal-line and protocol placeholders (#2, #9)

---

## 1. BII - Application Received

- **Sender / trigger:** System, automated. Fires on application form submission.
- **Voice:** Lo.
- **Recommended subject:** We've got your application

```html
<p>Hi {{contact.first_name}},</p>
<p>Your application landed. Thank you for taking the time.</p>
<p>Lo reads every application personally. You'll hear back within 2 to 3 business days.</p>
<p>Nothing you need to do for now. Just breathe and carry on with your day.</p>
<p>Lo x</p>
```

- **Merge fields:** `{{contact.first_name}}`
- **Usage notes:** Automated acknowledgment. Turnaround phrased exactly as "2 to 3 business days" per the locked decision. No links, no action required from the applicant.

---

## 2. BII - Approval

- **Sender / trigger:** Jenna, sent manually (or via workflow) after Lo approves. The booking-link email.
- **Voice:** Lo's voice, Jenna signs.
- **Recommended subject:** You're in. Let's book your first session

```html
<p>Hi {{contact.first_name}},</p>
<p>Thank you for applying to work with Lauren in person.</p>
<p>Lo has read your application and we'd love to have you in.</p>
<p>[Optional personal line from Jenna, specific to the application. Fill in or delete.]</p>
<p>Here is everything you need to book your first session.</p>
<p><strong>Where</strong><br>
Sessions are held at the Body Intelligence Institute in Santa Barbara. The exact address is shared by email once your booking is confirmed.</p>
<p><strong>What to wear</strong><br>
[what to wear — confirm with Jenna]</p>
<p><strong>What to expect</strong><br>
Ninety minutes, one-to-one with Lo. Hands-on work with how you move, breathe, and carry tension. You don't need any experience. Come as you are.</p>
<p><strong>What to bring</strong><br>
Just yourself. Everything else is provided.</p>
<p><strong>Investment</strong><br>
Single session: $1,950<br>
Three-session series: $5,200<br>
Ten-session series: $15,900</p>
<p>When you're ready, <a href="[BOOKING LINK]">book your first session here</a>.</p>
<p>Any questions, just reply to this email.</p>
<p>Warmly,<br>
Jenna<br>
Lo Rox Coach</p>
```

- **Merge fields:** `{{contact.first_name}}`
- **Usage notes:** Built from the structure in the Phase B brief (greeting, approval framing, personal hook, where, what to wear, what to expect, what to bring, investment, booking link, sign-off). The earlier verbatim chat draft was not in this session's context, so please confirm this matches your intent. Two placeholders need filling: the optional personal line, and the wear text. `[BOOKING LINK]` is the in-person calendar's scheduling link.

---

## 3. BII - Decline

- **Sender / trigger:** Jenna, sent after Lo declines.
- **Voice:** Lo's voice, Jenna signs. Warm, brief, no specifics on why. Door left open without false hope.
- **Recommended subject:** About your application

```html
<p>Hi {{contact.first_name}},</p>
<p>Thank you for your application, and for the care you put into it.</p>
<p>After reading it, Lo isn't able to take you on at this time. This isn't a no forever, and it isn't about anything you did. It comes down to fit and timing right now.</p>
<p>You're welcome to apply again down the line.</p>
<p>Wishing you well.</p>
<p>Warmly,<br>
Jenna<br>
Lo Rox Coach</p>
```

- **Merge fields:** `{{contact.first_name}}`
- **Usage notes:** Subject is deliberately neutral so the outcome is not telegraphed before opening. No reason given. Leaves a genuine door open without promising anything.

---

## 4. BII - Waitlist

- **Sender / trigger:** Jenna, sent when Lo says maybe-later.
- **Voice:** Lo's voice, Jenna signs. Honest: real yes, no current capacity.
- **Recommended subject:** You're on the list

```html
<p>Hi {{contact.first_name}},</p>
<p>Lo read your application and would love to work with you.</p>
<p>Right now there is no open capacity. So you're on the list, and we'll be in touch the moment a space opens up.</p>
<p>This is a real yes, just not a yet. Thank you for your patience.</p>
<p>Warmly,<br>
Jenna<br>
Lo Rox Coach</p>
```

- **Merge fields:** `{{contact.first_name}}`
- **Usage notes:** Honest framing, no false timeline. "A real yes, just not a yet" carries the intent without over-promising a date.

---

## 5. BII - Booking Confirmation

- **Sender / trigger:** System, calendar-fired to the contact on booking + payment complete.
- **Voice:** Lo. Receipt-style but warm.
- **Recommended subject:** Your session is booked

```html
<p>Hi {{contact.first_name}},</p>
<p>You're booked. Here are the details.</p>
<p><strong>When</strong><br>
{{appointment.start_time}}</p>
<p><strong>Payment</strong><br>
Received, thank you.</p>
<p><strong>Next</strong><br>
Please fill in <a href="[INTAKE FORM LINK]">your intake form</a> before your session. It takes a few minutes and helps Lo prepare for your body specifically.</p>
<p>The exact address arrives in your reminder, 24 hours before we meet.</p>
<p>By booking, you've agreed to our <a href="[T&CS LINK]">terms and conditions</a>.</p>
<p>See you soon.</p>
<p>Lo x</p>
```

- **Merge fields:** `{{contact.first_name}}`, `{{appointment.start_time}}`
- **Usage notes:** Per the locked decision, this copy is pasted into the calendar notification `body` field (contact / booked) on both calendars, not wired via `templateId`. References intake form and T&Cs links, and sets the expectation that the address comes in the 24-hour reminder.

---

## 6. BII - Booking Notification (Jenna)

- **Sender / trigger:** System, calendar-fired to Jenna as assignedUser on booking + payment.
- **Voice:** INTERNAL operational. Not Lo's voice. Plain, factual, short.
- **Recommended subject:** New BII booking: {{contact.name}}

```html
<p>New booking.</p>
<p>Client: {{contact.name}}<br>
Email: {{contact.email}}<br>
Session: {{appointment.start_time}}<br>
Calendar: {{appointment.title}}</p>
<p>Payment received. Intake form sent to client.</p>
```

- **Merge fields:** `{{contact.name}}`, `{{contact.email}}`, `{{appointment.start_time}}`, `{{appointment.title}}`
- **Usage notes:** The one template intentionally outside Lo's voice. No sign-off. Pasted into the calendar notification `body` field (assignedUser / booked) on both calendars.

---

## 7. BII - Reminder 7-day

- **Sender / trigger:** System, calendar-fired 7 days before the session.
- **Voice:** Lo. Warm anticipation, no logistics.
- **Recommended subject:** One week until your session

```html
<p>Hi {{contact.first_name}},</p>
<p>One week from now, you'll be on the table with Lo.</p>
<p>Nothing to prepare. Nothing to read. Just keep living your week, and let your body know rest is coming.</p>
<p>The full details, address and all, land in your inbox the day before.</p>
<p>Lo x</p>
```

- **Merge fields:** `{{contact.first_name}}`
- **Usage notes:** Deliberately holds back logistics (those are in the 24-hour). Pasted into the calendar notification `body` field (contact / reminder, the 7-day element). Note: both 7-day and 24-hour reminders live on the same `reminder` notification record (`beforeTime: [{7, days}, {24, hours}]`), which fires one body for both offsets. See the open wiring question at the bottom.

---

## 8. BII - Reminder 24-hour

- **Sender / trigger:** System, calendar-fired 24 hours before the session. The logistics email, most concrete.
- **Voice:** Lo. Calm, concrete.
- **Recommended subject:** Tomorrow: everything you need

```html
<p>Hi {{contact.first_name}},</p>
<p>Your session with Lo is tomorrow, {{appointment.start_time}}.</p>
<p>Here is everything you need.</p>
<p><strong>Where</strong><br>
[exact studio address — confirm with Jenna]</p>
<p><strong>What to wear</strong><br>
[what to wear — confirm with Jenna]</p>
<p><strong>What to bring</strong><br>
Just yourself. Water if you like. Everything else is here.</p>
<p><strong>What to expect</strong><br>
Ninety minutes, one-to-one. Hands-on work with how you move and breathe. Come a few minutes early so you can settle before we start. [eating guidance - confirm with Lo]</p>
<p>For day-of issues, reach Jenna at [Jenna's phone - confirm if including].</p>
<p>If anything changes on your end, reply to this email and let us know.</p>
<p>See you tomorrow.</p>
<p>Lo x</p>
```

- **Merge fields:** `{{contact.first_name}}`, `{{appointment.start_time}}`
- **Usage notes:** This is where the real studio address is revealed. The address and wear text are both placeholders to confirm with Jenna before go-live. See the 7-day vs 24-hour shared-record note in #7.

---

## 9. BII - Post-Session Follow-up

- **Sender / trigger:** Jenna, manual send or automation after the session.
- **Voice:** Lo's voice, Jenna signs. Open-ended warmth. Does not push a sale. Leaves space for a protocol.
- **Recommended subject:** After your session

```html
<p>Hi {{contact.first_name}},</p>
<p>It was good to have you in the studio.</p>
<p>Over the next few days, notice how your body feels. Sometimes the work keeps settling in long after you leave the table. Drink water, move gently, rest when you can.</p>
<p>[Optional: Lo's notes or a simple protocol for this client go here. Delete if none.]</p>
<p>If anything comes up, or you would like to book your next session, just reply.</p>
<p>Take care of yourself.</p>
<p>Warmly,<br>
Jenna<br>
Lo Rox Coach</p>
```

- **Merge fields:** `{{contact.first_name}}`
- **Usage notes:** Next-session mention is soft and reply-based, no link or CTA, so it does not push a sale. The protocol placeholder is optional per client.

---

## Self-check: voice compliance (pre-review)

| # | template | voice | forbidden words | em dashes | US spelling | sign-off |
|---|---|---|---|---|---|---|
| 1 | Application Received | Lo | none | none | yes | Lo x |
| 2 | Approval | Lo / Jenna sends | none | none | yes | Warmly, Jenna / Lo Rox Coach |
| 3 | Decline | Lo / Jenna sends | none | none | yes | Warmly, Jenna / Lo Rox Coach |
| 4 | Waitlist | Lo / Jenna sends | none | none | yes | Warmly, Jenna / Lo Rox Coach |
| 5 | Booking Confirmation | Lo | none | none | yes | Lo x |
| 6 | Booking Notification (Jenna) | internal (by design) | none | none | yes | none (internal) |
| 7 | Reminder 7-day | Lo | none | none | yes | Lo x |
| 8 | Reminder 24-hour | Lo | none | none | yes | Lo x |
| 9 | Post-Session Follow-up | Lo / Jenna sends | none | none | yes | Warmly, Jenna / Lo Rox Coach |

A dedicated voice-compliance review pass is planned before Phase C provisioning, per the task's reviewer requirement.

## Placeholders to resolve before go-live

| placeholder | appears in | needs |
|---|---|---|
| `[what to wear — confirm with Jenna]` | #2, #8 | The women's / men's wear text from saved copy. |
| `[exact studio address — confirm with Jenna]` | #8 | The real Santa Barbara studio address (revealed in the 24-hour reminder). |
| `[BOOKING LINK]` | #2 | In-person calendar scheduling link. |
| `[INTAKE FORM LINK]` | #5 | BII intake form URL. |
| `[T&CS LINK]` | #5 | Terms and conditions URL. |
| `[Optional personal line ...]` | #2 | Jenna fills per applicant, or deletes. |
| `[Optional: Lo's notes or a simple protocol ...]` | #9 | Per-client protocol, or delete. |

## Open question for Phase C/D wiring (calendar reminders)

The 7-day (#7) and 24-hour (#8) reminders are written as two separate emails, but on the calendars they live on a **single `reminder` notification record** with `beforeTime: [{7, days}, {24, hours}]`. That one record fires **one body** at both offsets. To deliver distinct 7-day and 24-hour copy, the options are:

1. Split into **two reminder notification records** per calendar, one with `beforeTime: [{7, days}]` carrying #7, the other with `beforeTime: [{24, hours}]` carrying #8.
2. Keep one record and use a single combined reminder body (loses the deliberate hold-back-logistics design).

Recommend option 1. This is a small change to the existing notification records, to settle during Phase C/D wiring. Flagging now so the copy design and the notification structure stay consistent.
