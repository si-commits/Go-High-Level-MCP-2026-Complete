# BII Email Templates — Phase A Diagnosis

Date: 2026-06-11. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox` (extended fork).
Scope: read-only. No writes were made to GHL in this phase.

## 1. Tool surface (exact names and shapes)

| operation | tool | params | notes |
|---|---|---|---|
| list | `get_email_templates` | `limit` (default 10), `offset` (default 0) | Returns **top-level entries only**. No body in the listing. No locationId param (bound to the connection's location). |
| create | `create_email_template` | `title` (req), `html` (req), `isPlainText` (default `false`) | **Body-only.** No subject, no folder/parentId, no previewText. |
| update | `update_email_template` | `templateId` (req), `html` (req), `previewText` | Updates body + preview snippet. **Cannot rename** (no title param), cannot move folder, cannot toggle isPlainText. |
| delete | `delete_email_template` | `templateId` (req) | |

- **No single-template fetch tool exists for email templates.** Read-back in Phase C will use `get_email_templates` (list) and match on the ID returned by each create response. The `create` response is expected to return the new template ID.
- `get_location_templates` exists (`type: email`) but **requires an `originId`** we do not have, so it is not usable here.
- `emails_fetch-template` (named in the task) does not exist under this connection; the read path is the list tool above.

## 2. Folders / categories — GHL supports them, the MCP does not expose them

GHL **natively supports email-template folders.** The listing returns folder entries with `templateType: "folder"`, a `childCount`, and `parentId`. Live examples on this location:

- `1. Studio - Product Delivery` (5 children), `2. BI Quiz - Deliver` (7), `2. Hero Fascia Flow` (2), `3. Black Friday Sale (2025)` (10), `3. Empowered Body Launch` (2), `6. BI Assessment Emails` (4), `Private Coaching Roadmap` (3).

**But none of the MCP email-template tools expose a `parentId` / folder param, and there is no folder-create tool.** So through this MCP we **cannot** create a "Body Intelligence Institute" template folder or place templates inside one.

**Decision needed (carried to Phase C):** group the nine BII templates by **name prefix `BII - `** only (the GHL API supports folders; the fork just does not pass the param). This is clean and searchable, but they will sit at the top level alongside other templates rather than in a folder. Alternative is a small wrapper extension (see follow-up tracker) to forward `parentId`; that is a code change, not in scope for this task unless you want it.

## 3. Naming conflicts — none at the top level

10 top-level entries: 3 real templates (`Lo Rox Basic Email Template`, `Default - Invoice received`, `SmartTV: Email Block`) and 7 folders. **None begins with `BII - `.** The closest names use the prefix **`BI`** (`6. BI Assessment Emails`, `2. BI Quiz - Deliver`), which is distinct from our `BII` (two I's). No collision.

**Caveat:** the list tool returns top-level only. The 33 child templates inside the seven folders are **not enumerable** via the MCP (no parentId filter, no originId). I cannot byte-confirm that no child anywhere is named `BII - ...`. Given the prefix and the themed folder contents, a collision is implausible. Low risk, flagged for honesty.

## 4. Body format — HTML is the default; subject lives elsewhere

- `isPlainText` defaults to `false`, so **HTML is the default** and what we will use. The API accepts a raw HTML string for `html`; no builder JSON is required. Existing location templates are all builder-type (version 2), but API-created templates store the HTML we send.
- **Recommendation:** simple, inline-styled transactional HTML for the eight client-facing templates. The internal Jenna operational notification (#6) can be the same simple HTML, plain in tone.
- **Subject is NOT part of an email template.** GHL email templates store **body only.** The subject is set at the point of use:
  - **Calendar-fired notifications (#5, #6, #7, #8):** subject goes in the notification's own `subject` field; the body comes from either the notification `body` field (paste) or `templateId` (if it fires, see section 5).
  - **Jenna / workflow sends (#2, #3, #4, #9):** subject is set in the workflow "Send Email" action or at manual send time.
  - **Consequence:** the subject lines we draft in Phase B are carried in the documentation and applied **at wiring time.** They do not live on the template object, and there is no MCP field to store them on the template.

## 5. `templateId` on calendar notifications — the architectural question

- The `create_calendar_notifications` item schema exposes **both** `templateId` and `body`.
- **Storage acceptance is testable** (set `templateId` via `update_calendar_notification`, read back), but that is a write and was deliberately deferred out of this read-only phase.
- **Whether `templateId` actually causes the template body to render when the notification fires is GHL-internal runtime behavior.** It cannot be confirmed without a live appointment that triggers a real outbound email, which is a side-effecting experiment (a real email to a real inbox). → **OPEN QUESTION, deferred to Phase D.**
- **Safe fallback that does not depend on `templateId`:** paste the rendered body directly into the notification `body` field. Notifications already fire on these calendars (Phase D of the calendar task), so this path is known-good. **Delivery of the calendar-triggered emails does not require `templateId` to function.**
- **Phase D options:** (a) wire `templateId` and run one controlled test booking to confirm it renders, then keep it; or (b) skip `templateId` and put the body in the notification `body` field. Recommend deciding in Phase D with you.

## 6. Merge fields (to use in Phase B drafts)

- **Contact (confirmed standard GHL):** `{{contact.first_name}}`, `{{contact.last_name}}`, `{{contact.name}}`, `{{contact.email}}`.
- **Custom fields (BII):** referenced by field key, e.g. `{{contact.bii_program_type}}`. Exact merge token for custom fields can vary in GHL; **confirm at wiring.**
- **Appointment fields (calendar notifications):** `{{appointment.start_time}}`, `{{appointment.title}}`, and similar `{{appointment.*}}` tokens. **Exact tokens to confirm at wiring.**
- Phase B will use `{{contact.first_name}}` for greetings and flag custom/appointment tokens as verify-at-wiring rather than hardcoding anything.

## Open questions to resolve

1. **`templateId` runtime firing** on calendar notifications — needs a live test (Phase D).
2. **Folder grouping is not possible via the MCP** — accept prefix-only (`BII - `) grouping, or extend the fork to forward `parentId`? (Recommend accept prefix-only for this task.)
3. **Exact appointment and custom-field merge tokens** — confirm at the wiring step.

## Summary for the go/no-go

- Tools to create/list/update/delete templates all exist and are sufficient to build the nine as a prefixed `BII - ` set.
- No naming conflicts at the top level; folder grouping is not available through the MCP.
- Templates are body-only; subjects are applied at wiring, not stored on the template.
- The `templateId`-fires-the-body question is genuinely undeterminable without a live test, so Phase D wire-up stays conditional. The notification `body` field is a known-good fallback either way.
