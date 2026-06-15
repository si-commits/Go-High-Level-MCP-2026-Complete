# BII Client Intake Survey: GHL UI Walkthrough

A multi-step Survey (not a Form), built by hand in the GoHighLevel UI. It collects
Lo's full client intake across 8 pages and writes every answer onto the contact
record. Follow it top to bottom. Every field to add is named inline, so you do not
need another file open.

## Why this is a Survey, and why manual

A Survey is used (not a Form) because it gives multi-page progression with a
progress bar and conditional logic, which the intake needs for its four
"If yes, please explain" follow-ups. The survey is built in the GHL UI: the MCP
can read surveys but cannot build a multi-page, conditional survey, so this is a
hand build. The 36 custom fields it writes into were already provisioned (see
`bii-intake-fields.md`).

## Three critical reminders (read before you start)

1. **Drag existing fields only.** For every BII field, drag it from the Custom
   Fields panel, under the `Body Intelligence Institute` folder. **Never click
   "Add Custom Field"**: that creates a brand new duplicate field per survey and
   breaks the contact record and all downstream automation. There are 36 BII
   fields to drag here, so this rule matters more than anywhere else. You are
   always selecting an existing field, never creating one.
2. **Use GHL standard fields** for First Name, Last Name, Email, Date of Birth,
   Street Address, City, State, and Postal Code. These come from the standard /
   contact field group in the builder, not from Custom Fields. (Fallback: if the
   standard group somehow lacks Date of Birth or an address field, provision
   `bii_intake_dob` / `bii_intake_address_*` per the note in `bii-intake-fields.md`.
   Not expected.)
3. **Match the field, then set the label.** When you drag a custom field on, its
   label defaults to the GHL field name (for example "Intake - Age"). Change the
   displayed label to the question text given in each step. The underlying field
   mapping is what matters; the label is just what the client reads.

## Pre-flight checklist

1. The 36 `bii_intake_*` fields exist in the `Body Intelligence Institute` folder
   (Settings then Custom Fields). They are named `Intake - ...` (for example
   "Intake - Age", "Intake - Rating Health").
2. The standard contact fields (First/Last Name, Email, Date of Birth, address
   fields) are available in the survey builder's standard group.
3. You know where to capture the survey URL and id at the end (a step is included).

## Navigate to a new survey

1. In the GHL left sidebar, click "Sites".
2. Click the "Surveys" tab.
3. Click the "Builder" sub-tab.
4. Click "+ Add Survey" (or "Create New Survey"). Choose a blank survey. The survey
   builder opens.

## Name the survey and turn on multi-page

1. Click the survey name field at the top of the builder and type exactly:
   `BII - Client Intake`
2. Open the survey's Styles or Options panel and enable the progress bar / step
   indicator (often labeled "Show progress bar" or a "Slider" style). This gives
   the page-by-page progression.
