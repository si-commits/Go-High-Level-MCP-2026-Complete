# BII Intake Submitted Workflow: GHL UI Walkthrough

One small workflow, built by hand in the GoHighLevel UI. It fires when a client
submits the BII Client Intake survey: it stamps the submission date on the contact
and alerts Lo to read the answers before the session.

## Why this is manual

Workflow construction is UI-only on this connection (the MCP lists workflows but
the builder tools need an unconfigured workflow-builder auth). This doc is the
script.

## What it does

When a contact submits the `BII - Client Intake` survey:

1. stamps `bii_intake_submitted_at` on the contact with the submission date,
2. emails Lo an internal alert so she can read the intake before the session.

## Pre-flight checklist

1. **Survey exists:** `BII - Client Intake` (`JbumriuUbRYTa3EVEjmy`).
2. **Field exists:** `bii_intake_submitted_at` (DATE, `MqkmwfNRLlrFG4rOtZiI`), in
   the Body Intelligence Institute custom field folder.
3. **Lo's email:** `loroxburgh@gmail.com` (Lo is a custom email recipient here, not
   a team-member pick).

## Navigate to a new workflow

1. In the GHL left sidebar, click "Automation".
2. Click "Workflows".
3. Click "+ Create Workflow".
4. Choose "Start from Scratch". The workflow builder opens.

## Name the workflow

1. Click the workflow name at the top left and type exactly: `BII - Intake Submitted`
2. For reference: fires on the BII Client Intake survey submission, stamps the
   intake date, and alerts Lo.

## Add the trigger

1. Click "Add New Workflow Trigger".
2. Choose "Survey Submitted".
3. Add the filter "Survey is" and select `BII - Client Intake`.
4. Save the trigger.

## Action 1: Update Contact Field, bii_intake_submitted_at = now

1. Click the "+" below the trigger, choose "Update Contact Field".
2. Field: `Intake Submitted At` (`bii_intake_submitted_at`).
3. Value: set it to the current date, using the same "current date" / now option
   you used on the BII - Payment Received workflow for `bii_tcs_accepted_at` (the
   date value has a current-date option, or a 0-day relative date).
4. Save.

## Action 2: Internal Notification to Lo

1. Click the "+" below Action 1, choose "Send Internal Notification".
2. Channel: "Email".
3. Recipient type: custom email address (Lo is set as a custom recipient, not a
   user pick).
4. Recipient: `loroxburgh@gmail.com`
5. From Name: `Lo Rox` (or the account default). From Email: account default.
6. Subject: `Intake submitted: {{contact.name}}`
7. Body: switch the body editor to code/source view if it has one, paste this HTML:

```html
<p>Intake form submitted.</p>
<p>Client: {{contact.name}}<br>
Email: {{contact.email}}</p>
<p>Open the contact in GHL to read the intake answers before the session.</p>
```

8. Switch back to the normal view and confirm it renders as formatted text.
9. Save.

## Save and publish

1. Click Save (top right).
2. Toggle from Draft to Publish. Confirm it reads Published.
3. **Capture the workflow id** (it appears in the workflow URL and the workflow
   list) and record it:

| item | value |
|---|---|
| Workflow name | BII - Intake Submitted |
| Workflow id | _fill in_ |

## Verification (after publishing)

1. Submit the `BII - Client Intake` survey using a test email that matches an
   existing contact (ideally one with an upcoming booking).
2. In GHL, confirm the workflow shows a run for that submission.
3. Confirm Lo's alert arrives at `loroxburgh@gmail.com`, with the client name and
   email rendered.
4. Open the contact and confirm `bii_intake_submitted_at` is populated with today's
   date.

The Session line was deliberately left out of the body, because
`{{appointment.start_time}}` is not expected to resolve on a Survey Submitted
trigger (the survey submission carries no appointment context). The closing line
("before the session") carries the intent without a merge token. No action needed
here unless a future requirement wants the session time, which would need the
appointment loaded by a different trigger or a lookup step.

## Rollback

- Take the workflow offline: open it in Automation then Workflows, toggle Publish
  back to Draft (a draft workflow does not fire).
- Delete it entirely via its three-dot menu then Delete. Deleting the workflow does
  not touch the survey, the field, or any contacts it already processed.

## Downstream dependencies

- This workflow only stamps the date and alerts Lo; it does not change tags or the
  contact lifecycle. The intake answers themselves are written to the contact by the
  survey, not by this workflow.
- It is independent of the BII - Payment Received workflow. A client receives the
  intake link from Payment Received (Template #11), fills the survey, and this
  workflow then stamps the submission and alerts Lo. The two are sequential in the
  client experience but separate workflows.
