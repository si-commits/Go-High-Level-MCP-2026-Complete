# BII Application Forms: GHL UI Walkthrough (In-Person and Virtual)

Two application forms, built by hand in the GoHighLevel UI. Follow the form you
are building top to bottom. Each form section is self-contained: you can build
just one without reading the other. Every label and message to type is included
inline.

## Why this is manual

GHL form builders are UI-driven. The `ghl-lorox` MCP exposes only read tools for
forms (list, get, submissions); it has no create or update, and the form-detail
read route is blocked on this connection. So forms are built in the GHL UI by
hand. This doc is the script.

## What is being built

Two application forms for the Body Intelligence Institute (BII):

- **BII - Application - In-Person:** the live intake for in-person sessions.
- **BII - Application - Virtual:** the intake for the virtual program (currently
  on pause; the form is built now so it is ready, and it captures equipment
  access for home practice).

Both forms write into the **same existing** BII contact custom fields (not new
per-form fields), and both set a hidden `bii_program_type` default on submit so
downstream automation can route In-Person vs Virtual applicants. In-Person writes
`TBD`; Virtual writes `Virtual Program`.

## Time expectation

About 15 minutes per form, roughly 30 minutes total including the verification
test at the end.

## Dependency: the BII custom fields must already exist

Both forms map to custom fields that were already provisioned in the folder
`Body Intelligence Institute` (folder id `pDPx2ONpj6G9ktTqju3l`). The fields used
here, with their exact mapping keys:

| field name in GHL | maps to (key) | type |
|---|---|---|
| Location | `contact.bii_location` | TEXT |
| Body State | `contact.bii_body_state` | LARGE_TEXT |
| Hopes | `contact.bii_hopes` | LARGE_TEXT |
| Why Now | `contact.bii_why_now` | LARGE_TEXT |
| How Heard | `contact.bii_how_heard` | SINGLE_OPTIONS |
| Anything Else | `contact.bii_anything_else` | LARGE_TEXT |
| Equipment Access (Virtual only) | `contact.bii_equipment_access` | MULTIPLE_OPTIONS |
| Program Type (hidden) | `contact.bii_program_type` | SINGLE_OPTIONS |

If any of these are missing, stop and rebuild the fields first (see
`bii-custom-fields.md`). All 11 BII fields should be present.

## Two-form summary

| Form | Visible fields | Hidden default on submit | Time |
|---|---|---|---|
| BII - Application - In-Person | 10 (4 standard + 6 custom) | `bii_program_type` = `TBD` | ~15 min |
| BII - Application - Virtual | 11 (4 standard + 7 custom) | `bii_program_type` = `Virtual Program` | ~15 min |

## Pre-flight checklist (do this once before building)

1. In the GHL UI, go to Settings then Custom Fields, open the folder
   `Body Intelligence Institute`, and confirm the 11 BII fields are listed.
2. Confirm no form named `BII - Application - In-Person` or
   `BII - Application - Virtual` already exists (Sites then Forms then Builder).
   As of this writing neither exists, so if one does, someone started it; check
   before making a duplicate.