3. Pages are created by adding a new slide / page in the builder (look for "Add
   Page", "Add Slide", or a page-break element at the bottom of the canvas). Each
   of the 8 sections below is its own page. Add pages as you go.

A note on page headers: at the top of each page, drag a Text or Heading element and
type the header given for that page.

---

## Page 1: Identification

Header: `Thank you for booking with Lo. To get the most from your session, please complete this intake before we meet.`

Fields (all standard, from the standard / contact group):

1. First Name. Label: `First Name`. Required: ON.
2. Last Name. Label: `Last Name`. Required: ON.
3. Email. Label: `Email`. Required: ON. (Email is what matches this submission to
   the client's existing contact, so it must be the email already on their
   record.)

## Page 2: About you

Header: `A few details about you.`

1. Drag custom field "Intake - Age". Label: `Age`. Required: ON.
2. Add standard field Date of Birth. Label: `Date of Birth`. Required: ON.
3. Drag custom field "Intake - Height". Label: `Height`. Required: ON.
4. Drag custom field "Intake - Weight". Label: `Weight`. Required: ON.
5. Drag custom field "Intake - Occupation". Label: `Occupation`. Required: OFF.
6. Add standard field Street Address. Label: `Street Address`. Required: OFF.
7. Add standard field City. Label: `City`. Required: OFF.
8. Add standard field State. Label: `State`. Required: OFF.
9. Add standard field Postal Code. Label: `Postal Code`. Required: OFF.

## Page 3: What you want from this work

Header: `What you are hoping for, and why now.`

1. Drag custom field "Intake - General Results" (a paragraph field). Label:
   `What general results do you want from the sessions?`. Required: ON.
2. Drag custom field "Intake - Specific Issues" (paragraph). Label:
   `What specific physical or emotional issues would you like to address?`.
   Required: ON.
3. Drag custom field "Intake - Biggest Concern" (paragraph). Label:
   `What is your biggest concern right now?`. Required: ON.

## Page 4: Health context

Header: `Anything Lo should know about your current health.`

1. Drag custom field "Intake - Physician Care" (Yes/No single-select). Label:
   `Are you currently, or in the past 6 months, under the care of a physician or other healthcare professional?`.
   Required: ON.
2. Drag custom field "Intake - Physician Explain" (paragraph). Label:
   `If yes, please explain`. Required: OFF. **Conditional: show only if "Intake -
   Physician Care" is Yes** (see "How to set conditional logic" below).

## Page 5: Current self-care

Header: `How are you currently caring for your body and mind? Fill in what applies, leave blank what does not.`

All optional (Required: OFF for every field on this page):

1. Drag "Intake - Care Physical". Label: `Physical`.
2. Drag "Intake - Care Emotional". Label: `Emotional`.
3. Drag "Intake - Care Recreation". Label: `Recreation`.
4. Drag "Intake - Care Intellectual". Label: `Intellectual`.
5. Drag "Intake - Care Relaxation". Label: `Relaxation`.
6. Drag "Intake - Care Spiritual". Label: `Spiritual`.
7. Drag "Intake - Care Other". Label: `Other`.

## Page 6: Body focus

Header: `What you want this work to address, and where in your body.`

1. Drag custom field "Intake - Focus Goals" (a multi-select). Label:
   `What are you hoping to address?`. Required: ON. Its options come from the field
   (confirm they read: Improved posture or alignment, More ease in movement,
   Release of tension, Relief of aches or pains). Do not retype them.
2. Drag custom field "Intake - Focus Areas" (paragraph). Label:
   `Where in your body?`. Required: ON. Set its placeholder text to:
   `e.g. lower back, shoulders, hips, knees`

## Page 7: Body history

Header: `Anything significant from your body's history.`

1. Drag "Intake - Accident" (Yes/No). Label:
   `Have you ever had a serious accident?`. Required: ON.
2. Drag "Intake - Accident Explain" (paragraph). Label: `If yes, please explain`.
   Required: OFF. **Conditional: show only if "Intake - Accident" is Yes.**
3. Drag "Intake - Broken Bones" (Yes/No). Label:
   `Have you ever had broken bones?`. Required: ON.
4. Drag "Intake - Broken Bones Explain" (paragraph). Label: `If yes, please explain`.
   Required: OFF. **Conditional: show only if "Intake - Broken Bones" is Yes.**
5. Drag "Intake - Surgery" (Yes/No). Label: `Have you ever had major surgery?`.
   Required: ON.
6. Drag "Intake - Surgery Explain" (paragraph). Label: `If yes, please explain`.
   Required: OFF. **Conditional: show only if "Intake - Surgery" is Yes.**

## Page 8: Self-assessment

Header: `Please rate each item from 0 to 10, where 10 is highest and 0 is lowest. This is a baseline before our work together.`

All 12 are required, single-select dropdowns with options 0 to 10 (the options come
from each field; do not retype them). Drag each field and set its label:

1. "Intake - Rating Appearance". Label: `Physical Appearance`.
2. "Intake - Rating Health". Label: `Health`.
3. "Intake - Rating Presentation". Label: `Presentation`.
4. "Intake - Rating Wellbeing". Label: `Well-being`.
5. "Intake - Rating Energy". Label: `Energy Level`.
6. "Intake - Rating Sexual Enjoyment". Label: `Sexual Enjoyment`.
7. "Intake - Rating Tension Freedom". Label: `Freedom from muscular tension (sense of ease)`.
8. "Intake - Rating Body Awareness". Label: `Knowledge or awareness of your body`.
9. "Intake - Rating Stress Ability". Label: `Ability to deal with stress as it arises`.
10. "Intake - Rating Self Esteem". Label: `Self-esteem`.
11. "Intake - Rating Pain Freedom". Label: `Freedom from pain`.
12. "Intake - Rating Emotional Expression". Label: `Expressing your emotions`.

> **If 12 ratings on one page feels too long** in the builder, split this into two
> pages of 6: Page 8a with ratings 1 to 6 (header above), and Page 8b with ratings
> 7 to 12 (a short header like `A few more to rate, same 0 to 10 scale.`). The
> field mapping is identical either way.

## How to set conditional logic (the four "If yes, please explain" fields)

Each explain field should appear only when its Yes/No question is answered Yes. The
Yes/No field is placed immediately before its explain field on the same page, which
is what conditional logic needs.

For each of the four explain fields (Physician Explain, Accident Explain, Broken
Bones Explain, Surgery Explain):

1. Click the explain field on the canvas to select it.
2. Open its Conditional Logic setting (in the field's settings panel; it may be
   labeled "Conditional Logic", "Logic", or shown as a branching icon).
3. Choose to **Show** the field **if** a condition is met.
4. Set the condition: the controlling field is the matching Yes/No question (for
   example "Intake - Physician Care"), the operator is `is` / `is equal to`, and the
   value is `Yes`.
5. Save the logic. The explain field will now stay hidden until the client picks
   Yes on its question.

Why the explain fields are not required: a required field that is hidden by logic
can block submission in some builders. Leaving them optional avoids that entirely.
GHL generally skips required validation on a hidden field, so if Lo later wants an
explanation to be mandatory when shown, you can turn Required on for these and rely
on that behavior. Optional is the safe default.

## Inline thank-you message

1. Open the survey's settings / On Submit behavior.
2. Choose the inline message / thank-you message option (not a redirect).
3. Type: `Thank you. Your intake has landed with Lo. She will read it before your session.`

## Save and publish

1. Click Save (top right).
2. Publish the survey so it is live (the builder has a Save and a Publish control;
   make sure it reads Published).

## Capture the survey URL and id (needed downstream)

1. Open the survey's Share / Integrate option (top right) and copy the public URL.
2. Note the survey id (it appears in the share link and in the survey list).
3. Record both in the table below. They are needed for the Payment Received
   workflow (Phase 2 task 7), which emails this link to clients after they pay, and
   for the later Notion sync work.

| item | value |
|---|---|
| Survey name | BII - Client Intake |
| Survey id | _fill in_ |
| Public URL | _fill in_ |

---

# Verification (after publishing)

1. Open the survey's public URL in a private browser window, using the **same email
   that is already on your own existing contact** (so you can confirm it updates,
   not duplicates).
2. Progress through all 8 pages and confirm the progress indicator advances page by
   page.
3. On Page 4 and Page 7, confirm the conditional fields behave: the "If yes, please
   explain" box stays hidden until you choose Yes, and appears when you do. Test all
   four (physician care, accident, broken bones, surgery).
4. Complete and submit. Confirm the inline thank-you message displays.
5. In GHL, open your contact and confirm it was **updated, not duplicated**, and
   that the new field values landed: the Page 2 to 7 answers in their `bii_intake_*`
   fields, and the standard fields (DOB, address) on the contact.
6. Confirm the 12 ratings populated, and that each stored a value from `0` to `10`
   (open the rating fields on the contact and check the stored value is the number
   you picked).

If a contact was duplicated instead of updated, the Email field mapping is the
likely cause (it must map to the standard Email field). If a `bii_intake_*` field
is empty when you filled it, check that the survey question was the dragged
existing field and not an accidental "Add Custom Field" duplicate.

# Downstream dependency

The survey's public URL and id (captured above) feed the **Payment Received
workflow (Phase 2 task 7)**, which emails the intake link to a client after they
pay, and the later **Notion sync** work. Capture them at publish time so those
tasks are not blocked.

# Rollback

To take the survey offline without deleting it: open it in Sites then Surveys then
Builder, and toggle it from Published back to Draft (or unpublish). To delete it,
use its three-dot menu then Delete. Deleting the survey does not delete the
`bii_intake_*` custom fields or any contact data already collected; it only removes
the survey.
