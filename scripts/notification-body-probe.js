#!/usr/bin/env node
/**
 * Phase A read-only probe: does GHL return notification body/subject through
 * ANY GET endpoint? wrapResponse is a passthrough, so the MCP output already
 * equals GHL's raw response.data. This script hits candidate endpoints with
 * raw axios (same auth as the client) and dumps the FULL notification object
 * so every returned field is visible. PURE GET. No writes.
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const envPath = path.join(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const baseURL = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com';
const http = axios.create({
  baseURL,
  headers: {
    Authorization: `Bearer ${process.env.GHL_API_KEY}`,
    Version: process.env.GHL_API_VERSION || '2021-07-28',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
  validateStatus: () => true, // never throw; we want to see every status
});

const CAL = '9czE4WeZ4QbbDIHFxlOP';
const REMINDER = '6a2a2a39b72e84c1892e4513'; // soft-deleted; may carry partial-write body
const BOOKED = '6a2a2a39b72e8439ef2e4512';   // contact/booked, created empty body

function summarize(obj) {
  if (!obj || typeof obj !== 'object') return String(obj);
  const keys = Object.keys(obj);
  return {
    keys,
    hasBody: 'body' in obj,
    hasSubject: 'subject' in obj,
    body: obj.body,
    subject: obj.subject,
  };
}

async function probe(label, method, url, params) {
  try {
    const res = await http.request({ method, url, params });
    let payload = res.data;
    // notifications endpoints return either an object or {notifications:[...]} or array
    let note = payload;
    if (payload && payload.notifications) note = payload.notifications;
    console.log(`\n=== ${label} ===`);
    console.log(`${method.toUpperCase()} ${url} -> ${res.status}`);
    if (Array.isArray(note)) {
      console.log(`array of ${note.length}; per-item summary:`);
      for (const n of note) {
        if (n && (n._id === REMINDER || n._id === BOOKED)) {
          console.log(` _id=${n._id}`, JSON.stringify(summarize(n)));
        }
      }
      // also dump first item's full keys for reference
      if (note[0]) console.log('first item keys:', Object.keys(note[0]));
    } else {
      console.log(JSON.stringify(summarize(note), null, 2));
      console.log('FULL:', JSON.stringify(payload).slice(0, 800));
    }
  } catch (e) {
    console.log(`\n=== ${label} ===`);
    console.log(`${method.toUpperCase()} ${url} -> THREW ${e.message}`);
  }
}

(async () => {
  // A: standard singular GET, reminder (may have partial-write body)
  await probe('A reminder singular', 'get', `/calendars/${CAL}/notifications/${REMINDER}`);
  // B: standard singular GET, booked (empty body baseline)
  await probe('B booked singular', 'get', `/calendars/${CAL}/notifications/${BOOKED}`);
  // C: list endpoint, includes deleted
  await probe('C list (deleted=true)', 'get', `/calendars/${CAL}/notifications`, { deleted: true });
  // D: no-calendarId variant (user suggestion)
  await probe('D reminder no-calendarId', 'get', `/calendars/notifications/${REMINDER}`);
  // E: guess at a preview subpath
  await probe('E reminder preview subpath', 'get', `/calendars/${CAL}/notifications/${REMINDER}/preview`);
  console.log('\n--- probe complete (read-only) ---');
})();
