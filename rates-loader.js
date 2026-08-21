/* rates-loader.js — pulls live SONYMA rates and updates the page
   Include after data.js:
   <script src="/data.js"></script>
   <script src="/rates-loader.js"></script>
*/
(function () {
  const FALLBACK = window.SONYMA_RATES || {
    atd: { noDpal: 5.7, withDpal: 6.1 },
    lir: { noDpal: 6.1, withDpal: 6.5 }
  };

  function fmt(n) {
    if (typeof n !== 'number') return '—';
    return n.toFixed(3) + '%';
  }

  function applyRates(rates) {
    // Keep global in sync for other scripts (eligible.html etc.)
    window.SONYMA_RATES = {
      asOf: rates.asOf || rates.fetchedAt || 'live',
      source: rates.source || 'https://hcr.ny.gov/current-rates',
      live: !!rates.live,
      atd: rates.atd || FALLBACK.atd,
      lir: rates.lir || FALLBACK.lir
    };

    const R = window.SONYMA_RATES;

    // Update any elements marked with data-rate attributes
    // Examples:
    //   <span data-rate="atd-no">5.700%</span>
    //   <span data-rate="atd-with">6.100%</span>
    //   <span data-rate="lir-no">6.100%</span>
    //   <span data-rate="lir-with">6.500%</span>
    document.querySelectorAll('[data-rate]').forEach(el => {
      const key = el.getAttribute('data-rate');
      let val = null;
      if (key === 'atd-no') val = R.atd.noDpal;
      else if (key === 'atd-with') val = R.atd.withDpal;
      else if (key === 'lir-no') val = R.lir.noDpal;
      else if (key === 'lir-with') val = R.lir.withDpal;
      if (val != null) el.textContent = fmt(val);
    });

    // Homepage rate cards (class-based fallback for current markup)
    document.querySelectorAll('.rate').forEach(card => {
      const strong = card.querySelector('strong');
      const num = card.querySelector('.num');
      const small = card.querySelector('small');
      if (!strong || !num) return;
      const label = (strong.textContent || '').toLowerCase();
      if (label.includes('achieving') || label.includes('dream')) {
        num.textContent = fmt(R.atd.noDpal);
        if (small) small.innerHTML = 'Without DPAL<br>With DPAL: <b>' + fmt(R.atd.withDpal) + '</b>';
      } else if (label.includes('low interest')) {
        num.textContent = fmt(R.lir.noDpal);
        if (small) small.innerHTML = 'Without DPAL<br>With DPAL: <b>' + fmt(R.lir.withDpal) + '</b>';
      }
    });

    // eligible.html mini rate boxes
    const ratesEl = document.getElementById('rates');
    if (ratesEl) {
      ratesEl.innerHTML =
        '<div><strong>Achieving the Dream</strong><div class="n">' + fmt(R.atd.noDpal) + '</div><small>w/ DPAL: ' + fmt(R.atd.withDpal) + '</small></div>' +
        '<div><strong>Low Interest Rate</strong><div class="n">' + fmt(R.lir.noDpal) + '</div><small>w/ DPAL: ' + fmt(R.lir.withDpal) + '</small></div>';
    }

    // Optional live badge
    document.querySelectorAll('[data-rate-badge]').forEach(el => {
      if (R.live) {
        el.textContent = 'Live rates';
        el.style.opacity = '1';
      } else {
        el.textContent = 'Snapshot rates';
      }
    });

    // Fire event so other page scripts can react
    window.dispatchEvent(new CustomEvent('sonyma-rates-ready', { detail: R }));
  }

  // Start with fallback so UI is never blank
  applyRates(FALLBACK);

  // Then try live
  fetch('/api/rates')
    .then(r => r.ok ? r.json() : Promise.reject(new Error('bad status')))
    .then(data => {
      if (data && data.atd && data.lir) applyRates(data);
    })
    .catch(function () {
      // Keep fallback — silent
    });
})();
