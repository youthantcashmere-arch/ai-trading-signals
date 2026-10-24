const defaultPeriod = 14;

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calculateRsi(prices, period = defaultPeriod) {
  if (prices.length < period + 1) {
    return 50;
  }

  const changes = [];
  for (let index = 1; index < prices.length; index += 1) {
    changes.push(prices[index] - prices[index - 1]);
  }

  const gains = changes.map((change) => (change > 0 ? change : 0));
  const losses = changes.map((change) => (change < 0 ? Math.abs(change) : 0));

  let averageGain = average(gains.slice(0, period));
  let averageLoss = average(losses.slice(0, period));

  for (let index = period; index < changes.length; index += 1) {
    averageGain = ((averageGain * (period - 1)) + gains[index]) / period;
    averageLoss = ((averageLoss * (period - 1)) + losses[index]) / period;
  }

  if (averageLoss === 0) {
    return 100;
  }

  const relativeStrength = averageGain / averageLoss;
  return 100 - (100 / (1 + relativeStrength));
}

export function buildSignalFromSeries(series) {
  if (!Array.isArray(series) || series.length < 20) {
    return {
      signal: null,
      explanation: 'Not enough market history to generate a trade signal. Historical data is missing or incomplete.',
      reasons: []
    };
  }

  const closes = series.slice(-30).map((point) => Number(point.price));
  const lastPrice = closes.at(-1);
  const shortWindow = 5;
  const longWindow = 20;

  const shortMa = average(closes.slice(-shortWindow));
  const longMa = average(closes.slice(-longWindow));
  const rsi = calculateRsi(closes, defaultPeriod);

  const priceAboveLongMa = lastPrice > longMa;
  const shortAboveLong = shortMa > longMa;
  const priceBelowLongMa = lastPrice < longMa;
  const shortBelowLong = shortMa < longMa;

  if (rsi < 30 && priceAboveLongMa && shortAboveLong) {
    return {
      signal: 'BUY',
      explanation: `BUY signal: RSI is ${rsi.toFixed(1)} (oversold), price is ${lastPrice.toFixed(2)} above the ${longWindow}-period moving average ${longMa.toFixed(2)}, and the ${shortWindow}-period average is above the long average.`,
      reasons: [
        `RSI ${rsi.toFixed(1)} is below 30`,
        `Price ${lastPrice.toFixed(2)} is above MA(${longWindow}) ${longMa.toFixed(2)}`,
        `MA(${shortWindow}) ${shortMa.toFixed(2)} is above MA(${longWindow}) ${longMa.toFixed(2)}`
      ]
    };
  }

  if (rsi > 70 && priceBelowLongMa && shortBelowLong) {
    return {
      signal: 'SELL',
      explanation: `SELL signal: RSI is ${rsi.toFixed(1)} (overbought), price is ${lastPrice.toFixed(2)} below the ${longWindow}-period moving average ${longMa.toFixed(2)}, and the ${shortWindow}-period average is below the long average.`,
      reasons: [
        `RSI ${rsi.toFixed(1)} is above 70`,
        `Price ${lastPrice.toFixed(2)} is below MA(${longWindow}) ${longMa.toFixed(2)}`,
        `MA(${shortWindow}) ${shortMa.toFixed(2)} is below MA(${longWindow}) ${longMa.toFixed(2)}`
      ]
    };
  }

  return {
    signal: 'HOLD',
    explanation: `HOLD signal: RSI is ${rsi.toFixed(1)}, price is ${lastPrice.toFixed(2)}, and the short-term trend is not confirmed against the ${longWindow}-period moving average.`,
    reasons: [
      `RSI ${rsi.toFixed(1)} is in the neutral zone`,
      `Price ${lastPrice.toFixed(2)} is near MA(${longWindow}) ${longMa.toFixed(2)}`,
      `Trend confirmation is not strong enough for a directional trade.`
    ]
  };
}

export function classifyDataStatus(ageMinutes) {
  if (!Number.isFinite(ageMinutes) || ageMinutes < 0) {
    return 'unavailable';
  }

  if (ageMinutes <= 5) {
    return 'live';
  }

  if (ageMinutes <= 30) {
    return 'delayed';
  }

  return 'stale';
}
