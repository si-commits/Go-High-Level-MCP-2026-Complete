# BII Tag Taxonomy — Diagnosis (read-only)

Date: 2026-06-10. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox`.

**No writes were made.** This is the pre-provisioning diagnosis. Stopping here for review before any tag is created or applied.

---

## Headline

- GHL **does** support standalone tag definitions. The `create_location_tag` tool maps to `POST /locations/{id}/tags`, which registers a tag in the location dictionary **without** applying it to a contact. **No "system reference" contact is needed.** Recommended approach: create all 9 BII tags directly as standalone definitions.
- **No naming conflicts.** None of the 9 proposed `bii:*` tags exist today. The closest existing names are `bi_score:*` (different prefix) and the `us:*` Studio set (different namespace).
- The colon-namespacing convention is well established here (`us:`, `org:`, `ppc:`, `e:`, `lead:`, `eb:`, `bf:`, `hff:`, `modality_focus:`, `assessment_count:`, `bi_score:`, `optout:`, and nested `us:status:`). `bii:` fits cleanly alongside them.
- **Caution: duplicate tag names are possible.** The existing dictionary already contains two separate tags named `e:day-7-new` (ids `FkYhAJHBOfObafyXaZUv` and `FamS0VW8wxu9a0CuKDbx`). So the location tag list is not guaranteed unique by name. We must verify after each create and avoid double-creating.

---

## 1. Existing tags

`get_location_tags` returned **98 tags**. Each record exposes only `id`, `name`, `locationId`.

**Metadata note:** the API does **not** return contact-tagged count, last-used date, or colour. Those fields you asked about are not available through this tool, so the diagnosis cannot include them. (Colour and usage are only visible in the GHL UI.)

### Namespaces in use (by prefix)

| Prefix | Examples | Notes |
|---|---|---|
| `us:` and `us:status:` | us:trial, us:active, us:former, us:membership-annual, us:status:paused | Studio membership state (the set you flagged). Largest group. |
| `org:` | org:hff-lead, org:hff-trial-converted | HFF org funnel |
| `ppc:` | ppc:hff-lead, ppc:hff-trial | Paid funnel mirror of org: |
| `e:` | e:day-1-new … e:day-10-new | Email day sequence. Contains the duplicate `e:day-7-new`. |
| `lead:` | lead:assessment, lead:pelvic-floor-guide | Lead-magnet source |
| `eb:` / `bf:` | eb: free, eb:prize, bf:2025-power-source-book | Campaign tags |
| `hff:` | hff:welcome-sequence | HFF welcome |
| `modality_focus:` | modality_focus:bodywork, :bounce, :flow, :glow, :roll | Modality |
| `assessment_count:` | assessment_count:1, :2, :3+ | Body Intelligence Assessment counters |
| `bi_score:` | bi_score:high, :mid, :low | Body Intelligence Assessment scoring (the existing BI Assessment product, distinct from BII) |
| `optout:` | optout:mothers-day-2026 | Campaign opt-out |
| (no prefix) | client, body, roxy, inactive, subscribed, vip-client, private-body-work-client | Legacy / unnamespaced |

Note the `bi_score:*` and `assessment_count:*` tags belong to the existing **Body Intelligence Assessment** (the Roxy PWA quiz), which is a different product from the **Body Intelligence Institute** funnel. The `bii:` prefix keeps them clearly separate. Worth being aware they coexist.

---

## 2. Conflict check vs proposed BII tags

Case-insensitive comparison against all 98 existing names:

| Proposed tag | Conflict? |
|---|---|
| bii:applicant | none |
| bii:in-review | none |
| bii:approved | none |
| bii:declined | none |
| bii:waitlist | none |
| bii:active-client | none |
| bii:past-client | none |
| bii:popup-interest | none |
| bii:studio-access-pending | none |

**No conflicts, exact or case-variant.** No existing tag starts with `bii:`.

---

## 3. Relevant MCP tools (verified via introspection)

| Need | Tool | Params |
|---|---|---|
| List all tags on a location | `get_location_tags` | `locationId` |
| Get one tag by ID | `get_location_tag` | `locationId`, `tagId` |
| Create a standalone tag definition | `create_location_tag` | `locationId`, `name` |
| Update a tag | `update_location_tag` | (location tag id + name) |
| Delete a tag definition | `delete_location_tag` | (location tag id) |
| Apply tags to a contact | `add_contact_tags` | `contactId`, `tags[]` |
| Remove tags from a contact | `remove_contact_tags` | `contactId`, `tags[]` |

So tag-definition lifecycle (create/list/get/update/delete) is fully separate from contact application (add/remove). This is the strong signal that tags are first-class standalone definitions here.

---

## 4. Standalone vs application-derived (the key question)

**Resolved: standalone is supported.** `create_location_tag` (`POST /locations/{id}/tags`) creates a tag in the location dictionary on its own. We do not need to apply tags to any contact to make them exist.

This means:
- **Recommended provisioning:** call `create_location_tag` once for each of the 9 `bii:*` tags. No contact is touched. This satisfies the constraint "provision the tag definitions only" perfectly.
- The **"BII System Reference contact" fallback is not required** and I recommend against creating it, since it would be an unnecessary fake contact in production. (It was the right contingency to raise, but the API makes it unnecessary.)

Two behaviours I will confirm empirically **during provisioning** (cannot be tested read-only):
1. **Does `create_location_tag` lowercase the name?** All 98 existing tags are lowercase, and GHL normally lowercases tags. I will send `bii:applicant` exactly and confirm the stored name matches. If GHL upcases/changes it, I stop and report.
2. **Does `create_location_tag` dedupe by name?** Given the existing `e:day-7-new` duplicate, the dictionary clearly can hold dupes. I will create each name exactly once and re-list to confirm exactly one of each, no accidental duplicates.

---

## 5. Case sensitivity / convention

- Every existing tag is lowercase. GHL's tag system is effectively case-normalising (it lowercases tags on contact application), but the dictionary can still hold byte-distinct duplicates as shown.
- **Chosen convention (matches the spec):** all lowercase, colon-separated, `bii:` prefix, hyphen-separated multiword segments (e.g. `bii:active-client`). This mirrors the dominant existing style (`us:status:paused`, `modality_focus:bodywork`).
- I will verify post-create that each stored name is exactly the lowercase `bii:*` string with no case variants.

---

## 6. Recommended plan (for your approval, not yet executed)

1. Create 9 standalone tags via `create_location_tag`, one call each, exact names:
   `bii:applicant`, `bii:in-review`, `bii:approved`, `bii:declined`, `bii:waitlist`, `bii:active-client`, `bii:past-client`, `bii:popup-interest`, `bii:studio-access-pending`.
2. After each create, capture the returned tag id and stored name; stop if any name comes back altered or if a duplicate appears.
3. Re-list with `get_location_tags`; confirm all 9 present, exactly once each, no case variants.
4. Apply none of them to any contact. No system reference contact created.
5. Write `bii-tags.md` with the provisioned names + ids, the standalone-vs-applied finding, queryability confirmation, and a rollback section.

**Open question for you:** confirm you're happy to skip the system-reference contact entirely (my recommendation, since standalone creation works). If for any reason you want the tags anchored to a contact as well, say so and I'll add the `BII System Reference - DO NOT DELETE` contact with `bii-system-reference@example.invalid`.

**Nothing has been created. Awaiting your go-ahead before provisioning.**
