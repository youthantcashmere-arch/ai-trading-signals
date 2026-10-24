const cryptoConfig = {
  'BTC/USD': { id: 'bitcoin', currency: 'usd' },
  'ETH/USD': { id: 'ethereum', currency: 'usd' }
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, timeoutMs, retries = 2) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutHandle);

      if (response.status === 429) {
        const retryAfter = Number(response.headers.get('retry-after') || 2);
        if (attempt < retries) {
          await delay(retryAfter * 1000);
          continue;
        }
        throw new Error('Rate limited by the market data API.');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} while fetching ${url}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await delay(1000 * (attempt + 1));
      }
    }
  }

  throw lastError || new Error('Market fetch failed.');
}

export async function fetchCryptoMarket(symbol, timeoutMs = 15000) {
  const config = cryptoConfig[symbol];

  if (!config) {
    return {
      symbol,
      provider: 'CoinGecko API',
      status: 'unavailable',
      timestamp: null,
      message: `Crypto market ${symbol} is not supported by this adapter.`
    };
  }

  try {
    const currentResponse = await fetchJson(
      `https://api.coingecko.com/api/v3/simple/price?ids=${config.id}&vs_currencies=usd&include_24hr_change=true`,
      timeoutMs
    );

    const marketData = currentResponse?.[config.id];
    const currentPrice = Number(marketData?.usd);

    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      return {
        symbol,
        provider: 'CoinGecko API',
        status: 'unavailable',
        timestamp: null,
        message: 'Crypto current price is missing or invalid.'
      };
    }

    const chartResponse = await fetchJson(
      `https://api.coingecko.com/api/v3/coins/${config.id}/market_chart?vs_currency=usd&days=30&interval=daily`,
      timeoutMs
    );

    const history = (chartResponse?.prices || [])
      .map(([timestamp, price]) => ({
        date: new Date(timestamp).toISOString(),
        price: Number(price)
      }))
      .filter((point) => Number.isFinite(point.price))
      .slice(-30);

    const latestHistoryTimestamp = history.at(-1)?.date ? new Date(history.at(-1).date).getTime() : Date.now();
    const ageMinutes = Math.max(0, (Date.now() - latestHistoryTimestamp) / 60000);

    return {
      symbol,
      provider: 'CoinGecko API',
      status: ageMinutes <= 5 ? 'live' : ageMinutes <= 30 ? 'delayed' : 'stale',
      timestamp: new Date().toISOString(),
      price: currentPrice,
      history,
      notes: 'CoinGecko provides public crypto market data without requiring an API key.'
    };
  } catch (error) {
    return {
      symbol,
      provider: 'CoinGecko API',
      status: 'unavailable',
      timestamp: null,
      message: `Crypto data could not be loaded: ${error.message}`
    };
  }
}
