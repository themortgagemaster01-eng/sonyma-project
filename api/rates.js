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

function extractRates(html) {
  const text = html.replace(/\s+/g, ' ');

  let atdNo = null, atdWith = null, lirNo = null, lirWith = null;

  // Achieving the Dream Mortgage Program section
  const atdMatch = text.match(/Achieving the Dream Mortgage Program[\s\S]{0,600}?(\d+\.\d{3})\s*%[\s\S]{0,200}?(\d+\.\d{3})\s*%/i)
    || text.match(/Achieving the Dream(?![\s\S]{0,40}Programs)[\s\S]{0,400}?(\d+\.\d{3})\s*%[\s\S]{0,120}?(\d+\.\d{3})\s*%/i);
  if (atdMatch) {
    atdNo = parseFloat(atdMatch[1]);
    atdWith = parseFloat(atdMatch[2]);
  }

  // Low Interest Rate Program (singular) — do NOT match "Low Interest Rate Programs" header
  const lirMatch = text.match(/Low Interest Rate Program(?!s)[\s\S]{0,500}?(\d+\.\d{3})\s*%[\s\S]{0,200}?(\d+\.\d{3})\s*%/i);
  if (lirMatch) {
    lirNo = parseFloat(lirMatch[1]);
    lirWith = parseFloat(lirMatch[2]);
  }

  function ok(n) { return typeof n === 'number' && !isNaN(n) && n >= 3 && n <= 12; }

  if (!ok(atdNo) || !ok(atdWith) || !ok(lirNo) || !ok(lirWith)) {
    return null;
  }

  // Sanity: LIR should not be lower than ATD
  if (lirNo + 0.01 < atdNo) {
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

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
