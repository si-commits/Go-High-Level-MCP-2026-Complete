#!/usr/bin/env node
/**
 * Phase C smoke test for the email template two-step flow fix.
 * Drives the REBUILT dist client directly (this session's live MCP runs the
 * pre-rebuild process). Creates throwaway templates, verifies bodies via the
 * rendered previewUrl, and deletes everything. Read-only on existing data.
 */
const fs = require('fs');
const path = require('path');

// Load .env (gitignored) into process.env.
const envPath = path.join(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const { GHLApiClient } = require('../dist/clients/ghl-api-client.js');

const config = {
  accessToken: process.env.GHL_API_KEY,
  baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
  version: process.env.GHL_API_VERSION || '2021-07-28',
  locationId: process.env.GHL_LOCATION_ID,
};
const JENNA = 'UIChIX3a0wWAs7vdhdfM';
const client = new GHLApiClient(config);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function listBuilders() {
  const r = await client.getEmailTemplates({ limit: 100, offset: 0 });
  return (r.data && r.data.builders) || [];
}
async function findByName(name) {
  return (await listBuilders()).find((t) => t.name === name);
}
// Poll the rendered preview for a marker string (body regen can lag a beat).
async function previewHasMarker(name, marker, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const entry = await findByName(name);
    if (entry && entry.previewUrl) {
      const res = await fetch(entry.previewUrl);
      const text = await res.text();
      if (text.includes(marker)) return { found: true, id: entry.id };
      if (i === tries - 1) return { found: false, id: entry.id, snippet: text.slice(0, 300) };
    }
    await sleep(2500);
  }
  return { found: false, id: null };
}
async function deleteByName(name) {
  const entry = await findByName(name);
  if (!entry) return { deleted: false, reason: 'not found pre-delete' };
  await client.deleteEmailTemplate({ templateId: entry.id });
  await sleep(1500);
  const still = await findByName(name);
  return { deleted: !still, id: entry.id };
}

const results = [];
function log(test, pass, detail) {
  results.push({ test, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} | ${test} | ${detail}`);
}

(async () => {
  // Discover a second valid user for the explicit-override test.
  let secondUser = JENNA;
  let userNote = 'fallback: reused Jenna (no distinct second user found)';
  try {
    const res = await fetch(`${config.baseUrl}/users/search?locationId=${config.locationId}&limit=20`, {
      headers: { Authorization: `Bearer ${config.accessToken}`, Version: config.version, Accept: 'application/json' },
    });
    const j = await res.json();
    const ids = (j.users || []).map((u) => u.id).filter(Boolean);
    const distinct = ids.find((id) => id !== JENNA);
    if (distinct) { secondUser = distinct; userNote = `distinct user ${distinct}`; }
  } catch (e) {
    userNote = `user lookup failed: ${e.message}`;
  }

  // TEST 1: create-with-body round-trip
  try {
    const name = 'SMOKE Create Body 9001';
    const marker = 'SMOKE TEST EMAIL TEMPLATE 9001';
    const c = await client.createEmailTemplate({ title: name, html: `<p>${marker}</p>` });
    const id = c.data && (c.data.id || c.data.templateId);
    const v = await previewHasMarker(name, marker);
    log('T1 create-with-body', !!id && v.found, `id=${id} bodyVerified=${v.found}${v.found ? '' : ' snippet=' + (v.snippet || '')}`);
    const d = await deleteByName(name);
    log('T1 cleanup', d.deleted, `deleted=${d.deleted} id=${d.id}`);
  } catch (e) { log('T1 create-with-body', false, `threw: ${e.message}`); }

  // TEST 2: update-existing-body round-trip
  try {
    const name = 'SMOKE Update 9002';
    const a = 'SMOKE BODY ALPHA 9002A';
    const b = 'SMOKE BODY BETA 9002B';
    await client.createEmailTemplate({ title: name, html: `<p>${a}</p>` });
    const v1 = await previewHasMarker(name, a);
    await client.updateEmailTemplate({ templateId: v1.id, html: `<p>${b}</p>` });
    const v2 = await previewHasMarker(name, b);
    const gone = await previewHasMarker(name, a, 2); // ALPHA should no longer be present
    log('T2 update-body', v1.found && v2.found && !gone.found, `alphaSet=${v1.found} betaSet=${v2.found} alphaGone=${!gone.found}`);
    const d = await deleteByName(name);
    log('T2 cleanup', d.deleted, `deleted=${d.deleted} id=${d.id}`);
  } catch (e) { log('T2 update-body', false, `threw: ${e.message}`); }

  // TEST 3: default updatedBy (none passed)
  try {
    const name = 'SMOKE Default UpdatedBy 9003';
    const marker = 'SMOKE DEFAULT UPDATEDBY 9003';
    const c = await client.createEmailTemplate({ title: name, html: '<p>seed 9003</p>' });
    const id = c.data && (c.data.id || c.data.templateId);
    await client.updateEmailTemplate({ templateId: id, html: `<p>${marker}</p>` }); // no updatedBy
    const v = await previewHasMarker(name, marker);
    log('T3 default-updatedBy', v.found, `updateSucceeded=true bodyVerified=${v.found}`);
    const d = await deleteByName(name);
    log('T3 cleanup', d.deleted, `deleted=${d.deleted} id=${d.id}`);
  } catch (e) { log('T3 default-updatedBy', false, `threw: ${e.message}`); }

  // TEST 4: explicit updatedBy override
  try {
    const name = 'SMOKE Explicit UpdatedBy 9004';
    const marker = 'SMOKE EXPLICIT UPDATEDBY 9004';
    const c = await client.createEmailTemplate({ title: name, html: '<p>seed 9004</p>' });
    const id = c.data && (c.data.id || c.data.templateId);
    await client.updateEmailTemplate({ templateId: id, html: `<p>${marker}</p>`, updatedBy: secondUser });
    const v = await previewHasMarker(name, marker);
    log('T4 explicit-updatedBy', v.found, `override=${userNote} bodyVerified=${v.found}`);
    const d = await deleteByName(name);
    log('T4 cleanup', d.deleted, `deleted=${d.deleted} id=${d.id}`);
  } catch (e) { log('T4 explicit-updatedBy', false, `threw: ${e.message}`); }

  // Final cleanup sweep: ensure no SMOKE templates linger.
  const lingering = (await listBuilders()).filter((t) => t.name && t.name.startsWith('SMOKE '));
  log('Final cleanup sweep', lingering.length === 0, `lingering=${lingering.length}`);

  const failures = results.filter((r) => !r.pass).length;
  console.log(`\n=== SUMMARY: ${results.length - failures}/${results.length} passed, ${failures} failed ===`);
  process.exit(failures > 0 ? 1 : 0);
})();
