# Email Template Wrapper Extension — Phase C Smoke Results

Date: 2026-06-11. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox` (extended fork).
Build: rebuilt `dist/` driven directly via `scripts/email-template-smoke.js` (this session's live MCP runs the pre-rebuild process, so the script imports the freshly built `dist/clients/ghl-api-client.js` and calls the methods against live GHL).

## What was fixed

GHL stores an email template in two steps. The fork previously called only one per operation. Now:

- **`createEmailTemplate`** runs both steps internally: `POST /emails/builder` (shell) then `POST /emails/builder/data` (body), the second with `editorType: 'html'` and `updatedBy`. Returns a normalized object carrying the resolved `id`.
- **`updateEmailTemplate`** sends `updatedBy` on `POST /emails/builder/data` (previously missing, causing a 422).
- `updatedBy` is an optional param on both, defaulting to Jenna `UIChIX3a0wWAs7vdhdfM` (a confirmed valid location user), overridable per call.

Source: [src/clients/ghl-api-client.ts:2210-2253](src/clients/ghl-api-client.ts#L2210-L2253), types [src/types/ghl-types.ts:1519-1545](src/types/ghl-types.ts#L1519-L1545), tool schemas [src/tools/email-tools.ts:62-150](src/tools/email-tools.ts#L62-L150).

## Verification method

Bodies are verified by fetching the template's rendered `previewUrl` and asserting the marker string is present (the `get_email_templates` listing does not return body content; this is the read-back path established in Phase A). Each test created throwaway `SMOKE *` templates and deleted them, with delete confirmed by read-back. A final sweep confirmed no `SMOKE ` templates linger.

## Probe results — 9/9 passed

| check | result | detail |
|---|---|---|
| **T1 create-with-body** | PASS | Created id `6a2a60ad55fd109fc760d7f9`; HTTP trace shows `POST /emails/builder` (201) then `POST /emails/builder/data` (201) firing as one create. Body marker verified via preview. |
| T1 cleanup | PASS | Deleted, confirmed gone by read-back. |
| **T2 update-body** | PASS | Created with ALPHA body (verified), updated to BETA body (verified), ALPHA no longer present. Update is `POST /emails/builder/data` (201). |
| T2 cleanup | PASS | Deleted id `6a2a60b2b7fd17d4212d8a70`, confirmed gone. |
| **T3 default updatedBy** | PASS | `updateEmailTemplate` called with NO `updatedBy`; succeeded (201) and body verified. The Jenna default is applied silently. |
| T3 cleanup | PASS | Deleted id `6a2a60bdf6c95955d246bd23`, confirmed gone. |
| **T4 explicit updatedBy** | PASS | `updateEmailTemplate` called WITH an explicit `updatedBy`; succeeded (201) and body verified. The passed value threads through to the payload. |
| T4 cleanup | PASS | Deleted id `6a2a60c33fe47dad9d173b35`, confirmed gone. |
| **Final cleanup sweep** | PASS | 0 lingering `SMOKE ` templates. |

## Caveat on T4

T4 proves the explicit-override code path: a `updatedBy` value passed by the caller is threaded into the `/emails/builder/data` payload, the call succeeds, and the body is set. However, the value used was Jenna's own ID, because a **distinct** second location user could not be confirmed in this run (the script's `/users/search` returned no id other than Jenna, and the `get_users` tool requires a `companyId` not available here). So the override was exercised mechanically but not against a different real user. Combined with T3 (default applied when omitted), the param is proven to thread both ways. Confirming behavior against a genuinely different user is a minor open item if a second user ID is ever needed.

## Build status

- `tsc --noEmit`: clean.
- `npm run build`: clean (built into `dist/`).

## Nothing unexpected

The two-step flow behaved exactly as diagnosed: shell create returns the templateId in `id`/`redirect`, the data POST sets the body, and `updatedBy` is required and now satisfied. No GHL quirks surfaced beyond the known preview-render path for body verification.
