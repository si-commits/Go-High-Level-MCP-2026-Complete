# BII Payment Received Workflow: GHL UI Walkthrough

One workflow, built by hand in the GoHighLevel UI. It fires when a client pays for
a BII Single Session, delivers the intake email, flips the contact from applicant
to client, and alerts Aya to provision Studio Access. This closes the
applicant-to-client lifecycle end to end.

## Why this is manual

Workflow construction is UI-only on this connection (the MCP lists workflows but
the builder tools need an unconfigured workflow-builder auth). This doc is the
script.

## Trigger architecture (locked in Phase A)

- **Trigger: Order Submitted**, filtered to the **BII Single Session** product
  (`6a2a1445af2123a4da1d1342`). An order only exists once payment clears, so this
  fires after a successful payment, not on a failed one, and it filters by product
  so it only runs for the single-session purchase.
- Single trigger today. When 3-Series and 10-Series come online, add one Order
  Submitted trigger per product and branch inside with If/Else (see Future
  Extensions).

## Pre-flight checklist

1. **Template #11 exists:** `BII - Intake Delivery` (`6a307fe706bb2896fa08ebe6`).
2. **Tags exist:** `bii:applicant` (`8wzBeGqago1cVnK0tRi4`) and
   `bii:studio-access-pending` (`Lc27WvS0I7cbzc12EZ1K`). See the tag note in the
   actions for the client tag.
3. **Custom fields exist:** `bii_tcs_accepted_at` (DATE, `ZAn6aTP7fW6UX3FYvwu3`),
   `bii_program_type` (SINGLE_OPTIONS, `WWPElTlPQHkNY6p3GkvF`), and the
   `Studio Access Granted` checkbox field (`bii_studio_access_granted`,
   `My3LKEpkLvtO8p9tuYuW`) that Aya ticks later.
4. **Product:** BII Single Session `6a2a1445af2123a4da1d1342`.
5. **Aya** `aya@sishearer.com` is **not** a GHL team member (confirmed Phase A), so
   her notification uses a custom email address, not a user pick.

## Navigate to a new workflow

1. In the GHL left sidebar, click "Automation".
2. Click "Workflows".
3. Click "+ Create Workflow".
4. Choose "Start from Scratch". The workflow builder opens.

## Name the workflow

1. Click the workflow name at the top left and type exactly: `BII - Payment Received`
2. For reference: fires on a paid Single Session order, delivers the intake email,
   converts applicant to client, and triggers Studio Access provisioning.

## Add the trigger

1. Click "Add New Workflow Trigger".
2. Choose "Order Submitted".
3. Add a filter: "Product" (or "Product is"), and select `BII Single Session`.
4. Save the trigger.

> Confirm at the test-payment step that a Single Session paid through the In-Person
> calendar's booking flow actually fires this Order Submitted trigger. GHL calendar
> payments create order records, so this is expected, but verify it. If it does not
> fire, the fallback is a "Customer Booked Appointment" trigger filtered to the
> In-Person calendar (it loses the per-product filter but works for today since
> Single Session is the only paid product on that calendar).

## Actions, in order

### Action 1: Update Contact Field, bii_tcs_accepted_at = now

1. Add an action, choose "Update Contact Field".
2. Field: `T&Cs Accepted At` (`bii_tcs_accepted_at`).
3. Value: set it to the current date. In the date value, choose the "current date"
   option (GHL date fields can be set to the workflow's current date, sometimes a
   `{{right_now}}` token or a 0-day relative date). Confirm the field stamps the
   run date when you test.
4. Save.

> The consent was actually given at booking (the calendar T&Cs checkbox). Payment
> happens in the same booking flow, so stamping the field at payment-received is a
> faithful record of acceptance. If the builder will not set a custom DATE field to
> "now" directly, the fallback is a relative date of 0 days from the trigger.

### Action 2: Update Contact Field, bii_program_type = Single Session

1. Add an action, choose "Update Contact Field".
2. Field: `Program Type` (`bii_program_type`).
3. Value: `Single Session` (exact option).
4. Save.

> Known limitation (from Phase A): GHL's Update Contact Field is unconditional, it
> overwrites whatever is there. That is correct today (the buyer bought a Single
> Session). When 3-Series / 10-Series are added, wrap this in an If/Else so a later
> upgrade is not overwritten (see Future Extensions).

### Action 3: Remove Tag, bii:applicant

1. Add an action, choose "Remove Contact Tag".
2. Tag: `bii:applicant`.
3. Save.

### Action 4: Add Tag, the client tag

1. Add an action, choose "Add Contact Tag".
2. Tag: `bii:client`.
3. Save.

> **Flag, please reconcile before building.** The task specifies `bii:client`, but
> the provisioned BII tag taxonomy (`bii-tags.md`) has **`bii:active-client`**
> (`3JKk2YJ70SziDgSsiqWB`), not `bii:client`. There is no `bii:client` in the
> taxonomy, so typing it here would create a new off-taxonomy tag on the fly.
> Recommendation: use `bii:active-client` to stay consistent with the taxonomy,
> unless you specifically want a separate `bii:client` tag. Confirm which, then set
> this step accordingly.

