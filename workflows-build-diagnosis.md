# BII Application Workflows: Phase A Diagnosis (read-only)

Date: 2026-06-15. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox`.

Goal: confirm what the GHL workflow builder can do before writing the two
"Application Submitted" workflow walkthroughs. As with the forms diagnosis, two
evidence levels are used and labeled per item:

- **API-confirmed:** observed this session through the `ghl-lorox` MCP.
- **Product behavior:** established GHL workflow-builder behavior. The MCP cannot
  probe the builder internals here (see the tooling limits), so it is stated from
  how the GHL workflow builder works, with the one genuinely uncertain item
  (multi-recipient internal email) flagged with a recommended path.

## Tooling limits found this session (API-confirmed)

- **Workflow listing works.** `ghl_list_workflows` / `ghl_get_workflows` return the
  full workflow list (used for the naming-conflict check below).
- **The workflow builder is not reachable on this connection.**
  `ghl_get_workflow_full` returned: `Workflow builder not initialized: Workflow
  builder requires GHL_REFRESH_TOKEN (v2 JWT) or GHL_FIREBASE_API_KEY +
  GHL_FIREBASE_REFRESH_TOKEN`. The builder-level tools (full read, create,
  update-actions, clone, publish) all depend on that auth, which is not
  configured. So workflow construction and inspection are UI-only here, the same
  conclusion the forms diagnosis reached for forms. The action-node internals
  could not be inspected via API, so items 4 and 5 below are product-behavior.
- Net: build these workflows in the GHL UI by hand. This doc is the script.

## 1. Existing workflows and naming conflicts (API-confirmed)

`ghl_list_workflows` returned 53 workflows. None collides with either planned
name. Build is clear.

- No workflow named `BII - Application Submitted - In-Person`.
- No workflow named `BII - Application Submitted - Virtual`.

(The closest existing automations are unrelated: "Private Coaching Inquiry Form",
"Contact Form", the Empowered Body and HFF sequences. None uses the BII naming.)

## 2. Workflow MCP coverage (API-confirmed): UI-only here

| capability | tool | works on this connection? |
|---|---|---|
| list workflows | `ghl_list_workflows`, `ghl_get_workflows` | Yes |
| full read (action nodes) | `ghl_get_workflow_full` | No (builder auth missing) |
| create / update actions / clone / publish | `ghl_create_workflow`, `ghl_update_workflow_actions`, `ghl_clone_workflow`, `ghl_publish_workflow` | No (same builder auth) |
| enroll a contact | `add_contact_to_workflow` | standard API, but does not build workflows |

So the walkthrough is a UI build, not an API build.

## 3. Form Submitted trigger (product behavior; targets API-confirmed)

The trigger pattern locked in the forms diagnosis holds: in the workflow builder,
add a trigger of type "Form Submitted" (sometimes shown as "Form Submitted" under
the Contact/Events trigger group), then add the filter "Form is" and select the
specific form. It is form-ID-based, so each workflow points at exactly one form.

Both target forms exist and were verified by `get_forms` this session:

| form | id (API-confirmed) |
|---|---|
| BII - Application - In-Person | `fkinw2HKhk3XnyidYw61` |
| BII - Application - Virtual | `taGKzsQfC2uVwJpsfdpu` |

No quirks beyond the standard: select the exact form in the "Form is" filter so
the In-Person workflow only fires for the In-Person form and vice versa.

## 4. Action types (product behavior)

All three actions the workflows need are standard GHL workflow actions:

- **Update Contact Field** ("Update Contact Field" action): pick the field, set the
  value. For `bii_program_type` (a SINGLE_OPTIONS field) the value is chosen from
  its options, so the value must be an exact existing option (`TBD` or
  `Virtual Program`).
- **Add Tag** ("Add Contact Tag" action): pick an existing tag or type a new one.
- **Send Email** ("Send Email" action): composes or selects a template and sends.
  The Send Email action offers selecting from the email template library and sends
  to the contact in the workflow. This is the right action for the applicant
  auto-reply (template #1 to the contact).

One nuance carried into item 5: the standard "Send Email" action is built to email
the contact, and the recipient-to-arbitrary-third-parties path is the uncertain
piece, which is exactly the Lo + Jenna question.

## 5. KEY FINDING: how to send the internal email to Lo and Jenna

This is the item that decides the internal-email step structure. GHL separates two
distinct actions:

- **Send Email** sends to the contact (template-library selectable). Good for the
  applicant auto-reply, not built for staff alerts.
- **Internal Notification** (also shown as "Send Internal Notification") is the
  purpose-built staff-alert action. It supports the Email channel and lets you set
  recipients as: the Assigned User, a specific user, and/or **custom email
  addresses, multiple in a single action**. This is the natural fit for "to Lo and
  Jenna".

**Recommended structure (most reliable):**

- Applicant auto-reply: a **Send Email** action, To = Contact, template = #1
  (`BII - Application Received`). One action.
- Internal notification to Lo + Jenna: a single **Internal Notification** action,
  Email channel, recipients = Lo's email address and Jenna's email address (both in
  the one action; the action takes multiple custom recipients). Subject =
  `New BII application: {{contact.name}}`.

**The one tradeoff to know:** the Internal Notification action composes its email
body inline (subject + body editor); it does not always expose the email
template-library picker that the Send Email action has. So template #10's body is
used by **pasting its HTML into the Internal Notification body**, with template #10
remaining the canonical source. The HTML to paste is in `template-10-provisioned.md`
(and reproduced in the walkthrough so Si does not have to switch files). Merge
fields still resolve because the action runs in the submitting contact's context,
so `{{contact.name}}`, `{{contact.bii_*}}`, etc. populate exactly as designed. This
is the live-substitution test flagged at template #10 provisioning time.

**Alternative if Si's GHL build allows it:** in some GHL versions the Send Email
action's "To" field is editable and accepts custom, comma-separated addresses while
still letting you select template #10 from the library. If Si sees an editable "To"
on Send Email that accepts both Lo's and Jenna's addresses, that single
Send-Email-with-template-#10 action is a clean alternative and template #10 is then
truly selected, not pasted. The walkthrough presents the Internal Notification path
as primary (reliable everywhere) and names this alternative.

Either way it is achievable in **one** action for both recipients; two separate
Send Email actions are not needed.

## 6. Tags (API-confirmed state, product behavior for creation)

`bii-tags.md` confirms `bii:applicant` is provisioned (`8wzBeGqago1cVnK0tRi4`),
lowercase, exact. There is **no** form-specific applicant variant provisioned
(no `bii:applicant:in-person` or similar).

- GHL workflow "Add Contact Tag" actions create a tag on the fly if you type one
  that does not exist, so no pre-provisioning is needed for any variant.
- Recommendation: apply `bii:applicant` on both workflows (as the Phase B spec
  says). A form-specific tag is arguably redundant because the two flows are
  already separate workflows and `bii_program_type` already distinguishes In-Person
  (`TBD`) from Virtual (`Virtual Program`). If tag-level segmentation is wanted
  later, `bii:applicant:in-person` and `bii:applicant:virtual` can be added in the
  Add Tag step with no provisioning. Flagging the choice; defaulting to
  `bii:applicant` only unless told otherwise.

## Open item: Lo and Jenna email addresses

The internal notification needs Lo's and Jenna's actual email addresses, which I do
not have. The walkthrough will carry clearly-marked placeholders
(`[Lo's email]`, `[Jenna's email]`) for Si to fill at build time. If you provide
them, I will inline them. They are the only missing input.

## Template IDs for the walkthrough (API-confirmed earlier this project)

- Template #1, `BII - Application Received`: `6a2a692855fd109fc761571e`
- Template #10, `BII - Internal Application Notification`: `6a2f2e258addbb8d63588b7f`

## Net for Phase B

Nothing blocks the walkthrough. UI-only build (confirmed). Trigger pattern and both
form IDs confirmed. The three actions are standard. The internal-email question is
resolved: one Internal Notification action to Lo + Jenna with template #10's body
pasted inline (primary), or a single Send Email with template #10 to both addresses
if the builder allows a custom multi-address "To" (alternative). The only missing
input is Lo's and Jenna's email addresses.
