#!/usr/bin/env node
/** Decisive: is a notification body mutable via ANY path? And does an API
 *  Version header change the PUT 422? Determines Phase D viability. */
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
function mkHttp(versionHeader) {
  return axios.create({
    baseURL: cfg.baseUrl,
    headers: { Authorization: `Bearer ${cfg.accessToken}`, Version: versionHeader, 'Content-Type': 'application/json', Accept: 'application/json' },
    timeout: 30000, validateStatus: () => true,
  });
}
const http = mkHttp(cfg.version);
const bodyOf = async (calId, id) => {
  const r = await http.get(`/calendars/${calId}/notifications/${id}`);
  return { status: r.status, subject: r.data && r.data.subject, body: r.data && r.data.body, deleted: r.data && r.data.deleted, version: r.data && r.data.version };
};
(async () => {
  let calId = null;
  try {
    const cal = await client.createCalendar({ name: 'SMOKE TEST - mutability probe', calendarType: 'personal', isActive: false, teamMembers: [{ userId: JENNA, isPrimary: true }] });
    calId = cal.data.calendar.id;
    const mk = async (subject, body) => {
      const c = await client.createCalendarNotifications(calId, [{ receiverType: 'contact', notificationType: 'reminder', channel: 'email', beforeTime: [{ timeOffset: 24, unit: 'hours' }], subject, body, isActive: true }]);
      const arr = Array.isArray(c.data) ? c.data : (c.data.notifications || []);
      return arr[0] && arr[0]._id;
    };
    const id = await mk('AAA', '<p>AAA</p>');
    console.log('created notif', id, '->', JSON.stringify(await bodyOf(calId, id)));

    // M1: POST same type with new body while active (collision)
    await client.createCalendarNotifications(calId, [{ receiverType: 'contact', notificationType: 'reminder', channel: 'email', beforeTime: [{ timeOffset: 24, unit: 'hours' }], subject: 'BBB', body: '<p>BBB</p>', isActive: true }]);
    console.log('M1 after POST BBB (active collision) ->', JSON.stringify(await bodyOf(calId, id)));

    // M2: soft-delete then POST new body
    await client.deleteCalendarNotification(calId, id);
    console.log('M2a after soft-delete ->', JSON.stringify(await bodyOf(calId, id)));
    await client.createCalendarNotifications(calId, [{ receiverType: 'contact', notificationType: 'reminder', channel: 'email', beforeTime: [{ timeOffset: 24, unit: 'hours' }], subject: 'CCC', body: '<p>CCC</p>', isActive: true }]);
    console.log('M2b after soft-delete + POST CCC ->', JSON.stringify(await bodyOf(calId, id)));

    // M3: PUT under alternate Version headers
    const full = { altType: 'calendar', altId: calId, receiverType: 'contact', channel: 'email', notificationType: 'reminder', isActive: true, beforeTime: [{ timeOffset: 24, unit: 'hours' }], subject: 'PUTV', body: '<p>PUTV</p>' };
    for (const v of ['2021-07-28', '2021-04-15', '2021-11-01']) {
      const res = await mkHttp(v).put(`/calendars/${calId}/notifications/${id}`, full);
      console.log(`M3 PUT Version=${v} -> ${res.status} ${JSON.stringify(res.data).slice(0, 160)}`);
    }
  } catch (e) { console.log('ERROR:', e.message); }
  finally { if (calId) { try { await client.deleteCalendar(calId); console.log('\ncleaned up', calId); } catch (e) { console.log('cleanup failed', e.message); } } }
})();
