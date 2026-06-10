# V2 Write Probe — Results

Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox`. Date: 2026-06-10.
Purpose: settle whether the V2 `ghl_*custom_field*` route accepts **write** operations on the `contact` model (reads were already confirmed gated in `diagnosis.md`).

## Verdict

**V2 is conclusively dead for the `contact` model — writes included.** Both a folder-create and a field-create were rejected at the `objectKey` layer with the same API-level error. The V2 path cannot build the BII fields. **Nothing was created; nothing needed deleting.**

## What was attempted (in order)

### 1. V2 folder create — REJECTED
Call: `ghl_create_custom_field_folder(locationId:"1W01uH5EthLl1oJRj8Xq", objectKey:"contact", name:"ZZ BII Probe")`
Result:
```
GHL API Error (500): GHL API Error (400): Api does not support objectKey of type contact or opportunity
```
No folder created, so no `parentId` was available for the field step.

### 2. V2 field create (with options + custom fieldKey) — REJECTED
Because no throwaway folder exists, this was run with a **deliberately fake** `parentId` (`000000000000000000000000`) so that, if `objectKey:"contact"` were somehow accepted, the call would fail on the bad folder rather than create a real field in a real folder. It never got that far.

Call: `ghl_create_custom_field(locationId:"1W01uH5EthLl1oJRj8Xq", objectKey:"contact", parentId:"0000...", fieldKey:"contact.zz_bii_probe_field", name:"ZZ BII Probe Field", dataType:"SINGLE_OPTIONS", options:[{key:"option_a",label:"Option A"},{key:"option_b",label:"Option B"}])`
Result:
```
GHL API Error (500): GHL API Error (400): Api does not support objectKey of type contact or opportunity
```
The error is the same `objectKey` rejection — validation fails on `objectKey:"contact"` **before** the fake `parentId` or the options are evaluated. So we learned the route rejects contact unconditionally on write; we did not (and could not) confirm whether its `options`/`parentId`/`fieldKey` handling would otherwise work for contacts, because contact never passes the door.

## What works vs what doesn't (contact model, this connection)

| Capability | V1 `*_location_custom_field` | V2 `ghl_*custom_field*` |
|---|---|---|
| Create plain contact field | ✅ (smoke-tested earlier) | ❌ rejects `contact` |
| Set custom `fieldKey` | ❌ auto-derived | ❌ rejects `contact` |
| Set picklist `options` | ❌ not exposed | ❌ rejects `contact` |
| Assign field to a folder (`parentId`) | ❌ not exposed | ❌ rejects `contact` |
| Create a folder | ❌ no tool | ❌ rejects `contact` |
| Read fields | ✅ | ❌ rejects `contact` |
| Read folders (names) | ❌ (V1 returns fields only) | ❌ rejects `contact` |

The `contact` (and `opportunity`) models are simply not served by the V2 custom-objects routes on this MCP. This is an API-level limitation, consistent across 5 calls now (2 reads in diagnosis, 1 read-by-id ×2, and these 2 writes).

## Cleanup

None required. No folder and no field were created at any point. No existing record was touched.

## Recommendation / decision needed

The V2 route is ruled out. The faithful build (dedicated `Body Intelligence Institute` folder + 11 fields inside it + exact `bii_*` keys + real options on the two option fields) is therefore **not possible through the MCP as it ships today.** Since you confirmed we own the fork (deployed locally to si-commits), the clean path is:

**Extend the V1 contact-field tooling in the `ghl-lorox` server** to forward the params GHL's V1 `/locations/{id}/customFields` API already supports but the wrapper hides:
- `options` (picklist values) on create/update,
- caller-supplied `fieldKey`,
- `parentId` (folder assignment) on create/update,
- and add a contact folder-create tool (verify GHL's V1 API actually exposes folder creation for contacts — the existing contact folders prove folders *exist*, but the create endpoint for them needs confirming; if the API has no contact-folder create, the folder is a one-time GHL-UI step and the wrapper only needs `parentId` support to drop fields into it).

This is paused here for your decision, as instructed. **No further writes until you confirm the build path.** Open question to resolve before coding the wrapper: does GHL's public V1 API support *creating* a contact custom-field folder, or only assigning `parentId` to an existing (UI-created) one?
