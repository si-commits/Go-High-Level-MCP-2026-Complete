# Template #10: Draft (Internal Application Notification)

Date: 2026-06-15. Status: **DRAFT for review. Nothing written to GHL yet.**
Merge syntax confirmed standard in Phase A (`template-10-diagnosis.md`).

## Metadata

- **Internal name (proposed):** `BII - Internal Application Notification`
- **Recommended subject:** `New BII application: {{contact.first_name}} {{contact.last_name}}`
  - Alternative subject if a single full-name token is preferred (proven in #6):
    `New BII application: {{contact.name}}`
- **Voice:** operational, not Lo's voice. Same approach as #6 (BII - Booking
  Notification). Plain, factual, structured for fast reading. No sign-off.
- **isPlainText:** false (HTML body).
- **Trigger / use:** fired by the application-submission workflow, sent to Lo and
  Jenna so they can review an application without logging into GHL. Internal only,
  never client-facing.

## Body (HTML)

```html
<p>New application received.</p>
<p><strong>Contact</strong><br>
Name: {{contact.first_name}} {{contact.last_name}}<br>
Email: {{contact.email}}<br>
Phone: {{contact.phone}}<br>
Location: {{contact.bii_location}}</p>
<p><strong>Body State</strong><br>
{{contact.bii_body_state}}</p>
<p><strong>Hopes</strong><br>
{{contact.bii_hopes}}</p>
<p><strong>Why Now</strong><br>
{{contact.bii_why_now}}</p>
<p><strong>How Heard</strong><br>
{{contact.bii_how_heard}}</p>
<p><strong>Anything Else</strong><br>
{{contact.bii_anything_else}}</p>
<p><strong>Equipment Access</strong> (virtual applications only)<br>
{{contact.bii_equipment_access}}</p>
<p>Review and respond in GHL.</p>
```

## Field mapping

| section | token(s) | source field |
|---|---|---|
| Name | `{{contact.first_name}} {{contact.last_name}}` | standard |
| Email | `{{contact.email}}` | standard |
| Phone | `{{contact.phone}}` | standard |
| Location | `{{contact.bii_location}}` | Location (TEXT) |
| Body State | `{{contact.bii_body_state}}` | Body State (LARGE_TEXT) |
| Hopes | `{{contact.bii_hopes}}` | Hopes (LARGE_TEXT) |
| Why Now | `{{contact.bii_why_now}}` | Why Now (LARGE_TEXT) |
| How Heard | `{{contact.bii_how_heard}}` | How Heard (SINGLE_OPTIONS) |
| Anything Else | `{{contact.bii_anything_else}}` | Anything Else (LARGE_TEXT) |
| Equipment Access | `{{contact.bii_equipment_access}}` | Equipment Access (MULTIPLE_OPTIONS) |

## Design notes

- **Substance over polish:** the value here is the applicant's qualifying answers
  laid out for a 10-second scan. Bolded section labels, one answer per block, no
  preamble, no sign-off. This mirrors #6.
- **Empty fields render blank:** if a contact lacks a value (e.g. an in-person
  applicant has no Equipment Access, or no phone was collected), that line shows
  empty. That is acceptable for an internal triage email. The
  "(virtual applications only)" annotation on Equipment Access sets the
  expectation that it is blank for in-person applicants.
- **Only application-form answers are included.** Post-approval fields (Program
  Type, T&Cs Accepted At, Intake Submitted At, Studio Access Granted) are not on
  the application form and are deliberately left out.
- **Voice compliance:** no em dashes, no forbidden words (embody, transform,
  optimize, journey, align, unlock, empower, wellness-as-noun), US spelling.
  Internal, so no sign-off by design.
- **Merge fields will substitute at send,** not in a template preview (see the
  Phase A scope note). Confirm live substitution once when wiring the workflow.

## Open choices for your review

1. Subject: keep `{{contact.first_name}} {{contact.last_name}}` or switch to
   `{{contact.name}}`?
2. Keep Phone in the Contact block even though the application form may not
   collect it, or drop it?
3. Any reordering of the answer blocks (current order follows the suggested draft:
   Body State, Hopes, Why Now, How Heard, Anything Else, Equipment Access)?

Nothing is provisioned until you approve. On approval I will run Phase C
(`create_email_template` with the approved name and body, verify via previewUrl,
capture the template id) and Phase D (record the deliverable, single commit,
push).
