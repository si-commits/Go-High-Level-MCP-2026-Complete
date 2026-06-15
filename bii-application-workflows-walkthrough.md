# BII Application Submitted Workflows: GHL UI Walkthrough

Two workflows, one per application form, built by hand in the GoHighLevel UI.
Each fires when its form is submitted, sets the applicant's program type, tags the
contact, sends the applicant an auto-reply, and notifies Lo and Jenna. Follow the
workflow you are building top to bottom. Everything you need to paste is inline.

## Why this is manual

Workflow construction is UI-only on this connection. The `ghl-lorox` MCP can list
workflows but the builder-level tools (full read, create, update actions, clone,
publish) require a workflow-builder auth that is not configured
(`Workflow builder not initialized`). So these are built in the GHL UI by hand.
This doc is the script.

## What these workflows do

When someone submits a BII application form, the matching workflow runs and:

1. stamps `bii_program_type` on the contact (`TBD` for In-Person, `Virtual
   Program` for Virtual), which routes them downstream and feeds the internal
   notification email's Application Type line,
2. tags the contact `bii:applicant` plus a permanent provenance tag
   (`bii:applied:in-person` or `bii:applied:virtual`) that records the original
   entry point and is never removed,
3. emails the applicant an auto-reply (template #1),
4. emails Lo and Jenna an internal notification with the application details
   (template #10).

## Two-workflow summary

| Workflow | Trigger (Form is) | Actions | Build time |
|---|---|---|---|
| BII - Application Submitted - In-Person | BII - Application - In-Person (`fkinw2HKhk3XnyidYw61`) | Update Field (TBD), Add Tag x2, Send Email, Internal Notification | ~15 min |
| BII - Application Submitted - Virtual | BII - Application - Virtual (`taGKzsQfC2uVwJpsfdpu`) | same shape, value `Virtual Program`, tag `bii:applied:virtual` | ~5 min if cloned |

## Pre-flight checklist (once, before building)

1. **Forms exist** (confirmed): `BII - Application - In-Person`
   (`fkinw2HKhk3XnyidYw61`) and `BII - Application - Virtual`
   (`taGKzsQfC2uVwJpsfdpu`).
2. **Email templates exist** (confirmed): `BII - Application Received`
   (template #1, id `6a2a692855fd109fc761571e`) and
   `BII - Internal Application Notification` (template #10, id
   `6a2f2e258addbb8d63588b7f`).
3. **Tags:** `bii:applicant` is already provisioned. The provenance tags
   `bii:applied:in-person` and `bii:applied:virtual` are not pre-provisioned; the
   Add Tag action creates a tag on the fly when you type a new one, so this is
   fine. Type them exactly, all lowercase.
4. **Lo and Jenna email addresses:** Lo `loroxburgh@gmail.com`, Jenna
   `clients@laurenroxburgh.com`.

A note on email subjects: GHL email templates store the body only, not a subject.
So the subject is typed into each email action, using the recommended values given
in the steps below.

---

# Workflow 1: BII - Application Submitted - In-Person

## Navigate to a new workflow

1. In the GHL left sidebar, click "Automation".
2. Click "Workflows".
3. Click "+ Create Workflow".
4. Choose "Start from Scratch". The workflow builder opens.

## Name the workflow

1. At the top left of the builder, click the workflow name (it defaults to
   something like "New Workflow").
2. Type the name exactly: `BII - Application Submitted - In-Person`
3. For reference (internal description, kept in your head; GHL identifies the
   workflow by name): fires on the In-Person application form, stamps program type
   TBD, tags the applicant, sends the auto-reply and the internal notification.

## Add the trigger

1. In the builder, click "Add New Workflow Trigger".
2. In the trigger type list, choose "Form Submitted".
3. In the trigger settings, click "Add filters".
4. Choose the filter "Form is".
5. In the form selector, choose `BII - Application - In-Person`.
6. Click "Save Trigger".

## Action 1: Update Contact Field (program type)

1. Click the "+" below the trigger to add an action.
2. Choose "Update Contact Field".
3. In the field selector, choose `Program Type` (the `contact.bii_program_type`
   field).
4. In its value, choose `TBD` (it is a single-select field, so pick the existing
   option; the value must read exactly `TBD`).
5. Click "Save Action".

## Action 2: Add Tag (bii:applicant)

1. Click the "+" below Action 1.
2. Choose "Add Contact Tag".
3. In the tag field, type or select: `bii:applicant`
4. Click "Save Action".

## Action 3: Add Tag (bii:applied:in-person)

1. Click the "+" below Action 2.
2. Choose "Add Contact Tag".
3. In the tag field, type: `bii:applied:in-person` (it does not exist yet; typing
   it creates it on the fly. All lowercase, exact.)
4. Click "Save Action".

## Action 4: Send Email to the applicant (template #1)

1. Click the "+" below Action 3.
2. Choose "Send Email".
3. Recipient: leave it as the Contact (this email goes to the applicant who
   submitted the form). Do not change the recipient.
4. From Name: set to `Lo Rox` (or the account default sender name if preferred).
5. From Email: leave the account default sending address.
6. Subject: type `We've got your application`
7. To use template #1 for the body, click the template option in the email editor
   (look for "Select template" or the template library icon) and choose
   `BII - Application Received`.
8. Confirm the body loaded (it opens "Hi {{contact.first_name}}, Your application
   landed...").
9. Click "Save Action".

## Action 5: Internal Notification to Lo and Jenna (template #10 body)

This is the staff alert. Use the Internal Notification action because it sends to
specific people (Lo and Jenna), not to the contact, and it takes multiple
recipients in one action.

1. Click the "+" below Action 4.
2. Choose "Send Internal Notification".
3. Channel: choose "Email".
4. Recipient type: choose the option for a custom email address (often labeled
   "Custom Email" or "Specific Email"), so this goes to Lo and Jenna rather than an
   assigned user.
5. Enter both recipient addresses: `loroxburgh@gmail.com` and
   `clients@laurenroxburgh.com`. If the field takes multiple addresses, enter both
   separated by a comma. If it only takes one, add the second as a second recipient
   entry in the same action.
6. From Name: `Lo Rox` (or account default). From Email: account default.
7. Subject: type `New BII application: {{contact.name}}`
8. Body: switch the body editor to its code or source view if it has one (the
   `</>` icon), then paste this HTML exactly:

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

9. Switch the body editor back to the normal view and confirm it shows formatted
   text, not literal tags.
10. Click "Save Action".

> **Alternative to step 2 to 8 (if your GHL surfaces it):** if the plain
> "Send Email" action shows an editable "To" address field that accepts custom,
> comma-separated addresses, you can instead use a single Send Email action with
> the "To" set to `loroxburgh@gmail.com, clients@laurenroxburgh.com` and select
> template #10 (`BII - Internal Application Notification`) from the template
> library, which avoids pasting the HTML. Both paths deliver the same email to Lo
> and Jenna. Use whichever your builder makes available; the Internal Notification
> path above works everywhere.

## Save and publish

1. Click "Save" (top right of the builder).
2. Toggle the workflow from "Draft" to "Publish" (the toggle at the top of the
   builder) so it goes live.
3. Confirm the toggle reads Published.

---

# Workflow 2: BII - Application Submitted - Virtual

This workflow is identical to Workflow 1 except for three things: the trigger
form, the program type value, and the third tag. The fastest path is to clone
Workflow 1 and change those three. A from-scratch path is given as a fallback.

## Fastest path: clone Workflow 1

1. Go to Automation then Workflows (the workflow list).
2. Find `BII - Application Submitted - In-Person`.
3. Click its three-dot menu and choose "Clone" (or "Copy").
4. Open the cloned workflow.
5. Rename it exactly: `BII - Application Submitted - Virtual`
6. **Change the trigger:** open the Form Submitted trigger, change the "Form is"
   filter from the In-Person form to `BII - Application - Virtual`, and save the
   trigger.
7. **Change Action 1:** open the Update Contact Field action and change the
   `Program Type` value from `TBD` to `Virtual Program` (exact, including the space
   and capitalization). Save.
8. **Change Action 3:** open the third action (Add Tag) and change the tag from
   `bii:applied:in-person` to `bii:applied:virtual`. Save. Leave Action 2
   (`bii:applicant`) as is.
9. Leave Actions 4 and 5 unchanged: the applicant auto-reply (template #1) and the
   internal notification to Lo and Jenna (template #10 body, same subject) are
   identical for both forms. The cloned copy already carries the template #10 HTML.
10. Save, then toggle from Draft to Publish.

## Fallback: build Workflow 2 from scratch

If cloning is not available, repeat all of Workflow 1's steps with these three
substitutions:

- Trigger "Form is": `BII - Application - Virtual` (`taGKzsQfC2uVwJpsfdpu`).
- Action 1 value: `Virtual Program` instead of `TBD`.
- Action 3 tag: `bii:applied:virtual` instead of `bii:applied:in-person`.

Everything else is the same, including Action 5's template #10 HTML (reuse the
exact block from Workflow 1, Action 5 above), the subject
`New BII application: {{contact.name}}`, and both recipient addresses.

---

# Verification (after publishing each workflow)

Test each workflow by submitting its form with a fresh test email (use a different
test address per form so the two do not collide), then confirm all five:

1. **Applicant auto-reply:** template #1 (`BII - Application Received`) arrives in
   the test inbox.
2. **Internal notification:** the notification email arrives at BOTH
   `loroxburgh@gmail.com` and `clients@laurenroxburgh.com`.
3. **Program type:** open the test contact in GHL and confirm `Program Type` reads
   `TBD` (In-Person) or `Virtual Program` (Virtual).
4. **Tags:** the test contact has BOTH `bii:applicant` and the form-specific
   provenance tag (`bii:applied:in-person` or `bii:applied:virtual`).
5. **Live substitution (the one we flagged at template #10 provisioning):** open
   the internal notification email and confirm the "Application Type" line renders
   the real value (`TBD` or `Virtual Program`), and that the other fields
   (Name, Body State, Hopes, etc.) all populated. This is the first end-to-end
   proof that `{{contact.bii_program_type}}` and the other custom-field tokens
   substitute correctly. If any token shows as literal `{{...}}` text instead of a
   value, stop and flag it: the merge syntax or the field would need a second look.

Delete the test contacts when done so they do not pollute the real applicant list.

# Rollback

To take a workflow offline without deleting it:

1. Go to Automation then Workflows.
2. Open the workflow (or use its three-dot menu).
3. Toggle it from "Publish" back to "Draft". A draft workflow does not fire.

To remove it entirely, use the three-dot menu then Delete. Deleting a workflow
does not touch the forms, templates, tags, or any contacts it already processed.

# Downstream dependencies

- **Lo Approves workflow (next batch)** triggers off the `bii:approved` tag, which
  Lo or Jenna apply manually after reviewing an application. These submission
  workflows do not set `bii:approved`; they only set `bii:applicant` and the
  provenance tag.
- **The provenance tags** (`bii:applied:in-person` / `bii:applied:virtual`) are set
  here at submission and are never removed, so later stages can always see the
  original entry point even after `bii_program_type` changes through the funnel.
- **Notion sync via n8n (Phase 5)** will hook into these workflows or the
  contact-created event; no action needed here, noted for sequencing.
