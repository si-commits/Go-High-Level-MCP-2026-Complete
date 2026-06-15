# BII Client Intake Fields: Provisioning Result

Date: 2026-06-15. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox`.
Status: **COMPLETE: 36 new `bii_intake_*` fields created in the BII folder and
confirmed from their create responses.**

These are the deeper client-intake fields that the BII - Client Intake survey
writes into. They extend the original 11 BII fields (`bii-custom-fields.md`) and
the existing `bii_intake_submitted_at` stamp field. The application-stage fields
(`bii_location`, `bii_body_state`, `bii_hopes`, `bii_why_now`) are deliberately
separate and not reused here.

## Folder

- **Name:** `Body Intelligence Institute`
- **Folder ID:** `pDPx2ONpj6G9ktTqju3l` (same folder as the original 11 BII fields)
- Every field below was created with `model: contact`, `parentId` = the folder ID,
  an explicit `bii_intake_*` `fieldKey` (GHL auto-prefixes `contact.`), and
  positions assigned by GHL after the existing BII fields.

## Standard fields used instead of custom (per Phase A)

These intake inputs map to GHL standard contact fields, so no custom field was
provisioned for them. In the survey builder, drag them from the standard / contact
field group:

- First Name, Last Name, Email (standard, also used to match the existing contact)
- **Date of Birth** (standard `dateOfBirth`)
- **Street Address** (`address1`), **City** (`city`), **State** (`state`),
  **Postal Code** (`postalCode`)

Fallback: if the survey builder's standard group somehow does not expose Date of
Birth or an address field, provision `bii_intake_dob` (DATE) and
`bii_intake_address_*` (TEXT) at that point. Not expected.

## Fields provisioned (36)

### Personal (4)

| name | id | fieldKey | dataType |
|---|---|---|---|
| Intake - Age | `PdjIzoujVfE26TY7eFal` | contact.bii_intake_age | NUMERICAL |
| Intake - Height | `UOrWdQsefYVpmHe4FCNU` | contact.bii_intake_height | TEXT |
| Intake - Weight | `N9TMvwY7omGw16EUuARH` | contact.bii_intake_weight | TEXT |
| Intake - Occupation | `B9IttlK9v5txRceP3VGJ` | contact.bii_intake_occupation | TEXT |

### Goals and concerns (3)

| name | id | fieldKey | dataType |
|---|---|---|---|
| Intake - General Results | `2aBsQEufVDUOCuSw0Gah` | contact.bii_intake_general_results | LARGE_TEXT |
| Intake - Specific Issues | `0obpkGlg1JnKENUcGzXN` | contact.bii_intake_specific_issues | LARGE_TEXT |
| Intake - Biggest Concern | `Rz5kZZU5DmrQqQIByxQl` | contact.bii_intake_biggest_concern | LARGE_TEXT |

### Health (2)

| name | id | fieldKey | dataType | options |
|---|---|---|---|---|
| Intake - Physician Care | `1dVTGThekU2IMnfFLc5j` | contact.bii_intake_physician_care | SINGLE_OPTIONS | Yes, No |
| Intake - Physician Explain | `WroYBTnv5BLsCVqq91Xl` | contact.bii_intake_physician_explain | LARGE_TEXT | - |

### Self-care (7)

| name | id | fieldKey | dataType |
|---|---|---|---|
| Intake - Care Physical | `ejBqYaZf3fjmiZmrTn6D` | contact.bii_intake_care_physical | TEXT |
| Intake - Care Emotional | `AHqjifioGOLqxwK44xGr` | contact.bii_intake_care_emotional | TEXT |
| Intake - Care Recreation | `i27MRwVLBKpmGH0Cn6sQ` | contact.bii_intake_care_recreation | TEXT |
| Intake - Care Intellectual | `6UojAgYYGRFB4FMWrrff` | contact.bii_intake_care_intellectual | TEXT |
| Intake - Care Relaxation | `cniZsx7kZlcBOZBvUCsZ` | contact.bii_intake_care_relaxation | TEXT |
| Intake - Care Spiritual | `FqScVEVAKbdMwMewvBTP` | contact.bii_intake_care_spiritual | TEXT |
| Intake - Care Other | `EtlwwEzBMVOJVVuBEAvR` | contact.bii_intake_care_other | TEXT |

### Body focus (2)

| name | id | fieldKey | dataType | options |
|---|---|---|---|---|
| Intake - Focus Goals | `b86dyUBAnmboO3lGRWsu` | contact.bii_intake_focus_goals | MULTIPLE_OPTIONS | Improved posture or alignment, More ease in movement, Release of tension, Relief of aches or pains |
| Intake - Focus Areas | `AdX9Wp0w7g8X1TzNGz87` | contact.bii_intake_focus_areas | LARGE_TEXT | - |

### Body history (6)

| name | id | fieldKey | dataType | options |
|---|---|---|---|---|
| Intake - Accident | `naejqLd5tf4LqT7wJUIY` | contact.bii_intake_accident | SINGLE_OPTIONS | Yes, No |
| Intake - Accident Explain | `kLHaIug2GttUWys1La9a` | contact.bii_intake_accident_explain | LARGE_TEXT | - |
| Intake - Broken Bones | `QsQEqOVFUmRz3GxrPiqz` | contact.bii_intake_broken_bones | SINGLE_OPTIONS | Yes, No |
| Intake - Broken Bones Explain | `i5BDXIanjruJxMhvE1jF` | contact.bii_intake_broken_bones_explain | LARGE_TEXT | - |
| Intake - Surgery | `zjW9RXpTI7gzrrs8zC1j` | contact.bii_intake_surgery | SINGLE_OPTIONS | Yes, No |
| Intake - Surgery Explain | `Wix9QzpBJ0nkMpND7iXz` | contact.bii_intake_surgery_explain | LARGE_TEXT | - |

### Self-assessment ratings (12)

All SINGLE_OPTIONS with options "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
"10". The "survey label" column is the page-8 question text the field maps to.

| name | id | fieldKey | survey label |
|---|---|---|---|
| Intake - Rating Appearance | `WFRNrr0FzozsyMLWzH8m` | contact.bii_intake_rating_appearance | Physical Appearance |
| Intake - Rating Health | `lF4WqS7GFQACQ7mviZJv` | contact.bii_intake_rating_health | Health |
| Intake - Rating Presentation | `YcwJY6PMlzA24iAodiSV` | contact.bii_intake_rating_presentation | Presentation |
| Intake - Rating Wellbeing | `i5wxnLTWWCXs90CgyuMa` | contact.bii_intake_rating_wellbeing | Well-being |
| Intake - Rating Energy | `QNjD2BO6pgGvgsDLsxe0` | contact.bii_intake_rating_energy | Energy Level |
| Intake - Rating Sexual Enjoyment | `BLKETXG3eygtUofJ1KzV` | contact.bii_intake_rating_sexual_enjoyment | Sexual Enjoyment |
| Intake - Rating Tension Freedom | `SVSPsygq4eGKaPhHsGnQ` | contact.bii_intake_rating_tension_freedom | Freedom from muscular tension (sense of ease) |
| Intake - Rating Body Awareness | `3NlXMtyvFyycnltMwHqh` | contact.bii_intake_rating_body_awareness | Knowledge or awareness of your body |
| Intake - Rating Stress Ability | `ZaVav5JEyAy7cwbtZUny` | contact.bii_intake_rating_stress_ability | Ability to deal with stress as it arises |
| Intake - Rating Self Esteem | `4R2nD5XlVSmwKVuRKtwH` | contact.bii_intake_rating_self_esteem | Self-esteem |
| Intake - Rating Pain Freedom | `2Xn0KSrvvk37M5XVm2RI` | contact.bii_intake_rating_pain_freedom | Freedom from pain |
| Intake - Rating Emotional Expression | `fhXrHsCH6zzR82RyXwUp` | contact.bii_intake_rating_emotional_expression | Expressing your emotions |

## Verification

- **36 distinct fields created**, each returning `success: true` with a unique id,
  the exact `contact.bii_intake_*` fieldKey, the correct dataType, and (for the
  option fields) the exact picklistOptions echoed back. No silent dedup occurred
  (every create returned a fresh id and a "created successfully" message).
- One provisioning slip during the batch: a duplicate create call for
  `bii_intake_care_intellectual` was issued by mistake and was correctly rejected
  by GHL (`already exists`). It created nothing extra; `bii_intake_care_intellectual`
  exists exactly once (`6UojAgYYGRFB4FMWrrff`).
- Option-field spot checks from the create responses: `bii_intake_physician_care`,
  `bii_intake_accident`, `bii_intake_broken_bones`, `bii_intake_surgery` each
  returned `["Yes", "No"]`; `bii_intake_focus_goals` returned the four focus
  options; all 12 `bii_intake_rating_*` returned `["0" .. "10"]`.

## Rollback

To remove these 36 fields, call `delete_location_custom_field` with
`locationId: 1W01uH5EthLl1oJRj8Xq` and each id above. They are applied to zero
contacts at provisioning time, so deleting them removes only the dictionary
entries. Do not delete the original 11 BII fields or `bii_intake_submitted_at`
(those are separate and in use).
