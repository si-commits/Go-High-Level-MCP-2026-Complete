# BII Client Intake Survey: Phase A Diagnosis (read-only)

Date: 2026-06-15. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox`.

Goal: confirm GHL Survey capabilities, MCP coverage, the standard-vs-custom field
split, custom-field overlap, and naming conflicts before provisioning anything.
Evidence is labeled **API-confirmed** (observed this session) or **product
behavior** (established GHL survey-builder behavior, not API-probeable here).

## Headline

Surveys are the right tool and nothing blocks the plan. The survey itself is a UI
build (the MCP create tool cannot express multi-page or conditional structure),
but the ~36 new custom fields it writes into are provisionable via the same
`create_location_custom_field` path used for the original 11 BII fields. Date of
Birth and the address fields are GHL standard fields, so they are dropped from the
custom-field list.

## 1. Survey capabilities (product behavior)

GHL Surveys support everything the plan needs, and several of these are exactly
why a Survey beats a Form here:

| capability | supported? | note |
|---|---|---|
| Multi-page / step progression with progress bar | Yes | Surveys are natively multi-slide; a progress indicator is a survey style option. This is the core Survey-vs-Form difference. |
| Conditional logic (show B only if A = X) | Yes | Surveys support conditional/branching logic on fields. This is the right mechanism for the "If yes, please explain" follow-ups. Forms have weaker conditional support, another reason to use a Survey. |
| Write to existing contact custom fields | Yes | Same as forms: a survey question mapped to a contact field writes to that field on submit. |
| Existing-custom-field selection (drag from folder) | Yes | The builder lists existing custom fields (under their folders) to drag in, same as the form builder. |
| Per-field required toggle | Yes | Standard per-question setting. |
| Inline thank-you on completion | Yes | Survey "thank you message" shown on submit (the MCP create tool even exposes a `thankYouMessage` param). |
| Field types: text, paragraph, dropdown, multi-select, date, number | Yes | All map to survey question types. |

## 2. MCP coverage for Surveys (API-confirmed)

- **Read works.** `ghl_get_surveys` returned successfully (0 surveys, see item 6).
  Survey read tools are functional on this connection, unlike the form-detail route
  (IAM-blocked) and the workflow builder (auth missing).
- **Create exists but is insufficient for this build.** `ghl_create_survey` is
  present, but its schema is flat: `name`, a single `fields[]` array
  (dataType/fieldKey/label/options/required), and `thankYouMessage`. It has **no
  representation of pages or conditional logic**. So it cannot build the 8-page,
  conditional survey this task needs. The survey is therefore a **UI build**. (I did
  not call create, to avoid littering a junk survey.)
- **Custom-field creation works** via `create_location_custom_field` (the V1 path
  used to build the original 11 BII fields, options supported at create). That is
  how Phase B provisions the new fields.

Net: provision the fields via MCP (Phase B), build the survey in the UI (Phase C).

## 3. Survey Submitted trigger (product behavior)

GHL workflows have a **"Survey Submitted"** trigger, filtered by a specific survey
(mirroring "Form Submitted" filtered by form). So the downstream intake automation
selects this survey by id in the trigger. No material difference from the form
pattern. The survey's public URL and id are captured at build time (Phase C
includes a step and a reference slot), which the Payment Received workflow
(task 7) also needs for emailing the link.

## 4. Standard vs custom field mapping (item 4)

GHL contacts have standard fields that the survey builder exposes in its standard
/ contact group. The relevant ones for this intake:

| intake field | GHL standard? | decision |
|---|---|---|
| First Name, Last Name, Email | Yes (standard) | use standard (these match the submission to the existing contact) |
| Date of Birth | Yes (standard `dateOfBirth`) | **use standard, drop `bii_intake_dob`** |
| Street Address, City, State, Postal Code | Yes (standard `address1`, `city`, `state`, `postalCode`) | **use standard, drop the custom address fields** |
| Age | No standard equivalent | **provision custom** (`bii_intake_age`) |
| Height | No | provision custom (`bii_intake_height`) |
| Weight | No | provision custom (`bii_intake_weight`) |
| Occupation | No | provision custom (`bii_intake_occupation`) |

Caveat (low risk): the `get_location_custom_fields` API returns only custom
fields, so the standard set above is asserted from GHL product behavior, not this
session's API. The `std_billing_address_*` and `gender` entries in the inventory
are **custom** fields (a billing-address mimic and a quiz field), not GHL's
standard contact address or a DOB. If, when building, the survey builder's standard
group is somehow missing Date of Birth or an address field, the fallback is to
provision `bii_intake_dob` (DATE) and `bii_intake_address_*` (TEXT) at that point.
I do not expect this; GHL ships these as standard.

**Age field type:** GHL supports a NUMERICAL custom field (the location already has
one, `bi_score`). Age is a clean integer, so NUMERICAL fits and is the
recommendation. If survey-builder handling of a numerical custom field proves
fiddly, TEXT is the fallback (the task allows either). Height and Weight stay TEXT
because real answers look like `5'10"` or `165 lbs`, not pure numbers.

