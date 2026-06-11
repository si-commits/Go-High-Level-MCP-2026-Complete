# Security Audit: Go-High-Level-MCP-2026-Complete (lo-rox-ghl-mcp)

Read-only static audit. No code was changed. Dependencies were installed only with
`npm install --ignore-scripts` after this report's static sections were written (Phase 3).

- Repo: `https://github.com/si-commits/Go-High-Level-MCP-2026-Complete.git`
- Audited commit: `928076c` (branch `main`)
- Author of all commits: Jake Shore (upstream), not the fork owner
- Date of audit: 2026-06-10

---

## Summary verdict

**Minor concerns (listed), with one hard condition.**

The code itself is clean. There is no telemetry, no phone-home, no secret exfiltration, the
GHL token is handled correctly and never logged or written to disk, the git history carries no
committed secrets, and there are no malicious dependency lifecycle scripts. For **stdio** use
(the desktop MCP client path) I see no red flags.

The one hard condition: **do not deploy the HTTP or SSE transport on a public or shared network
as shipped.** Those transports apply zero authentication. Anyone who can reach the port can call
every tool, including destructive and payment tools, against the live CRM using the server's
configured Private Integration Token. This is fine on `localhost` only. See finding 2.

So: safe to run over stdio with a full-access PIT. Not safe to expose `start:http` or
`start:legacy` to anything beyond loopback without adding an auth layer first.

---

## Evidence-table reconciliation (the three claims in the brief)

**Claim 1: "single commit in history, no development trail, contradicts the daily CI claim."**
Refuted. `git rev-list --all --count` returns **8** commits, all authored by "Jake Shore",
dated 2026-03-21 (one) and 2026-05-15 (seven). There is a development trail, compressed mostly
into one day. The README's "daily GitHub Actions refresh" claim is **true and independently
verifiable**: `.github/workflows/ghl-api-drift.yml` exists with a `schedule: cron "20 9 * * *"`
trigger. There is no contradiction to resolve. (Note: most commit messages match the fork
owner's house style, suggesting the fork was rebuilt, not the upstream public repo. The history
is short but not a single squashed commit.)

