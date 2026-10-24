# AI Trading Signals

A responsive dashboard for analyzing Forex and cryptocurrency markets using transparent technical rules, without placing real trades or connecting to a broker.

Features:
- Mobile-friendly dashboard UI
- Forex pairs: EUR/USD, GBP/USD, USD/JPY
- Crypto pairs: BTC/USD and ETH/USD
- Separate adapters for Forex and crypto market data
- BUY / SELL / HOLD signal generation using RSI and moving averages
- Data source metadata including provider, last timestamp, and live/delayed/stale status
- Historical signal log with a clearly labeled hypothetical-only note
- Telegram Bot API integration option
- No broker connection, no real-money execution, and no auto-trading
- Graceful handling for API failures, rate limits, and unavailable data

Data sources used:
- Frankfurter API for free FX rates
- CoinGecko API for public crypto prices and daily charts

Environment variables:
- PORT: local server port (default: 3000)
- TELEGRAM_BOT_TOKEN: optional Telegram bot token
- TELEGRAM_CHAT_ID: optional Telegram chat ID
- MARKET_DATA_TIMEOUT_MS: timeout for public data fetch attempts

Setup:
1. Install dependencies:
   npm install
2. Copy the environment template:
   cp .env.example .env
3. Add optional Telegram values if you want to test notifications.
4. Start the app:
   npm start
5. Visit:
   http://localhost:3000

Testing:
- Use the built-in local endpoint to check the service:
  http://localhost:3000/api/health
- Use the market summary endpoint:
  http://localhost:3000/api/markets
- Optionally test Telegram integration via a POST request to:
  http://localhost:3000/api/telegram/test

Important notes:
- Market data can be unavailable or rate-limited. In those cases, the app does not invent prices or signals.
- Signals are based only on the latest available market history and are shown with explanations.
- This project is intentionally educational and risk-aware.

Files created for this prototype:
- package.json
- server.js
- .env.example
- public/index.html
- public/styles.css
- public/app.js
- src/config.js
- src/marketData.js
- src/signalEngine.js
- src/adapters/forexAdapter.js
- src/adapters/cryptoAdapter.js
- src/telegram.js
- tests/signalEngine.test.js
