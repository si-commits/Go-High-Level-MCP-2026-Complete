#!/usr/bin/env node
/**
 * Phase C smoke test for the altType/altId auto-inject fix on
 * update_calendar_notification. Drives the REBUILT dist client directly (the
 * session MCP runs the pre-rebuild process). Creates a throwaway inactive
 * calendar + notification, updates it (the path that used to 422), proves the
 * update is clean and idempotent, then deletes the calendar (cascade).
 *
 * Body/subject cannot be read back (Phase A: GHL returns neither on any GET),
 * so verification is: update returns success (no 422), and the version bumps
 * cleanly by exactly 1 per successful update (no error-with-mutation).
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const { GHLApiClient } = require('../dist/clients/ghl-api-client.js');
const client = new GHLApiClient({
  accessToken: process.env.GHL_API_KEY,
  baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
  version: process.env.GHL_API_VERSION || '2021-07-28',
  locationId: process.env.GHL_LOCATION_ID,
});
const JENNA = 'UIChIX3a0wWAs7vdhdfM';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
function log(test, pass, detail) {
  results.push({ test, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} | ${test} | ${detail}`);
}

async function notifVersion(calId, notifId) {
  const r = await client.getCalendarNotification(calId, notifId);
  return r.data ? r.data.version : null;
}

(async () => {
  let calId = null;
  let notifId = null;
  try {
    // --- setup: throwaway inactive calendar ---
    const cal = await client.createCalendar({
      name: 'SMOKE TEST - update probe cal',
      calendarType: 'personal',
      isActive: false,
      teamMembers: [{ userId: JENNA, isPrimary: true }],
    });
    calId = cal.data && cal.data.calendar && cal.data.calendar.id;
    if (!calId) throw new Error('no calendar id: ' + JSON.stringify(cal).slice(0, 300));
    console.log('throwaway calendar:', calId);

    // --- setup: a notification on it ---
    const created = await client.createCalendarNotifications(calId, [{
      receiverType: 'contact',
      notificationType: 'reminder',
      channel: 'email',
      beforeTime: [{ timeOffset: 24, unit: 'hours' }],
      subject: 'SMOKE initial',
      body: '<p>smoke initial</p>',
      isActive: true,
    }]);
    const arr = Array.isArray(created.data) ? created.data : (created.data && created.data.notifications) || [];
    notifId = arr[0] && arr[0]._id;
    if (!notifId) throw new Error('no notification id: ' + JSON.stringify(created).slice(0, 300));
    console.log('throwaway notification:', notifId);
    const v1 = await notifVersion(calId, notifId);
    console.log('version after create:', v1);

    // --- Test 1: update succeeds without 422, clean single version bump ---
    let t1err = null, t1resp = null;
    try {
      t1resp = await client.updateCalendarNotification(calId, notifId, {
        subject: 'SMOKE TEST UPDATE PROBE',
        body: '<p>smoke updated</p>',
      });
    } catch (e) { t1err = e.message; }
    const v2 = await notifVersion(calId, notifId);
    if (t1err) {
      log('T1 update no-422', false, `update threw: ${t1err}`);
    } else {
      const clean = t1resp && t1resp.success === true && v2 === v1 + 1;
      log('T1 update no-422', !!clean,
        `success=${t1resp && t1resp.success}, version ${v1} -> ${v2} (expect +1, clean single bump, no error-with-mutation)`);
    }

    // --- Test 2: idempotent retry ---
    let t2err = null, t2resp = null;
    try {
      t2resp = await client.updateCalendarNotification(calId, notifId, {
        subject: 'SMOKE TEST UPDATE PROBE',
        body: '<p>smoke updated</p>',
      });
    } catch (e) { t2err = e.message; }
    const v3 = await notifVersion(calId, notifId);
    if (t2err) {
      log('T2 idempotent retry', false, `retry threw: ${t2err}`);
    } else {
      const ok = t2resp && t2resp.success === true && v3 === v2 + 1;
      log('T2 idempotent retry', !!ok,
        `success=${t2resp && t2resp.success}, version ${v2} -> ${v3} (safely retryable)`);
    }
  } catch (e) {
    log('setup', false, e.message);
  } finally {
    // --- Test 3: cleanup (cascade) ---
    if (calId) {
      try {
        const del = await client.deleteCalendar(calId);
        await sleep(1500);
        let calGone = false;
        try {
          const after = await client.getCalendar(calId);
          calGone = !after || !after.data || (after.data.calendar == null && after.data.id == null);
        } catch (e) { calGone = true; } // 404 on a deleted calendar counts as gone
        const ok = (del && del.success === true) || calGone;
        log('T3 cleanup', !!ok, `deleteCalendar success=${del && del.success}; calendar fetch gone=${calGone}`);
      } catch (e) {
        log('T3 cleanup', false, `delete failed: ${e.message}`);
      }
    }
    const passed = results.filter((r) => r.pass).length;
    console.log(`\n${passed}/${results.length} checks passed`);
  }
})();
