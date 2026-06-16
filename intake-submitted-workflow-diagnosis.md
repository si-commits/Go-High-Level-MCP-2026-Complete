# BII Intake Submitted Workflow: Phase A Diagnosis (read-only)

Date: 2026-06-16. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox`.
Evidence is **API-confirmed** (this session) or **product behavior** (GHL
workflow-builder behavior; the builder is UI-only on this connection, so trigger
and merge-token specifics are stated from product behavior and flagged where they
must be confirmed at the test).

## 1. Survey Submitted trigger (product behavior)

GHL workflows have a **"Survey Submitted"** trigger, filterable by a specific
survey ("Survey is" = the survey), mirroring the Form Submitted pattern used in the
application workflows. It runs in the **contact context** of the person who
submitted, so `{{contact.*}}` merge tokens (name, email, custom fields) are
available to the actions. Building it is a UI task (the builder is UI-only here).

## 2. No workflow naming conflict (API-confirmed)

`ghl_list_workflows` returned 53 workflows; **none is named `BII - Intake
Submitted`**. The BII workflows that exist: `BII - Application Submitted -
In-Person`, `BII - Application Submitted - Virtual`, and `BII - Payment Received`
(`bbdab6e9-82d6-4b71-9232-6ff2bf09d081`, published, built by Si since the last
task). Clear to create.

## 3. Survey confirmed (API-confirmed)

`ghl_get_surveys` returned exactly one survey:
`JbumriuUbRYTa3EVEjmy` = **BII - Client Intake**. This is the survey to filter the
trigger on, matching the provisioning record. (The single-survey route
`ghl_get_survey` is IAM-blocked on this connection, but the list route confirms
the id and name.)

## 4. The timestamp field exists (API-confirmed earlier)

`bii_intake_submitted_at` (DATE, id `MqkmwfNRLlrFG4rOtZiI`) is in the BII custom
field folder (`bii-intake-fields.md` and the field inventory). It is available to
the workflow's Update Contact Field action. (Note: this is a stamp field, not a
survey content field, so the survey does not write it; the workflow does.)

## 5. Setting the date to "now"

Reuse the mechanism Si proved on the BII - Payment Received workflow: GHL's Update
Contact Field action on a DATE field supports setting the **current date / now**
(the date value has a "current date" option, or a 0-day relative date). Same
approach here for `bii_intake_submitted_at`. Stamps the submission date on run.

## 6. KEY UNKNOWN: does `{{appointment.start_time}}` resolve on this trigger?

**Reasoned conclusion: very likely NO.** The Survey Submitted trigger runs in the
contact context, not an appointment context. A survey submission is not tied to a
specific appointment, so the workflow has no appointment loaded into
`{{appointment.*}}`. Unlike the Payment Received workflow (whose order/booking
trigger carries appointment context), a survey submission carries only the contact.
Even if the contact has an upcoming booking, GHL does not auto-populate
`{{appointment.*}}` for a survey-triggered workflow. So `{{appointment.start_time}}`
will most likely render empty or as a literal token.

This cannot be confirmed without building and testing (the builder is UI-only), but
the product behavior is clear enough to plan around it.

**Recommendation:** drop the "Session" line from the internal notification body. The
clean body becomes:

```html
<p>Intake form submitted.</p>
<p>Client: {{contact.name}}<br>
Email: {{contact.email}}</p>
<p>Open the contact in GHL to read the intake answers before the session.</p>
```

If you would rather keep the Session line and confirm empirically, the walkthrough
can include it with a flag to remove it at the test if it renders empty. But the
expected outcome is that it does not resolve, so dropping it up front is the cleaner
default. The closing line already says "before the session", which carries the
intent without depending on a merge token.

## Net for Phase B

- Trigger: **Survey Submitted, filter Survey is `BII - Client Intake`
  (`JbumriuUbRYTa3EVEjmy`)**, single trigger.
- Action 1: Update Contact Field `bii_intake_submitted_at` = current date (now).
- Action 2: Internal Notification to Lo (`loroxburgh@gmail.com`, custom email,
  Aya and Jenna not needed), subject `Intake submitted: {{contact.name}}`, body as
  above (Session line dropped, pending your call), inline HTML.
- One thing to confirm at the test: the `{{appointment.start_time}}` decision (the
  recommended body avoids it entirely).

Recommend writing the walkthrough with the Session line dropped. Confirm and I will
proceed to Phase B.