## 5. Custom-field overlap check (item 5)

No conflict with the planned `bii_intake_*` content fields. Notes:

- `bii_intake_submitted_at` (DATE, id `MqkmwfNRLlrFG4rOtZiI`) already exists in the
  BII folder. It is a **stamp** field (set by automation when the intake is
  submitted), not a survey content field, and its key differs from every planned
  field. No clash, but it means the `bii_intake_` prefix family already has one
  member. The new fields extend that family cleanly.
- The original surface-level BII fields (`bii_location`, `bii_body_state`,
  `bii_hopes`, `bii_why_now`, `bii_anything_else`, `bii_how_heard`,
  `bii_equipment_access`, `bii_program_type`, etc.) do **not** overlap the deeper
  intake fields. No reuse, as expected. (The intake's "general results / specific
  issues / biggest concern" are distinct, deliberately separate from the
  application's `bii_hopes` / `bii_why_now`.)
- A separate, pre-existing generic intake field set exists under a different
  folder (`uGJUOec0olcpDEqF7LZ5`): generic questions such as primary goals, current
  medical conditions, and a free-text "anything else" prompt. These are unrelated,
  not BII, and must **not** be reused. The new BII intake fields are all
  `bii_intake_*` under the BII folder, keeping them cleanly separated.

## 6. Naming conflict (API-confirmed)

`ghl_get_surveys` returned **0 surveys** on the location. There is no survey named
`BII - Client Intake` (there are no surveys at all). No conflict.

## Proposed Phase B field list (36 new custom fields)

After the standard-field reductions (drop DOB and the 4 address fields), the count
is **36** new custom fields, all model `contact`, parentId `pDPx2ONpj6G9ktTqju3l`
(BII folder), `bii_intake_*` prefix, positioned after the existing 11 BII fields.

| group | count | fields |
|---|---|---|
| Personal | 4 | `bii_intake_age` (NUMERICAL, rec.), `bii_intake_height` (TEXT), `bii_intake_weight` (TEXT), `bii_intake_occupation` (TEXT) |
| Goals & concerns | 3 | `bii_intake_general_results`, `bii_intake_specific_issues`, `bii_intake_biggest_concern` (all LARGE_TEXT) |
| Health | 2 | `bii_intake_physician_care` (SINGLE_OPTIONS Yes/No), `bii_intake_physician_explain` (LARGE_TEXT) |
| Self-care | 7 | `bii_intake_care_physical/emotional/recreation/intellectual/relaxation/spiritual/other` (TEXT) |
| Body focus | 2 | `bii_intake_focus_goals` (MULTIPLE_OPTIONS, 4 options), `bii_intake_focus_areas` (LARGE_TEXT) |
| Body history | 6 | `bii_intake_accident` + `_explain`, `bii_intake_broken_bones` + `_explain`, `bii_intake_surgery` + `_explain` (3 SINGLE_OPTIONS Yes/No + 3 LARGE_TEXT) |
| Self-assessment ratings | 12 | `bii_intake_rating_*` (each SINGLE_OPTIONS with options "0".."10") |

Dropped from the original ~32+ list: `bii_intake_dob` (standard DOB) and the four
address fields (standard address). Everything else provisions as listed.

`bii_intake_focus_goals` options: "Improved posture or alignment", "More ease in
movement", "Release of tension", "Relief of aches or pains".

The 12 rating fields each carry options "0", "1", "2", "3", "4", "5", "6", "7",
"8", "9", "10" (the "after" column from the paper form is dropped, "before" kept,
per the spec).

## Net for Phase B

Provision 36 `bii_intake_*` custom fields in the BII folder via
`create_location_custom_field`. Two decisions for your confirmation before I start:

1. **Age as NUMERICAL** (recommended) vs TEXT.
2. **Drop DOB and address custom fields** in favor of GHL standard fields
   (recommended), with the noted fallback if the builder's standard group lacks
   them.

Stop here per the phase gate. Report follows.
