# BII Application Forms: Phase A Diagnosis (read-only)

Date: 2026-06-15. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox`.

Goal: confirm what the GHL form builder can do before writing the In-Person and
Virtual application form walkthroughs. Two evidence levels are used below and
labeled on each item:

- **API-confirmed:** observed this session through the `ghl-lorox` MCP.
- **Product behavior:** established GHL form-builder behavior. The MCP cannot
  probe it (see the tooling limits below), so it is stated from how the GHL
  builder works, and the one genuinely uncertain item is flagged to verify
  in-builder with a fallback.

## Tooling limits found this session (API-confirmed)

- **No form create or update tool.** The `ghl-lorox` MCP exposes only read tools
  for forms: `get_forms` (list), `get_form_by_id`, `get_form_submissions`, plus
  `upload_form_custom_files`. There is no create/update. So the forms must be
  built by hand in the GHL UI. This is the premise of the walkthrough, now
  confirmed.
- **`get_form_by_id` is blocked at the route level.** Calling it on an existing
  form returned `GHL API Error (401): This route is not yet supported by the IAM
  Service. Please update your IAM config.` This is a route-level IAM block, not a
  per-form issue, so the form's internal field structure cannot be inspected via
  the API at all. The builder-capability items below therefore rely on product
  behavior, not API inspection.
- `get_forms` (list) works fine and is the basis for the naming-conflict check.

## 1. Existing forms and naming conflicts (API-confirmed)

`get_forms` returned 10 forms on the location. None collides with the two planned
names. Build is clear to proceed.

| existing form | id |
|---|---|
| Newsletter Footer Form | `n1mGllX1L0cjHfQ0R7lp` |
| Prize Shipping Details | `oNwxFcs0dXiqnfFfdOEd` |
| Shipping Details | `nIbtWgsFDTmCVyO3L9Jx` |
| Newsletter Form | `6h5dqEIYi1eaz29oqniv` |
| Empowered Body_Registration (2025/2026) | `B5rAJpVmZapzLJvMx1t4` |
| Private Coaching Form | `pj3HmMFmdxSnWk4diS7e` |
| Certification Waitlist form | `iuNV5tOc8x480a09v6eJ` |
| Contact form | `s7MSbUr97pla7r6XTBiv` |
| PPC_Fascia Flow | `jhste1vmaB3jPnshns1p` |
| ORG_Fascia Flow | `SWL7WZc5Na9G1y1FYXSm` |

No form named `BII - Application - In-Person` or `BII - Application - Virtual`
exists. No conflict.

## 2. Form-to-custom-field linkage (product behavior)

The GHL form builder maps a form field to an **existing** custom field by
selecting/dragging that field from the builder's field palette. The palette
groups fields: a "Contact" / "Personal Info" group (the standard First Name, Last
Name, Email, Phone) and a "Custom Fields" group that lists the location's existing
custom fields, organized under their folders. The 11 BII fields live under the
`Body Intelligence Institute` folder (`pDPx2ONpj6G9ktTqju3l`) and appear there.

Dragging an existing custom field onto the form writes submissions into **that
same** contact field. It does not create a new per-form field. So both application
forms can target the same `bii_body_state`, `bii_hopes`, etc. This is the
intended behavior and the approach holds.

Caveat to watch in-builder: the builder also has an "Add Custom Field" action that
creates a brand new field. Do not use it for the BII fields. Always pick the
existing field from the Custom Fields list (under the Body Intelligence Institute
folder). The walkthrough will say "select the existing field", not "add a field".

## 3. Hidden default value for `bii_program_type` (product behavior, one item flagged)

GHL forms support a hidden field: an element placed on the form that is mapped to
a contact field, not shown to the applicant, and written to the contact on submit.
It can carry a static default value (or be populated from a URL query parameter).
So the plan is: add a hidden field mapped to `contact.bii_program_type` with a
static default of `TBD` (In-Person) or `Virtual Program` (Virtual).

Two things to get right, both flagged in the walkthrough:

- **The default must exactly match a provisioned option.** `bii_program_type` is a
  SINGLE_OPTIONS field whose options are `Single Session, 3-Series, 10-Series,
  Virtual Program, Pop-Up, TBD` (`bii-custom-fields.md` field #10). `TBD` and
  `Virtual Program` are both exact existing options, so they are valid defaults.
  Spelling and capitalization must match exactly.
- **Verify the hidden field accepts a SINGLE_OPTIONS mapping with a preset
  option as its default.** This is the one capability I cannot confirm without the
  builder. If the GHL hidden-field element will not map to a single-options custom
  field, or will not take a preset option as a static default, there is a robust
  fallback: set `bii_program_type` from the form's downstream workflow instead,
  with an "Update Contact Field" action (In-Person workflow sets `TBD`, Virtual
  workflow sets `Virtual Program`). The workflows are the next Phase 2 prompt and
  each is already form-specific, so this fallback costs nothing and is fully
  reliable. The walkthrough documents the hidden-field approach as primary and
  names this fallback so Si can switch without stopping if the builder balks.

## 4. Inline thank-you message (product behavior)

GHL form settings include an "On Submit" behavior with the options to show an
inline confirmation message or to redirect to a URL. Choosing the inline message
("Show Message" / "Thank You Message") displays custom text in place of the form
after submission, with no redirect. This matches Si's preference. Supported.

## 5. Field types map cleanly (product behavior, against API-confirmed field set)

The custom field dataTypes are API-confirmed in `bii-custom-fields.md`. The form
builder element for each maps cleanly:

| form need | GHL form element | maps to | dataType (confirmed) |
|---|---|---|---|
| First Name, Last Name, Email, Phone | standard contact fields | standard | - |
| Where are you based? | single-line text | `contact.bii_location` | TEXT |
| Body State, Hopes, Why Now, Anything Else | large text / paragraph | `contact.bii_*` | LARGE_TEXT |
| How did you hear about Lo? | single-select dropdown | `contact.bii_how_heard` | SINGLE_OPTIONS |
| Equipment Access (Virtual only) | multi-select / checkboxes | `contact.bii_equipment_access` | MULTIPLE_OPTIONS |

The dropdown and multi-select render their options from the custom field's
provisioned `picklistOptions`, so the options do not need re-entering on the form;
they come from the field. (How Heard: Instagram, Podcast, Referral, Lo Rox Studio,
Other. Equipment Access: Roller, Balls, Block, Strap, Rebounder, Sound Tools, None
of the above, Other.)

## 6. Required vs optional per field (product behavior)

Each form field in the GHL builder has a per-field "Required" toggle in its
settings. So all BII fields can be required except "Anything Else", which stays
optional. Supported.

## 7. Form submission trigger pattern for the downstream workflows (product behavior)

GHL workflows fire on form submission via a **"Form Submitted" trigger filtered to
a specific form** (the trigger has a "Form is" filter where you select the exact
form). So the trigger is form-ID-based: the In-Person workflow uses a Form
Submitted trigger set to the In-Person form, the Virtual workflow uses one set to
the Virtual form. This keeps the two flows cleanly separated (Option A) without
needing tags to disambiguate.

Locked for the workflow build prompt: trigger = "Form Submitted", filter "Form is"
= the specific form. Each form needs its published form id (capture it at build
time; the walkthrough includes a step and a reference table for the URLs/ids).

## Net for Phase B

Nothing blocks writing the walkthrough. Confirmed clear: no naming conflict, forms
are UI-only (so a manual walkthrough is correct), field types and required toggles
and inline thank-you and existing-field linkage all map to the plan. One item to
verify in-builder, with a no-cost fallback already identified: the hidden
`bii_program_type` default (fallback = set it via the form's workflow with an
Update Contact Field action). The walkthrough will carry that flag inline so Si is
not surprised.
