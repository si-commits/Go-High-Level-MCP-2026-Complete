# Wrapper Extension — `create_location_custom_field` (V1 contact fields)

Date: 2026-06-10. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox` (fork, local stdio deploy).
Goal (Option B): extend the V1 contact-field create tool to pass through `parentId`, `options`, and `fieldKey`, which GHL's `POST /locations/{id}/customFields` (API 2.0, `services.leadconnectorhq.com`) already supports but the wrapper was hiding.

## Result: PASSTHROUGH CONFIRMED for all three params

The live smoke test (driving the rebuilt `dist` client directly against production, throwaway fields, all deleted) confirms GHL honors all three. The wrapper is ready for the real BII build once the MCP connection is restarted.

---

## Changes made

Two source files, all additions optional and backward compatible:

### 1. `src/types/ghl-types.ts`
- `GHLCreateCustomFieldRequest` (the API request body type): added optional `parentId?: string`, `fieldKey?: string`, `options?: string[]`.
- `MCPCreateCustomFieldParams` (the MCP-facing params type): added the same three optional fields.

### 2. `src/tools/location-tools.ts`
- `create_location_custom_field` tool `inputSchema`: added `parentId`, `fieldKey`, and `options` (array of strings) properties with descriptions. None added to `required`.
- Updated the tool `description` to mention folder placement, picklist options, and explicit field key, so MCP introspection surfaces the new capability.

No handler change was needed: `createLocationCustomField` already does `const { locationId, ...fieldData } = params` and forwards `fieldData` straight to the client, which POSTs it as the request body. New optional params flow through automatically; when omitted they are absent from the body (axios drops undefined), so existing callers are unaffected.

### Build / typecheck
- `npx tsc --noEmit` -> exit 0 (clean).
- `npm run build` -> exit 0. `dist/tools/location-tools.js` confirmed to contain the new `parentId` schema.

---

## Smoke test (live, throwaway, all cleaned up)

Driven against the COMPILED `dist` client (so it tests our wrapper's passthrough, not just the raw API). Three probes:

### Probe A — all three params, FAKE parentId `00000000-0000-0000-0000-000000000000`
- GHL responded `400: The parentId is invalid.`
- **Interpretation:** the wrapper forwarded `parentId` and GHL validated it. **`parentId` passthrough confirmed.** No field created (nothing to clean up). A real folder ID will place the field in that folder.

### Probe B — `options` + `fieldKey`, no parentId
- Created (HTTP 201). Read back. Result:
  - `picklistOptions: ["Alpha","Beta","Gamma"]` exactly as requested -> **`options` passthrough confirmed and honored.**
  - landed in the location default folder `parentId: uGJUOec0olcpDEqF7LZ5` (no parentId supplied).
  - `fieldKey: contact.zz_bii_smoke_b` — but this was inconclusive for fieldKey, because the requested key happened to equal the name's auto-derivation. Resolved by Probe C.
- Field deleted (HTTP 200).

### Probe C — `fieldKey` disambiguation (name and fieldKey deliberately different)
- Requested `name: "ZZ BII Smoke C"` (would auto-derive to `contact.zz_bii_smoke_c`) with `fieldKey: "bii_distinct_probe_key"`.
- GHL stored `fieldKey: contact.bii_distinct_probe_key` (the requested key), NOT the auto-derived one.
- **Interpretation: `fieldKey` is HONORED.** Field deleted (HTTP 200).

### Cleanup
All throwaway fields deleted (Probe A never created one; B and C both deleted, HTTP 200). No `ZZ BII Smoke` fields remain. No existing record was touched. The two temporary smoke scripts were removed from `scripts/`.

---

## Behaviours to bake into the real BII build

1. **`fieldKey` gets a `contact.` prefix automatically.** Requesting `fieldKey: "bii_body_state"` yields the stored key `contact.bii_body_state`. So pass the bare `bii_*` keys (no `contact.` prefix); GHL adds it. This matches the existing convention (all 42 existing fields are `contact.*`).
2. **`options` is a plain array of strings**, e.g. `["Instagram","Podcast","Referral","Lo Rox Studio","Other"]`. The GET response echoes them as `picklistOptions`.
3. **`parentId` must be a real folder ID** (GHL validates it). This is why you are creating the `Body Intelligence Institute` folder in the GHL UI and giving me its ID before the build.
4. **`dataType` strings** confirmed accepted by this V1 endpoint: `TEXT`, `SINGLE_OPTIONS` (and by the diagnosis, `LARGE_TEXT`, `MULTIPLE_OPTIONS`, `DATE`, `CHECKBOX`). Same enum your spec used.

---

## Action required before the build: restart the MCP

`ghl-lorox` is a **stdio** server (`node dist/server.js`) that Claude Code spawns per session. The dist is rebuilt, but the server process this session is connected to is still running the old code, and the tool schema Claude sees was loaded at session start. The new `parentId` / `options` / `fieldKey` params will not be visible to the `mcp__ghl-lorox__create_location_custom_field` tool until the MCP connection is restarted.

**You need to reconnect the MCP** (e.g. `/mcp` reconnect, or restart Claude Code) so the updated tool surface is live. The smoke test above did not need this because it called the rebuilt `dist` directly, but the real build should run through the proper MCP tool.

---

## Status: PAUSED for your go-ahead

Wrapper extended, built, and proven against a live throwaway test. Awaiting two things from you before the real build:
1. The `Body Intelligence Institute` folder ID (created in GHL UI).
2. A restart/reconnect of the `ghl-lorox` MCP so the new params are exposed to the build.

No production BII fields have been created. Nothing committed yet (source edits are staged in the working tree only).
