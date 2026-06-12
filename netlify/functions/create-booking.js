// Creates a VEVENT in Radicale after a booking form submission.
// Expects JSON body: { date, startTime, endTime, name, phone, email, address, organisation, abn, food }

const RADICALE_URL  = process.env.RADICALE_URL;
const RADICALE_USER = process.env.RADICALE_USER;
const RADICALE_PASS = process.env.RADICALE_PASSWORD;
const CALENDAR_PATH = process.env.RADICALE_CALENDAR_PATH || `/${RADICALE_USER}/calendar/`;
const TZ            = process.env.BOOKING_TZ || 'Australia/Sydney';

function basicAuth(user, pass) {
  return 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
}

// "2026-06-15" + "09:00" → "20260615T090000"
function toLocal(dateStr, timeStr) {
  const d = dateStr.replace(/-/g, '');
  const t = (timeStr === '24:00' ? '23:59' : timeStr).replace(':', '') + '00';
  return `${d}T${t}`;
}

function makeICS({ uid, date, startTime, endTime, name, phone, email, address, organisation, abn, food }) {
  const dtstart = toLocal(date, startTime);
  const dtend   = toLocal(date, endTime);
  const now     = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';

  const descParts = [
    `Contact: ${name}`,
    `Phone: ${phone}`,
    `Email: ${email}`,
    `Address: ${address}`,
    organisation ? `Organisation: ${organisation}` : null,
    abn          ? `ABN: ${abn}` : null,
    `Food/drink provided: ${food === 'yes' ? 'Yes' : 'No'}`,
  ].filter(Boolean);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dreamy Shots//Booking//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=${TZ}:${dtstart}`,
    `DTEND;TZID=${TZ}:${dtend}`,
    `SUMMARY:Dreamy Shots - ${name}`,
    `DESCRIPTION:${descParts.join('\\n')}`,
    `LOCATION:${address}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

exports.handler = async function (event, context) {
  console.log('[create-booking] function invoked, method:', event.httpMethod);
  console.log('[create-booking] env check — URL:', RADICALE_URL, '| USER:', RADICALE_USER, '| PASS set:', !!RADICALE_PASS);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  if (!RADICALE_URL || !RADICALE_USER || !RADICALE_PASS) {
    console.error('[create-booking] missing env vars — aborting');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Radicale not configured' }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
    console.log('[create-booking] parsed payload:', JSON.stringify(payload));
  } catch {
    console.error('[create-booking] failed to parse body:', event.body);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' }),
    };
  }

  const { date, startTime, endTime, name, phone, email, address } = payload;
  if (!date || !startTime || !endTime || !name || !phone || !email || !address) {
    console.error('[create-booking] missing required fields in payload');
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required fields' }),
    };
  }

  const uid    = `DS-${date.replace(/-/g, '')}-${startTime.replace(':', '')}-${endTime.replace(':', '')}@dreamyshots`;
  const ics    = makeICS({ uid, ...payload });
  const putUrl = `${RADICALE_URL}${CALENDAR_PATH}${uid}.ics`;

  console.log('[create-booking] generated UID:', uid);
  console.log('[create-booking] PUTting to Radicale:', putUrl);
  console.log('[create-booking] ICS content:\n', ics);

  try {
    const res = await fetch(putUrl, {
      method:  'PUT',
      headers: {
        'Authorization': basicAuth(RADICALE_USER, RADICALE_PASS),
        'Content-Type':  'text/calendar; charset=utf-8',
        'If-None-Match': '*',
      },
      body: ics,
    });

    console.log('[create-booking] Radicale response status:', res.status, res.statusText);

    if (res.status === 412) {
      console.warn('[create-booking] 412 Precondition Failed — slot already exists in Radicale');
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'This slot is already booked.' }),
      };
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error('[create-booking] Radicale error body:', errText);
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Radicale error: ${res.status}` }),
      };
    }

    console.log('[create-booking] booking created successfully, UID:', uid);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, uid }),
    };
  } catch (err) {
    console.error('[create-booking] fetch threw:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
