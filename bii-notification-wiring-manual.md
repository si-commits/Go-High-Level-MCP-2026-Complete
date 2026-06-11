# BII Notification Body Wiring: GHL UI Walkthrough

This is a step-by-step configuration script for setting the email bodies on the
BII calendar notifications, done by hand in the GoHighLevel UI. Follow it in
order. You do not need any other file open: every email body you need to paste is
included inline below.

## Why this is manual

GHL's public API cannot write a notification body on this API version. The
underlying PUT endpoint is non-functional (it returns a `422` regardless of the
payload and partially mutates state on error), and there is no API path that
hard-deletes and cleanly recreates a notification either. Both limitations were
established by diagnostic probes. The working path is to paste the bodies in the
GHL UI, which uses GHL's internal endpoints and is not subject to the public-API
limitation. Diagnostic detail, if you want it, is in
`notification-update-wrapper-extension.md` (the dead PUT) and
`notification-hard-delete-probe.md` (no hard-delete, soft-cascade on calendar
delete).

## What is being wired

Six email notifications across two BII calendars, sourced from three provisioned
email templates:

| Calendar | Notification | Recipient | Template body |
|---|---|---|---|
| BII - In-Person Sessions | Appointment Booked (Email) | Contact | #5 Booking Confirmation |
| BII - In-Person Sessions | Appointment Booked (Email) | Assigned User | #6 Booking Notification (Jenna) |
| BII - In-Person Sessions | Reminder (Email) | Contact | #8 Reminder 24-hour |
| BII - Virtual Sessions | Appointment Booked (Email) | Contact | #5 Booking Confirmation |
| BII - Virtual Sessions | Appointment Booked (Email) | Assigned User | #6 Booking Notification (Jenna) |
| BII - Virtual Sessions | Reminder (Email) | Contact | #8 Reminder 24-hour |

Calendar IDs (for reference, you navigate by name in the UI):
In-Person `9czE4WeZ4QbbDIHFxlOP`, Virtual `JzlzhxG86qNPAsiELNV2`.

## Time expectation

About 15 minutes, including the visual verification at the end. The In-Person
calendar is the live one and is the priority. The Virtual calendar is dormant
(no availability set), so its notifications will not fire until availability is
added later, but wire it now so it is ready.

## Before going live (placeholders to fill first)

The three bodies below still contain unfilled placeholders in square brackets.
They are safe to paste now (no real booking will fire yet), but every one of
these must be replaced with a real value in the GHL body editor before any real
client books. Fill them directly in each notification's body field as you paste,
or paste now and come back. Either way, none of these can still say "[...]" when
the calendar goes live.

Placeholders inside the bodies wired by this walkthrough:

| placeholder | appears in | who confirms | needs |
|---|---|---|---|
| `[INTAKE FORM LINK]` | #5 (Contact booked) | Jenna | BII intake form URL |
| `[T&CS LINK]` | #5 (Contact booked) | Jenna | terms and conditions URL |
| `[exact studio address: confirm with Jenna]` | #8 (Contact reminder) | Jenna | real Santa Barbara studio address |
| `[what to wear: confirm with Jenna]` | #8 (Contact reminder) | Jenna | the wear text |
| `[eating guidance - confirm with Lo]` | #8 (Contact reminder) | Lo | eating guidance line, or remove |
| `[Jenna's phone - confirm if including]` | #8 (Contact reminder) | Jenna | day-of contact number, or remove the sentence |

