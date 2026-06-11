#!/usr/bin/env node
/**
 * Diagnose the real 422 on the notification PUT. altType/altId injection did
 * not fix it, so capture GHL's FULL 422 response body (the wrapper collapses it
 * to the exception name) across several payload shapes to see what GHL actually
 * rejects. Creates a throwaway calendar+notification, raw-PUTs variants, cleans up.
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
  headers: {
    Authorization: `Bearer ${cfg.accessToken}`,
    Version: cfg.version,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
  validateStatus: () => true,
});

async function putVariant(label, calId, notifId, body) {
  const res = await http.put(`/calendars/${calId}/notifications/${notifId}`, body);
  console.log(`\n=== ${label} -> ${res.status} ===`);
  console.log('sent keys:', Object.keys(body).join(', '));
  console.log('resp:', JSON.stringify(res.data).slice(0, 600));
}

(async () => {
  let calId = null;
  try {
    const cal = await client.createCalendar({
      name: 'SMOKE TEST - 422 probe cal',
      calendarType: 'personal',
      isActive: false,
      teamMembers: [{ userId: JENNA, isPrimary: true }],
    });
    calId = cal.data.calendar.id;
    const created = await client.createCalendarNotifications(calId, [{
      receiverType: 'contact', notificationType: 'reminder', channel: 'email',
      beforeTime: [{ timeOffset: 24, unit: 'hours' }],
      subject: 'init', body: '<p>init</p>', isActive: true,
    }]);
    const arr = Array.isArray(created.data) ? created.data : (created.data.notifications || []);
    const notifId = arr[0]._id;
    console.log('cal:', calId, 'notif:', notifId);
    // Dump the exact GET shape we are trying to mirror
    const got = await http.get(`/calendars/${calId}/notifications/${notifId}`);
    console.log('GET shape:', JSON.stringify(got.data));

    // V1: just altType/altId + one field
    await putVariant('V1 altType+altId+subject', calId, notifId, {
      altType: 'calendar', altId: calId, subject: 'probe v1',
    });
    // V2: full object mirroring GET + required notification fields
    await putVariant('V2 full object', calId, notifId, {
      altType: 'calendar', altId: calId,
      receiverType: 'contact', channel: 'email', notificationType: 'reminder',
      isActive: true, beforeTime: [{ timeOffset: 24, unit: 'hours' }],
      subject: 'probe v2', body: '<p>v2</p>',
    });
    // V3: V2 + _id + deleted
    await putVariant('V3 full + _id + deleted', calId, notifId, {
      _id: notifId, deleted: false,
      altType: 'calendar', altId: calId,
      receiverType: 'contact', channel: 'email', notificationType: 'reminder',
      isActive: true, beforeTime: [{ timeOffset: 24, unit: 'hours' }],
      subject: 'probe v3', body: '<p>v3</p>',
    });
    // V4: no altType/altId (original failing shape) for contrast
    await putVariant('V4 no altType/altId', calId, notifId, {
      subject: 'probe v4',
    });
    // V5: selectedUsers + emailEnabled style fields some GHL notif schemas want
    await putVariant('V5 full + selectedUsers', calId, notifId, {
      altType: 'calendar', altId: calId,
      receiverType: 'contact', channel: 'email', notificationType: 'reminder',
      isActive: true, beforeTime: [{ timeOffset: 24, unit: 'hours' }],
      subject: 'probe v5', body: '<p>v5</p>', selectedUsers: [],
    });
  } catch (e) {
    console.log('SETUP ERROR:', e.message);
  } finally {
    if (calId) {
      try { await client.deleteCalendar(calId); console.log('\ncleaned up calendar', calId); }
      catch (e) { console.log('cleanup failed:', e.message); }
    }
  }
})();
