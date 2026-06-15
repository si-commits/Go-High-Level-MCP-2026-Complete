# Template #11: BII - Intake Delivery

Date: 2026-06-16. Status: **PROVISIONED.** Template id
`6a307fe706bb2896fa08ebe6`, subject `Before your session with Lo`. Body below is
the final approved version, verified persisted verbatim via previewUrl
(0 em dashes, intake link intact).

## Metadata

- **Internal name:** `BII - Intake Delivery`
- **Voice:** Lo. Warm, somatic, direct, brief. Transactional moment (they just
  paid, they are committed), made personal.
- **isPlainText:** false (HTML body, matching the other 10 templates).
- **Trigger / use:** sent to the contact by the BII - Payment Received workflow,
  after the Single Session payment clears. Delivers the intake link.
- **Merge field:** `{{contact.first_name}}` (standard, as in the other templates).

## Subject options

1. **`Before your session with Lo`** (recommended): clear, warm, sets up the
   single next action without sounding like a receipt.
2. `Before we meet`: more first-person and intimate, matches the "Lo x" signature.
3. `One step before your session`: most explicitly task-framed.

**Locked: option 1, `Before your session with Lo`.**

## Body (HTML)

```html
<p>Hi {{contact.first_name}},</p>
<p>Your payment came through, thank you. I'm really looking forward to working with you.</p>
<p>Before we meet, please fill in your intake form.</p>
<p>It tells me how your body is doing right now, where you hold tension, and what you're hoping for. With that, I can meet your body where it is from the first minute, instead of spending our session finding my way in.</p>
<p><a href="https://laurenroxburgh.com/somatic-bodywork-with-lo-intake">Fill in your intake here</a></p>
<p>It takes about 15 minutes. If a question doesn't sit right, leave it blank. Only share what you're comfortable sharing.</p>
<p>See you soon. Come as you are.</p>
<p>Lo x</p>
```

## Body intent mapping (confirming the brief is covered)

| brief point | where |
|---|---|
| Acknowledge payment + warmth | "Your payment came through, thank you. I'm really looking forward to working with you." |
| The ask: complete the intake before the session | "Before we meet, please fill in your intake form." |
| Why it matters, plain terms | "It tells me how your body is doing... I can meet your body where it is from the first minute..." |
| The link (branded embed URL) | `https://laurenroxburgh.com/somatic-bodywork-with-lo-intake` |
| Time (~15 min) + permission to leave blank | "It takes about 15 minutes. If a question doesn't sit right, leave it blank. Only share what you're comfortable sharing." |
| Closing, signed Lo x | "See you soon. Come as you are." / "Lo x" |

## Voice compliance

- No em dashes (colons and full stops used).
- No forbidden words (embody, transform, optimize, journey, align, unlock,
  empower, wellness-as-noun): none present.
- US spelling.
- Signs `Lo x`.
- "Come as you are" deliberately echoes the application/approval templates for a
  consistent BII closing note.

## Provisioned

- **Template id:** `6a307fe706bb2896fa08ebe6`
- **Name:** `BII - Intake Delivery`
- **Subject (set at point-of-use, on the Send Email action):** `Before your session with Lo`
- **Provisioned via** `create_email_template` (two-step flow), `updatedBy` default
  (Jenna). Body verified verbatim from the rendered previewUrl: matches the HTML
  above exactly, 0 em dashes, the intake link
  `https://laurenroxburgh.com/somatic-bodywork-with-lo-intake` intact.
- Used by the BII - Payment Received workflow (Send Email to Contact). See
  `bii-payment-received-workflow-walkthrough.md`.
