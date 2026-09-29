import { scheduleAvCall } from './_av.js';

// In-memory price cache for 24 hours + stale fallback.
//
// This Map lives in one warm serverless instance and disappears when it is
// recycled, so it is best-effort only. The durable layer is the CDN: fresh
// responses carry s-maxage=86400 and are served from Vercel's edge cache.
// Stale responses deliberately carry a short s-maxage (see STALE_CACHE_HEADER)
// so a rate-limited answer cannot pin old figures at the edge for a full day.
const priceCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FRESH_CACHE_HEADER = 'public, s-maxage=86400, max-age=86400';
const STALE_CACHE_HEADER = 'public, s-maxage=300, max-age=60';

// A listing counts as trading only if its latest real close is within this
// many calendar days. Fourteen clears long holiday weekends and provider lag
// while still catching series that stopped years ago.
const RECENT_TRADING_DAYS = 14;

function cachedBody(symbol, cached, stale) {
  return {
    symbol,
    prices: cached.prices,
    lastRefreshed: cached.lastRefreshed,
    ...(cached.inactive ? { inactive: true, lastPriceDate: cached.lastPriceDate } : {}),
    stale,
    cachedAt: cached.cachedAt
  };
}

export default async function handler(req, res) {
  const symbol = (req.query?.symbol || '').trim().toUpperCase();

  if (!symbol) {
    return res.status(400).json({
      error: 'invalid_symbol',
      message: "Query parameter 'symbol' is required."
    });
  }

  // Guard BEFORE fetch: check if ALPHAVANTAGE_API_KEY is configured
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return res.status(503).json({
      error: 'missing_credential',
      message: 'ALPHAVANTAGE_API_KEY is not configured.'
    });
  }

  const cached = priceCache.get(symbol);
  const isFresh = cached && Date.now() - cached.timestamp < CACHE_TTL_MS;

  // Serve fresh cache if available within 24h
  if (isFresh) {
    res.setHeader('Cache-Control', FRESH_CACHE_HEADER);
    return res.status(200).json(cachedBody(symbol, cached, false));
  }

  const fetchPrices = async () => {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(9000) });
    if (!response.ok) {
      return { status: response.status, ok: false };
    }
    const data = await response.json();
    return { ok: true, data };
  };

  try {
    let result = await scheduleAvCall(fetchPrices);

    // Alpha Vantage throttle detection: 200 OK carrying "Information" or "Note"
    if (result.ok && (result.data?.Information || result.data?.Note)) {
      // On throttle, wait 1200ms and retry ONCE
      await new Promise((r) => setTimeout(r, 1200));
      result = await scheduleAvCall(fetchPrices);
    }

    if (!result.ok) {
      // Check if we have stale cache to serve
      if (cached) {
        res.setHeader('Cache-Control', STALE_CACHE_HEADER);
        return res.status(200).json(cachedBody(symbol, cached, true));
      }

      if (result.status === 401 || result.status === 403) {
        return res.status(result.status).json({
          error: 'refused',
          message: 'The price provider rejected our credential.'
        });
      }
      return res.status(502).json({
        error: 'unreachable',
        message: "Can't reach the price provider."
      });
    }

    const payload = result.data;

    // Check throttle after retry
    if (payload?.Information || payload?.Note) {
      if (cached) {
        res.setHeader('Cache-Control', STALE_CACHE_HEADER);
        return res.status(200).json(cachedBody(symbol, cached, true));
      }
      return res.status(429).json({
        error: 'rate_limited',
        message: 'Price data is rate-limited right now.'
      });
    }

    if (payload?.['Error Message']) {
      return res.status(404).json({
        error: 'empty',
        message: 'No price history for this symbol. It may be delisted or not covered.'
      });
    }

    const timeSeries = payload?.['Time Series (Daily)'];
    if (!timeSeries || typeof timeSeries !== 'object') {
      return res.status(200).json({
        symbol,
        prices: [],
        stale: false
      });
    }

    // Dates are OBJECT KEYS, not an array — sort descending, take 90
    const dates = Object.keys(timeSeries).sort((a, b) => (a < b ? 1 : -1));
    const lastNinetyDates = dates.slice(0, 90);

    // Order chronologically (oldest to newest) for plotting 90-day trend
    const sortedDatesAsc = [...lastNinetyDates].reverse();
    const prices = [];

    for (const d of sortedDatesAsc) {
      const closeRaw = timeSeries[d]?.['4. close'];
      const closeNum = Number(closeRaw);
      // A close of 0 or below is a placeholder for a day with no trade, not a
      // price. Plotting it draws a crash that never happened.
      if (Number.isFinite(closeNum) && closeNum > 0) {
        prices.push({
          date: d,
          close: closeNum
        });
      }
    }

    const lastRefreshed = payload?.['Meta Data']?.['3. Last Refreshed'] || prices[prices.length - 1]?.date;
    const nowIso = new Date().toISOString();

    // A series with no price change at all, or whose latest real close is old,
    // has no trading behind it: every statistic drawn from it would describe
    // a listing that is not trading. Say so instead of sending the series.
    const hasMovement = prices.some((p, i) => i > 0 && p.close !== prices[i - 1].close);
    const lastPriceDate =
      dates.find((d) => {
        const close = Number(timeSeries[d]?.['4. close']);
        return Number.isFinite(close) && close > 0;
      }) || null;
    const lastPriceMs = lastPriceDate ? Date.parse(lastPriceDate) : NaN;
    const isRecent =
      Number.isFinite(lastPriceMs) &&
      Date.now() - lastPriceMs <= RECENT_TRADING_DAYS * 24 * 60 * 60 * 1000;

    if (!hasMovement || !isRecent) {
      const entry = {
        prices: [],
        inactive: true,
        lastPriceDate,
        lastRefreshed,
        cachedAt: nowIso,
        timestamp: Date.now()
      };
      priceCache.set(symbol, entry);
      res.setHeader('Cache-Control', FRESH_CACHE_HEADER);
      return res.status(200).json(cachedBody(symbol, entry, false));
    }

    priceCache.set(symbol, {
      prices,
      lastRefreshed,
      cachedAt: nowIso,
      timestamp: Date.now()
    });

    res.setHeader('Cache-Control', FRESH_CACHE_HEADER);
    return res.status(200).json({
      symbol,
      prices,
      lastRefreshed,
      stale: false,
      cachedAt: nowIso
    });
  } catch (err) {
    if (cached) {
      res.setHeader('Cache-Control', STALE_CACHE_HEADER);
      return res.status(200).json(cachedBody(symbol, cached, true));
    }
    return res.status(502).json({
      error: 'unreachable',
      message: "Can't reach the price provider."
    });
  }
}
