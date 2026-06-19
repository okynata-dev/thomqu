// Cloudflare Pages Function — /price?ticker=MSTR
// Pulls a live quote from Yahoo Finance's chart endpoint (keyless), caches ~30 min at the edge,
// serves JSON with open CORS. The token's animation_url (live.html) reads this to set the press
// temperature from the real price. On any failure price=null -> live page renders clean (t=0.5).
export async function onRequest({ request }) {
  const url = new URL(request.url);
  const ticker = (url.searchParams.get('ticker') || 'MSTR').toUpperCase().replace(/[^A-Z0-9.^\-]/g, '');
  const cache = caches.default;
  const ckey = new Request('https://thomqu.com/__price/' + ticker);

  const hit = await cache.match(ckey);
  if (hit) return hit;

  let price = null, prevClose = null, date = null, dayHigh = null, dayLow = null,
      w52High = null, w52Low = null, volume = null;
  try {
    const y = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(ticker) + '?interval=1d&range=1d',
      { headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } });
    const j = await y.json();
    const m = j.chart.result[0].meta;
    if (typeof m.regularMarketPrice === 'number') price = m.regularMarketPrice;
    if (typeof m.chartPreviousClose === 'number') prevClose = m.chartPreviousClose;
    if (typeof m.regularMarketDayHigh === 'number') dayHigh = m.regularMarketDayHigh;
    if (typeof m.regularMarketDayLow === 'number') dayLow = m.regularMarketDayLow;
    if (typeof m.fiftyTwoWeekHigh === 'number') w52High = m.fiftyTwoWeekHigh;
    if (typeof m.fiftyTwoWeekLow === 'number') w52Low = m.fiftyTwoWeekLow;
    if (typeof m.regularMarketVolume === 'number') volume = m.regularMarketVolume;
    if (m.regularMarketTime) date = new Date(m.regularMarketTime * 1000).toISOString().slice(0, 10);
  } catch (e) { /* price stays null -> clean render */ }

  const out = new Response(JSON.stringify({ ticker, price, prevClose, date, dayHigh, dayLow, w52High, w52Low, volume }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=1800',
    },
  });
  if (price != null) await cache.put(ckey, out.clone());   // cache only good quotes
  return out;
}
