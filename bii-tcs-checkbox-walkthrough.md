# BII T&Cs Acceptance Checkbox: Shared Booking Form Walkthrough

Adds a required Terms & Conditions acceptance checkbox to both BII calendar booking
forms, by building one shared booking form and attaching it to both calendars. A
client cannot complete a booking without ticking it.

## Why a shared form (Option B)

Both BII calendars currently use GHL's default booking form, which has no required
T&Cs field. Rather than repurpose the per-calendar consent checkbox (which cannot
reliably carry a clickable link and whose required-enforcement is unverifiable, see
`tcs-checkbox-diagnosis.md`), we build one custom form with an explicit required
Terms checkbox and attach it to both calendars. One form, so a future edit to the
terms language is a single change that propagates to both.

## What you are building

1. One form: `BII - Booking Form` (standard contact fields + a required T&Cs
   checkbox).
2. That form attached to both calendars:
   - In-Person `9czE4WeZ4QbbDIHFxlOP`
   - Virtual `JzlzhxG86qNPAsiELNV2`

The terms URL `https://laurenroxburgh.com/terms-conditions` is a placeholder: the
T&Cs page is Phase 1 task 8 and is not built yet. The checkbox is fully functional
now; the link will 404 until that page exists. That is expected during testing.

---

# Part 1: Build the shared booking form

## Navigate to a new form

1. In the GHL left sidebar, click "Sites".
2. Click the "Forms" tab.
3. Click the "Builder" sub-tab.
4. Click "+ Add Form" (or "Create New Form"). A blank form builder opens.

## Name the form

1. Click the form name field at the top of the builder.
2. Type exactly: `BII - Booking Form`

## Add the fields, in this order

The first four are standard fields, from the builder's standard / contact group
(select them, do not create new custom fields):

1. First Name. Label: `First Name`. Required: ON.
2. Last Name. Label: `Last Name`. Required: ON.
3. Email. Label: `Email`. Required: ON.
4. Phone. Label: `Phone`. Required: ON.

## Add the Terms & Conditions checkbox (field 5)

Try these in order; stop at the first that works in your builder.

**Best, if available: a dedicated "Terms and Conditions" element.** If the form
builder's element list has a "Terms and Conditions" (or "Terms") element, use it:
enter the acceptance text and the URL `https://laurenroxburgh.com/terms-conditions`,
and set Required ON. This element renders a clickable link natively.

**Primary: a Checkbox with an inline link in its label.** Add a Checkbox field and
set its label to (markdown link syntax):

```
I have read and agree to the [Terms & Conditions](https://laurenroxburgh.com/terms-conditions)
```

Set Required: ON. If the builder renders "Terms & Conditions" as a clickable link,
this is done.

**Fallback, if the inline link shows as literal text instead of a link:** use a
text-element + checkbox combo.

1. Add a Text element above the checkbox with the line:
   `Please read our Terms & Conditions before booking.` and make the words
   "Terms & Conditions" a clickable hyperlink to
   `https://laurenroxburgh.com/terms-conditions` (select the words, use the link
   tool in the text editor).
2. Add a Checkbox field below it with the plain label:
   `I have read and agree to the Terms & Conditions`
3. Set the checkbox Required: ON.

Either way, the checkbox must be **Required**, so a booking cannot be submitted
without it ticked.

## Save, publish, and capture the form ID

1. Click Save (top right).
2. The form is live once saved. Open the "Integrate Form" / share option and note
   the **form ID** (it appears in the share link). Write it down: it is needed to
   attach the form to the calendars in Part 2.

| item | value |
|---|---|
| Form name | BII - Booking Form |
| Form ID | _fill in_ |

---

# Part 2: Attach the form to both calendars

Pick one path. Option 2a (MCP) is recommended; 2b (UI) is the no-dependency
fallback.

## Option 2a (recommended): attach via MCP

Once the form ID is known, the form is attached to each calendar by setting the
calendar's `formId`. This is two `update_calendar` calls:

```
update_calendar  calendarId=9czE4WeZ4QbbDIHFxlOP  formId=<BII - Booking Form ID>
update_calendar  calendarId=JzlzhxG86qNPAsiELNV2  formId=<BII - Booking Form ID>
```

Why this is safe: `update_calendar` merges (it does not blank omitted fields). This
was verified directly during the calendar wrapper smoke tests (formId persisted
through an unrelated update, and a minimal-body update preserved all other config),
so sending only `{ calendarId, formId }` changes only the booking form and leaves
team members, availability, notifications, and everything else intact.

To run this path: hand the form ID to CC and the two calls are run and committed,
or run the equivalent `update_calendar` MCP calls directly. After attaching,
proceed to Verification.

## Option 2b (fallback): attach in the UI

For each calendar (In-Person `9czE4WeZ4QbbDIHFxlOP`, Virtual
`JzlzhxG86qNPAsiELNV2`):

1. Go to the calendar settings: Calendars, then edit the calendar.
2. Open the "Forms" tab (in some GHL versions "Forms & Payment").
3. In the form selector, change it from "Default Form" to `BII - Booking Form`.
4. Save.

---

# Verification (after both calendars are wired)

For each calendar (do this for In-Person, then Virtual):

1. Open the calendar's public booking link in a private browser window.
2. Confirm the booking form shows the standard fields (First Name, Last Name,
   Email, Phone) **plus** the T&Cs checkbox.
3. Confirm the "Terms & Conditions" text is a clickable link. It will 404 until the
   T&Cs page (Phase 1 task 8) is built: that is expected, the link target just does
   not exist yet.
4. Attempt to book **without** ticking the checkbox. Confirm GHL **rejects** the
   submission (the form should block and flag the required checkbox). This is the
   core test: no acceptance, no booking.
5. Tick the checkbox and complete a test booking. Confirm it succeeds.
6. In GHL, open the resulting test contact. Confirm the booking went through, and
   check whether the T&Cs acceptance was recorded anywhere (at minimum it appears in
   the form submission record for the booking). Delete the test booking and contact
   afterward so they do not pollute real data.

If the booking form still shows the old default fields with no checkbox, the form
did not attach: re-check the `formId` (2a) or that "BII - Booking Form" is selected
in the calendar's Forms tab (2b).

# Notes

- **The terms link 404s until Phase 1 task 8** builds the actual T&Cs page. The
  checkbox and the required-enforcement work regardless; only the link target is
  pending. Expected, not a defect.
- **Acceptance timestamp is out of scope here.** GHL does not stamp a datetime when
  a checkbox is ticked. If Lo later wants an explicit "T&Cs accepted at" record, that
  is a small workflow (on booking, set the already-provisioned `bii_tcs_accepted_at`
  field, `ZAn6aTP7fW6UX3FYvwu3`, to now). Not built in this task.
- **Future terms-language edits are a single edit** to `BII - Booking Form`, which
  propagates to both calendars because they share the one form.

# Rollback

To remove the T&Cs requirement:

- Revert each calendar's `formId` back to empty / the Default Form. Via MCP:
  `update_calendar calendarId=<id> formId=""` for each. Via UI: each calendar's
  Forms tab, select "Default Form".
- Optionally delete the `BII - Booking Form` (Sites then Forms then the form's
  three-dot menu then Delete). Deleting the form does not affect contacts or
  bookings already taken.

Reverting the calendars to the Default Form restores the original booking
experience (standard fields, the old consent checkbox) with no T&Cs requirement.