### Action 5: Add Tag, bii:studio-access-pending

1. Add an action, choose "Add Contact Tag".
2. Tag: `bii:studio-access-pending`.
3. Save.

### Action 6: Send Email to the client, Template #11

1. Add an action, choose "Send Email".
2. Recipient: leave it as the Contact (the client who paid).
3. From Name: `Lo Rox` (or the account default). From Email: account default.
4. Subject: `Before your session with Lo`
5. Use the template: select `BII - Intake Delivery` from the template library.
6. Confirm the body loaded ("Hi {{contact.first_name}}, Your payment came
   through...").
7. Save.

### Action 7: Internal Notification to Aya (provision Studio Access)

1. Add an action, choose "Send Internal Notification".
2. Channel: "Email".
3. Recipient type: custom email address (Aya is not a team member).
4. Recipient: `aya@sishearer.com`
5. From Name: `Lo Rox` (or default). From Email: account default.
6. Subject: `Provision Studio Access: {{contact.name}}`
7. Body: switch the body editor to code/source view if it has one, paste this HTML:

```html
<p>New BII payment.</p>
<p>Client: {{contact.name}}<br>
Email: {{contact.email}}<br>
Purchased: BII Single Session</p>
<p>Action needed: provision this client's year of Studio Access on Uscreen.</p>
<p>Once provisioned, open the client's contact in GHL, tick the "Studio Access Granted" custom field, and remove the "bii:studio-access-pending" tag.</p>
```

8. Switch back to the normal view and confirm it renders.
9. Save.

## Save and publish

1. Click Save (top right).
2. Toggle from Draft to Publish. Confirm it reads Published.
3. **Capture the workflow id** (it appears in the workflow URL and the workflow
   list) and record it for the Phase 2 task records:

| item | value |
|---|---|
| Workflow name | BII - Payment Received |
| Workflow id | _fill in_ |

## Verification (after publishing)

Run a test Single Session payment through the In-Person calendar's booking flow
(use GHL's test payment mode if available, or a real low-risk card you refund),
then confirm all of:

1. **Trigger fired:** the workflow shows a run for the test order. (If it did not,
   the calendar payment did not create the expected order, use the appointment
   trigger fallback above.)
2. **Intake email:** Template #11 (`BII - Intake Delivery`) arrives at the test
   contact's email, with the intake link working.
3. **Aya notification:** `aya@sishearer.com` receives the "Provision Studio Access"
   email with the client name and the two follow-up instructions.
4. **`bii_tcs_accepted_at`** is populated with the run date/time on the contact.
5. **`bii_program_type`** reads `Single Session`.
6. **Tags:** `bii:applicant` removed; the client tag added (`bii:active-client` or
   `bii:client` per the reconciliation above); `bii:studio-access-pending` added.

When all six pass, the applicant-to-client lifecycle is closed end to end:
application, approval, booking, payment, intake delivery, and the Studio Access
hand-off to Aya.

## Future extensions (3-Series and 10-Series)

When the other two products go live, this same workflow handles them:

- **Add one Order Submitted trigger per product** (3-Series
  `6a2a145899eef43fed863e66`, 10-Series `6a2a1469fc5f50dbbcfd51e7`), all into this
  workflow.
- **Branch with If/Else on the purchased product** so `bii_program_type` is set to
  the right value (`3-Series` / `10-Series`) per branch, and so the
  `bii_program_type` set is **conditional**, only writing if the current value is
  empty, `TBD`, or a lower package, so a package upgrade is not overwritten. This
  is the protection for the unconditional-overwrite limitation noted in Action 2.
- Per-package post-payment actions (different Studio Access terms, different
  internal notes) go in their respective branches. The email (Template #11) and the
  tag flips are likely shared across all branches, so keep those outside the
  If/Else where they are common.

## Rollback

- Take the workflow offline: open it in Automation then Workflows, toggle Publish
  back to Draft (a draft workflow does not fire).
- Delete it entirely via its three-dot menu then Delete. Deleting the workflow does
  not touch the template, tags, fields, products, or any contacts it already
  processed.

## Downstream dependencies

- **`bii_tcs_accepted_at` stamping** lands here (it was deferred from the T&Cs task
  as a workflow step, now built into Action 1).
- **Studio Access provisioning is a manual hand-off to Aya** on Uscreen. The loop
  closes when Aya ticks the `Studio Access Granted` field and removes
  `bii:studio-access-pending`. A future automation could watch for that field and
  drive further steps, out of scope here.
- **The intake link** points to the branded embed page
  `https://laurenroxburgh.com/somatic-bodywork-with-lo-intake` (Phase 1 task 8 / the
  survey embed). If that page is not live yet, the link in Template #11 will not
  resolve until it is.