3. Confirm the two email templates the downstream workflows will use exist:
   `BII - Application Received` (template #1) and
   `BII - Internal Application Notification` (template #10). They are not used by
   the form itself, only noted here so the dependency is visible.

---

# Form 1: BII - Application - In-Person

## Navigate to a new form

1. In the GHL left sidebar, click "Sites".
2. Click the "Forms" tab at the top.
3. Click the "Builder" sub-tab.
4. Click "+ Add Form" (or "Create New Form"). A blank form builder opens.

## Name the form

1. At the top of the builder, click the form name field (it defaults to something
   like "Untitled Form").
2. Type the name exactly: `BII - Application - In-Person`
3. For your own reference (GHL identifies the form by its name; there is no
   separate internal-description field), keep in mind this form is: the in-person
   BII application, fired to its own workflow, writes `bii_program_type = TBD`.

## Add the header the applicant sees

1. From the builder's element palette, drag a Text (or Heading) element to the
   very top of the form canvas.
2. Click it to edit, and type this header (Lo's voice):

```
Working with Lo at the Body Intelligence Institute starts with a conversation. Tell us a little about you, your body, and what you are hoping for. Lo reads every application personally and will be in touch within 2 to 3 business days.
```

## Critical: adding the right kind of field

> **Read this before you place a single field.**
>
> Every BII field below must be the **existing** custom field, not a new one. The
> two forms share the same fields, and downstream automation reads those exact
> fields. There are two ways to add a field in the builder, and only one is right.
>
> - **RIGHT: drag the existing field from the Custom Fields panel.** In the
>   builder's field palette, open the "Custom Fields" section and find the field
>   under the `Body Intelligence Institute` folder. Drag that existing field onto
>   the form. This connects the form input to the existing `bii_*` field, so
>   submissions from both forms land in the same place.
> - **WRONG: clicking "Add Custom Field".** That creates a brand new field per
>   form. You would end up with duplicate fields (for example two "Body State"
>   fields) and the workflows and the internal notification email would read the
>   wrong one. Do not use "Add Custom Field" for any BII field.
>
> Rule of thumb: you are always **selecting** an existing field, never
> **creating** one. The standard fields (First Name, Last Name, Email, Phone) come
> from the "Contact" / "Personal Info" group of the palette and are also selected,
> not created.

## Add the fields, in this exact order

For each field: add it by the method noted, set its label to the exact text given,
and set the Required toggle (in the field's settings on the right) as noted.

1. **First Name**: from the Contact / Personal Info group, add the standard
   First Name field. Label: `First Name`. Required: ON.
2. **Last Name**: standard Last Name field. Label: `Last Name`. Required: ON.
3. **Email**: standard Email field (keep its email validation). Label: `Email`.
   Required: ON.
4. **Phone**: standard Phone field (keep its phone validation). Label: `Phone`.
   Required: ON.
5. **Location**: drag the existing `Location` custom field from the Body
   Intelligence Institute folder. Label: `Where are you based?`. Required: ON.
6. **Body State**: drag the existing `Body State` field (it renders as a
   paragraph / large text box). Label: `What is going on in your body right now?`.
   Required: ON.
7. **Hopes**: drag the existing `Hopes` field (paragraph). Label:
   `What are you hoping this work helps you with?`. Required: ON.
8. **Why Now**: drag the existing `Why Now` field (paragraph). Label:
   `Why now?`. Required: ON.
9. **How Heard**: drag the existing `How Heard` field (it renders as a
   single-select dropdown). Label: `How did you hear about Lo?`. Required: ON.
   The dropdown options come from the field itself; confirm they read: Instagram,
   Podcast, Referral, Lo Rox Studio, Other. Do not retype them.
10. **Anything Else**: drag the existing `Anything Else` field (paragraph).
    Label: `Anything else you would like Lo to know?`. Required: OFF (this is the
    one optional field).

## Set the hidden default (bii_program_type = TBD)

This writes `TBD` to the applicant's Program Type field on submit without showing
anything to the applicant.

1. From the Custom Fields panel, drag the existing `Program Type`
   (`contact.bii_program_type`) field onto the form, below the visible fields.
2. With it selected, in the right settings panel set its preset / default value to
   exactly: `TBD` (capitalization must match the provisioned option).
3. Toggle the field to Hidden so the applicant does not see it.
4. Set Required: OFF (it is prefilled, not something the applicant answers).

> **If the builder will not let you do steps 1 to 3** (for example it will not
> hide a single-select field, or will not accept `TBD` as a preset), do not force
> it. Remove the field from the form and instead set `bii_program_type` from this
> form's workflow later: in the In-Person workflow (next Phase 2 task), add an
> "Update Contact Field" action that sets Program Type to `TBD`. That path is
> fully reliable and costs nothing here. If you take it, note it so the workflow
> build knows to include the action.

## Set the inline thank-you message

1. Open the form's Settings (or Options), find the "On Submit" behavior.
2. Choose "Show Message" (the inline confirmation, not a redirect).
3. Type this message (Lo's voice):

```
Your application has landed. Thank you. Lo will read it personally and you will hear back within 2 to 3 business days.
```

## Save and publish

1. Click Save (top right of the builder).
2. The form is live once saved. There is no separate publish step for a standalone
   GHL form; saving makes it available at its share link.

## Get the form URL

1. In the builder, open the "Integrate Form" or share option (top right).
2. Copy the direct link (the public form URL). You will also see an embed code
   here if a page embed is needed later.
3. Record the URL in the "Form URLs reference" table at the bottom of this doc.
   Also note the form id (it appears in the share link and is needed to set the
   workflow trigger).

---

# Form 2: BII - Application - Virtual

This form is built the same way as Form 1, with four differences: the name, the
header copy, field 10 (Equipment Access instead of going straight to Anything
Else, so Anything Else becomes field 11), the hidden default value
(`Virtual Program` instead of `TBD`), and the thank-you message. The virtual
program is on pause, so the copy is honest about that.

## Navigate to a new form

1. GHL left sidebar then "Sites".
2. "Forms" tab, then "Builder" sub-tab.
3. Click "+ Add Form". A blank builder opens.

## Name the form

1. Click the form name field at the top of the builder.
2. Type exactly: `BII - Application - Virtual`
3. For reference: this is the virtual BII application, fired to its own workflow,
   writes `bii_program_type = Virtual Program`.

## Add the header the applicant sees

1. Drag a Text (or Heading) element to the top of the form canvas.
2. Type this header (Lo's voice, honest about the pause):

```
Working with Lo virtually starts with a conversation. Tell us a little about you, your body, what you are hoping for, and the equipment you have at home. The virtual program is on pause right now, so this is an early application: Lo reads every one personally and the team will be in touch when there is an update, usually within 2 to 3 business days.
```

## Critical: adding the right kind of field

The same rule from Form 1 applies here: **drag the existing BII field from the
Custom Fields panel (under the Body Intelligence Institute folder); never click
"Add Custom Field", which creates a duplicate per-form field and breaks downstream
automation.** See the full "Critical: adding the right kind of field" callout in
Form 1 if you want the detail. You are always selecting an existing field, never
creating one.

## Add the fields, in this exact order

Fields 1 to 9 are identical to Form 1. Field 10 is Equipment Access. Field 11 is
Anything Else.

1. **First Name**: standard. Label: `First Name`. Required: ON.
2. **Last Name**: standard. Label: `Last Name`. Required: ON.
3. **Email**: standard (email validation). Label: `Email`. Required: ON.
4. **Phone**: standard (phone validation). Label: `Phone`. Required: ON.
5. **Location**: existing `Location` field. Label: `Where are you based?`.
   Required: ON.
6. **Body State**: existing `Body State` field (paragraph). Label:
   `What is going on in your body right now?`. Required: ON.
7. **Hopes**: existing `Hopes` field (paragraph). Label:
   `What are you hoping this work helps you with?`. Required: ON.
8. **Why Now**: existing `Why Now` field (paragraph). Label: `Why now?`.
   Required: ON.
9. **How Heard**: existing `How Heard` field (dropdown). Label:
   `How did you hear about Lo?`. Required: ON. Confirm options read: Instagram,
   Podcast, Referral, Lo Rox Studio, Other. Do not retype them.
10. **Equipment Access**: drag the existing `Equipment Access` field (it renders
    as a multi-select / checkboxes). Label:
    `What movement equipment do you have access to?`. Required: ON. Confirm options
    read: Roller, Balls, Block, Strap, Rebounder, Sound Tools, None of the above,
    Other. Do not retype them. ("None of the above" lets an applicant satisfy the
    required toggle if they have nothing.)
11. **Anything Else**: existing `Anything Else` field (paragraph). Label:
    `Anything else you would like Lo to know?`. Required: OFF.

## Set the hidden default (bii_program_type = Virtual Program)

1. Drag the existing `Program Type` (`contact.bii_program_type`) field onto the
   form, below the visible fields.
2. Set its preset / default value to exactly: `Virtual Program` (match the
   provisioned option exactly, including the space and capitalization).
3. Toggle the field to Hidden.
4. Required: OFF.

> Same fallback as Form 1: if the builder will not hide the field or take
> `Virtual Program` as a preset, remove it and set `bii_program_type` to
> `Virtual Program` via an "Update Contact Field" action in the Virtual workflow
> instead. Note it so the workflow build includes the action.

## Set the inline thank-you message

1. Form Settings (or Options), "On Submit" behavior.
2. Choose "Show Message".
3. Type this message (Lo's voice, honest about the pause):

```
Your application has landed. Thank you. The virtual program is currently on pause, but Lo and the team will review your application and be in touch when we have an update, usually within 2 to 3 business days for an initial response.
```

## Save and publish

1. Click Save (top right).
2. The form is live once saved.

## Get the form URL

1. Open "Integrate Form" / share (top right).
2. Copy the direct link and note the form id.
3. Record both in the "Form URLs reference" table below.

---

# Verification (after publishing each form)

Do this for each form once it is saved:

1. Open the form's public URL in a private browser window.
2. Confirm the header copy and all field labels read correctly, the dropdown
   (How Heard) and, for Virtual, the multi-select (Equipment Access) show the
   right options, and the hidden Program Type field is NOT visible.
3. Submit a test entry using your own email and filling every required field.
4. Confirm the inline thank-you message displays after submit (no redirect).
5. In GHL, open Contacts and find the test contact you just created.
6. On that contact, confirm every submitted value landed in the right field:
   First Name, Last Name, Email, Phone, and each `bii_*` field
   (Location, Body State, Hopes, Why Now, How Heard, Anything Else, and for
   Virtual, Equipment Access).
7. Critically, confirm `Program Type` reads `TBD` (In-Person) or `Virtual Program`
   (Virtual) on the contact. This proves the hidden default wrote correctly. If it
   is empty, the hidden field did not take; use the workflow fallback described in
   the hidden-default section.
8. Delete the test contact when done so it does not pollute the real applicant
   list.

# Form URLs reference (fill in once live)

| Form | Form id | Public URL |
|---|---|---|
| BII - Application - In-Person | _fill in_ | _fill in_ |
| BII - Application - Virtual | _fill in_ | _fill in_ |

These are needed for two later tasks: embedding the forms on pages, and setting
the "Form Submitted" trigger (filtered to the specific form id) on each workflow.

# Downstream dependencies

- **Two separate workflows (next Phase 2 task).** Each form feeds its own
  workflow via a "Form Submitted" trigger filtered to that specific form
  (Option A, two workflows). The form ids captured above are what you select in
  each trigger.
- **Applicant auto-reply:** template #1, `BII - Application Received`, sends to the
  applicant on submit (wired in the workflow, not the form).
- **Internal notification:** template #10, `BII - Internal Application
  Notification`, sends to Lo and Jenna on submit (wired in the workflow). Its
  Application Type line reads from `bii_program_type`, which is exactly what the
  hidden default (or the workflow fallback) populates: `TBD` for In-Person,
  `Virtual Program` for Virtual.
- **`bii_program_type` population:** set by the hidden form default, or by the
  workflow Update Contact Field fallback if the hidden field does not take. Either
  way it must be set, or the internal notification email shows a blank Application
  Type and Lo loses the In-Person vs Virtual signal.

# Rollback

To remove or pause a form:

1. Go to Sites then Forms then Builder.
2. Find the form by name.
3. To take it offline without deleting, remove it from any page it is embedded on
   and stop sharing its link (a standalone GHL form has no real traffic until its
   link is shared or embedded).
4. To delete it, use the form's three-dot menu then Delete. Deleting a form does
   not delete the custom fields it wrote to, and does not delete contacts already
   created. It only removes the form.

Deleting a form does not touch the shared BII custom fields, so a delete-and-
rebuild is safe if a form gets into a bad state.
