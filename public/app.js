const marketGrid = document.getElementById('marketGrid');
const historyList = document.getElementById('historyList');
const generatedAt = document.getElementById('generatedAt');
const refreshButton = document.getElementById('refreshButton');

function signalClass(signal) {
  if (!signal) return 'signal-unavailable';
  if (signal === 'BUY') return 'signal-buy';
  if (signal === 'SELL') return 'signal-sell';
  return 'signal-hold';
}

function statusClass(status) {
  if (!status) return 'status-unavailable';
  return `status-${status}`;
}

function formatTimestamp(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
}

function renderSignalCard(market) {
  const signal = market.signal || 'UNAVAILABLE';
  const priceText = market.price ? `$${Number(market.price).toLocaleString(undefined, { maximumFractionDigits: 4 })}` : 'Unavailable';
  const signalText = signal === 'UNAVAILABLE' ? 'N/A' : signal;

  return `
    <article class="market-card">
      <div class="market-card-header">
        <div class="market-symbol">${market.symbol}</div>
        <span class="signal-pill ${signalClass(market.signal)}">${signalText}</span>
      </div>
      <div class="price-label">Last price</div>
      <div class="price-value">${priceText}</div>
      <ul class="meta-list">
        <li><strong>Provider:</strong> ${market.dataProvider}</li>
        <li><strong>Updated:</strong> ${formatTimestamp(market.dataTimestamp)}</li>
        <li><strong>Status:</strong> <span class="${statusClass(market.status)}">${market.status || 'unavailable'}</span></li>
      </ul>
      <p class="explanation">${market.explanation || 'No signal generated.'}</p>
    </article>
  `;
}

function renderHistory(items) {
  historyList.innerHTML = '';

  if (!items || !items.length) {
    historyList.innerHTML = '<li class="history-item"><div class="muted-text">No historical signal records yet.</div></li>';
    return;
  }

  historyList.innerHTML = items
    .slice(0, 10)
    .map((item) => `
      <li class="history-item">
        <div class="top">
          <strong>${item.symbol}</strong>
          <span class="signal-pill ${signalClass(item.signal)}">${item.signal || 'N/A'}</span>
        </div>
        <div class="muted-text small">${formatTimestamp(item.timestamp)}</div>
        <div class="small">${item.note || 'Hypothetical signal record'}</div>
      </li>
    `)
    .join('');
}

async function loadMarkets() {
  try {
    const response = await fetch('/api/markets');
    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    const payload = await response.json();
    generatedAt.textContent = `Updated ${formatTimestamp(payload.generatedAt)}`;
    marketGrid.innerHTML = payload.markets.map(renderSignalCard).join('');
    renderHistory(payload.history || []);
  } catch (error) {
    generatedAt.textContent = 'Data unavailable';
    marketGrid.innerHTML = `<div class="market-card"><p class="explanation">Unable to load market data right now. The public API may be rate-limited or temporarily unavailable.</p></div>`;
    historyList.innerHTML = '<li class="history-item"><div class="muted-text">Historical signals are unavailable because the data source failed.</div></li>';
    console.error(error);
  }
}

refreshButton.addEventListener('click', loadMarkets);
loadMarkets();
