# BII Custom Fields — Diagnosis (read-only)

Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox`. Date: 2026-06-10.

**No writes were made to GHL.** This document is the pre-write diagnosis you asked to review before anything is created.

---

## TL;DR / headline finding

**The task as specified is not currently buildable through the exposed MCP tools.** Contact custom fields on this connection can only be created as *plain* fields. Through the available tools you cannot, for the `contact` model:

1. create a custom field **folder**,
2. **place a field in a folder**, or
3. set **picklist options** (for `SINGLE_OPTIONS` / `MULTIPLE_OPTIONS`).

This is evidenced below with exact errors and tool schemas. There is a cheap next step (a single create-then-delete folder probe) that would definitively confirm or lift part of the blocker. I have not run it because you asked for no writes before confirmation.

There are **no naming conflicts** with your proposed fields, and there is an **existing folder already holding four `BI ...` fields** that is very likely "Body Intelligence" related — you should decide whether the new fields join it or live in a fresh `Body Intelligence Institute` folder.

---

## 1. Tool surface — what actually exists for custom fields

There are two distinct families on `ghl-lorox`:

### V1 family — `*_location_custom_field` (works for contacts, thin)

| Tool | Purpose | Param shape (verified via introspection) |
|---|---|---|
| `get_location_custom_fields` | list contact/opportunity fields | `locationId`, `model` (contact \| opportunity \| all) |
| `get_location_custom_field` | read one field | `locationId`, `customFieldId` |
| `create_location_custom_field` | create field | `locationId`, `name`, `dataType`, `model`, `placeholder`, `position` — **no `parentId`, no `options`** |
| `update_location_custom_field` | update field | `locationId`, `customFieldId`, `name`, `placeholder`, `position` — **no `parentId`, no `options`** |
| `delete_location_custom_field` | delete field | `locationId`, `customFieldId` |

**Critical gap:** neither create nor update exposes `options` or `parentId`. So a contact field made through these tools is always optionless and lands in a default folder you cannot choose. There is **no V1 folder tool at all** (no create/list/update/delete folder for the contact model).

### V2 family — `ghl_*custom_field*` (folders + options, but custom-objects/company only)

| Tool | Purpose | Supports folder/options? | Works for `contact`? |
|---|---|---|---|
| `ghl_get_custom_fields_by_object_key` | list fields + folders | yes | **No** |
| `ghl_get_custom_field_by_id` | read field/folder | yes | **No** |
| `ghl_create_custom_field` | create field | yes — has `parentId` + `options` + full `dataType` enum | **No (untested for write, see below)** |
| `ghl_create_custom_field_folder` | create folder | yes | **No (untested for write)** |
| `ghl_update_custom_field_folder` | rename folder | yes | n/a |
| `ghl_delete_custom_field` / `ghl_delete_custom_field_folder` | delete | yes | n/a |

`ghl_create_custom_field` *does* carry exactly the params this task needs (`parentId`, `options[]`, and a `dataType` enum of `TEXT, LARGE_TEXT, NUMERICAL, PHONE, MONETORY, CHECKBOX, SINGLE_OPTIONS, MULTIPLE_OPTIONS, DATE, TEXTBOX_LIST, FILE_UPLOAD, RADIO, EMAIL`). The problem is purely that its route does not accept the `contact` model.

### Evidence (exact errors, all read-only calls)

- `ghl_get_custom_fields_by_object_key(objectKey:"contact")` →
  `GHL API Error (400): Api does not support objectKey of type contact or opportunity`
- `ghl_get_custom_field_by_id(id:"kEo2k0gsCFTFv0djXiO7")` →
  `GHL API Error (400): Fields with model contact is not supported on this route`
- `ghl_get_custom_field_by_id(id:"uGJUOec0olcpDEqF7LZ5")` → same error.

These are GHL **API-level** errors (not just IAM), and they are consistent across three calls. The V2 custom-objects routes are built for `custom_object.*` and `company`, not `contact`/`opportunity`. (Separately, in the earlier smoke test, `ghl_create_survey` failed with an IAM "route not yet supported" error — this connection has known route gaps.)

### V1 vs V2 — summary of the difference that matters here

- **V1** = the legacy `/locations/{id}/customFields` surface. Handles the `contact` model, but the MCP wrapper only forwards name/type/placeholder/position. The underlying GHL V1 API *does* store `picklistOptions` and `parentId` (we can see them on existing fields), so the capability exists at the API but is **not exposed by the wrapper**.
- **V2** = the newer `/custom-fields` + `/custom-fields/folder` surface scoped by `objectKey`. Supports folders/options richly, but **rejects `contact`/`opportunity`** on this connection.

The net is a capability gap: the tool that can do folders+options can't touch contacts, and the tool that can touch contacts can't do folders+options.

---

## 2. Existing custom fields on the location

`get_location_custom_fields` returned **42 contact fields**. Folder display names are **not retrievable** through any available tool (the V1 list returns only `documentType: "field"`, and the V2 by-id route rejects contact folders), so folders below are identified by their `parentId` and characterised by their contents.

| Folder `parentId` | Likely meaning | Fields (name — dataType) |
|---|---|---|
| `uGJUOec0olcpDEqF7LZ5` | Application / intake questions | If yes please specify (TEXT); Gender: (SINGLE_OPTIONS); Preferred Appointment Time: (SINGLE_OPTIONS); Do you have any medical conditions or injuries... (SINGLE_OPTIONS); Do you have any specific concerns... (TEXT); Yes please specify: (TEXT); Which services are you most interested in... (MULTIPLE_OPTIONS); Other (Please specify): (TEXT); What are your primary wellness goals? (MULTIPLE_OPTIONS); Are you currently on any medications... (SINGLE_OPTIONS); Is there anything else... (LARGE_TEXT); uscreen_payload (LARGE_TEXT) |
| `zxENU1GDPtkpGh7B2peu` | Uscreen / subscription | Uscreen Subscription ID; Uscreen Last IP Address; Uscreen Subscription Status; Uscreen Status; Uscreen Signup Origin; Uscreen User ID; Uscreen Subscription Title; Uscreen Lifetime Spent (MONETORY); Subscription Start Date (DATE); Subscription Canceled At (DATE); Last Order Paid |
| `kEo2k0gsCFTFv0djXiO7` | **"BI ..." — very likely Body Intelligence** | BI Score (NUMERICAL); BI Intro (LARGE_TEXT); BI Latest Result Link (TEXT); BI Profile Link (TEXT) |
| `aNoG8C4SzMFufGCRFcyE` | Billing address | Billing Address - Full Name / Phone / Full Address / Country / State / Zip Code / City (all TEXT) |
| `VFMMVQCuZ9HpPOCzaSql` | Temp tags | Temp Tag; Temp Tag 2; Temp Tag 3 (all TEXT) |
| `XoYFnOADBudJTCvVk5T4` | Inquiry | Reason for Inquiry (MULTIPLE_OPTIONS); Message (LARGE_TEXT) |
| `k2y71gfOWXtcBgC3Da0j` | Misc / test | Checkbox 1plu (CHECKBOX); Single Dropdown 13f6 (SINGLE_OPTIONS) |
| `CPsExX3DDTUPpdTm0qkN` | (single field) | Lifetime Value (MONETORY) |

**BII-relevant flag:** folder `kEo2k0gsCFTFv0djXiO7` already groups four `BI ...` fields. "BI" plausibly = "Body Intelligence". Before creating a new `Body Intelligence Institute` folder, confirm whether these are the same initiative and whether the new fields should join this folder rather than a new one. (Note: I cannot read this folder's display name via the API, and I cannot move fields between folders via the API either.)

---

## 3. Naming-conflict check (proposed vs existing)

Case-insensitive comparison of your 11 proposed field **names** against all 42 existing names:

| Proposed name | Conflict? |
|---|---|
| Body State | none |
| Hopes | none |
| Why Now | none |
| How Heard | none |
| Anything Else | none |
| Location | none |
| Equipment Access | none |
| T&Cs Accepted At | none |
| Intake Submitted At | none |
| Program Type | none |
| Studio Access Granted | none |

**No name conflicts.** Note however that GHL also derives a `fieldKey` automatically from the name on the V1 create path (e.g. earlier test "ZZ MCP Test" became `contact.zz_mcp_test`). The V1 create tool does **not** let you supply your own `fieldKey` — so your intended keys (`bii_body_state`, etc.) would not be honoured; you would get auto-derived keys like `contact.body_state`. This is another reason the V1 path is unsuitable if exact `fieldKey` control matters (you flagged that it does).

---

## 4. Datatype mapping verification

Your table's datatype strings were checked against the `dataType` enum the MCP actually accepts (from `ghl_create_custom_field`):

| Your value | Accepted by MCP enum? | Notes |
|---|---|---|
| `LARGE_TEXT` | yes | not `TEXTAREA` |
| `TEXT` | yes | |
| `SINGLE_OPTIONS` | yes | not `RADIO` (RADIO is a separate enum value) |
| `MULTIPLE_OPTIONS` | yes | |
| `DATE` | yes | |
| `CHECKBOX` | yes | |

Good news: **your datatype strings are exactly correct** for this MCP. The catch is that this verified enum belongs to the V2 tool that won't accept `contact`.

---

## 5. The blocker, stated precisely

To satisfy all hard requirements (dedicated `Body Intelligence Institute` folder, every field inside it, exact `fieldKey`s, and real picklist options on the two option fields), you need, for the `contact` model:

- a folder-create call → **no tool can do this for contacts** (V1 has none; V2 rejects contact),
- per-field `parentId` assignment → **no contact tool exposes it**,
- per-field `options[]` → **no contact tool exposes it**,
- custom `fieldKey` control → **V1 auto-derives it; not settable**.

So a faithful build is **blocked** on the current tool surface.

---

## 6. Options / recommended path (your call — nothing done yet)

**Option A — one-call write probe (recommended first step, ~1 min).**
With your go-ahead, run a single `ghl_create_custom_field_folder(objectKey:"contact", name:"ZZ BII Probe")` and, if it succeeds, immediately delete it. Reads are gated for contact, but writes have not been tested; if the write path actually accepts `contact`, the entire V2 build (folder + fields + options + custom keys) becomes possible and we proceed in full. If it returns the same "objectKey of type contact" error, the V2 path is conclusively dead and we move to B/C.

**Option B — server-side fix (cleanest durable fix).**
Extend the `ghl-lorox` MCP's V1 contact-field tooling to forward `options`, `parentId`, and a caller-supplied `fieldKey` to GHL's `/locations/{id}/customFields` API, and add a contact folder-create tool. The underlying GHL V1 API supports these (existing fields demonstrably carry `picklistOptions` and `parentId`); only the wrapper under-exposes them. Best if `ghl-lorox` is maintainable by us. Note: whether GHL's public V1 API exposes *folder creation* for contacts needs confirming — folders may only be creatable in the GHL UI.

**Option C — hybrid (unblock today, minimal manual).**
You (or Aya) create the `Body Intelligence Institute` folder once in GHL UI (Settings → Custom Fields → New Folder). Even then, the API still can't place fields into it or set options, so the fields would also need to be created in the UI. This is effectively a manual build with the diagnosis as the spec. Reliable, but not automated.

**Option D — degraded API-only (NOT recommended).**
Create all 11 via V1 `create_location_custom_field` as plain fields. Consequences: option fields lose their picklists (become plain text or unusable), all fields land in a default folder (violates the dedicated-folder requirement), and `fieldKey`s are auto-derived (e.g. `contact.body_state` not `bii_body_state`). Fails three of your hard requirements; listed only for completeness.

**Recommendation:** run **Option A** first (cheap, definitive). If it works → full V2 build. If not → decide between **B** (if we own the MCP server) and **C** (fastest manual unblock).

---

## 7. Open questions for you

1. Are the existing `BI ...` fields (folder `kEo2k0gsCFTFv0djXiO7`) the same "Body Intelligence" initiative? Should the new fields join that folder instead of a new `Body Intelligence Institute` folder?
2. May I run the Option A probe (create-then-delete one throwaway contact folder) to settle whether the V2 write path accepts contacts?
3. Is the `ghl-lorox` MCP server maintainable by us (i.e. is Option B on the table), or is it a fixed external dependency?
4. How firm is the exact-`fieldKey` requirement (`bii_*`)? It materially affects which path is viable, since the V1 path auto-derives keys.

**No fields or folders have been created. Awaiting your confirmation before any write.**
