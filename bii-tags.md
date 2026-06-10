# BII Tag Taxonomy — Provisioning Result

Date: 2026-06-10. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox`.
Status: **COMPLETE — all 9 BII tags provisioned as standalone definitions and verified.**

## Provisioning method

Created as **standalone tag definitions** via `create_location_tag` (`POST /locations/{id}/tags`). **No contact was touched; no system-reference contact was created.** GHL accepted each tag directly into the location tag dictionary without requiring contact application. This confirms the diagnosis question: on this location, tags exist as first-class definitions independent of any contact.

Each name was sent exactly as the lowercase `bii:*` string and **returned unchanged** (no normalisation, no case folding, no truncation). Each was verified twice: from the create response, and again via an individual `get_location_tag` read-back.

## Tags provisioned

| # | tag name (exact) | GHL-assigned id |
|---|---|---|
| 1 | `bii:applicant` | `8wzBeGqago1cVnK0tRi4` |
| 2 | `bii:in-review` | `NA4myXAawV2QmyKy1zoB` |
| 3 | `bii:approved` | `CHRxVmdA8Odvikitxr12` |
| 4 | `bii:declined` | `1gFG3q8yCxAZ31E08JRK` |
| 5 | `bii:waitlist` | `Ez8D9R8TjGIq2yPKQD8L` |
| 6 | `bii:active-client` | `3JKk2YJ70SziDgSsiqWB` |
| 7 | `bii:past-client` | `ROh32NBrdWLuocb7g8s4` |
| 8 | `bii:popup-interest` | `kFcxEFdMf1W0L5NV26dt` |
| 9 | `bii:studio-access-pending` | `Lc27WvS0I7cbzc12EZ1K` |

## Verification

- **Individual read-backs:** all 9 `get_location_tag` calls returned the exact name and matching id. None altered.
- **Re-list (`get_location_tags`):** location tag count went from **98 to 107 (+9 exactly)**. Each create added precisely one tag; none was silently deduped against an existing tag, and no accidental duplicate was created.
- **All 9 `bii:*` present exactly once**, in this dictionary, with the IDs above. No duplicates.
- **No case variants:** there is exactly one entry per tag, all lowercase. No `BII:*`, no `bii:Applicant`, etc.
- **Queryable from the API:** confirmed — every tag is returned by both `get_location_tag` (by id) and `get_location_tags` (full list).
- **GHL UI:** these are location-dictionary tags, which is exactly what the GHL UI Tag manager (Settings -> Tags) lists, so they appear there. (Confirmed present in the dictionary via API; the UI reads from the same dictionary.)

## Case sensitivity / convention (confirmed)

- GHL stored each name byte-for-byte as sent (all lowercase). The chosen convention holds: **all lowercase, colon-separated `bii:` prefix, hyphen-separated multiword segments** (e.g. `bii:active-client`). This matches the dominant house style (`us:status:paused`, `modality_focus:bodywork`).
- Caveat for downstream automation: GHL lowercases tags when they are applied to contacts. Because our definitions are already lowercase, application will match exactly. Always reference these tags in workflows using the exact lowercase strings above.
- Note: the location dictionary can hold byte-distinct duplicates (the pre-existing `e:day-7-new` appears twice, ids `FkYhAJHBOfObafyXaZUv` and `FamS0VW8wxu9a0CuKDbx`). That is pre-existing and unrelated to BII; our 9 tags are each unique.

## Rollback

To remove the BII tags, delete each definition via MCP `ghl-lorox` -> `delete_location_tag` with `locationId: 1W01uH5EthLl1oJRj8Xq` and the tag id:

```
delete_location_tag  tagId=8wzBeGqago1cVnK0tRi4   # bii:applicant
delete_location_tag  tagId=NA4myXAawV2QmyKy1zoB   # bii:in-review
delete_location_tag  tagId=CHRxVmdA8Odvikitxr12   # bii:approved
delete_location_tag  tagId=1gFG3q8yCxAZ31E08JRK   # bii:declined
delete_location_tag  tagId=Ez8D9R8TjGIq2yPKQD8L   # bii:waitlist
delete_location_tag  tagId=3JKk2YJ70SziDgSsiqWB   # bii:active-client
delete_location_tag  tagId=ROh32NBrdWLuocb7g8s4   # bii:past-client
delete_location_tag  tagId=kFcxEFdMf1W0L5NV26dt   # bii:popup-interest
delete_location_tag  tagId=Lc27WvS0I7cbzc12EZ1K   # bii:studio-access-pending
```

**Does delete remove the tag from the dictionary, or just from contacts?**
`delete_location_tag` maps to `DELETE /locations/{id}/tags/{tagId}`, which deletes the tag **definition** from the location dictionary entirely (the clean case). When a tag definition is deleted, GHL also removes it from any contacts that had it applied, because the tag id ceases to exist. This is based on the GHL location-tags API semantics, not a destructive experiment (none was run, per the task constraints).

For our case specifically this is unambiguous and clean: **these 9 tags are applied to zero contacts** (provisioned standalone, never applied), so deleting them only removes the dictionary entries with no contact-side residue.

> If you ever need to roll back, run the 9 deletes above, then `get_location_tags` to confirm the count returns to its prior value with no `bii:*` entries remaining.
