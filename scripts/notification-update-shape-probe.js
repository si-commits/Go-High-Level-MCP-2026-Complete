#!/usr/bin/env node
/** The 422 is body-shape/route independent of fields. Test body-shape and
 *  method variants to find what GHL's notification update actually accepts. */
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
async function req(label, method, url, body) {
  const res = await http.request({ method, url, data: body });
  console.log(`\n=== ${label} -> ${res.status} ===`);
  console.log('resp:', JSON.stringify(res.data).slice(0, 400));
  return res.status;
}
(async () => {
  let calId = null;
  try {
    const cal = await client.createCalendar({ name: 'SMOKE TEST - shape probe cal', calendarType: 'personal', isActive: false, teamMembers: [{ userId: JENNA, isPrimary: true }] });
    calId = cal.data.calendar.id;
    const created = await client.createCalendarNotifications(calId, [{ receiverType: 'contact', notificationType: 'reminder', channel: 'email', beforeTime: [{ timeOffset: 24, unit: 'hours' }], subject: 'init', body: '<p>init</p>', isActive: true }]);
    const arr = Array.isArray(created.data) ? created.data : (created.data.notifications || []);
    const id = arr[0]._id;
    console.log('cal:', calId, 'notif:', id);
    const full = { altType: 'calendar', altId: calId, receiverType: 'contact', channel: 'email', notificationType: 'reminder', isActive: true, beforeTime: [{ timeOffset: 24, unit: 'hours' }], subject: 'shaped', body: '<p>shaped</p>' };
    const url = `/calendars/${calId}/notifications/${id}`;
    const coll = `/calendars/${calId}/notifications`;
    await req('P1 PUT array body', 'put', url, [full]);
    await req('P2 PUT {notifications:[...]}', 'put', url, { notifications: [full] });
    await req('P3 PATCH object', 'patch', url, full);
    await req('P4 PUT object+_id', 'put', url, { ...full, _id: id });
    await req('P5 PUT to collection (no id)', 'put', coll, full);
    await req('P6 PUT array to collection', 'put', coll, [{ ...full, _id: id }]);
    await req('P7 POST array w/ _id (update via upsert?)', 'post', coll, [{ ...full, _id: id }]);
  } catch (e) { console.log('SETUP ERROR:', e.message); }
  finally { if (calId) { try { await client.deleteCalendar(calId); console.log('\ncleaned up', calId); } catch (e) { console.log('cleanup failed', e.message); } } }
})();
