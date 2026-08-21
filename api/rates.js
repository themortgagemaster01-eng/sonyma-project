// Vercel Serverless Function: /api/rates
// Fetches live SONYMA rates from hcr.ny.gov/current-rates
// Falls back to known defaults if scrape fails

const FALLBACK = {
  asOf: 'fallback',
  source: 'https://hcr.ny.gov/current-rates',
  fetchedAt: null,
  live: false,
  atd: { label: 'Achieving the Dream', noDpal: 5.7, withDpal: 6.1, term: '30-year fixed', points: 0 },
  lir: { label: 'Low Interest Rate', noDpal: 6.1, withDpal: 6.5, term: '30-year fixed', points: 0 }
};

function parsePercent(str) {
  if (!str) return null;
  const m = String(str).match(/(\d+\.\d{1,3})\s*%/);
  return m ? parseFloat(m[1]) : null;
}

function extractRates(html) {
  // Normalize whitespace for easier matching
  const text = html.replace(/\s+/g, ' ');

  // Find Achieving the Dream block — look for rate numbers near the program name
  // Table order: Without DPAL | With DPAL
  let atdNo = null, atdWith = null, lirNo = null, lirWith = null;

  // Strategy: find sections by program name, then grab the first two percentage values that look like rates
  const atdMatch = text.match(/Achieving the Dream[\s\S]{0,800}?(\d+\.\d{3})\s*%[\s\S]{0,200}?(\d+\.\d{3})\s*%/i);
  if (atdMatch) {
    atdNo = parseFloat(atdMatch[1]);
    atdWith = parseFloat(atdMatch[2]);
  }

  const lirMatch = text.match(/Low Interest Rate Program[\s\S]{0,800}?(\d+\.\d{3})\s*%[\s\S]{0,200}?(\d+\.\d{3})\s*%/i);
  if (lirMatch) {
    lirNo = parseFloat(lirMatch[1]);
    lirWith = parseFloat(lirMatch[2]);
  }

  // Sanity bounds (SONYMA rates historically 3%–9%)
  function ok(n) { return typeof n === 'number' && n >= 3 && n <= 12; }

  if (!ok(atdNo) || !ok(atdWith) || !ok(lirNo) || !ok(lirWith)) {
    return null;
  }

  return {
    asOf: new Date().toISOString().slice(0, 10),
    source: 'https://hcr.ny.gov/current-rates',
    fetchedAt: new Date().toISOString(),
    live: true,
    atd: { label: 'Achieving the Dream', noDpal: atdNo, withDpal: atdWith, term: '30-year fixed', points: 0 },
    lir: { label: 'Low Interest Rate', noDpal: lirNo, withDpal: lirWith, term: '30-year fixed', points: 0 }
  };
}

module.exports = async function handler(req, res) {
  // Allow browser calls from the same origin / Vercel domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400'); // 1h cache, 24h stale

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const response = await fetch('https://hcr.ny.gov/current-rates', {
      headers: {
        'User-Agent': 'SONYMA-Eligibility-Explorer/1.0 (educational tool; robert.castro@movement.com)',
        'Accept': 'text/html'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error('Upstream status ' + response.status);
    }

    const html = await response.text();
    const rates = extractRates(html);

    if (!rates) {
      // Parse failed — return fallback but mark not live
      return res.status(200).json({ ...FALLBACK, fetchedAt: new Date().toISOString(), parseError: true });
    }

    return res.status(200).json(rates);
  } catch (err) {
    return res.status(200).json({
      ...FALLBACK,
      fetchedAt: new Date().toISOString(),
      error: String(err.message || err)
    });
  }
};
