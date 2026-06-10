# BII Custom Fields — Build Result

Date: 2026-06-10. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox`.
Status: **COMPLETE — all 11 fields created and verified inside the BII folder.**

## Folder

- **Name:** `Body Intelligence Institute`
- **Folder ID:** `pDPx2ONpj6G9ktTqju3l`
- Created manually in the GHL UI (Settings -> Custom Fields). Every field below references it as `parentId`.

## Fields (all verified)

Each field was created with `model: contact`, then read back via `get_location_custom_field`. For all 11: `parentId` equals the folder ID, `fieldKey` is the exact `contact.bii_*` key (GHL auto-prefixes `contact.` to the supplied bare key), and picklist options match the spec exactly and in order.

| # | name | GHL id | fieldKey | dataType | options (picklistOptions) |
|---|---|---|---|---|---|
| 1 | Body State | `sZyOg7aYoqQZaXJN59wv` | contact.bii_body_state | LARGE_TEXT | — |
| 2 | Hopes | `eOyVESyLTUK0K4rZUk6y` | contact.bii_hopes | LARGE_TEXT | — |
| 3 | Why Now | `8YycWrZzLn6o5fKRVqeO` | contact.bii_why_now | LARGE_TEXT | — |
| 4 | How Heard | `xVCsFzmADSolxC0LGh9u` | contact.bii_how_heard | SINGLE_OPTIONS | Instagram, Podcast, Referral, Lo Rox Studio, Other |
| 5 | Anything Else | `NDVJvdVRwlYcsfyHy0N5` | contact.bii_anything_else | LARGE_TEXT | — |
| 6 | Location | `TW8Ovn3wkMFpULP5qOdp` | contact.bii_location | TEXT | — |
| 7 | Equipment Access | `JlDJ42dXcbAaekmOpebn` | contact.bii_equipment_access | MULTIPLE_OPTIONS | Roller, Balls, Block, Strap, Rebounder, Sound Tools, None of the above, Other |
| 8 | T&Cs Accepted At | `ZAn6aTP7fW6UX3FYvwu3` | contact.bii_tcs_accepted_at | DATE | — |
| 9 | Intake Submitted At | `MqkmwfNRLlrFG4rOtZiI` | contact.bii_intake_submitted_at | DATE | — |
| 10 | Program Type | `WWPElTlPQHkNY6p3GkvF` | contact.bii_program_type | SINGLE_OPTIONS | Single Session, 3-Series, 10-Series, Virtual Program, Pop-Up, TBD |
| 11 | Studio Access Granted | `My3LKEpkLvtO8p9tuYuW` | contact.bii_studio_access_granted | CHECKBOX | Granted |

## How it appears in GHL UI (Settings -> Custom Fields)

```
Body Intelligence Institute            [folder pDPx2ONpj6G9ktTqju3l]
├─ Body State                          (LARGE_TEXT)
├─ Hopes                               (LARGE_TEXT)
├─ Why Now                             (LARGE_TEXT)
├─ How Heard                           (SINGLE_OPTIONS: Instagram | Podcast | Referral | Lo Rox Studio | Other)
├─ Anything Else                       (LARGE_TEXT)
├─ Location                            (TEXT)
├─ Equipment Access                    (MULTIPLE_OPTIONS: Roller | Balls | Block | Strap | Rebounder | Sound Tools | None of the above | Other)
├─ T&Cs Accepted At                    (DATE)
├─ Intake Submitted At                 (DATE)
├─ Program Type                        (SINGLE_OPTIONS: Single Session | 3-Series | 10-Series | Virtual Program | Pop-Up | TBD)
└─ Studio Access Granted               (CHECKBOX: Granted)
```

## Verification

- **Folder placement:** all 11 read back with `parentId = pDPx2ONpj6G9ktTqju3l`. None at root level.
- **Field keys:** all 11 stored exactly as `contact.bii_*` (the supplied bare key, honored across every datatype used: LARGE_TEXT, TEXT, SINGLE_OPTIONS, MULTIPLE_OPTIONS, DATE, CHECKBOX). No auto-derivation occurred.
- **Options:** the four option fields (How Heard, Equipment Access, Program Type, Studio Access Granted) returned `picklistOptions` matching the spec exactly and in order.
- **Method:** each field verified from its create response and again from a separate `get_location_custom_field` read-back.

## Deviation from original spec

**Field 11 (`bii_studio_access_granted`)** was specified as `CHECKBOX` with no options and a boolean purpose ("whether the year of free Lo Rox Studio access has been provisioned"). GHL's `CHECKBOX` datatype is a **multi-select option group, not a true boolean**, and the API rejects creation without options:

```
GHL API Error (400): Either options or picklistOptionsImage should exists and should not be empty
```

Resolution (approved): created as `CHECKBOX` with a single option `["Granted"]`. It behaves as a binary flag — **ticked = studio access provisioned, unticked = not provisioned.** This is the idiomatic GHL way to model a boolean. Downstream automations should check whether `Granted` is present/ticked rather than expecting a true/false value. (If a strict two-state field is later preferred, `SINGLE_OPTIONS` with `["Granted","Not Granted"]` is the alternative.)

No other field deviates from spec.

## Rollback

To remove everything cleanly.

### 1. Delete the 11 fields (via MCP `ghl-lorox`)

Each call: `delete_location_custom_field` with `locationId: 1W01uH5EthLl1oJRj8Xq` and the `customFieldId` below.

```
delete_location_custom_field  customFieldId=sZyOg7aYoqQZaXJN59wv   # Body State
delete_location_custom_field  customFieldId=eOyVESyLTUK0K4rZUk6y   # Hopes
delete_location_custom_field  customFieldId=8YycWrZzLn6o5fKRVqeO   # Why Now
delete_location_custom_field  customFieldId=xVCsFzmADSolxC0LGh9u   # How Heard
delete_location_custom_field  customFieldId=NDVJvdVRwlYcsfyHy0N5   # Anything Else
delete_location_custom_field  customFieldId=TW8Ovn3wkMFpULP5qOdp   # Location
delete_location_custom_field  customFieldId=JlDJ42dXcbAaekmOpebn   # Equipment Access
delete_location_custom_field  customFieldId=ZAn6aTP7fW6UX3FYvwu3   # T&Cs Accepted At
delete_location_custom_field  customFieldId=MqkmwfNRLlrFG4rOtZiI   # Intake Submitted At
delete_location_custom_field  customFieldId=WWPElTlPQHkNY6p3GkvF   # Program Type
delete_location_custom_field  customFieldId=My3LKEpkLvtO8p9tuYuW   # Studio Access Granted
```

### 2. Delete the folder (GHL UI, not MCP)

The folder must be removed in the **GHL UI** (Settings -> Custom Fields -> Body Intelligence Institute -> delete). The MCP's V2 folder tools (`ghl_delete_custom_field_folder`) reject the `contact` model on this connection (`Api does not support objectKey of type contact or opportunity`), the same limitation documented in `diagnosis.md` and `probe-results.md`. There is no V1 contact folder-delete tool. Delete the 11 fields first, then the empty folder.

> Warning: these deletes are permanent and remove any contact data stored in these fields. Only run a rollback if intentionally tearing down the BII field set.
