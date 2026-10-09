/* =========================================
   CHROME — Booking flow v1.1
   Updates: :has() fallback with .is-selected
   ========================================= */
(function () {
  'use strict';

  const PRICES = {
    service: {
      express:   { label: 'Express Shine',     price: 500,  time: '30–45 min' },
      interior:  { label: 'Interior Revival',  price: 1200, time: '~90 min' },
      signature: { label: 'Signature Detail',  price: 2500, time: '~3 hrs' },
      ceramic:   { label: 'Ceramic Coating',   price: 3000, time: '1 day (quote)' },
      engine:    { label: 'Engine Bay',        price: 800,  time: '~45 min' },
      leather:   { label: 'Leather Care',      price: 1000, time: '~60 min' }
    },
    vehicle: {
      sedan:  { label: 'Sedan / Hatchback', multiplier: 1.0 },
      suv:    { label: 'SUV / Crossover',    multiplier: 1.15 },
      pickup: { label: 'Pickup / Double cab', multiplier: 1.25 },
      van:    { label: 'Van / Minibus',      multiplier: 1.4 }
    },
    addons: {
      air:      { label: 'Air Freshener',       price: 100 },
      tyre:     { label: 'Tyre Shine Refresh',  price: 150 },
      headlight:{ label: 'Headlight Polish',    price: 500 },
      odour:    { label: 'Odour Removal',       price: 600 },
      clay:     { label: 'Clay Bar Treatment',  price: 800 },
      trim:     { label: 'Trim Restoration',    price: 500 },
      carpet:   { label: 'Carpet Shampoo',      price: 800 },
      polish:   { label: 'Machine Polish',      price: 1500 }
    }
  };

  const state = {
    step: 1,
    service: null,
    vehicle: 'sedan',
    date: null,
    time: null,
    addons: new Set()
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function fmtKsh(n) { return 'KSh ' + n.toLocaleString('en-KE'); }

  /* Applies .is-selected to label wrappers — fallback for browsers without :has() */
  function syncSelectionState(root, groupName) {
    if (!root) return;
    root.querySelectorAll(`input[name="${groupName}"]`).forEach(input => {
      const parent = input.closest('.choice, .pill, .slot, .addon-check');
      if (parent) parent.classList.toggle('is-selected', input.checked);
    });
  }

  function computeTotal() {
    if (!state.service) return 0;
    const svc = PRICES.service[state.service];
    const veh = PRICES.vehicle[state.vehicle];
    let total = svc.price * veh.multiplier;
    state.addons.forEach(k => { total += PRICES.addons[k].price; });
    return Math.round(total);
  }

  function updateTotalUI() {
    const totalEl = $('#booking-total-value');
    if (!totalEl) return;
    const newVal = fmtKsh(computeTotal());
    if (totalEl.textContent !== newVal) {
      totalEl.textContent = newVal;
      totalEl.classList.remove('counting');
      void totalEl.offsetWidth;
      totalEl.classList.add('counting');
    }
  }

  function renderServiceChoices() {
    const root = $('#service-choices');
    if (!root) return;
    root.innerHTML = Object.entries(PRICES.service).map(([key, svc]) => `
      <label class="choice">
        <input type="radio" name="service" value="${key}" ${state.service === key ? 'checked' : ''}>
        <span class="choice-title">${svc.label}</span>
        <span class="choice-meta">
          <span>${svc.time}</span>
          <span class="choice-price">from ${fmtKsh(svc.price)}</span>
        </span>
      </label>
    `).join('');
    syncSelectionState(root, 'service');
    $$('input[name="service"]', root).forEach(input => {
      input.addEventListener('change', () => {
        state.service = input.value;
        syncSelectionState(root, 'service');
        updateTotalUI();
        validateStep1();
      });
    });
  }

  function renderVehicleOptions() {
    const root = $('#vehicle-options');
    if (!root) return;
    root.innerHTML = Object.entries(PRICES.vehicle).map(([key, v]) => `
      <label class="pill">
        <input type="radio" name="vehicle" value="${key}" ${state.vehicle === key ? 'checked' : ''}>
        ${v.label}
      </label>
    `).join('');
    syncSelectionState(root, 'vehicle');
    $$('input[name="vehicle"]', root).forEach(input => {
      input.addEventListener('change', () => {
        state.vehicle = input.value;
        syncSelectionState(root, 'vehicle');
        updateTotalUI();
      });
    });
  }

  function buildDateSlots() {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      days.push(d);
    }
    return days;
  }

  function renderDateSlots() {
    const root = $('#date-slots');
    if (!root) return;
    const days = buildDateSlots();
    root.innerHTML = days.map((d, i) => {
      const val = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('en-KE', { weekday: 'short' });
      const dayNum = d.getDate();
      const month = d.toLocaleDateString('en-KE', { month: 'short' });
      return `
        <label class="slot">
          <input type="radio" name="date" value="${val}" ${state.date === val ? 'checked' : ''}>
          <strong>${i === 0 ? 'Today' : dayName}</strong>
          <small>${dayNum} ${month}</small>
        </label>
      `;
    }).join('');
    syncSelectionState(root, 'date');
    $$('input[name="date"]', root).forEach(input => {
      input.addEventListener('change', () => {
        state.date = input.value;
        syncSelectionState(root, 'date');
        validateStep2();
      });
    });
  }

  function renderTimeSlots() {
    const root = $('#time-slots');
    if (!root) return;
    const times = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
    root.innerHTML = times.map(t => {
      const [h, m] = t.split(':');
      const hr12 = ((+h + 11) % 12) + 1;
      const ampm = +h < 12 ? 'AM' : 'PM';
      const label = `${hr12}:${m} ${ampm}`;
      return `
        <label class="slot">
          <input type="radio" name="time" value="${t}" ${state.time === t ? 'checked' : ''}>
          <strong>${label}</strong>
        </label>
      `;
    }).join('');
    syncSelectionState(root, 'time');
    $$('input[name="time"]', root).forEach(input => {
      input.addEventListener('change', () => {
        state.time = input.value;
        syncSelectionState(root, 'time');
        validateStep2();
      });
    });
  }

  function renderAddons() {
    const root = $('#addon-list');
    if (!root) return;
    root.innerHTML = Object.entries(PRICES.addons).map(([key, a]) => `
      <label class="addon-check">
        <input type="checkbox" name="addon" value="${key}" ${state.addons.has(key) ? 'checked' : ''}>
        <span class="addon-name">${a.label}</span>
        <span class="addon-price">${fmtKsh(a.price)}</span>
      </label>
    `).join('');
    syncSelectionState(root, 'addon');
    $$('input[name="addon"]', root).forEach(input => {
      input.addEventListener('change', () => {
        if (input.checked) state.addons.add(input.value);
        else state.addons.delete(input.value);
        syncSelectionState(root, 'addon');
        updateTotalUI();
      });
    });
  }

  function validateStep1() {
    const btn = $('#btn-to-step-2');
    if (btn) btn.disabled = !state.service;
  }
  function validateStep2() {
    const btn = $('#btn-to-step-3');
    if (btn) btn.disabled = !(state.date && state.time);
  }

  function goToStep(n) {
    state.step = n;
    $$('.booking-panel').forEach(p => p.classList.toggle('active', +p.dataset.panel === n));
    $$('.booking-step').forEach(s => {
      const num = +s.dataset.step;
      s.classList.toggle('active', num === n);
      s.classList.toggle('done', num < n);
    });
    updateTotalUI();
    if (n === 3) renderSummary();
    window.scrollTo({ top: 0, behavior: prefersReduced() ? 'auto' : 'smooth' });
  }
  const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function formatTime(t) {
    if (!t) return '—';
    const [h, m] = t.split(':');
    const hr12 = ((+h + 11) % 12) + 1;
    const ampm = +h < 12 ? 'AM' : 'PM';
    return `${hr12}:${m} ${ampm}`;
  }

  function renderSummary() {
    const root = $('#booking-summary');
    if (!root) return;
    const svc = PRICES.service[state.service];
    const veh = PRICES.vehicle[state.vehicle];
    const subtotal = Math.round(svc.price * veh.multiplier);
    const addonRows = Array.from(state.addons).map(k =>
      `<div class="summary-row"><span>+ ${PRICES.addons[k].label}</span><span>${fmtKsh(PRICES.addons[k].price)}</span></div>`
    ).join('');
    const addonTotal = Array.from(state.addons).reduce((s, k) => s + PRICES.addons[k].price, 0);

    root.innerHTML = `
      <div class="summary-row"><span>Service</span><span>${svc.label}</span></div>
      <div class="summary-row"><span>Vehicle</span><span>${veh.label}</span></div>
      <div class="summary-row"><span>When</span><span>${formatDate(state.date)} · ${formatTime(state.time)}</span></div>
      <div class="summary-row"><span>Base price</span><span>${fmtKsh(subtotal)}</span></div>
      ${addonRows}
      <div class="summary-row total"><span>Total from</span><span>${fmtKsh(subtotal + addonTotal)}</span></div>
    `;
  }

  function buildWhatsAppMessage() {
    const svc = PRICES.service[state.service];
    const veh = PRICES.vehicle[state.vehicle];
    const addons = Array.from(state.addons).map(k => PRICES.addons[k].label);
    const total = computeTotal();
    const lines = [
      "Hello CHROME, I'd like to book:",
      '',
      `Service: ${svc.label}`,
      `Vehicle: ${veh.label}`,
      `Date: ${formatDate(state.date)}`,
      `Time: ${formatTime(state.time)}`,
      addons.length ? `Add-ons: ${addons.join(', ')}` : null,
      '',
      `Estimated total: ${fmtKsh(total)}`,
      '',
      'Please confirm availability.'
    ].filter(Boolean);
    return encodeURIComponent(lines.join('\n'));
  }

  function initLastBookingBanner() {
    const banner = $('#last-booking-banner');
    if (!banner) return;
    const last = localStorage.getItem('chrome-last-booking');
    if (!last) { banner.remove(); return; }
    try {
      const data = JSON.parse(last);
      banner.innerHTML = `
        <p>Last time: <strong>${PRICES.service[data.service]?.label || 'a service'}</strong> on ${data.date}</p>
        <button class="btn btn-outline btn-sm" type="button" id="book-again">Book again</button>
      `;
      $('#book-again').addEventListener('click', () => {
        state.service = data.service || null;
        state.vehicle = data.vehicle || 'sedan';
        state.addons = new Set(data.addons || []);
        renderServiceChoices(); renderVehicleOptions(); renderAddons();
        goToStep(1);
        validateStep1();
      });
    } catch { banner.remove(); }
  }

  function saveBooking() {
    localStorage.setItem('chrome-last-booking', JSON.stringify({
      service: state.service,
      vehicle: state.vehicle,
      addons: Array.from(state.addons),
      date: state.date,
      time: state.time,
      total: computeTotal(),
      savedAt: Date.now()
    }));
  }

  function init() {
    if (!$('#booking-shell')) return;
    renderServiceChoices();
    renderVehicleOptions();
    renderDateSlots();
    renderTimeSlots();
    renderAddons();
    updateTotalUI();
    validateStep1();
    validateStep2();
    initLastBookingBanner();

    $('#btn-to-step-2')?.addEventListener('click', () => goToStep(2));
    $('#btn-to-step-3')?.addEventListener('click', () => goToStep(3));
    $('#btn-back-1')?.addEventListener('click', () => goToStep(1));
    $('#btn-back-2')?.addEventListener('click', () => goToStep(2));
    $('#btn-submit')?.addEventListener('click', () => {
      saveBooking();
      window.open(`https://wa.me/254702555093?text=${buildWhatsAppMessage()}`, '_blank', 'noopener');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();