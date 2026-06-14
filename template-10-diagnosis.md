# Template #10: Phase A Diagnosis (custom field merge syntax)

Date: 2026-06-15. Location: `1W01uH5EthLl1oJRj8Xq` (Lo Rox). MCP: `ghl-lorox`.

## Question

What is the exact merge token syntax GHL uses for contact custom fields in email
template bodies? The draft for Template #10 references seven BII custom fields,
provisioned with fieldKey `contact.bii_*` (see `bii-custom-fields.md`). The
candidate token is `{{contact.bii_body_state}}` (token = stored fieldKey,
directly). This needed confirming before drafting.

## Method

1. Scanned existing location templates for any custom-field token usage. The
   accessible top-level non-BII templates ("Lo Rox Basic Email Template",
   "Default - Invoice received") use only system tokens (`{{invoiceNumber}}`,
   `{{location.email}}`, `{{email.unsubscribe_link}}`, `{{receiverFirstName}}`,
   handlebars `{{#if dueDate}}`). No contact custom-field references, so no
   real-world example to copy from on this location.
2. Ran a persistence probe: provisioned a throwaway template
   (`PROBE-MERGE-SYNTAX-throwaway`, id `6a2f2ba23a647007832d3e1c`) via the same
   two-step `create_email_template` flow Phase C will use, containing all eleven
   candidate tokens (4 standard, 7 custom). Fetched its rendered `previewUrl` and
   compared the stored body to what was sent. Deleted the throwaway afterward.

## Finding: standard syntax, `{{contact.bii_*}}` direct

All eleven tokens persisted **verbatim** in the stored template body, with zero
transformation, stripping, or re-encoding:

```
{{contact.first_name}}     {{contact.last_name}}     {{contact.email}}
{{contact.phone}}          {{contact.bii_location}}  {{contact.bii_body_state}}
{{contact.bii_hopes}}      {{contact.bii_why_now}}   {{contact.bii_how_heard}}
{{contact.bii_anything_else}}                         {{contact.bii_equipment_access}}
```

The custom-field token is simply `{{ <fieldKey> }}`, and the fieldKey already
carries the `contact.` prefix (GHL baked it in at field creation), so
`{{contact.bii_body_state}}` is correct. This is the same pattern the standard
fields follow. No double-prefixing, no separate `custom_values` namespace, no
id-based token. The drafted syntax is right as-is. Proceeding to Phase B without
changes.

## Important scope note on what the probe proves

A template `previewUrl` is a static render of the stored body with **no contact
context**, so merge tokens are NOT substituted in a preview: they render
literally whether the syntax is right or wrong. Therefore this probe confirms
**acceptance and verbatim persistence** of the tokens through the create flow
(which is the real Phase C provisioning risk: that GHL might choke on or mangle a
custom-field token), but it does **not** confirm live substitution.

Live substitution is only observable at send time against a real contact whose
`bii_*` fields are populated. That belongs to the workflow-wiring step (when this
template is attached to the application-submission workflow): send one test
application through the form, or fire the workflow against a test contact with the
fields filled, and confirm each value resolves. Flagging it here so it is not
assumed done. The syntax itself is not in doubt; only end-to-end substitution
remains to be eyeballed once, downstream.

## Field references confirmed to exist

All seven custom fields in the draft exist on the location (per
`bii-custom-fields.md`), model `contact`:

| token | field name | fieldKey | dataType |
|---|---|---|---|
| `{{contact.bii_location}}` | Location | `contact.bii_location` | TEXT |
| `{{contact.bii_body_state}}` | Body State | `contact.bii_body_state` | LARGE_TEXT |
| `{{contact.bii_hopes}}` | Hopes | `contact.bii_hopes` | LARGE_TEXT |
| `{{contact.bii_why_now}}` | Why Now | `contact.bii_why_now` | LARGE_TEXT |
| `{{contact.bii_how_heard}}` | How Heard | `contact.bii_how_heard` | SINGLE_OPTIONS |
| `{{contact.bii_anything_else}}` | Anything Else | `contact.bii_anything_else` | LARGE_TEXT |
| `{{contact.bii_equipment_access}}` | Equipment Access | `contact.bii_equipment_access` | MULTIPLE_OPTIONS |

Standard fields used: `{{contact.first_name}}`, `{{contact.last_name}}`,
`{{contact.email}}`, `{{contact.phone}}`. All four are standard GHL contact
fields.

## Note on the name token in the subject

The draft subject uses `{{contact.first_name}} {{contact.last_name}}`. Both are
valid. The alternative is the single full-name token `{{contact.name}}`, which is
already proven working in Template #6 ("New BII booking: {{contact.name}}"). The
first+last form gives identical output when both are set, but leaves a trailing
space if last_name is empty. I kept the draft's first+last form for the
structured layout; `{{contact.name}}` is a clean swap at your call.
