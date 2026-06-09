(function () {
  'use strict';

  const MIN_HOURS = 3;

  // ── Mock booked dates (YYYY-MM-DD) ─────────────────────────────────────────
  const MOCK_BOOKED = [
    '2026-06-10', '2026-06-15', '2026-06-22', '2026-06-28',
    '2026-07-04', '2026-07-11', '2026-07-18', '2026-07-25',
    '2026-08-01', '2026-08-09', '2026-08-16',
    '2026-09-05', '2026-09-12', '2026-09-19',
  ];

  const SESSION_KEY = 'ds-session-bookings';

  function getSessionBookings() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function saveSessionBooking(date) {
    const b = getSessionBookings();
    if (!b.includes(date)) {
      b.push(date);
      localStorage.setItem(SESSION_KEY, JSON.stringify(b));
    }
  }

  function isBooked(d) {
    return MOCK_BOOKED.includes(d) || getSessionBookings().includes(d);
  }

  // ── Time helpers ───────────────────────────────────────────────────────────
  function toMins(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  function addMins(t, mins) {
    const total = toMins(t) + mins;
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h >= 24) return '24:00';
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function durationHours(start, end) {
    return Math.ceil((toMins(end) - toMins(start)) / 60);
  }

  // ── Time slots: 6 AM to midnight ───────────────────────────────────────────
  function makeTimeSlots(fromH, toH, stepMins) {
    const slots = [];
    let h = fromH, m = 0;
    while (h < toH || (h === toH && m === 0)) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      m += stepMins;
      if (m >= 60) { m -= 60; h++; }
    }
    return slots;
  }

  const GRID_SLOTS = makeTimeSlots(6, 24, 30); // 06:00 – 24:00 (midnight)

  function fmt12(t) {
    if (t === '24:00') return 'Midnight';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  function gridLabel(t) {
    if (t === '24:00') return 'Midnight';
    const [h, m] = t.split(':').map(Number);
    const h12 = h % 12 || 12;
    const ap  = h >= 12 ? 'PM' : 'AM';
    return m === 0 ? `${h12} ${ap}` : `${h12}:30`;
  }

  // ── State ──────────────────────────────────────────────────────────────────
  const now = new Date();
  const state = {
    year:  now.getFullYear(),
    month: now.getMonth(),
    selectedDate: null,
    startTime: null,
    endTime:   null,
  };

  const $id = id => document.getElementById(id);

  function toDateStr(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function fmtDateLong(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-AU', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  // ── Calendar ───────────────────────────────────────────────────────────────
  const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  function renderCalendar() {
    $id('ds-cal-month-label').textContent = `${MONTHS[state.month]} ${state.year}`;

    const nowObj      = new Date();
    const todayStr    = toDateStr(nowObj.getFullYear(), nowObj.getMonth(), nowObj.getDate());
    const firstDay    = new Date(state.year, state.month, 1);
    const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
    const pad         = (firstDay.getDay() + 6) % 7;

    const grid = $id('ds-cal-days');
    grid.innerHTML = '';

    for (let i = 0; i < pad; i++) {
      const blank = document.createElement('div');
      blank.className = 'ds-cal-day ds-cal-blank';
      blank.setAttribute('aria-hidden', 'true');
      grid.appendChild(blank);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = toDateStr(state.year, state.month, d);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-cal-day';
      btn.textContent = d;
      btn.setAttribute('aria-label', fmtDateLong(dateStr));
      btn.dataset.date = dateStr;

      if (dateStr === todayStr) btn.classList.add('ds-cal-today');
      if (dateStr === state.selectedDate) btn.classList.add('ds-cal-selected');

      if (dateStr < todayStr) {
        btn.classList.add('ds-cal-past'); btn.disabled = true;
      } else if (isBooked(dateStr)) {
        btn.classList.add('ds-cal-booked'); btn.disabled = true; btn.title = 'Already booked';
      } else {
        btn.addEventListener('click', () => onDateSelect(dateStr));
      }

      grid.appendChild(btn);
    }

    $id('ds-cal-prev').disabled =
      state.year === nowObj.getFullYear() && state.month === nowObj.getMonth();
  }

  function onPrevMonth() {
    if (state.month === 0) { state.month = 11; state.year--; } else state.month--;
    renderCalendar();
  }

  function onNextMonth() {
    if (state.month === 11) { state.month = 0; state.year++; } else state.month++;
    renderCalendar();
  }

  // ── Time grid ──────────────────────────────────────────────────────────────
  function buildTimeGrid() {
    const grid = $id('ds-time-grid');
    grid.innerHTML = '';

    GRID_SLOTS.forEach(t => {
      const [, m] = t.split(':').map(Number);
      const isHour = m === 0;

      const row = document.createElement('div');
      row.className = 'ds-tg-row' + (isHour ? ' ds-tg-row-hour' : '');

      const label = document.createElement('span');
      label.className = 'ds-tg-label' + (isHour ? ' ds-tg-hour-label' : '');
      label.textContent = gridLabel(t);
      label.setAttribute('aria-hidden', 'true');

      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'ds-tg-slot';
      slot.dataset.time = t;
      slot.setAttribute('aria-label', fmt12(t));
      slot.addEventListener('click',      () => onSlotClick(t));
      slot.addEventListener('mouseenter', () => onSlotHover(t));
      slot.addEventListener('mouseleave', clearPreview);

      row.appendChild(label);
      row.appendChild(slot);
      grid.appendChild(row);
    });

    // Pre-scroll to 6 PM centred in the visible area
    requestAnimationFrame(() => {
      const wrap   = $id('ds-tg-wrap');
      const target = grid.querySelector('[data-time="18:00"]');
      if (target && wrap) {
        wrap.scrollTop = target.closest('.ds-tg-row').offsetTop - wrap.clientHeight / 2;
      }
    });
  }

  function isValidEnd(t) {
    return state.startTime && t > state.startTime &&
      (toMins(t) - toMins(state.startTime)) >= MIN_HOURS * 60;
  }

  function updateSlotClasses() {
    document.querySelectorAll('.ds-tg-slot').forEach(slot => {
      const t = slot.dataset.time;
      slot.classList.remove('ds-slot-start', 'ds-slot-end', 'ds-slot-range', 'ds-slot-below-min');

      if (t === state.startTime) {
        slot.classList.add('ds-slot-start');
      } else if (t === state.endTime) {
        slot.classList.add('ds-slot-end');
      } else if (state.startTime && state.endTime && t > state.startTime && t < state.endTime) {
        slot.classList.add('ds-slot-range');
      } else if (state.startTime && !state.endTime && t > state.startTime && !isValidEnd(t)) {
        slot.classList.add('ds-slot-below-min');
      }
    });
  }

  function onSlotHover(t) {
    if (!state.startTime || state.endTime) return;
    if (!isValidEnd(t)) return; // don't preview the below-min zone
    clearPreview();
    document.querySelectorAll('.ds-tg-slot').forEach(slot => {
      const st = slot.dataset.time;
      if (st > state.startTime && st <= t) slot.classList.add('ds-slot-preview');
    });
  }

  function clearPreview() {
    document.querySelectorAll('.ds-slot-preview').forEach(el => el.classList.remove('ds-slot-preview'));
  }

  function onSlotClick(t) {
    if (!state.startTime || state.endTime) {
      // Fresh start
      state.startTime = t;
      state.endTime   = null;
    } else if (isValidEnd(t)) {
      // Valid end time
      state.endTime = t;
      clearPreview();
      setTimeout(() => {
        $id('ds-booking-continue').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 120);
    } else {
      // Clicked at/before start, or within min window — reset to new start
      state.startTime = t;
      state.endTime   = null;
    }
    updateSlotClasses();
    updateInstruction();
    updateContinue();
  }

  function updateInstruction() {
    const el = $id('ds-tg-instruction');
    if (!state.startTime) {
      el.textContent = 'Tap a slot to set arrival time';
      el.classList.remove('ds-tg-complete');
    } else if (!state.endTime) {
      const earliest = addMins(state.startTime, MIN_HOURS * 60);
      const hasValid  = GRID_SLOTS.some(t => isValidEnd(t));
      if (!hasValid) {
        el.textContent = `${fmt12(state.startTime)} is too late for a ${MIN_HOURS}-hour booking. Please select an earlier arrival.`;
      } else {
        el.textContent = `Arrival: ${fmt12(state.startTime)} — tap a finish time (earliest ${fmt12(earliest)})`;
      }
      el.classList.remove('ds-tg-complete');
    } else {
      el.textContent = `${fmt12(state.startTime)} to ${fmt12(state.endTime)}`;
      el.classList.add('ds-tg-complete');
    }
  }

  // ── Date select ────────────────────────────────────────────────────────────
  function onDateSelect(dateStr) {
    state.selectedDate = dateStr;
    state.startTime    = null;
    state.endTime      = null;
    renderCalendar();
    buildTimeGrid();
    updateInstruction();
    $id('ds-time-pickers').hidden = false;
    updateContinue();
    $id('ds-time-pickers').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Continue ───────────────────────────────────────────────────────────────
  function updateContinue() {
    $id('ds-booking-continue').disabled =
      !(state.selectedDate && state.startTime && state.endTime);
  }

  // ── Step navigation ────────────────────────────────────────────────────────
  function goToStep2() {
    if (!state.selectedDate || !state.startTime || !state.endTime) return;
    renderBookingSummary();
    $id('ds-booking-step1').hidden = true;
    $id('ds-booking-step2').hidden = false;
    $id('step-indicator-1').classList.remove('ds-step-active');
    $id('step-indicator-2').classList.add('ds-step-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goToStep1() {
    $id('ds-booking-step2').hidden = true;
    $id('ds-booking-step1').hidden = false;
    $id('step-indicator-2').classList.remove('ds-step-active');
    $id('step-indicator-1').classList.add('ds-step-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  function renderBookingSummary() {
    $id('ds-booking-summary').innerHTML = `
      <div class="ds-summary-row">
        <i class="bi bi-calendar3" aria-hidden="true"></i>
        <span>${fmtDateLong(state.selectedDate)}</span>
      </div>
      <div class="ds-summary-row">
        <i class="bi bi-clock" aria-hidden="true"></i>
        <span>${fmt12(state.startTime)} to ${fmt12(state.endTime)}</span>
      </div>
    `;
  }

  // ── Form submit → Stripe ───────────────────────────────────────────────────
  function onFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) {
      form.classList.add('ds-form-validated');
      const firstInvalid = form.querySelector(':invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    saveSessionBooking(state.selectedDate);

    const stripeLink = (window.__DS_STRIPE || '').trim();
    if (stripeLink.startsWith('https://')) {
      const email = (form.querySelector('[name="email"]') || {}).value || '';
      const qty   = durationHours(state.startTime, state.endTime);

      // Compact reference Wency can cross-check against Stripe payments
      const ref = 'DS-' +
        state.selectedDate.replace(/-/g, '') + '-' +
        state.startTime.replace(':', '') + '-' +
        state.endTime.replace(':', '');

      const url = new URL(stripeLink);
      url.searchParams.set('prefilled_quantity',    qty);
      url.searchParams.set('client_reference_id',   ref);
      if (email) url.searchParams.set('prefilled_email', email);

      window.location.href = url.toString();
    } else {
      // Stripe not configured — placeholder confirmation
      const confirmDate = `${fmtDateLong(state.selectedDate)}, ${fmt12(state.startTime)} to ${fmt12(state.endTime)}`;
      $id('ds-confirm-date').textContent    = confirmDate;
      $id('ds-booking-step2').hidden        = true;
      $id('ds-booking-confirm').hidden      = false;
      $id('ds-booking-steps-bar').hidden    = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    if (!$id('ds-calendar')) return;

    renderCalendar();

    $id('ds-cal-prev').addEventListener('click', onPrevMonth);
    $id('ds-cal-next').addEventListener('click', onNextMonth);
    $id('ds-booking-continue').addEventListener('click', goToStep2);
    $id('ds-booking-back').addEventListener('click', goToStep1);
    $id('ds-booking-form').addEventListener('submit', onFormSubmit);
  });

})();