**Claim 2: "plain /sse endpoint, defaults CORS_ORIGINS=* , equals open unauthenticated access."**
Partly refuted, core concern confirmed and it is the most important finding. CORS is **not** `*`
and there is **no `CORS_ORIGINS` env var** anywhere. CORS is a hardcoded allowlist
([src/http-server.ts:39-52](src/http-server.ts#L39-L52),
[src/main.ts:72-85](src/main.ts#L72-L85)): localhost any port, `https://chatgpt.com`,
`https://chat.openai.com`, plus all no-origin requests. But CORS is a browser-only control and
no-origin (curl, server-to-server) is explicitly allowed, so it provides no protection against a
non-browser caller. The real issue is that **none of the HTTP endpoints check any token or
session.** Confirmed. Details in finding 2.

**Claim 3: "localbosses.org, clawd.bot, signet.sh, a Stripe link are contacted at runtime."**
Refuted for runtime contact. None of `localbosses.org`, `clawd.bot`, or `signet.sh` appear
anywhere in the tree. The Stripe URL is a donation link in plain text in
[LICENSE:39](LICENSE#L39) and is never fetched. "clawd" appears only as a hardcoded local
**filesystem** path (`~/.clawdbot/workspace/skills/ghl-workflow-builder/.env`) in the optional
workflow-builder client; it is a local file read/write, not a network call. The only non-GHL
runtime host in the whole codebase is `securetoken.googleapis.com` (Google Firebase), used solely
as GoHighLevel's own auth-token refresh endpoint, and only by the optional workflow-builder client
when refresh-token env vars are present. Full outbound list in finding 7.

---

## Findings by area

### 1. API client — `src/clients/ghl-api-client.ts`

Token handling is correct.

- Token is read once from `process.env.GHL_API_KEY` at server start
  ([src/server.ts:38](src/server.ts#L38), [src/main.ts:34](src/main.ts#L34),
  [src/http-server.ts:58](src/http-server.ts#L58)) and passed into the client config.
- It is attached as `Authorization: Bearer ${config.accessToken}` on the axios instance
  ([src/clients/ghl-api-client.ts:401](src/clients/ghl-api-client.ts#L401)) and on the conversations
  header helper ([:464](src/clients/ghl-api-client.ts#L464)).
- It is **never logged**. The request interceptor logs only method and URL
  ([:412](src/clients/ghl-api-client.ts#L412)); the response interceptor logs status, message, and
  URL ([:424-432](src/clients/ghl-api-client.ts#L424-L432)). `updateAccessToken` writes the literal
  string "Access token updated" with no value ([:1550-1551](src/clients/ghl-api-client.ts#L1550-L1551)).
  No code path writes the token to disk or echoes it in an error.
- Caveat, low severity: a few handlers log full request payloads to **stderr** (search-contacts
  [:604](src/clients/ghl-api-client.ts#L604), search-opportunities [:1689](src/clients/ghl-api-client.ts#L1689)).
  These can contain contact PII (names, search terms). It is stderr only, not disk, not network. If
  stderr is captured into a log aggregator, PII could land there. Consider lowering to a debug gate
  in a later run.

Base URL: hardcoded **default** of `https://services.leadconnectorhq.com`, overridable via
`GHL_BASE_URL` ([src/clients/ghl-api-client.ts:399](src/clients/ghl-api-client.ts#L399) uses
`config.baseUrl`). All requests use relative paths against that single axios `baseURL`, so no tool
can target an arbitrary host unless the operator changes `GHL_BASE_URL`. That env override is
operator-controlled and acceptable; just keep `.env` correct.

`EnhancedGHLClient` ([src/enhanced-ghl-client.ts](src/enhanced-ghl-client.ts), used by the
streamable HTTP server) wraps the same base client with caching, retry, and keep-alive. Same
`baseURL: config.baseUrl`, same Bearer header ([:117-128](src/enhanced-ghl-client.ts#L117-L128)),
no token logging, no extra hosts.

### 2. HTTP transport — `src/http-server.ts`, `src/main.ts`, `src/execute-route.ts`  (most important)

There is **no `api/` directory**; all HTTP surface lives in these three files.

No authentication or authorization on any endpoint. The server builds one shared `GHLApiClient`
from the env `GHL_API_KEY` and every request uses it. Endpoints exposed:

- `src/http-server.ts` (legacy SSE, `start:legacy`): `GET/POST /sse`, `POST /tools/call`,
  `GET /tools`, `GET /capabilities`, `GET /health`, `GET /`. None check a token.
  Binds `0.0.0.0` ([src/http-server.ts:176](src/http-server.ts#L176)).
- `src/main.ts` (streamable HTTP, `start:http`): `ALL /mcp`, `GET/POST /sse`, `POST /tools/call`,
  `GET /tools`, `POST /execute`, `GET /tool-inventory`, `GET /capabilities`, `GET /health`,
  `GET /`. None check a token. Binds `0.0.0.0` ([src/main.ts:209](src/main.ts#L209)).
- `/mcp` and `/execute` optionally read `x-ghl-access-token` / `x-ghl-location-id` headers to build
  a per-request client ([src/main.ts:94-98](src/main.ts#L94-L98),
  [src/execute-route.ts:54-65](src/execute-route.ts#L54-L65)). When those headers are absent, they
  fall back to the powerful env-configured shared client. So supplying a token is optional, not
  required: the default path runs with the server's own full-access PIT.

CORS: hardcoded allowlist (not `*`, no env var), localhost + chatgpt.com + chat.openai.com + all
no-origin requests ([src/http-server.ts:39-52](src/http-server.ts#L39-L52),
[src/main.ts:72-85](src/main.ts#L72-L85)). CORS does not restrict non-browser clients, so it is not
a security boundary here.

Request-body logging: none. `src/main.ts` logs method, path, and IP at debug level only
([src/main.ts:87-90](src/main.ts#L87-L90)). No unexpected debug routes or backdoors were found.
`/tool-inventory` and `/capabilities` disclose the full tool list unauthenticated, which is
information disclosure but not itself a token leak.

Net effect: deploying `start:http` or `start:legacy` on anything reachable beyond loopback gives
any caller full, unauthenticated execution of all 800+ tools (read, write, delete, payments)
against the live CRM. Treat these transports as localhost-only until an auth layer is added.

### 3. Representative tool implementations

Pattern is uniform across all 49 tool modules: a tool class holds a `ghl` client, `getTools()`
returns schemas, and an `executeTool`/`handleToolCall` switch maps each name to a private method
that calls exactly one `this.ghlClient.<method>()`. No side calls, no telemetry, no phone-home.

- Read example, `get_contact`: switch dispatch to `this.ghlClient.getContact()`
  ([src/tools/contact-tools.ts:834](src/tools/contact-tools.ts#L834)).
- Destructive example, `delete_contact`: schema at
  [src/tools/contact-tools.ts:155](src/tools/contact-tools.ts#L155), dispatched at
  [:716-717](src/tools/contact-tools.ts#L716-L717) to `deleteContact()` which calls only
  `this.ghlClient.deleteContact(contactId)` ([:859-860](src/tools/contact-tools.ts#L859-L860)).
  **No confirmation step and no guard**, as expected. The `_meta.labels.access: "delete"` label
  ([:164-170](src/tools/contact-tools.ts#L164-L170)) is descriptive metadata only; it does not
  gate execution.
- Payments example, `delete_coupon` ([src/tools/payments-tools.ts:773](src/tools/payments-tools.ts#L773))
  and `record_order_payment` ([:1028](src/tools/payments-tools.ts#L1028)): same direct-to-client
  pattern. The payments module is mostly read (list/get orders, transactions, subscriptions); its
  writes are coupon CRUD, custom-provider integration create/delete/disconnect, order fulfillment,
  and recording an order payment. No refund or void tool exists by name.

The curated "agent workspace" profile (`GHL_TOOL_PROFILE=curated`) wraps writes in
confirmation-queue staging, but the default `full` profile exposes every raw tool with no
confirmation.

### 4. Dependencies — `package.json`, `package-lock.json`

No `preinstall` / `postinstall` / `install` / `prepare` / `prepack` scripts in the root package.
The only lifecycle script is `prepublishOnly: npm run build`
([package.json:35](package.json#L35)), which runs only on `npm publish`, never on install.

Runtime deps are five well-known packages: `@modelcontextprotocol/sdk`, `axios`, `cors`,
`dotenv`, `express` ([package.json:74-80](package.json#L74-L80)). Dev deps are standard TypeScript
or Jest tooling. No typosquat candidates spotted.

Lockfile is clean:
- Every `"resolved"` URL points to `https://registry.npmjs.org/`. No git, URL, or tarball sources.
- Exactly one package carries `hasInstallScript: true`: `fsevents@2.3.3`
  ([package-lock.json:2416-2419](package-lock.json#L2416-L2419)). It is a `dev: true`, macOS-only
  optional dependency of the file watcher used by nodemon. It does not install on Windows, and the
  guarded install skips its script regardless. Not a concern.

Note: `mcp-apps/` is a **separate** npm package with its own dependency tree, installed only if
you run `npm run apps:install`. It was out of scope for this dependency pass and should get its
own review before the apps server is used.

### 5. CI and test scaffolding

- Workflow: `.github/workflows/ghl-api-drift.yml` exists.
  - Triggers: `pull_request`, `push` to `main`, `schedule` daily at 09:20 UTC, and manual
    `workflow_dispatch` ([:3-37](.github/workflows/ghl-api-drift.yml#L3-L37)).
  - Permissions block: `contents: write`, `pull-requests: write`
    ([:39-41](.github/workflows/ghl-api-drift.yml#L39-L41)). It can push branches and open PRs on
    its own repo, which it does via `peter-evans/create-pull-request@v6` using the built-in
    `GITHUB_TOKEN` ([:99-101](.github/workflows/ghl-api-drift.yml#L99-L101)).
  - It runs `npm ci` then `npm run scan:ghl-api`, which fetches the official GoHighLevel API docs
    snapshot and regenerates coverage artifacts. All network activity is inside GitHub's runner,
    not the client machine, and **nothing is posted to any external service.** No secrets beyond
    `GITHUB_TOKEN` are referenced.
- Smoke test: the brief referenced `smoke-test.mjs`; the actual file is
  [scripts/ghl-live-smoke.mjs](scripts/ghl-live-smoke.mjs). It is opt-in (skips unless
  `GHL_API_KEY` and `GHL_LOCATION_ID` are set), performs four **read-only** GETs against the
  configured GHL base URL only ([:13-18](scripts/ghl-live-smoke.mjs#L13-L18)), and contacts no
  other host.

### 6. Secrets hygiene

- `.gitignore` excludes `.env` and all `.env.*.local` variants, plus
  `cursor-mcp-config.json` ([.gitignore:7-14](.gitignore#L7-L14)). Good.
- `.env` was never committed (`git log --diff-filter=A` for env files returns nothing).
- Full-history blob scan for token patterns (Bearer, JWT `eyJ...`, `sk_live`/`sk_test`,
  `GHL_*_TOKEN=...`) found only placeholder strings (`YOUR_PRIVATE_INTEGRATIONS_API_KEY`) in an
  older README revision. No live secret has ever been committed.
- `.env.example` contains only placeholder values ([.env.example](.env.example)).

One non-secret leak to note: `src/clients/workflow-builder-client.ts` hardcodes the upstream
author's default GHL location ID `DZEpRd43MxUJKdtrev9t` and user ID `8Uy3ls0B517vLO2tSNva`
([:126-127](src/clients/workflow-builder-client.ts#L126-L127)). These are identifiers, not
credentials, but if a workflow-builder tool is ever invoked without `GHL_LOCATION_ID` /
`GHL_USER_ID` set, it would target the author's IDs. Set those env vars (or avoid the
workflow-builder tools) to be safe.

### 7. Outbound surface (full list of non-loopback hosts in `src`)

- `services.leadconnectorhq.com` — the GHL public API base URL. Default and expected. (server.ts,
  main.ts, http-server.ts, enhanced-ghl-client.ts, ghl-live-smoke.mjs)
- `backend.leadconnectorhq.com/workflow` — GHL's private internal workflow API, used only by the
  optional `WorkflowBuilderClient` ([src/clients/workflow-builder-client.ts:84](src/clients/workflow-builder-client.ts#L84)).
- `securetoken.googleapis.com/v1/token` — Google Firebase token refresh, GHL's own auth provider,
  used only by `WorkflowBuilderClient`'s legacy Firebase flow
  ([:85](src/clients/workflow-builder-client.ts#L85)). This is the only `googleapis.com` / non-GHL
  host in the codebase. It is contacted only when `GHL_FIREBASE_*` env vars are set.
- `services.leadconnectorhq.com/auth/refresh` — GHL v2 JWT refresh, `WorkflowBuilderClient`
  ([:86](src/clients/workflow-builder-client.ts#L86)).
- `app.gohighlevel.com` — appears as documentation/UI links inside tool descriptions in
  `src/tools/workflow-builder-tools.ts` (lines 370, 410, 484), not fetched at runtime.
- `chatgpt.com`, `chat.openai.com` — CORS allowlist string literals only, not fetched.

The workflow-builder client is constructed at registry startup
([src/tool-registry.ts:296-297](src/tool-registry.ts#L296-L297)), but its constructor only reads
env vars and the local `.clawdbot` `.env` file (a no-op when that path is absent) and catches any
error ([src/tools/workflow-builder-tools.ts:53-59](src/tools/workflow-builder-tools.ts#L53-L59)).
**No network call happens at startup.** The `backend.leadconnectorhq.com` /
`securetoken.googleapis.com` calls fire only when a `ghl_*_workflow` tool is actually executed and
the required refresh-token env vars are present. With a PIT-only `.env` (the planned setup), these
tools simply error and contact nothing.

---

## Destructive tools inventory (handle with care)

The `full` (default) profile exposes 800+ tools with no confirmation step. Destructive ones to
flag for a later "handle with care" gate include, by name prefix:

- Contacts: `delete_contact`, `delete_contact_task`, `delete_contact_note`,
  `remove_contact_tags`, `remove_contact_followers`, `remove_contact_from_campaign`,
  `remove_contact_from_all_campaigns`, `remove_contact_from_workflow`.
- Pipeline: `delete_opportunity`, `remove_opportunity_followers`.
- Location/account: `delete_location`, `delete_location_tag`, `delete_location_custom_field`,
  `delete_location_custom_value`, `delete_location_template`, `delete_recurring_task`,
  `delete_user`, `delete_api_key`.
- Calendars: `delete_calendar`, `delete_appointment`, `delete_calendar_group`,
  `delete_appointment_note`, `delete_calendar_resource_*`, `delete_calendar_notification`.
- Conversations/campaigns: `delete_conversation`, `cancel_scheduled_message`,
  `cancel_scheduled_email`, `delete_campaign`, `cancel_scheduled_campaign_message`.
- Commerce/payments: `delete_coupon`, `delete_custom_provider_integration`,
  `disconnect_custom_provider_config`, `record_order_payment`, `create_order_fulfillment`.
- Content/config: `delete_blog_post`-class, `delete_funnel_redirect`, `delete_link`,
  `delete_media_file`, `delete_object_record`, `delete_social_post`, `delete_social_account`,
  `delete_smart_list`, `delete_webhook`, `delete_trigger`, many `delete_*_template`,
  `delete_snippet`, `delete_voice_ai_agent`, `delete_voice_ai_action`, `delete_ivr_menu`,
  `delete_voicemail`, `delete_caller_id`, courses/store deletes, etc.
- Workflow builder (internal GHL API, only with refresh-token creds): `ghl_delete_workflow`,
  `ghl_update_workflow`, `ghl_publish_workflow`.

This is a representative list from a grep of tool definitions; treat any `delete_*`, `remove_*`,
`cancel_*`, `disconnect_*`, or payment-write tool as destructive.

---

## Things that surprised me

1. The brief's "single commit" premise was wrong: 8 commits exist, and the daily-CI workflow is
   real and verifiable. The two were framed as contradictory; neither claim holds.
2. The CORS detail in the brief (`CORS_ORIGINS=*`) does not exist in this code, but the underlying
   worry was understated, not overstated: the problem is not loose CORS, it is **no auth at all**.
3. The `WorkflowBuilderClient` is a notable artifact. It talks to GHL's **undocumented internal**
   backend and to Google Firebase, reads and writes credential files from a hardcoded
   author-specific path (`~/.clawdbot/.../.env`), and carries the upstream author's location and
   user IDs as defaults. It is inert without separate refresh-token env vars, but it is wired into
   the default tool surface and is the only part of the codebase that reaches beyond the GHL public
   API. Worth a closer look before enabling any `ghl_*_workflow` tool.
4. All commits are authored by "Jake Shore" while the repo lives under the `si-commits` account,
   confirming this is a fork or rebuild of an upstream project rather than original work. Trust in
   the code should track trust in that upstream author.

---

## Phase 3: guarded install result

Command run: `npm install --ignore-scripts --no-audit --no-fund`.

- Result: `added 414 packages in 3s`, exit code 0. No build or `dist/` output was produced
  (install only; the build script was not run, per the brief).
- Two deprecation warnings, both benign and transitive (not direct deps):
  `inflight@1.0.6` (memory-leak notice, pulled in via `glob`) and `glob@7.2.3` (pre-v9
  unsupported). Neither is a security issue; they are common in the npm ecosystem.
- Lifecycle scripts skipped: per the lockfile, the only package carrying an install script is
  `fsevents@2.3.3` (dev-only, macOS-only optional). With `--ignore-scripts` its native build was
  not run, and on Windows it would not run anyway. No other package requested a preinstall,
  install, or postinstall script. Nothing unexpected was skipped.

A non-guarded install and the build were intentionally **not** run in this session, per the brief.
