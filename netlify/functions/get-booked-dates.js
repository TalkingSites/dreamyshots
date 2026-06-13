// Returns booked dates from Radicale as ["YYYY-MM-DD", ...]
// Queries the next 12 months of calendar events.

const RADICALE_URL  = process.env.RADICALE_URL;
const RADICALE_USER = process.env.RADICALE_USER;
const RADICALE_PASS = process.env.RADICALE_PASSWORD;
const CALENDAR_PATH = process.env.RADICALE_CALENDAR_PATH || `/${RADICALE_USER}/calendar/`;

function basicAuth(user, pass) {
  return 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
}

function toCalDavDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function extractBookedDates(responseText) {
  const dates = new Set();
  const re = /DTSTART[^\r\n:]*:(\d{4})(\d{2})(\d{2})/g;
  let m;
  while ((m = re.exec(responseText)) !== null) {
    dates.add(`${m[1]}-${m[2]}-${m[3]}`);
  }
  return Array.from(dates).sort();
}

exports.handler = async function (event, context) {
  console.log('[get-booked-dates] function invoked');
  console.log('[get-booked-dates] env check — URL:', RADICALE_URL, '| USER:', RADICALE_USER, '| PASS set:', !!RADICALE_PASS);

  if (!RADICALE_URL || !RADICALE_USER || !RADICALE_PASS) {
    console.error('[get-booked-dates] missing env vars — aborting');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Radicale not configured' }),
    };
  }

  const now   = new Date();
  const later = new Date(now);
  later.setMonth(later.getMonth() + 12);

  const calUrl = `${RADICALE_URL}${CALENDAR_PATH}`;
  console.log('[get-booked-dates] querying Radicale REPORT:', calUrl);
  console.log('[get-booked-dates] time range:', toCalDavDate(now), '→', toCalDavDate(later));

  const body = `<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${toCalDavDate(now)}" end="${toCalDavDate(later)}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`;

  try {
    const res = await fetch(calUrl, {
      method:  'REPORT',
      headers: {
        'Authorization': basicAuth(RADICALE_USER, RADICALE_PASS),
        'Content-Type':  'application/xml; charset=utf-8',
        'Depth':         '1',
      },
      body,
    });

    console.log('[get-booked-dates] Radicale response status:', res.status, res.statusText);

    if (!res.ok) {
      const errText = await res.text();
      console.error('[get-booked-dates] Radicale error body:', errText);
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Radicale error: ${res.status}` }),
      };
    }

    const text = await res.text();
    console.log('[get-booked-dates] raw Radicale response:\n', text);

    const dates = extractBookedDates(text);
    console.log('[get-booked-dates] extracted booked dates:', dates);

    return {
      statusCode: 200,
      headers: {
        'Content-Type':  'application/json',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify({ booked: dates }),
    };
  } catch (err) {
    console.error('[get-booked-dates] fetch threw:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
