# Template #10: Provisioned (BII Internal Application Notification)

Date: 2026-06-15. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox`.
Status: **Provisioned to GHL and body-verified.** Phase 2 addition to the nine
BII templates in `email-templates-provisioned.md`.

## Metadata

| field | value |
|---|---|
| Template # | 10 |
| Template ID | `6a2f2e258addbb8d63588b7f` |
| Name | `BII - Internal Application Notification` |
| Recommended subject | `New BII application: {{contact.name}}` |
| Voice | internal / operational (not Lo's voice), no sign-off, like #6 |
| isPlainText | false |
| updatedBy | default (Jenna's user ID) |

Provisioned via `create_email_template` (two-step flow). Body verified by fetching
the rendered `previewUrl` and confirming the stored body matches the sent body
exactly, all twelve merge tokens intact, em-dash count 0.

## Use

Fired by the application-submission workflow, sent to Lo and Jenna so they can
review an application without logging into GHL. Internal only, never
client-facing. The substance is the applicant's qualifying answers laid out for a
fast scan. The Application Type line tells Lo at a glance whether to act now
(In-Person) or hold (Virtual, currently dormant).

## Final HTML body (as stored)

```html
<p>New application received.</p>
<p><strong>Contact</strong><br>
Name: {{contact.first_name}} {{contact.last_name}}<br>
Email: {{contact.email}}<br>
Phone: {{contact.phone}}<br>
Location: {{contact.bii_location}}<br>
Application Type: {{contact.bii_program_type}}</p>
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

## Merge tokens used (12) and their field sources

| # | token | source field | dataType |
|---|---|---|---|
| 1 | `{{contact.first_name}}` | standard | - |
| 2 | `{{contact.last_name}}` | standard | - |
| 3 | `{{contact.email}}` | standard | - |
| 4 | `{{contact.phone}}` | standard | - |
| 5 | `{{contact.bii_location}}` | Location | TEXT |
| 6 | `{{contact.bii_program_type}}` | Program Type | SINGLE_OPTIONS |
| 7 | `{{contact.bii_body_state}}` | Body State | LARGE_TEXT |
| 8 | `{{contact.bii_hopes}}` | Hopes | LARGE_TEXT |
| 9 | `{{contact.bii_why_now}}` | Why Now | LARGE_TEXT |
| 10 | `{{contact.bii_how_heard}}` | How Heard | SINGLE_OPTIONS |
| 11 | `{{contact.bii_anything_else}}` | Anything Else | LARGE_TEXT |
| 12 | `{{contact.bii_equipment_access}}` | Equipment Access | MULTIPLE_OPTIONS |

The subject token `{{contact.name}}` (standard full-name field) is the 13th token
overall; it lives on the subject line, set at point-of-use (workflow Send Email
action), not in the template body.

Merge syntax confirmed standard in Phase A (`template-10-diagnosis.md`): the
custom-field token is `{{ <fieldKey> }}` and the fieldKey already carries the
`contact.` prefix, so `{{contact.bii_*}}` is direct and correct.

## Downstream dependency (handoff to the forms walkthrough)

This template's Application Type line depends on the application forms setting
`bii_program_type` as a hidden default value on submit. The forms builds in the
upcoming forms walkthrough must do this:

- **In-Person application form** sets `bii_program_type: "TBD"` on submit. Lo
  refines to Single Session, 3-Series, or 10-Series at approval.
- **Virtual application form** sets `bii_program_type: "Virtual Program"` on
  submit. Signals a virtual applicant for the dormant queue.

Both values are already provisioned options on the Program Type field
(`bii-custom-fields.md` field #10: Single Session, 3-Series, 10-Series, Virtual
Program, Pop-Up, TBD). If a form does not set this hidden default, the Application
Type line renders empty and Lo loses the at-a-glance In-Person vs Virtual signal.

## Live-substitution caveat (verify at workflow-wiring time)

Phase A confirmed **verbatim persistence** of all tokens through the create flow
(GHL stores `{{contact.bii_*}}` exactly, no mangling). It did **not** confirm
**live substitution**, because a template `previewUrl` renders with no contact
context and shows tokens literally regardless of correctness.

Confirm substitution once when the template is wired to the application-submission
workflow: send one test application through the form (or fire the workflow against
a test contact with the `bii_*` fields populated), open the received email, and
confirm every token resolves to the real value, especially the custom fields and
the Application Type. Until that one end-to-end check is done, substitution is
expected-correct but not proven.
