import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 3000),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  marketDataTimeoutMs: Number(process.env.MARKET_DATA_TIMEOUT_MS || 15000)
};
