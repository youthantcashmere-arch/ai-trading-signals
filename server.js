import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllMarkets, buildMarketSummary } from './src/marketData.js';
import { config } from './src/config.js';
import { sendTelegramMessage } from './src/telegram.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = config.port;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'AI Trading Signals',
    timestamp: new Date().toISOString(),
    mode: config.telegramBotToken && config.telegramChatId ? 'telegram-configured' : 'standalone',
    disclaimer: 'Educational only. No broker connection, no real-money execution, and no automatic trading.'
  });
});

app.get('/api/markets', async (req, res) => {
  try {
    const summary = await getAllMarkets();
    res.json(summary);
  } catch (error) {
    console.error('Unexpected error while building market summary:', error);
    res.status(500).json({
      error: 'Failed to load market data.',
      detail: error.message,
      markets: [],
      generatedAt: new Date().toISOString()
    });
  }
});

app.get('/api/markets/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const summary = await buildMarketSummary(symbol);
    if (!summary) {
      return res.status(404).json({
        error: `Unsupported market symbol: ${symbol}`,
        symbol,
        signal: null,
        explanation: 'Unsupported symbol for this dashboard.'
      });
    }
    res.json(summary);
  } catch (error) {
    console.error(`Error building summary for ${req.params.symbol}:`, error);
    res.status(500).json({
      error: 'Failed to build one-market summary.',
      detail: error.message,
      symbol: req.params.symbol,
      signal: null,
      explanation: 'No signal generated because the market data request failed.'
    });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const summary = await getAllMarkets();
    res.json({
      generatedAt: new Date().toISOString(),
      history: summary.history || [],
      hypotheticalNote: 'Historical signal outcomes are hypothetical and educational only. They do not guarantee profitability.'
    });
  } catch (error) {
    console.error('History endpoint failed:', error);
    res.status(500).json({
      generatedAt: new Date().toISOString(),
      history: [],
      error: 'Unable to load historical signals.'
    });
  }
});

app.post('/api/telegram/test', async (req, res) => {
  const { symbol = 'EUR/USD', signal = 'HOLD', explanation = 'Educational test message from AI Trading Signals.' } = req.body || {};

  if (!config.telegramBotToken || !config.telegramChatId) {
    return res.status(400).json({
      ok: false,
      error: 'Telegram bot is not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in your environment before testing notifications.'
    });
  }

  try {
    const response = await sendTelegramMessage({
      token: config.telegramBotToken,
      chatId: config.telegramChatId,
      text: `[AI Trading Signals test]\nPair: ${symbol}\nSignal: ${signal}\nWhy: ${explanation}`
    });

    res.json({
      ok: true,
      provider: 'Telegram Bot API',
      response
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      provider: 'Telegram Bot API'
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`AI Trading Signals app is running on http://localhost:${port}`);
  console.log('Educational mode only. There is no broker connection or auto-trading.');
});
