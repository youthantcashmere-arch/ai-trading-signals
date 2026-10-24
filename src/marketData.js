import { fetchForexMarket } from './adapters/forexAdapter.js';
import { fetchCryptoMarket } from './adapters/cryptoAdapter.js';
import { buildSignalFromSeries } from './signalEngine.js';

const marketDefinitions = [
  { symbol: 'EUR/USD', type: 'forex' },
  { symbol: 'GBP/USD', type: 'forex' },
  { symbol: 'USD/JPY', type: 'forex' },
  { symbol: 'BTC/USD', type: 'crypto' },
  { symbol: 'ETH/USD', type: 'crypto' }
];

function toSignalResult(market) {
  if (!market || market.status === 'unavailable') {
    return {
      symbol: market?.symbol || 'UNKNOWN',
      dataProvider: market?.provider || 'Unavailable',
      dataTimestamp: market?.timestamp || null,
      status: market?.status || 'unavailable',
      price: null,
      signal: null,
      explanation: market?.message || 'No signal generated because the market data source is unavailable or rate-limited.',
      details: {
        provider: market?.provider || 'Unavailable',
        providerTimestamp: market?.timestamp || null,
        marketStatus: market?.status || 'unavailable'
      }
    };
  }

  const signal = buildSignalFromSeries(market.history || []);

  return {
    symbol: market.symbol,
    price: market.price,
    dataProvider: market.provider,
    dataTimestamp: market.timestamp,
    status: market.status,
    signal: signal?.signal || null,
    explanation: signal?.explanation || 'No signal generated because the market depth was insufficient.',
    reasons: signal?.reasons || [],
    source: {
      provider: market.provider,
      status: market.status,
      providerTimestamp: market.timestamp,
      notes: market.notes || 'Data source details come directly from the provider response.'
    },
    historical: market.history.slice(-20).map((point) => ({
      date: point.date,
      price: point.price
    })),
    meta: {
      lastUpdated: market.timestamp,
      providerStatus: market.status,
      riskDisclaimer: 'Educational only. No broker connection or automatic trading is used.'
    }
  };
}

async function fetchMarketBySymbol(symbol, type) {
  if (type === 'forex') {
    return fetchForexMarket(symbol);
  }

  return fetchCryptoMarket(symbol);
}

export async function buildMarketSummary(symbol) {
  const normalized = String(symbol).trim().toUpperCase();
  const definition = marketDefinitions.find((entry) => entry.symbol === normalized);

  if (!definition) {
    return null;
  }

  const market = await fetchMarketBySymbol(normalized, definition.type);
  return toSignalResult(market);
}

export async function getAllMarkets() {
  const markets = await Promise.all(
    marketDefinitions.map(async (entry) => {
      const result = await fetchMarketBySymbol(entry.symbol, entry.type);
      return toSignalResult(result);
    })
  );

  const history = markets
    .filter((market) => market.signal)
    .slice(0, 12)
    .map((market, index) => ({
      id: `${market.symbol}-${index}`,
      symbol: market.symbol,
      signal: market.signal,
      explanation: market.explanation,
      timestamp: market.dataTimestamp,
      hypotheticalPnl: null,
      note: 'Hypothetical outcome only. This is not a verified profitability claim.'
    }));

  return {
    generatedAt: new Date().toISOString(),
    markets,
    history,
    disclaimer: 'Educational only. No real-money trading, broker connection, or automated execution is used.'
  };
}
