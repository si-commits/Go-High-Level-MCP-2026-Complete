# Email Template Wrapper — Phase A Diagnosis

Date: 2026-06-11. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox` (extended fork).
Scope: read-only source reading + one live create probe (already run and since cleaned up).

## The problem (recap)

GHL stores an email template's shell and its body content via two different endpoints. The fork calls only one per operation:

- `createEmailTemplate` → `POST /emails/builder` only. Creates the shell; the `html` field is not applied as body content, so the template is born with GHL default boilerplate.
- `updateEmailTemplate` → `POST /emails/builder/data` (the body-content endpoint), but omits the required `updatedBy` field, so GHL returns `422: updatedBy must be a string, updatedBy should not be empty`.

Source: [src/clients/ghl-api-client.ts:2210-2250](src/clients/ghl-api-client.ts#L2210-L2250).

## Open detail confirmed: create-endpoint response shape

The Phase C probe (template since deleted) captured the raw `POST /emails/builder` response body. The handler [src/tools/email-tools.ts:214-218](src/tools/email-tools.ts#L214-L218) passes `response.data` through unchanged, and `wrapResponse` ([src/clients/ghl-api-client.ts:452-457](src/clients/ghl-api-client.ts#L452-L457)) only adds `{ success, data }` without injecting fields. So the captured object is exactly what GHL returned:

```json
{
  "redirect": "6a2a3c4df6c95955d244ec0b",
  "id": "6a2a3c4df6c95955d244ec0b",
  "status": "ok",
  "traceId": "bad23bf9-4be0-92fc-b171-09eee399fe33"
}
```

**Answer to the Phase A question:** the new templateId is returned in **both `redirect` and `id`** (identical values), and that value matched the `id` of the created template in the `get_email_templates` listing. There is no `_id` or `templateId` field on this response.

**Implication for the two-step flow:** step 2 (`POST /emails/builder/data`) needs the ID from step 1. To be robust against GHL response drift, the create method will extract the ID with a fallback chain:

```
const newId = data?.id ?? data?.redirect ?? data?._id ?? data?.templateId;
```

`id` is preferred (clean ID), `redirect` is the documented GHL field and a reliable fallback.

## `updatedBy` requirement

`POST /emails/builder/data` requires `updatedBy` to be a non-empty string (a location user ID). The fix defaults it to Jenna's user ID `UIChIX3a0wWAs7vdhdfM` (the BII calendar owner, a confirmed valid location user), overridable via an optional param on both methods.

## Fix plan (Phase B)

Both changes in `src/clients/ghl-api-client.ts`, with type + tool-description updates:

1. **`updateEmailTemplate`** — accept optional `updatedBy`, default to `UIChIX3a0wWAs7vdhdfM`, include it in the `/emails/builder/data` payload.
2. **`createEmailTemplate`** — two-step: POST `/emails/builder` for the shell, extract the new ID (fallback chain above), then POST `/emails/builder/data` with `html`, `editorType: 'html'`, and `updatedBy` to set the body. Return the resulting template object including the resolved `id`.

Both keep all new params optional and backward compatible.
