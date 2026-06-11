# Notification Hard-Delete Probe (Option 2)

Date: 2026-06-11. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox` (rebuilt dist, wrapper reverted to original).
Question: is there ANY API path to fully purge a notification record so a fresh one (with a body) can be created in its `(receiverType, notificationType, channel)` slot?

**Answer: No. Option 2 (hard-delete then create-fresh in place) is not viable.**

## Method

`scripts/notification-hard-delete-probe.js` (read/write on a throwaway calendar, cleaned up after). Created a throwaway inactive calendar, created a `contact/reminder/email` notification with body `ORIG`, soft-deleted it via the standard DELETE, then tried delete variants, checking state via GET after each. Finally POSTed a fresh same-type reminder with body `NEW` to see whether the slot was freed.

## Results

Setup: created notification `present deleted=false body="<p>ORIG</p>" v=1`. After standard soft-delete: `present deleted=true body="<p>ORIG</p>" v=2`.

| variant | response | state after |
|---|---|---|
| `DELETE ?hard=true` | 400 "Notification not found" | still `deleted=true` |
| `DELETE ?permanent=true` | 400 "Notification not found" | still `deleted=true` |
| `DELETE ?force=true` | 400 "Notification not found" | still `deleted=true` |
| `DELETE ?deleted=true` | 400 "Notification not found" | still `deleted=true` |
| `DELETE` body `{permanent:true}` | 400 "Notification not found" | still `deleted=true` |
| `DELETE` again (double-delete) | 400 "Notification not found" | still `deleted=true` |

Notable: once a record is soft-deleted, GHL's DELETE treats it as "not found" — you cannot even re-delete it. No query param or body triggers a purge.

### Decisive create-fresh test

POST a fresh `contact/reminder/email` reminder with subject `NEW`, body `<p>NEW</p>`:

- Returned `_id` = the original `_id` (not a new record).
- State: `present deleted=false body="<p>ORIG</p>" subject="ORIG" v=3`.
- **Result: revived the old record with its original body. The slot was NOT freed.**

## Conclusion

There is no API path to purge a notification record. A soft-deleted record permanently occupies its type-slot, the DELETE endpoint refuses to touch an already-soft-deleted record, and POST revives the old record (original body) rather than creating a fresh one. Combined with the earlier findings (PUT 422s; POST never overwrites or fills; bodies set only at create on an empty slot), **the existing BII notifications cannot be given bodies through the API.**

## Decision routing

Per the agreed plan, hard-delete failing means: **configure the notification bodies manually in the GHL UI.** Notifications remain the right architecture; the UI is the path that works (it uses GHL's internal endpoints, which are not subject to the public-API PUT limitation). Workflows are not needed for this.

## Live BII notification state (for the UI deliverable)

Accurate starting state Si will work from in the UI:

**In-Person `9czE4WeZ4QbbDIHFxlOP`:**
| notification ID | type | state | needs in UI |
|---|---|---|---|
| `6a2a2a39b72e8439ef2e4512` | contact / booked / email | active, empty body | set body = template #5, subject "Your session is booked" |
| `6a2a2a39b72e84a40f2e4514` | assignedUser / booked / email | active, empty body | set body = template #6, subject "New BII booking: {{contact.name}}" |
| `6a2a2a39b72e84c1892e4513` | contact / reminder / email | **soft-deleted**, beforeTime [7d, 24h] | re-enable or recreate in UI; set body = edited template #8, subject "Your session with Lo", beforeTime [7 days, 24 hours] |
| `6a2a175ffd6d71392aaa9982`, `6a2a175ffd6d712834aa9981` | assignedUser inApp (booked, confirmation) | GHL defaults | leave untouched |

**Virtual `JzlzhxG86qNPAsiELNV2`:**
| notification ID | type | state | needs in UI |
|---|---|---|---|
| `6a2a2a3ecd470245aeab4011` | contact / booked / email | active, empty body | set body = template #5, subject "Your session is booked" |
| `6a2a2a3ecd47024a3aab4013` | assignedUser / booked / email | active, empty body | set body = template #6, subject "New BII booking: {{contact.name}}" |
| `6a2a2a3ecd4702a840ab4012` | contact / reminder / email | **soft-deleted**, beforeTime [7d, 24h] | re-enable or recreate in UI; set body = edited template #8, subject "Your session with Lo", beforeTime [7 days, 24 hours] |
| `6a2a1be3942c37e6a6fa9160`, `6a2a1be3942c37f47afa915f` | assignedUser inApp (booked, confirmation) | GHL defaults | leave untouched |

Template bodies to paste are in `email-templates-provisioned.md` (#5 `6a2a69a355fd109fc7615e65`, #6 `6a2a69bddbcd44d274ab7c87`, edited #8 `6a2a69f02b8acb9bf509b626`). Note the placeholders still live in #8 and #5 (address, wear, links, etc.) per the do-not-go-live flag.

## Cleanup

The throwaway calendar was deleted (cascade). A prior sweep confirmed no `SMOKE TEST` calendars linger.
