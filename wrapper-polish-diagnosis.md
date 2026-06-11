# Wrapper Polish Pass: Phase A Diagnosis

Date: 2026-06-12. Branch: `main`. Baseline `tsc --noEmit`: clean (exit 0).

This is the Phase A read-only diagnosis for the eleven-item polish pass. The
headline finding: **most of the code-change scope is already done in the current
tree**, landed by two prior commits (`e4ca391` and `e957e1a`). The plan appears
to predate those commits. Details per item below, then a revised Phase B scope.

## Code-change items (1 to 4): all already in the tree

### Item 1: revert ac6df17 and d5eb118 (altType/altId injection) — ALREADY REVERTED

Commit `e957e1a` ("revert: remove inert altType/altId injection from ac6df17 and
d5eb118") already restored both source files to their pre-extension state:

- `git diff ba16444 HEAD -- src/clients/ghl-api-client.ts src/tools/calendar-tools.ts`
  returns **empty**. The source is byte-identical to the pre-extension baseline.
- `e957e1a`'s commit message **already references
  `notification-update-wrapper-extension.md`** for the "why", which is exactly what
  the plan asked the revert message to do.
- The diagnostic docs and probe scripts were intentionally kept (as the plan also
  wanted: "so the trail of the diagnostic survives").

**Running `git revert ac6df17 d5eb118` now does NOT apply cleanly.** Tested:
`git revert --no-commit ac6df17` fails with a modify/delete conflict on
`notification-update-wrapper-diagnosis.md` (the doc was created after the target
commit's parent and modified since). The code hunks are also already inverted, so
the revert is both conflicting and redundant.

Recommendation: **skip the git revert entirely.** Item 1 is complete. If a
literal `git revert` trail is wanted for audit symmetry, it would have to be done
with manual conflict resolution producing a no-op code diff, which adds noise for
no behavioural change. Not recommended.

### Item 2: validate_group_slug POST fix — ALREADY DONE (e4ca391)

`src/clients/ghl-api-client.ts:3348` `validateCalendarGroupSlug` already does:

```
POST /calendars/groups/validate-slug
body: { locationId, slug }
```

with a comment noting the old `GET /calendars/groups/slug/validate` 404'd. This
is the exact change the plan describes. **Empirically confirmed live this session**
via the connected `ghl-lorox` MCP: `validate_group_slug` returned
`{ success: true, available: true, message: "Slug is available" }` for a random
slug. Body shape question from the plan is answered: `{ locationId, slug }`.

No change needed.

### Item 3: create_calendar_group isActive passthrough — ALREADY DONE (e4ca391)

`src/tools/calendar-tools.ts:1972` already threads it:

```js
...(params.isActive !== undefined ? { isActive: params.isActive } : {})
```

Schema (`:831`) and type (`GHLCreateCalendarGroupRequest.isActive?`) already accept
it. No change needed.

### Item 4: preBuffer / preBufferUnit on create/update calendar — ALREADY DONE (e4ca391)

- Types: `src/types/ghl-types.ts` has `preBuffer? / preBufferUnit?` on the create
  and update request types (lines ~1185, ~1222, ~1247).
- Schema: present on both `create_calendar` (`:215`) and `update_calendar` (`:412`).
- Create handler: maps both in the `calendarData` allow-list (`:1597-1598`).
- Update handler: spreads `{ calendarId, ...updateData }` (`:1653`), so they pass
  through automatically. This matches the plan's "update spreads" note.

No change needed.

## Documentation items (5 to 7)

### Item 5: get_calendar_notifications filter-pattern note — TODO (genuine)

Current description (`:1206`) is the bare `'Get calendar notifications'`. The
schema already exposes both `isActive` and `deleted` filter params (`:1211-1212`)
but offers no guidance on which excludes soft-deleted records. This is a real
documentation gap. Add a note: pass `deleted: false` to exclude soft-deleted
records; `isActive: true` does NOT exclude them.

### Item 6: update_calendar_notification non-functional PUT note — TODO (genuine)

Current description (`:1306`) has **no** warning about the PUT being
non-functional. The altType/altId note that ac6df17 added was reverted by
`e957e1a`, so the description is back to timing-only. The diagnostic record
(`notification-update-wrapper-extension.md`, `notification-hard-delete-probe.md`)
establishes the PUT 422s regardless of body, mutates state on error, and bodies
are settable only at create. Add a clear warning to the description pointing at the
GHL UI as the workaround.

### Item 7: README "Lo Rox Fork Modifications" entry — PARTIALLY done

The existing entry "Calendar notification timing + group/buffer fixes"
(`e4ca391`, `60493d9`) **already documents items 2, 3, and 4** (validate_group_slug
fix, isActive passthrough, preBuffer/preBufferUnit passthrough). A new polish-pass
entry should NOT re-document those. What is not yet captured and should be the new
entry's content:

- The revert of the inert altType/altId injection (`e957e1a`).
- The notification PUT non-functional finding and UI workaround (item 6).
- The get_calendar_notifications `deleted: false` filter clarification (item 5).
- Links to the relevant commits from this session.

## Smoke-test backfill items (8 to 10): all testable as-is, no wrapper changes

All three are answerable through the existing tool surface (driven either via the
rebuilt dist or the connected `ghl-lorox` MCP). No wrapper change is required to
make them testable.

- **Item 8 (afterTime round-trip):** `afterTime` exists in the
  `create_calendar_notifications` schema (`:1257`) and types
  (`GHLScheduleDTO[]`). Probe: create throwaway calendar, create a `followup`
  notification with `afterTime: [{ timeOffset: 2, unit: "hours" }]`, read back,
  delete throwaway.
- **Item 9 (formId update persistence):** `formId` is in the create allow-list
  (`:1601`); update spreads, so a `formId` update is expressible. Probe: create
  throwaway with a formId, update an unrelated field, re-read, confirm formId
  persists, delete throwaway.
- **Item 10 (inApp cascade on delete):** expressible via create_calendar (auto
  -creates the 2 inApp defaults) then get_calendar_notifications to capture IDs,
  delete_calendar, then attempt to read those IDs. If they survive, that is the
  bigger orphaned-record finding the plan flags.

## Item 11: AUDIT.md — ready to commit

`AUDIT.md` is untracked in the working tree. Straightforward commit, no diagnosis
needed.

## Revised Phase B scope (what actually remains)

Of the four code-change items, **none require a code change** — all are already in
the tree. The real remaining work is:

1. **Item 5** — get_calendar_notifications description note (tool-schema edit).
2. **Item 6** — update_calendar_notification description warning (tool-schema edit).
3. **Item 7** — README polish-pass entry (revert + the two doc clarifications only,
   not items 2/3/4 which are already documented).
4. **Items 8 to 10** — smoke probes (Phase C).
5. **Item 11** — commit AUDIT.md.

The git-revert step (item 1) should be **skipped**: already done by `e957e1a`, and
re-running it now conflicts. This is the unexpected divergence the plan asked me to
stop and surface before any code change.