Other BII templates carry their own placeholders (`[BOOKING LINK]` in #2 Approval,
the optional personal line in #2, the optional protocol line in #9 Follow-up).
Those templates are sent by Jenna or by workflow, not through these calendar
notifications, so they are out of scope for this walkthrough and are filled when
those templates are wired to their own sends.

## A note on pasting HTML

Each body below is HTML. The GHL notification body field is a rich-text editor.
If it shows a source or code view toggle (an icon like `</>` or `{ }`), click it
to switch to HTML view before pasting, then switch back so the text shows as
formatted paragraphs rather than visible tags. If there is no code view, paste
the HTML as-is; GHL notification bodies accept HTML and will render it. If what
you see after pasting looks like literal `<p>` tags as text, you pasted into the
visual view: undo, switch to the code view, and paste again.

---

# In-Person calendar: BII - In-Person Sessions

## Navigate to the notifications

1. In the sub-account, click the Settings gear icon at the bottom of the left
   sidebar.
2. Click "Calendars" in the settings menu.
3. Open the "Calendar Settings" tab (the list of calendars).
4. Find the row named "BII - In-Person Sessions".
5. Click the edit icon (pencil) or the three-dot menu then Edit on that row.
6. In the calendar editor, open the "Notifications & policies" tab. In some GHL
   versions this tab is labeled "Notifications & Additional options".

You are now looking at the list of notification events for this calendar
(Appointment Booked, Confirmation, Reminder, Follow up, Cancellation, Reschedule
or similar).

## 1. Appointment Booked, Email to Contact (template #5)

1. Find the "Appointment Booked" notification.
2. Click its edit icon (pencil) to open it.
3. Select the "Email" tab inside the notification (not In-app, SMS, or WhatsApp).
4. Confirm the Email notification is toggled Enabled (on).
5. Find the email addressed to the Contact (the recipient selector should already
   show "Contact" from the API provisioning).
6. In the Subject field for this email, clear it and type: `Your session is booked`
7. Switch the body editor to its code/source view if it has one (see the pasting
   note above).
8. Clear the body field.
9. Paste this HTML into the body:

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

10. Switch the body editor back to the normal view and confirm it shows formatted
    paragraphs, not literal tags.
11. Click Save.

## 2. Appointment Booked, Email to Assigned User (template #6)

1. Stay in the "Appointment Booked" notification, "Email" tab.
2. Find the email addressed to the Assigned User. It may be a separate block below
   the Contact email, or a second recipient toggle within the same Email section.
   Its recipient should already show "Assigned User" from the API provisioning.
3. Confirm this Assigned User email is toggled Enabled (on).
4. In its Subject field, clear it and type: `New BII booking: {{contact.name}}`
5. Switch the body editor to its code/source view if it has one.
6. Clear the body field.
7. Paste this HTML into the body:

```html
<p>New booking.</p>
<p>Client: {{contact.name}}<br>
Email: {{contact.email}}<br>
Session: {{appointment.start_time}}<br>
Calendar: {{appointment.title}}</p>
<p>Payment received. Intake form sent to client.</p>
```

8. Switch the body editor back to the normal view and confirm it renders.
9. Click Save.

## 3. Reminder, Email to Contact (template #8)

The Reminder notification on this calendar was soft-deleted through the API
during earlier work, so it may not look like a normal active notification. It may
appear greyed out, toggled off, or with a restore or reactivate option. Handle it
with one of the two paths below, then do the common configuration that follows.

### Path A: reactivate the existing reminder (preferred, keeps the timing)

1. Locate the "Reminder" notification. If it shows as disabled, greyed out, or
   offers a "restore" or "reactivate" control, use that control to bring it back.
2. Confirm its trigger times still read "7 Days before" and "24 Hours before".
   If both are present, the timing is intact and you keep it.
3. Continue to "Common configuration" below.

### Path B: delete and recreate (only if Path A is not possible)

1. If the Reminder record is greyed out and cannot be edited or reactivated, use
   the UI delete control (trash icon) to remove it fully. The GHL UI may be able
   to hard-delete it where the API could not.
2. Click "Add Notification" (or the "+" to add a notification).
3. Set the notification type to "Reminder".
4. Select the "Email" tab and set the recipient to "Contact".
5. Set the trigger time to "7 Days before". Click "Add more" and add a second
   trigger time of "24 Hours before" so both are present.
6. Continue to "Common configuration" below.

### Common configuration (both paths)

1. Open the Reminder notification, "Email" tab, recipient "Contact".
2. Confirm it is toggled Enabled (on).
3. Confirm the trigger times show both "7 Days before" and "24 Hours before". If
   one is missing, click "Add more" to add it.
4. In the Subject field, clear it and type: `Your session with Lo`
5. Switch the body editor to its code/source view if it has one.
6. Clear the body field.
7. Paste this HTML into the body:

```html
<p>Hi {{contact.first_name}},</p>
<p>Your session with Lo: {{appointment.start_time}}.</p>
<p>Here is everything you need.</p>
<p><strong>Where</strong><br>
[exact studio address: confirm with Jenna]</p>
<p><strong>What to wear</strong><br>
[what to wear: confirm with Jenna]</p>
<p><strong>What to bring</strong><br>
Just yourself. Water if you like. Everything else is here.</p>
<p><strong>What to expect</strong><br>
Ninety minutes, one-to-one. Hands-on work with how you move and breathe. Come a few minutes early so you can settle before we start. [eating guidance - confirm with Lo]</p>
<p>For day-of issues, reach Jenna at [Jenna's phone - confirm if including].</p>
<p>If anything changes on your end, reply to this email and let us know.</p>
<p>See you soon.</p>
<p>Lo x</p>
```

8. Switch the body editor back to the normal view and confirm it renders.
9. Click Save.

Note on the single reminder record: this one Reminder fires the same body at both
the 7-day and the 24-hour mark. By design we use the 24-hour logistics copy (#8)
for both. The standalone 7-day template (#7, "One week until your session") is
not wired into this calendar; it stays in the template library for now. If you
later want distinct 7-day and 24-hour emails, that needs two separate Reminder
records, one per trigger time, which is a separate change.

## Confirm the other channels are untouched (In-Person)

For each of the three notifications you just edited (Appointment Booked, and
Reminder), glance at the In-app, SMS, and WhatsApp tabs inside that notification.
Confirm you did not change them: they should be on their GHL defaults (In-app
booked and confirmation are GHL defaults and stay as they are; SMS and WhatsApp
should be off or default). You only edited the Email tab. Do not toggle anything
on these other tabs.

---

# Virtual calendar: BII - Virtual Sessions

This calendar is dormant: it has no availability set, so its notifications will
not fire until availability is added. Wire it now anyway so it is ready when
Virtual launches. The content is identical to the In-Person calendar.

## Navigate to the notifications

1. Settings gear (bottom of the left sidebar) then "Calendars".
2. Open the "Calendar Settings" tab.
3. Find the row named "BII - Virtual Sessions".
4. Click the edit icon (pencil) or three-dot menu then Edit.
5. Open the "Notifications & policies" tab (may be "Notifications & Additional
   options").

## 1. Appointment Booked, Email to Contact (template #5)

1. Open the "Appointment Booked" notification, "Email" tab.
2. Confirm the Email notification is Enabled.
3. Find the email to the Contact (recipient should show "Contact").
4. Subject: clear it and type: `Your session is booked`
5. Switch the body editor to code/source view if it has one.
6. Clear the body field.
7. Paste this HTML into the body:

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

8. Switch back to the normal view and confirm it renders.
9. Click Save.

## 2. Appointment Booked, Email to Assigned User (template #6)

1. Stay in "Appointment Booked", "Email" tab.
2. Find the email to the Assigned User (recipient "Assigned User").
3. Confirm it is Enabled.
4. Subject: clear it and type: `New BII booking: {{contact.name}}`
5. Switch the body editor to code/source view if it has one.
6. Clear the body field.
7. Paste this HTML into the body:

```html
<p>New booking.</p>
<p>Client: {{contact.name}}<br>
Email: {{contact.email}}<br>
Session: {{appointment.start_time}}<br>
Calendar: {{appointment.title}}</p>
<p>Payment received. Intake form sent to client.</p>
```

8. Switch back to the normal view and confirm it renders.
9. Click Save.

## 3. Reminder, Email to Contact (template #8)

The Virtual calendar's Reminder was also soft-deleted via the API, so the same
two-path handling applies as on In-Person.

### Path A: reactivate the existing reminder (preferred)

1. Locate the "Reminder" notification. If greyed out or offering restore or
   reactivate, use that control.
2. Confirm its trigger times still read "7 Days before" and "24 Hours before".
3. Continue to "Common configuration" below.

### Path B: delete and recreate (only if Path A is not possible)

1. If it cannot be reactivated, delete it fully with the trash icon.
2. Click "Add Notification" then set the type to "Reminder".
3. Select "Email" and recipient "Contact".
4. Set trigger time "7 Days before", then "Add more" and add "24 Hours before".
5. Continue to "Common configuration" below.

### Common configuration (both paths)

1. Open the Reminder, "Email" tab, recipient "Contact".
2. Confirm it is Enabled.
3. Confirm both trigger times are present ("7 Days before", "24 Hours before");
   add the missing one with "Add more" if needed.
4. Subject: clear it and type: `Your session with Lo`
5. Switch the body editor to code/source view if it has one.
6. Clear the body field.
7. Paste this HTML into the body:

```html
<p>Hi {{contact.first_name}},</p>
<p>Your session with Lo: {{appointment.start_time}}.</p>
<p>Here is everything you need.</p>
<p><strong>Where</strong><br>
[exact studio address: confirm with Jenna]</p>
<p><strong>What to wear</strong><br>
[what to wear: confirm with Jenna]</p>
<p><strong>What to bring</strong><br>
Just yourself. Water if you like. Everything else is here.</p>
<p><strong>What to expect</strong><br>
Ninety minutes, one-to-one. Hands-on work with how you move and breathe. Come a few minutes early so you can settle before we start. [eating guidance - confirm with Lo]</p>
<p>For day-of issues, reach Jenna at [Jenna's phone - confirm if including].</p>
<p>If anything changes on your end, reply to this email and let us know.</p>
<p>See you soon.</p>
<p>Lo x</p>
```

8. Switch back to the normal view and confirm it renders.
9. Click Save.

## Confirm the other channels are untouched (Virtual)

Same as In-Person: for each edited notification, glance at the In-app, SMS, and
WhatsApp tabs and confirm you left them on their defaults. You only edited Email.

---

# Verification

The API cannot read back a notification body (it returns the record without the
body text, per `wrapper-polish-smoke.md`), so verification is visual in the UI.

1. Eyeball each of the six notifications you edited and confirm the body field
   contains the pasted copy, rendered as formatted paragraphs, not empty and not
   showing literal tags. This is the primary check.
2. If GHL offers a "Send test" or "Preview" control on the notification, use it to
   send yourself a test of each email and confirm the copy, the merge fields, and
   the formatting look right. Merge fields like `{{contact.first_name}}` and
   `{{appointment.start_time}}` only resolve in a real or test send, so a test
   send is the way to confirm they populate.
3. Confirm there are no leftover `[...]` placeholders in any body you intend to go
   live with (see the "Before going live" table). Placeholders are acceptable
   only while the calendar is not yet taking real bookings.

# Rollback

To undo a wiring on any notification:

1. Open the notification, Email tab, the recipient you edited.
2. Clear the Subject and the Body fields.
3. If you want it fully off, toggle the Email notification to Disabled (off).
4. Click Save.

A disabled notification with an empty body will not send. This returns the
notification to roughly the empty, provisioned state it was in before this
walkthrough. Note that clearing in the UI does not delete the underlying record;
that matches the known GHL behaviour (no hard-delete), and is fine.

# Where the templates live

The bodies above were copied from the nine BII email templates that live in GHL
under Marketing then Emails then Templates, each named with the `BII - ` prefix.
Those templates are the canonical copy library. If copy ever changes, edit the
template first, then copy the updated body back into the notification body fields
using this same UI flow (the templates and the notification bodies are separate
copies; editing a template does not change a notification that was already
pasted).

| # | Title | Template ID | Voice |
|---|---|---|---|
| 1 | BII - Application Received | `6a2a692855fd109fc761571e` | Lo |
| 2 | BII - Approval | `6a2a6947dbcd44d274ab77cf` | Lo, Jenna signs |
| 3 | BII - Decline | `6a2a69652b8acb9bf509ae75` | Lo, Jenna signs |
| 4 | BII - Waitlist | `6a2a69852b8acb9bf509af67` | Lo, Jenna signs |
| 5 | BII - Booking Confirmation | `6a2a69a355fd109fc7615e65` | Lo |
| 6 | BII - Booking Notification (Jenna) | `6a2a69bddbcd44d274ab7c87` | internal |
| 7 | BII - Reminder 7-day | `6a2a69d455fd109fc76160dc` | Lo |
| 8 | BII - Reminder 24-hour | `6a2a69f02b8acb9bf509b626` | Lo |
| 9 | BII - Post-Session Follow-up | `6a2a6a0a55fd109fc76163c6` | Lo, Jenna signs |

The three used in this walkthrough are #5 (Contact booked), #6 (Assigned User
booked), and #8 (Contact reminder). The HTML blocks in this doc are the live
versions as of 2026-06-12, including the edits applied to #8 (the "Your session
with Lo:" opening and the "See you soon" closing).

# If something does not match

If the GHL UI shows something different from what this walkthrough describes,
especially on the soft-deleted Reminder records (a state that is neither
reactivatable nor deletable, or trigger times that are missing or wrong), stop
and flag it rather than forcing it. We will adapt the walkthrough to whatever the
UI actually presents.
