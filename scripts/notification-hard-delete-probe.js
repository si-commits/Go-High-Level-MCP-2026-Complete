#!/usr/bin/env node
/**
 * Hard-delete probe. The critical question: is there ANY API path that fully
 * purges a notification record so a fresh one (with a body) can be created in
 * its (receiverType, notificationType, channel) slot? Standard DELETE only
 * soft-deletes (deleted:true, slot still occupied, revived by POST).
 *
 * Throwaway calendar + notification, body "ORIG". Soft-delete, then try delete
 * variants, GET-checking after each (404 = purged). Finally POST a fresh
 * notification with body "NEW": if GET shows "NEW" the slot was freed; if "ORIG"
 * it revived the old record. Cleans up the calendar regardless.
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const envPath = path.join(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const { GHLApiClient } = require('../dist/clients/ghl-api-client.js');
const cfg = {
  accessToken: process.env.GHL_API_KEY,
  baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
  version: process.env.GHL_API_VERSION || '2021-07-28',
  locationId: process.env.GHL_LOCATION_ID,
};
const client = new GHLApiClient(cfg);
const JENNA = 'UIChIX3a0wWAs7vdhdfM';
const http = axios.create({
  baseURL: cfg.baseUrl,
  headers: { Authorization: `Bearer ${cfg.accessToken}`, Version: cfg.version, 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 30000, validateStatus: () => true,
});

async function state(calId, id) {
  const r = await http.get(`/calendars/${calId}/notifications/${id}`);
  if (r.status !== 200) return `GET ${r.status} (gone?)`;
  return `present deleted=${r.data.deleted} body=${JSON.stringify(r.data.body)} subject=${JSON.stringify(r.data.subject)} v=${r.data.version}`;
}
async function mkReminder(calId, subject, body) {
  const c = await client.createCalendarNotifications(calId, [{ receiverType: 'contact', notificationType: 'reminder', channel: 'email', beforeTime: [{ timeOffset: 24, unit: 'hours' }], subject, body, isActive: true }]);
  const arr = Array.isArray(c.data) ? c.data : (c.data.notifications || []);
  return arr[0] && arr[0]._id;
}

(async () => {
  let calId = null;
  try {
    const cal = await client.createCalendar({ name: 'SMOKE TEST - hard delete probe', calendarType: 'personal', isActive: false, teamMembers: [{ userId: JENNA, isPrimary: true }] });
    calId = cal.data.calendar.id;
    const id = await mkReminder(calId, 'ORIG', '<p>ORIG</p>');
    console.log('created:', id, '->', await state(calId, id));

    // soft-delete (standard path)
    await client.deleteCalendarNotification(calId, id);
    console.log('after soft-delete ->', await state(calId, id));

    const base = `/calendars/${calId}/notifications/${id}`;
    const variants = [
      ['D1 DELETE ?hard=true', { method: 'delete', url: base, params: { hard: true } }],
      ['D2 DELETE ?permanent=true', { method: 'delete', url: base, params: { permanent: true } }],
      ['D3 DELETE ?force=true', { method: 'delete', url: base, params: { force: true } }],
      ['D4 DELETE ?deleted=true', { method: 'delete', url: base, params: { deleted: true } }],
      ['D5 DELETE body {permanent:true}', { method: 'delete', url: base, data: { permanent: true } }],
      ['D6 DELETE again (double)', { method: 'delete', url: base }],
    ];
    for (const [label, req] of variants) {
      const res = await http.request(req);
      console.log(`\n${label} -> ${res.status} ${JSON.stringify(res.data).slice(0, 140)}`);
      console.log('   state:', await state(calId, id));
    }

    // The decisive test: create fresh same-type with a NEW body.
    console.log('\n--- create-fresh test (same type, body NEW) ---');
    const newId = await mkReminder(calId, 'NEW', '<p>NEW</p>');
    console.log('returned _id:', newId, '(same as orig?', newId === id, ')');
    console.log('state of returned id ->', await state(calId, newId));
    console.log(newId === id
      ? 'RESULT: revived the old record (slot NOT freed)'
      : 'RESULT: fresh record created (slot freed!)');
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    if (calId) { try { await client.deleteCalendar(calId); console.log('\ncleaned up calendar', calId); } catch (e) { console.log('cleanup failed', e.message); } }
  }
})();
