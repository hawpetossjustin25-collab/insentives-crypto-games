// === SECURITY: Input Sanitization ===
function sanitize(str) {
  if (typeof str !== 'string') return '';
  // Strip script tags and their content, then strip all HTML tags
  return str.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, '').trim();
}

// === SECURITY: localStorage XOR obfuscation ===
const _LS_KEY = 'iNc3nT1v3s_0bF'; // obfuscation key (not true encryption)
function _xorCipher(text, key) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    out += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return out;
}
const _origSetItem = localStorage.setItem.bind(localStorage);
const _origGetItem = localStorage.getItem.bind(localStorage);
const _PROTECTED_KEYS = ['incentives-state', 'incentives-token-economy', 'incentives-sim-data', 'incentives-match-history', 'incentives-settings'];
localStorage.setItem = function(key, value) {
  if (_PROTECTED_KEYS.includes(key) && typeof value === 'string') {
    try { _origSetItem(key, btoa(_xorCipher(value, _LS_KEY))); return; } catch(e) {}
  }
  _origSetItem(key, value);
};
localStorage.getItem = function(key) {
  const raw = _origGetItem(key);
  if (_PROTECTED_KEYS.includes(key) && raw) {
    try { return _xorCipher(atob(raw), _LS_KEY); } catch(e) { return raw; } // fallback for unencrypted data
  }
  return raw;
};

// === SECURITY: Trade execution rate limiting (max 1 per 2s) ===
let _lastTradeTime = 0;
function tradeRateLimitOk() {
  const now = Date.now();
  if (now - _lastTradeTime < 2000) return false;
  _lastTradeTime = now;
  return true;
}

// === NOTIFICATION SYSTEM ===
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Style the notification
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '6px',
    color: 'white',
    fontWeight: '600',
    fontSize: '13px',
    zIndex: '10000',
    maxWidth: '300px',
    wordWrap: 'break-word',
    animation: 'fadeInSlide 0.3s ease',
    backgroundColor: type === 'success' ? '#00c853' : 
                     type === 'error' ? '#ff1744' : 
                     type === 'warning' ? '#ff9800' : '#2196f3'
  });
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }, 4000);
  
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// === TRADING PAIRS CONFIG ===
const PAIRS = {
  // Crypto (live from Kraken)
  XETHZUSD: { symbol: 'ETH', name: 'ETH/USD', decimals: 2, icon: '⟠', color: '#627eea', category: 'crypto' },
  XXBTZUSD: { symbol: 'BTC', name: 'BTC/USD', decimals: 2, icon: '₿', color: '#f7931a', category: 'crypto' },
  SOLUSD:   { symbol: 'SOL', name: 'SOL/USD', decimals: 2, icon: '◎', color: '#9945ff', category: 'crypto' },
  XDGUSD:   { symbol: 'DOGE', name: 'DOGE/USD', decimals: 5, icon: 'Ð', color: '#c2a633', category: 'crypto' },
  XXRPZUSD: { symbol: 'XRP', name: 'XRP/USD', decimals: 4, icon: '✕', color: '#00aae4', category: 'crypto' },
  ADAUSD:   { symbol: 'ADA', name: 'ADA/USD', decimals: 4, icon: '₳', color: '#0033ad', category: 'crypto' },
  AVAXUSD:  { symbol: 'AVAX', name: 'AVAX/USD', decimals: 2, icon: '🔺', color: '#e84142', category: 'crypto' },
  LINKUSD:  { symbol: 'LINK', name: 'LINK/USD', decimals: 2, icon: '⬡', color: '#2a5ada', category: 'crypto' },
  // Stocks (simulated)
  SIM_AAPL:  { symbol: 'AAPL', name: 'AAPL/USD', decimals: 2, icon: '🍎', color: '#555555', category: 'stock', simBase: 180, simVol: 0.0008 },
  SIM_TSLA:  { symbol: 'TSLA', name: 'TSLA/USD', decimals: 2, icon: '⚡', color: '#cc0000', category: 'stock', simBase: 250, simVol: 0.0015 },
  SIM_NVDA:  { symbol: 'NVDA', name: 'NVDA/USD', decimals: 2, icon: '🟢', color: '#76b900', category: 'stock', simBase: 800, simVol: 0.0012 },
  SIM_MSFT:  { symbol: 'MSFT', name: 'MSFT/USD', decimals: 2, icon: '🪟', color: '#00a4ef', category: 'stock', simBase: 420, simVol: 0.0007 },
  SIM_GOOGL: { symbol: 'GOOGL', name: 'GOOGL/USD', decimals: 2, icon: '🔍', color: '#4285f4', category: 'stock', simBase: 175, simVol: 0.0008 },
  SIM_AMZN:  { symbol: 'AMZN', name: 'AMZN/USD', decimals: 2, icon: '📦', color: '#ff9900', category: 'stock', simBase: 200, simVol: 0.0009 },
  SIM_META:  { symbol: 'META', name: 'META/USD', decimals: 2, icon: 'Ⓜ️', color: '#0668e1', category: 'stock', simBase: 550, simVol: 0.0011 },
  SIM_AMD:   { symbol: 'AMD', name: 'AMD/USD', decimals: 2, icon: '🔴', color: '#ed1c24', category: 'stock', simBase: 160, simVol: 0.0013 },
  SIM_INTC:  { symbol: 'INTC', name: 'INTC/USD', decimals: 2, icon: '🔵', color: '#0071c5', category: 'stock', simBase: 30, simVol: 0.0010 },
  SIM_NFLX:  { symbol: 'NFLX', name: 'NFLX/USD', decimals: 2, icon: '🎬', color: '#e50914', category: 'stock', simBase: 700, simVol: 0.0009 },
  // Oil & Gas (simulated)
  SIM_WTI:    { symbol: 'WTI', name: 'WTI Crude/USD', decimals: 2, icon: '🛢️', color: '#8b6914', category: 'oil', simBase: 75, simVol: 0.0010 },
  SIM_NATGAS: { symbol: 'NATGAS', name: 'Nat Gas/USD', decimals: 3, icon: '🔥', color: '#ff6600', category: 'oil', simBase: 2.50, simVol: 0.0018 },
  SIM_BRENT:  { symbol: 'BRENT', name: 'Brent Oil/USD', decimals: 2, icon: '🛢️', color: '#a0782c', category: 'oil', simBase: 80, simVol: 0.0010 },
  SIM_XOM:    { symbol: 'XOM', name: 'XOM/USD', decimals: 2, icon: '⛽', color: '#ff0000', category: 'oil', simBase: 110, simVol: 0.0008 },
  SIM_CVX:    { symbol: 'CVX', name: 'CVX/USD', decimals: 2, icon: '⛽', color: '#0055a5', category: 'oil', simBase: 155, simVol: 0.0008 },
  SIM_OXY:    { symbol: 'OXY', name: 'OXY/USD', decimals: 2, icon: '⛽', color: '#cc3333', category: 'oil', simBase: 55, simVol: 0.0012 },
  // Incentives
  SIM_INCENTIVES: { symbol: 'INCNTV', name: 'INCENTIVES/USD', decimals: 6, icon: '💎', color: '#ffd700', category: 'incentives', simBase: 0.005, simVol: 0.0035 },
};

function isSimulated(pair) { return pair.startsWith('SIM_'); }

// === SIMULATION ENGINE ===
const SIM_STORE_KEY = 'incentives-sim-data';
let simState = JSON.parse(localStorage.getItem(SIM_STORE_KEY) || '{}');

function saveSim() { localStorage.setItem(SIM_STORE_KEY, JSON.stringify(simState)); }

function getSimState(pair) {
  const info = PAIRS[pair];
  if (!simState[pair]) {
    simState[pair] = { price: info.simBase, momentum: 0, candles: {}, lastTick: Date.now() };
  }
  return simState[pair];
}

function simTick(pair) {
  const info = PAIRS[pair];
  const ss = getSimState(pair);
  const vol = info.simVol;
  // Random walk with momentum
  const rand = (Math.random() - 0.5) * 2;
  ss.momentum = ss.momentum * 0.92 + rand * vol * 0.4;
  const noise = (Math.random() - 0.5) * vol * ss.price;
  const meanRevert = (info.simBase - ss.price) * 0.0001;
  ss.price = Math.max(ss.price * 0.01, ss.price + ss.momentum * ss.price + noise + meanRevert);
  ss.lastTick = Date.now();
  // Update current candle for each timeframe
  const now = Math.floor(Date.now() / 1000);
  [1,5,15,60,240,1440].forEach(tf => {
    const key = tf.toString();
    if (!ss.candles[key]) ss.candles[key] = [];
    const bucket = Math.floor(now / (tf * 60)) * (tf * 60);
    const arr = ss.candles[key];
    const last = arr.length ? arr[arr.length - 1] : null;
    if (last && last.time === bucket) {
      last.high = Math.max(last.high, ss.price);
      last.low = Math.min(last.low, ss.price);
      last.close = ss.price;
      last.volume += Math.random() * 100;
    } else {
      arr.push({ time: bucket, open: ss.price, high: ss.price, low: ss.price, close: ss.price, volume: Math.random() * 500 });
      // Keep max 500 candles per tf
      if (arr.length > 500) arr.splice(0, arr.length - 500);
    }
  });
  saveSim();
  return ss.price;
}

function generateSimHistory(pair, tf) {
  const info = PAIRS[pair];
  const ss = getSimState(pair);
  const key = tf.toString();
  if (ss.candles[key] && ss.candles[key].length > 20) return ss.candles[key];
  // Generate historical candles
  const now = Math.floor(Date.now() / 1000);
  const interval = tf * 60;
  const count = 200;
  let price = info.simBase * (0.9 + Math.random() * 0.2);
  let mom = 0;
  const candles = [];
  for (let i = count; i >= 1; i--) {
    const t = Math.floor((now - i * interval) / interval) * interval;
    const rand = (Math.random() - 0.5) * 2;
    mom = mom * 0.9 + rand * info.simVol * 0.5;
    const open = price;
    price = Math.max(price * 0.01, price * (1 + mom + (Math.random() - 0.5) * info.simVol * 2));
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random() * info.simVol);
    const low = Math.min(open, close) * (1 - Math.random() * info.simVol);
    candles.push({ time: t, open, high, low, close, volume: Math.random() * 10000 });
  }
  ss.candles[key] = candles;
  ss.price = candles[candles.length - 1].close;
  saveSim();
  return candles;
}

// === NEWS RADIO ===
let radioOn = false;
const NEWS_HEADLINES = [
  "Fed signals potential rate hold through Q3...",
  "Tech earnings beat expectations across the board...",
  "Oil supply concerns mount amid Middle East tensions...",
  "Retail investors pile into meme stocks once again...",
  "Bitcoin ETF sees record inflows this week...",
  "NVIDIA announces next-gen AI chip architecture...",
  "Natural gas prices volatile on weather forecasts...",
  "Congress debates new crypto regulation framework...",
  "Tesla breaks ground on new Gigafactory...",
  "Amazon AWS growth accelerates, cloud war heats up...",
  "OPEC+ considers extending production cuts...",
  "Meta's AI division reports breakthrough results...",
  "Analysts upgrade INCENTIVES token to 'Strong Buy'...",
  "Market volatility index spikes to 3-month high...",
  "Goldman Sachs raises S&P 500 year-end target...",
  "Exxon posts record quarterly profit...",
  "Apple Vision Pro sales exceed analyst expectations...",
  "Netflix subscriber growth surprises to the upside...",
  "INCENTIVES ecosystem TVL surpasses $50M milestone...",
  "Chevron announces major new Gulf discovery...",
];

let radioTickerItems = [];
let radioInterval = null;

function generateRadioHeadline() {
  // Mix: 40% price-based, 60% fake news
  if (Math.random() < 0.4 && currentPrice > 0) {
    const info = pairInfo();
    const change = ((Math.random() - 0.5) * 4).toFixed(2);
    const dir = parseFloat(change) >= 0 ? '📈' : '📉';
    return `${dir} ${info.symbol} ${change >= 0 ? '+' : ''}${change}% — now at $${currentPrice.toFixed(info.decimals)}`;
  }
  return '📰 ' + NEWS_HEADLINES[Math.floor(Math.random() * NEWS_HEADLINES.length)];
}

function updateRadioTicker() {
  const ticker = document.getElementById('radio-ticker');
  if (!radioOn) return;
  radioTickerItems.push(generateRadioHeadline());
  if (radioTickerItems.length > 5) radioTickerItems.shift();
  ticker.textContent = radioTickerItems.join('  ///  ');
}

function toggleRadio() {
  radioOn = !radioOn;
  const container = document.getElementById('market-radio');
  const btn = document.getElementById('radio-toggle');
  if (radioOn) {
    container.classList.add('radio-on');
    btn.textContent = 'ON';
    updateRadioTicker();
    radioInterval = setInterval(updateRadioTicker, 6000);
  } else {
    container.classList.remove('radio-on');
    btn.textContent = 'OFF';
    if (radioInterval) clearInterval(radioInterval);
    radioInterval = null;
  }
}

function setupRadio() {
  document.getElementById('radio-toggle').onclick = toggleRadio;
  document.getElementById('radio-mute').onclick = function() {
    const vol = document.getElementById('radio-vol');
    if (parseInt(vol.value) > 0) { vol.dataset.prev = vol.value; vol.value = 0; this.textContent = '🔇'; }
    else { vol.value = vol.dataset.prev || 50; this.textContent = '🔊'; }
  };
}

// === SETTINGS ===
const DEFAULT_SETTINGS = {
  theme: 'dark', chartType: 'candlestick', defaultTimeframe: '15',
  soundEffects: false, notifications: false, tradeConfirm: true,
  currency: 'USD', language: 'en', fontSize: 'medium',
  radioAutoplay: false, mentorVoice: false,
};
let settings = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('incentives-settings') || '{}') };
// Migrate old midnight theme to telegram
if (settings.theme === 'midnight') settings.theme = 'dark';

function saveSettings() { localStorage.setItem('incentives-settings', JSON.stringify(settings)); }

const THEME_ORDER = ['dark', 'light', 'telegram'];
const THEME_ICONS = { dark: '🌙', light: '☀️', telegram: '💎' };

function cycleTheme() {
  const idx = THEME_ORDER.indexOf(settings.theme);
  settings.theme = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
  saveSettings();
  applySettings();
  if (chart) rebuildChart();
}

function applySettings() {
  // Theme
  document.body.classList.remove('theme-dark', 'theme-light', 'theme-telegram', 'theme-midnight');
  document.body.classList.add('theme-' + settings.theme);

  // Font size
  document.body.classList.remove('fs-small', 'fs-medium', 'fs-large');
  document.body.classList.add('fs-' + settings.fontSize);

  // Update theme cycle button icon
  const themeCycleBtn = document.getElementById('theme-cycle-btn');
  if (themeCycleBtn) themeCycleBtn.textContent = THEME_ICONS[settings.theme] || '🌙';

  // Update chart colors if chart exists
  if (chart) {
    const colors = getThemeColors();
    chart.applyOptions({
      layout: { background: { color: colors.bg }, textColor: colors.muted },
      grid: { vertLines: { color: colors.bg3 }, horzLines: { color: colors.bg3 } },
      timeScale: { borderColor: colors.border },
      rightPriceScale: { borderColor: colors.border },
    });
  }

  // Sync UI controls
  document.getElementById('set-theme').value = settings.theme;
  document.getElementById('set-charttype').value = settings.chartType;
  document.getElementById('set-timeframe').value = settings.defaultTimeframe;
  document.getElementById('set-fontsize').value = settings.fontSize;
  document.getElementById('set-currency').value = settings.currency;
  document.getElementById('set-language').value = settings.language;

  // Toggles
  document.querySelectorAll('.toggle-switch').forEach(el => {
    const key = el.dataset.setting;
    el.classList.toggle('active', !!settings[key]);
  });
}

function getThemeColors() {
  const s = getComputedStyle(document.documentElement);
  // Read from actual CSS vars after theme class applied
  const body = getComputedStyle(document.body);
  return {
    bg: body.getPropertyValue('--bg').trim() || '#0b0e11',
    bg2: body.getPropertyValue('--bg2').trim() || '#141821',
    bg3: body.getPropertyValue('--bg3').trim() || '#1a1f2e',
    border: body.getPropertyValue('--border').trim() || '#222840',
    muted: body.getPropertyValue('--muted').trim() || '#6b7280',
  };
}

function setupSettingsEvents() {
  document.getElementById('settings-btn').onclick = () => {
    document.getElementById('settings-overlay').classList.remove('hidden');
  };

  document.getElementById('set-theme').onchange = function() { settings.theme = this.value; saveSettings(); applySettings(); if (chart) rebuildChart(); };
  document.getElementById('set-fontsize').onchange = function() { settings.fontSize = this.value; saveSettings(); applySettings(); };
  document.getElementById('set-currency').onchange = function() { settings.currency = this.value; saveSettings(); updateUI(); };
  document.getElementById('set-language').onchange = function() { settings.language = this.value; saveSettings(); };
  document.getElementById('set-charttype').onchange = function() { settings.chartType = this.value; saveSettings(); rebuildChart(); };
  document.getElementById('set-timeframe').onchange = function() { settings.defaultTimeframe = this.value; saveSettings(); };

  // Toggles
  document.querySelectorAll('.toggle-switch').forEach(el => {
    el.onclick = () => {
      const key = el.dataset.setting;
      settings[key] = !settings[key];
      el.classList.toggle('active', settings[key]);
      saveSettings();
    };
  });
}

function openSettings() { document.getElementById('settings-overlay').classList.remove('hidden'); }
function closeSettings() { document.getElementById('settings-overlay').classList.add('hidden'); }

function resetBalance() {
  if (!confirm('Reset balance to $10,000? This will clear all trades and holdings.')) return;
  state = { ...DEFAULTS };
  save(); updateUI(); updateBotUI();
  closeSettings();
}

// === STATE ===
const DEFAULTS = { balance: 10000, holdings: {}, costBases: {}, openOrders: [], tradeHistory: [], botTrades: [], bots: [] };
let state = JSON.parse(localStorage.getItem('incentives-state')) || JSON.parse(JSON.stringify(DEFAULTS));
// Migrate old state format
if (state.ethHeld !== undefined) {
  state.holdings = { ETH: state.ethHeld || 0 };
  state.costBases = { ETH: state.costBasis || 0 };
  delete state.ethHeld; delete state.costBasis;
  save();
}
if (!state.holdings) state.holdings = {};
if (!state.costBases) state.costBases = {};

let currentPrice = 0;
let currentPair = 'XETHZUSD';
let orderSide = 'buy';
let orderType = 'market';
let activeHistoryTab = 'open';
let timeframe = 15;
let chart, mainSeries, volumeSeries;

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£' };
function cs() { return CURRENCY_SYMBOLS[settings.currency] || '$'; }
function pairInfo() { return PAIRS[currentPair]; }

function save() { localStorage.setItem('incentives-state', JSON.stringify(state)); }

// === CHART SETUP ===
function initChart() {
  const container = document.getElementById('chart-container');
  const colors = getThemeColors();
  chart = LightweightCharts.createChart(container, {
    width: container.clientWidth, height: container.clientHeight,
    layout: { background: { color: colors.bg }, textColor: colors.muted },
    grid: { vertLines: { color: colors.bg3 }, horzLines: { color: colors.bg3 } },
    crosshair: { mode: 0 },
    timeScale: { timeVisible: true, secondsVisible: false, borderColor: colors.border },
    rightPriceScale: { borderColor: colors.border }
  });
  createSeries();
  new ResizeObserver(() => chart.applyOptions({ width: container.clientWidth, height: container.clientHeight })).observe(container);
}

function createSeries() {
  if (mainSeries) { chart.removeSeries(mainSeries); mainSeries = null; }
  if (volumeSeries) { chart.removeSeries(volumeSeries); volumeSeries = null; }

  const type = settings.chartType;
  if (type === 'line') {
    mainSeries = chart.addLineSeries({ color: pairInfo().color, lineWidth: 2 });
  } else if (type === 'area') {
    mainSeries = chart.addAreaSeries({
      topColor: pairInfo().color + '80', bottomColor: pairInfo().color + '10',
      lineColor: pairInfo().color, lineWidth: 2
    });
  } else {
    mainSeries = chart.addCandlestickSeries({
      upColor: '#00c853', downColor: '#ff1744', borderUpColor: '#00c853',
      borderDownColor: '#ff1744', wickUpColor: '#00c853', wickDownColor: '#ff1744'
    });
  }
  volumeSeries = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: '' });
  volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
}

function rebuildChart() {
  createSeries();
  loadChart(timeframe);
}

// === KRAKEN API + SIMULATION ===
async function fetchCandles(tf) {
  if (isSimulated(currentPair)) {
    return generateSimHistory(currentPair, tf);
  }
  try {
    const r = await fetch(`https://api.kraken.com/0/public/OHLC?pair=${currentPair}&interval=${tf}`);
    const d = await r.json();
    if (d.error && d.error.length) { console.error('Kraken error:', d.error); return []; }
    const key = Object.keys(d.result).find(k => k !== 'last');
    return d.result[key].map(c => ({
      time: c[0], open: +c[1], high: +c[2], low: +c[3], close: +c[4], volume: +c[6]
    }));
  } catch (e) { console.error('Fetch candles error:', e); return []; }
}

async function fetchTicker() {
  if (isSimulated(currentPair)) {
    return simTick(currentPair);
  }
  try {
    const r = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${currentPair}`);
    const d = await r.json();
    if (d.error && d.error.length) return currentPrice;
    const key = Object.keys(d.result)[0];
    return +d.result[key].c[0];
  } catch (e) { console.error('Fetch ticker error:', e); return currentPrice; }
}

async function loadChart(tf) {
  timeframe = tf;
  const candles = await fetchCandles(tf);
  if (!candles.length) return;

  const type = settings.chartType;
  if (type === 'line' || type === 'area') {
    mainSeries.setData(candles.map(c => ({ time: c.time, value: c.close })));
  } else {
    mainSeries.setData(candles.map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
  }
  volumeSeries.setData(candles.map(c => ({ time: c.time, value: c.volume, color: c.close >= c.open ? 'rgba(0,200,83,.3)' : 'rgba(255,23,68,.3)' })));
  currentPrice = candles[candles.length - 1].close;
  updatePrice(currentPrice);
}

// === LIVE UPDATES ===
async function tick() {
  // Tick all simulated pairs in background for continuous price movement
  Object.keys(PAIRS).forEach(k => { if (isSimulated(k) && k !== currentPair) simTick(k); });
  const p = await fetchTicker();
  if (p) { currentPrice = p; updatePrice(p); checkLimitOrders(p); updateUI(); }
}

function updatePrice(p) {
  const info = pairInfo();
  const dec = info.decimals;
  document.getElementById('live-price').textContent = `${info.icon} ${info.symbol} ${cs()}${p.toFixed(dec)}`;
  const now = Math.floor(Date.now() / 1000);
  const type = settings.chartType;
  if (type === 'line' || type === 'area') {
    mainSeries.update({ time: now, value: p });
  } else {
    mainSeries.update({ time: now, open: p, high: p, low: p, close: p });
  }
}

// === PAIR SWITCHING ===
function switchPair(pair) {
  currentPair = pair;
  const info = pairInfo();
  // Update order labels
  document.getElementById('order-asset-label').textContent = `Amount (${info.symbol})`;
  document.getElementById('place-order').textContent = `${orderSide.toUpperCase()} ${info.symbol}`;
  // Show market hours note for stocks/oil
  const note = document.getElementById('market-hours-note');
  if (info.category === 'stock' || info.category === 'oil') {
    note.classList.remove('hidden');
  } else {
    note.classList.add('hidden');
  }
  // Reload chart with new series color
  createSeries();
  loadChart(timeframe);
  tick();
}

// === TRADING ===
function placeOrder() {
  const usd = parseFloat(document.getElementById('order-usd').value);
  if (!usd || usd <= 0) return;
  const price = orderType === 'market' ? currentPrice : parseFloat(document.getElementById('limit-price').value);
  if (!price) return;
  const info = pairInfo();
  const amount = usd / price;
  const fee = usd * 0.001;

  if (settings.tradeConfirm && orderType === 'market') {
    if (!confirm(`${orderSide.toUpperCase()} ${amount.toFixed(6)} ${info.symbol} at ${cs()}${price.toFixed(info.decimals)} for ${cs()}${usd.toFixed(2)}?`)) return;
  }

  if (orderType !== 'market') {
    state.openOrders.push({ id: Date.now(), pair: currentPair, side: orderSide, type: orderType, price, usd, amount, fee, time: new Date().toISOString() });
    save(); updateUI(); return;
  }

  executeTrade(orderSide, price, usd, amount, fee, 'manual', currentPair);
}

function executeTrade(side, price, usd, amount, fee, source = 'manual', pair = currentPair) {
  if (!tradeRateLimitOk()) return;
  const sym = PAIRS[pair].symbol;
  if (side === 'buy') {
    if (usd + fee > state.balance) return alert('Insufficient balance');
    state.balance -= usd + fee;
    const held = state.holdings[sym] || 0;
    const basis = state.costBases[sym] || 0;
    state.costBases[sym] = held + amount > 0 ? ((basis * held) + usd) / (held + amount) : 0;
    state.holdings[sym] = held + amount;
  } else {
    const held = state.holdings[sym] || 0;
    if (amount > held) return alert(`Insufficient ${sym}`);
    state.balance += usd - fee;
    state.holdings[sym] = held - amount;
    if (state.holdings[sym] < 0.00000001) { state.holdings[sym] = 0; state.costBases[sym] = 0; }
  }
  const entry = { side, pair, price, usd, amount, fee, time: new Date().toISOString(), source };
  if (source === 'bot') state.botTrades.push(entry);
  else { state.tradeHistory.push(entry); if (typeof TokenEconomy !== 'undefined') TokenEconomy.trackTrade(orderType); }
  save(); updateUI();
}

function checkLimitOrders(price) {
  const remaining = [];
  for (const o of state.openOrders) {
    if (o.pair !== currentPair) { remaining.push(o); continue; }
    let fill = false;
    if (o.type === 'limit' && o.side === 'buy' && price <= o.price) fill = true;
    if (o.type === 'limit' && o.side === 'sell' && price >= o.price) fill = true;
    if (o.type === 'stop' && o.side === 'sell' && price <= o.price) fill = true;
    if (o.type === 'stop' && o.side === 'buy' && price >= o.price) fill = true;
    if (fill) executeTrade(o.side, price, o.usd, o.amount, o.fee, 'manual', o.pair);
    else remaining.push(o);
  }
  state.openOrders = remaining;
  save();
}

function cancelOrder(id) {
  state.openOrders = state.openOrders.filter(o => o.id !== id);
  save(); updateUI();
}

// === BOTS ===
function startGridBot() {
  const upper = +document.getElementById('grid-upper').value;
  const lower = +document.getElementById('grid-lower').value;
  const count = +document.getElementById('grid-count').value;
  const invest = +document.getElementById('grid-invest').value;
  if (!upper || !lower || !count || !invest || upper <= lower) return alert('Invalid grid params');
  const bot = { id: Date.now(), type: 'grid', pair: currentPair, upper, lower, count, invest, active: true, pl: 0 };
  state.bots.push(bot);
  if (typeof TokenEconomy !== 'undefined') TokenEconomy.trackBotSetup();
  save(); updateBotUI();
  const step = (upper - lower) / count;
  const perGrid = invest / count;
  for (let i = 0; i < count; i++) {
    const price = lower + step * i;
    const amount = perGrid / price;
    state.openOrders.push({ id: Date.now() + i, pair: currentPair, side: 'buy', type: 'limit', price: +price.toFixed(2), usd: perGrid, amount, fee: perGrid * 0.001, time: new Date().toISOString(), botId: bot.id });
  }
  save(); updateUI();
}

function startDCABot() {
  const interval = +document.getElementById('dca-interval').value * 1000;
  const amt = +document.getElementById('dca-amount').value;
  if (!amt) return alert('Set amount');
  const bot = { id: Date.now(), type: 'dca', pair: currentPair, interval: interval / 1000, amount: amt, active: true, pl: 0 };
  state.bots.push(bot);
  if (typeof TokenEconomy !== 'undefined') TokenEconomy.trackBotSetup();
  bot._timer = setInterval(() => {
    if (!bot.active) return;
    const amount = amt / currentPrice;
    executeTrade('buy', currentPrice, amt, amount, amt * 0.001, 'bot', bot.pair);
  }, interval);
  save(); updateBotUI();
}

function startCustomBot() {
  const name = document.getElementById('custom-name').value || 'Custom Strategy';
  const tf = document.getElementById('custom-tf').value;
  const entryInd = document.getElementById('custom-entry-ind').value;
  const entryCond = document.getElementById('custom-entry-cond').value;
  const entryVal = +document.getElementById('custom-entry-val').value;
  const exitInd = document.getElementById('custom-exit-ind').value;
  const exitCond = document.getElementById('custom-exit-cond').value;
  const exitVal = +document.getElementById('custom-exit-val').value;
  const sl = +document.getElementById('custom-sl').value || 1;
  const tp = +document.getElementById('custom-tp').value || 2;
  const size = +document.getElementById('custom-size').value || 5;

  const bot = {
    id: Date.now(), type: 'custom', pair: currentPair, active: true, pl: 0,
    name, strategy: { tf, entryInd, entryCond, entryVal, exitInd, exitCond, exitVal, sl, tp, size },
    position: null, priceHistory: []
  };
  state.bots.push(bot);
  if (typeof TokenEconomy !== 'undefined') TokenEconomy.trackBotSetup();

  // Simple RSI calculation
  function calcRSI(prices, period) {
    if (prices.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) gains += diff; else losses -= diff;
    }
    const rs = gains / (losses || 0.001);
    return 100 - (100 / (1 + rs));
  }

  function checkCondition(value, cond, target) {
    if (cond === 'below') return value < target;
    if (cond === 'above') return value > target;
    return false;
  }

  bot._timer = setInterval(() => {
    if (!bot.active) return;
    bot.priceHistory.push(currentPrice);
    if (bot.priceHistory.length > 100) bot.priceHistory.shift();

    let indicatorValue = 50;
    if (bot.strategy.entryInd === 'RSI' || bot.strategy.exitInd === 'RSI') {
      indicatorValue = calcRSI(bot.priceHistory, 14);
    } else if (bot.strategy.entryInd === 'PRICE_CHANGE' || bot.strategy.exitInd === 'PRICE_CHANGE') {
      if (bot.priceHistory.length >= 2) {
        indicatorValue = ((currentPrice - bot.priceHistory[bot.priceHistory.length - 2]) / bot.priceHistory[bot.priceHistory.length - 2]) * 100;
      }
    }

    // Entry
    if (!bot.position && checkCondition(indicatorValue, bot.strategy.entryCond, bot.strategy.entryVal)) {
      const usd = state.balance * (bot.strategy.size / 100);
      if (usd > 5) {
        const amount = usd / currentPrice;
        executeTrade('buy', currentPrice, usd, amount, usd * 0.001, 'bot', bot.pair);
        bot.position = { entryPrice: currentPrice, amount, usd };
      }
    }

    // Exit
    if (bot.position) {
      const pnlPct = ((currentPrice - bot.position.entryPrice) / bot.position.entryPrice) * 100;
      const exitSignal = checkCondition(indicatorValue, bot.strategy.exitCond, bot.strategy.exitVal);
      const hitSL = pnlPct <= -bot.strategy.sl;
      const hitTP = pnlPct >= bot.strategy.tp;

      if (exitSignal || hitSL || hitTP) {
        const usd = bot.position.amount * currentPrice;
        executeTrade('sell', currentPrice, usd, bot.position.amount, usd * 0.001, 'bot', bot.pair);
        bot.pl += usd - bot.position.usd;
        bot.position = null;
      }
    }
    save(); updateBotUI();
  }, 15000); // check every 15 seconds

  save(); updateBotUI();
  alert('Custom bot "' + name + '" started! Checking ' + entryInd + ' every 15 seconds.');
}

function stopBot(id) {
  const bot = state.bots.find(b => b.id === id);
  if (bot) { bot.active = false; if (bot._timer) clearInterval(bot._timer); }
  state.openOrders = state.openOrders.filter(o => o.botId !== id);
  save(); updateBotUI(); updateUI();
}

// === UI UPDATES ===
function updateUI() {
  const sym = pairInfo().symbol;
  const held = state.holdings[sym] || 0;
  const portfolio = state.balance + Object.entries(state.holdings).reduce((sum, [s, h]) => {
    // For non-current pairs we use costBasis as estimate; for current pair use live price
    if (s === sym) return sum + h * currentPrice;
    return sum + h * (state.costBases[s] || 0);
  }, 0);
  const pl = portfolio - 10000;
  document.getElementById('balance').textContent = `${cs()}${state.balance.toFixed(2)}`;
  document.getElementById('portfolio').textContent = `${cs()}${portfolio.toFixed(2)}`;
  const pnlEl = document.getElementById('pnl');
  pnlEl.textContent = `${pl >= 0 ? '+' : ''}${cs()}${pl.toFixed(2)}`;
  pnlEl.className = `mono ${pl > 0 ? 'pnl-pos' : pl < 0 ? 'pnl-neg' : 'pnl-zero'}`;

  const usdVal = parseFloat(document.getElementById('order-usd').value) || 0;
  document.getElementById('fee-display').textContent = `Est. fee: ${cs()}${(usdVal * 0.001).toFixed(2)}`;

  const btn = document.getElementById('place-order');
  btn.textContent = `${orderSide.toUpperCase()} ${sym}`;
  btn.className = `primary-btn ${orderSide === 'buy' ? 'buy-color' : 'sell-color'}`;

  document.getElementById('order-asset-label').textContent = `Amount (${sym})`;

  renderHistory();
}

function renderHistory() {
  const body = document.getElementById('history-body');
  const noOrders = document.getElementById('no-orders');
  let rows = [];

  if (activeHistoryTab === 'open') {
    rows = state.openOrders.map(o => {
      const pi = PAIRS[o.pair] || pairInfo();
      return `<tr>
      <td>${new Date(o.time).toLocaleTimeString()}</td>
      <td>${pi.icon} ${pi.symbol}</td>
      <td style="color:${o.side === 'buy' ? 'var(--green)' : 'var(--red)'}">${o.side.toUpperCase()}</td>
      <td class="mono">${cs()}${o.price.toFixed(pi.decimals)}</td><td class="mono">${(o.amount||o.eth||0).toFixed(4)} ${pi.symbol}</td>
      <td class="mono">${cs()}${o.usd.toFixed(2)}</td><td>${o.type}</td>
      <td><button class="cancel-btn" onclick="cancelOrder(${o.id})">Cancel</button></td></tr>`;
    });
  } else if (activeHistoryTab === 'history') {
    rows = [...state.tradeHistory].reverse().map(t => {
      const pi = PAIRS[t.pair] || pairInfo();
      return `<tr>
      <td>${new Date(t.time).toLocaleTimeString()}</td>
      <td>${pi.icon} ${pi.symbol}</td>
      <td style="color:${t.side === 'buy' ? 'var(--green)' : 'var(--red)'}">${t.side.toUpperCase()}</td>
      <td class="mono">${cs()}${t.price.toFixed(pi.decimals)}</td><td class="mono">${(t.amount||t.eth||0).toFixed(4)} ${pi.symbol}</td>
      <td class="mono">${cs()}${t.usd.toFixed(2)}</td><td>Filled</td><td></td></tr>`;
    });
  } else {
    rows = [...state.botTrades].reverse().map(t => {
      const pi = PAIRS[t.pair] || pairInfo();
      return `<tr>
      <td>${new Date(t.time).toLocaleTimeString()}</td>
      <td>${pi.icon} ${pi.symbol}</td>
      <td style="color:${t.side === 'buy' ? 'var(--green)' : 'var(--red)'}">${t.side.toUpperCase()}</td>
      <td class="mono">${cs()}${t.price.toFixed(pi.decimals)}</td><td class="mono">${(t.amount||t.eth||0).toFixed(4)} ${pi.symbol}</td>
      <td class="mono">${cs()}${t.usd.toFixed(2)}</td><td>Bot</td><td></td></tr>`;
    });
  }
  body.innerHTML = rows.join('');
  noOrders.classList.toggle('hidden', rows.length > 0);
}

function updateBotUI() {
  const list = document.getElementById('active-bots-list');
  const active = state.bots.filter(b => b.active);
  if (!active.length) { list.innerHTML = '<p class="muted">No active bots</p>'; return; }
  list.innerHTML = active.map(b => {
    const pi = PAIRS[b.pair] || { symbol: '?', icon: '' };
    return `<div class="bot-entry">
    <div class="bot-info">${pi.icon} ${b.type.toUpperCase()} ${pi.symbol} #${b.id.toString().slice(-4)}</div>
    <button class="stop-bot-btn" onclick="stopBot(${b.id})">Stop</button>
  </div>`;
  }).join('');
}

// === EVENT HANDLERS ===
function setupEvents() {
  // Side toggle
  document.getElementById('buy-btn').onclick = () => { orderSide = 'buy'; document.getElementById('buy-btn').className = 'side-btn active-buy'; document.getElementById('sell-btn').className = 'side-btn'; updateUI(); };
  document.getElementById('sell-btn').onclick = () => { orderSide = 'sell'; document.getElementById('sell-btn').className = 'side-btn active-sell'; document.getElementById('buy-btn').className = 'side-btn'; updateUI(); };

  // Order type
  document.querySelectorAll('.ot-btn').forEach(b => b.onclick = () => {
    document.querySelectorAll('.ot-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    orderType = b.dataset.type;
    document.getElementById('limit-price-row').classList.toggle('hidden', orderType === 'market');
  });

  // Percentage buttons
  document.querySelectorAll('.pct-btn').forEach(b => b.onclick = () => {
    const pct = +b.dataset.pct / 100;
    const sym = pairInfo().symbol;
    const held = state.holdings[sym] || 0;
    const max = orderSide === 'buy' ? state.balance : held * currentPrice;
    document.getElementById('order-usd').value = (max * pct).toFixed(2);
    document.getElementById('order-eth').value = currentPrice ? (max * pct / currentPrice).toFixed(4) : '';
    updateUI();
  });

  // USD/asset sync
  document.getElementById('order-usd').oninput = function() {
    document.getElementById('order-eth').value = currentPrice ? (this.value / currentPrice).toFixed(4) : '';
    updateUI();
  };
  document.getElementById('order-eth').oninput = function() {
    document.getElementById('order-usd').value = (this.value * currentPrice).toFixed(2);
    updateUI();
  };

  // Place order
  document.getElementById('place-order').onclick = placeOrder;

  // Timeframes
  document.querySelectorAll('.tf-btn').forEach(b => b.onclick = () => {
    document.querySelectorAll('.tf-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    loadChart(+b.dataset.tf);
  });

  // Market selector
  document.getElementById('market-selector').onchange = function() {
    switchPair(this.value);
  };

  // History tabs
  document.querySelectorAll('.h-tab').forEach(b => b.onclick = () => {
    document.querySelectorAll('.h-tab').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    activeHistoryTab = b.dataset.htab;
    renderHistory();
  });

  // Bot tabs
  document.querySelectorAll('.bot-tab').forEach(b => b.onclick = () => {
    document.querySelectorAll('.bot-tab').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    document.querySelectorAll('.bot-form').forEach(f => f.classList.add('hidden'));
    document.getElementById('bot-' + b.dataset.bot).classList.remove('hidden');
  });

  // Bot starts
  document.getElementById('start-grid').onclick = startGridBot;
  document.getElementById('start-dca').onclick = startDCABot;
  document.getElementById('start-custom').onclick = startCustomBot;

  // Challenge modal
  document.getElementById('challenge-btn').onclick = openChallengeModal;

  // Leverage display
  document.getElementById('leverage').oninput = function() { document.getElementById('lev-val').textContent = this.value + 'x'; };

  // Mentor chat
  document.getElementById('mentor-send').onclick = sendMentorMsg;
  document.getElementById('mentor-input').onkeydown = e => { if (e.key === 'Enter') sendMentorMsg(); };
  document.getElementById('mentor-voice').onclick = () => alert('Voice call coming in Phase 2!');

  // Close wallet dropdown on outside click
  document.addEventListener('click', e => {
    const dd = document.getElementById('wallet-dropdown');
    const wa = document.getElementById('wallet-area');
    if (dd && !dd.classList.contains('hidden') && !wa.contains(e.target)) dd.classList.add('hidden');
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'b' || e.key === 'B') { document.getElementById('buy-btn').click(); }
    if (e.key === 's' || e.key === 'S') { document.getElementById('sell-btn').click(); }
    if (e.key === 'Escape') { closeChallengeModal(); closeSettings(); }
    if (e.key >= '1' && e.key <= '6') {
      const btns = document.querySelectorAll('.tf-btn');
      const idx = parseInt(e.key) - 1;
      if (btns[idx]) btns[idx].click();
    }
  });
}

// === MENTOR (placeholder) ===
function sendMentorMsg() {
  const input = document.getElementById('mentor-input');
  const text = sanitize(input.value.trim());
  if (!text) return;
  const msgs = document.getElementById('mentor-messages');
  msgs.innerHTML += `<div class="mentor-msg user">${text}</div>`;
  input.value = '';
  if (typeof TokenEconomy !== 'undefined') TokenEconomy.trackMentorQuestion();
  setTimeout(() => {
    const responses = [
      "That's a great question! In crypto trading, timing and risk management are everything. 📊",
      "Remember: never invest more than you can afford to lose! Start small. 💡",
      "Limit orders can help you get better prices. Try setting one below the current market price! 🎯",
      "DCA (Dollar Cost Averaging) is a solid strategy for beginners. Want me to explain more? 📈",
      "The market is volatile right now. Consider using stop-loss orders to protect your positions! ⚠️",
      "Grid bots work best in ranging markets. Look for support and resistance levels! 🤖"
    ];
    msgs.innerHTML += `<div class="mentor-msg bot">${responses[Math.floor(Math.random() * responses.length)]}</div>`;
    msgs.scrollTop = msgs.scrollHeight;
  }, 800);
}

function toggleMentor() {
  document.getElementById('mentor-body').classList.toggle('hidden');
  document.getElementById('mentor-toggle').textContent = document.getElementById('mentor-body').classList.contains('hidden') ? '▼' : '▲';
}

function closeModal() { closeChallengeModal(); }

// === INIT ===
async function init() {
  applySettings();
  initChart();
  setupEvents();
  setupSettingsEvents();
  setupRadio();

  // Use saved default timeframe
  timeframe = parseInt(settings.defaultTimeframe) || 15;
  document.querySelectorAll('.tf-btn').forEach(b => {
    b.classList.toggle('active', +b.dataset.tf === timeframe);
  });

  await loadChart(timeframe);
  await tick();
  setInterval(tick, 5000);
  updateUI();
  updateBotUI();
  TokenEconomy.init();
}

init();

// ============================================================
// === BOT VS PLAYER GAME MODE ================================
// ============================================================
const GAME = {
  active: false,
  pair: 'XETHZUSD',
  duration: 900,
  difficulty: 'medium',
  timeRemaining: 0,
  startPrice: 0,
  player: { balance: 10000, holdings: 0, trades: [], orderSide: 'buy', orderType: 'market', openOrders: [] },
  bot: { balance: 10000, holdings: 0, trades: [], commentary: [] },
  timerInterval: null,
  botInterval: null,
  tickInterval: null,
  playerChart: null,
  botChart: null,
  playerSeries: null,
  botSeries: null,
  matchHistory: JSON.parse(localStorage.getItem('incentives-match-history') || '[]'),
};

const DIFF_CONFIG = {
  easy:   { minInterval: 30000, maxInterval: 60000, strategies: ['grid'], mistakeRate: 0.2, desc: 'Bot uses grid only, trades every 30-60s, sometimes makes mistakes' },
  medium: { minInterval: 15000, maxInterval: 30000, strategies: ['grid','dip'], mistakeRate: 0, desc: 'Bot uses grid + dip strategies, trades every 15-30s' },
  hard:   { minInterval: 10000, maxInterval: 15000, strategies: ['grid','dip','scalp'], mistakeRate: 0, desc: 'Bot uses full grid + dip + scalp, trades every 10-15s' },
};

function openChallengeModal() {
  const overlay = document.getElementById('challenge-overlay');
  overlay.classList.remove('hidden');
  // Populate asset selector
  const sel = document.getElementById('cm-asset');
  sel.innerHTML = '';
  Object.entries(PAIRS).forEach(([k, v]) => {
    const opt = document.createElement('option');
    opt.value = k; opt.textContent = `${v.icon} ${v.name}`;
    if (k === currentPair) opt.selected = true;
    sel.appendChild(opt);
  });
  // Duration buttons
  document.querySelectorAll('.cm-dur').forEach(b => b.onclick = () => {
    document.querySelectorAll('.cm-dur').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
  });
  // Difficulty buttons
  document.querySelectorAll('.cm-diff').forEach(b => b.onclick = () => {
    document.querySelectorAll('.cm-diff').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    document.getElementById('cm-diff-desc').textContent = DIFF_CONFIG[b.dataset.diff].desc;
  });
  document.getElementById('cm-start-btn').onclick = startMatch;
}

function closeChallengeModal() {
  document.getElementById('challenge-overlay').classList.add('hidden');
}

function getGamePrice() {
  // Return current live price for the game pair
  const info = PAIRS[GAME.pair];
  if (isSimulated(GAME.pair)) {
    return getSimState(GAME.pair).price || info.simBase;
  }
  return currentPrice;
}

function gamePortfolioValue(who) {
  return who.balance + who.holdings * getGamePrice();
}

function startMatch() {
  GAME.pair = document.getElementById('cm-asset').value;
  GAME.duration = +document.querySelector('.cm-dur.active').dataset.dur;
  GAME.difficulty = document.querySelector('.cm-diff.active').dataset.diff;
  GAME.timeRemaining = GAME.duration;
  GAME.active = true;

  // Reset player & bot
  GAME.player = { balance: 10000, holdings: 0, trades: [], orderSide: 'buy', orderType: 'market', openOrders: [] };
  GAME.bot = { balance: 10000, holdings: 0, trades: [], commentary: [] };

  closeChallengeModal();
  if (typeof TokenEconomy !== 'undefined') TokenEconomy.trackChallengeStart();
  document.getElementById('game-view').classList.remove('hidden');

  const info = PAIRS[GAME.pair];
  document.getElementById('gs-asset-name').textContent = `${info.icon} ${info.name}`;

  // Init charts
  initGameCharts();

  // Fetch initial price
  GAME.startPrice = getGamePrice();
  updateGameUI();
  setupGameEvents();

  // Start timer
  GAME.timerInterval = setInterval(gameTick, 1000);

  // Start bot AI
  scheduleBotTrade();

  // Start price feed for game
  GAME.tickInterval = setInterval(() => {
    if (!GAME.active) return;
    const p = getGamePrice();
    updateGameCharts(p);
    checkGameLimitOrders(p);
    updateGameUI();
  }, 2000);

  // Initial bot commentary
  addBotCommentary(`Match started! Trading ${info.symbol} for ${formatDuration(GAME.duration)}. Let's go! 🚀`);
}

function formatDuration(s) {
  if (s >= 3600) return (s/3600) + ' hour';
  return (s/60) + ' min';
}

function initGameCharts() {
  // Destroy old
  if (GAME.playerChart) { GAME.playerChart.remove(); GAME.playerChart = null; }
  if (GAME.botChart) { GAME.botChart.remove(); GAME.botChart = null; }

  const colors = getThemeColors();
  const opts = {
    layout: { background: { color: colors.bg }, textColor: colors.muted },
    grid: { vertLines: { color: colors.bg3 }, horzLines: { color: colors.bg3 } },
    timeScale: { timeVisible: true, secondsVisible: false, borderColor: colors.border },
    rightPriceScale: { borderColor: colors.border },
    crosshair: { mode: 0 },
  };

  const pc = document.getElementById('gp-player-chart');
  const bc = document.getElementById('gp-bot-chart');
  pc.innerHTML = ''; bc.innerHTML = '';

  GAME.playerChart = LightweightCharts.createChart(pc, { ...opts, width: pc.clientWidth, height: pc.clientHeight });
  GAME.botChart = LightweightCharts.createChart(bc, { ...opts, width: bc.clientWidth, height: bc.clientHeight });

  const pairColor = PAIRS[GAME.pair].color;
  GAME.playerSeries = GAME.playerChart.addLineSeries({ color: '#4aa3ff', lineWidth: 2 });
  GAME.botSeries = GAME.botChart.addLineSeries({ color: '#ff6b35', lineWidth: 2 });

  // Add markers for trades
  GAME.playerMarkers = [];
  GAME.botMarkers = [];

  // Resize observers
  new ResizeObserver(() => GAME.playerChart && GAME.playerChart.applyOptions({ width: pc.clientWidth, height: pc.clientHeight })).observe(pc);
  new ResizeObserver(() => GAME.botChart && GAME.botChart.applyOptions({ width: bc.clientWidth, height: bc.clientHeight })).observe(bc);
}

function updateGameCharts(price) {
  const now = Math.floor(Date.now() / 1000);
  if (GAME.playerSeries) GAME.playerSeries.update({ time: now, value: price });
  if (GAME.botSeries) GAME.botSeries.update({ time: now, value: price });
}

function gameTick() {
  if (!GAME.active) return;
  GAME.timeRemaining--;

  if (GAME.timeRemaining <= 0) {
    endMatch();
    return;
  }

  // Update timer display
  const mins = Math.floor(GAME.timeRemaining / 60);
  const secs = GAME.timeRemaining % 60;
  const timerEl = document.getElementById('gs-timer');
  timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

  // Timer colors
  const pct = GAME.timeRemaining / GAME.duration;
  timerEl.classList.remove('timer-green', 'timer-yellow', 'timer-red');
  if (pct > 0.5) timerEl.classList.add('timer-green');
  else if (pct > 0.15) timerEl.classList.add('timer-yellow');
  else timerEl.classList.add('timer-red');

  updateGameUI();
}

function updateGameUI() {
  const price = getGamePrice();
  const info = PAIRS[GAME.pair];
  const dec = info.decimals;

  document.getElementById('gs-live-price').textContent = `$${price.toFixed(dec)}`;

  const pVal = gamePortfolioValue(GAME.player);
  const bVal = gamePortfolioValue(GAME.bot);
  document.getElementById('gs-player-val').textContent = `$${pVal.toFixed(2)}`;
  document.getElementById('gs-bot-val').textContent = `$${bVal.toFixed(2)}`;
  document.getElementById('gs-player-trades').textContent = `${GAME.player.trades.length} trades`;
  document.getElementById('gs-bot-trades').textContent = `${GAME.bot.trades.length} trades`;

  // Who's winning
  const winEl = document.getElementById('gs-winning');
  if (pVal > bVal + 1) { winEl.textContent = '👤 You\'re winning!'; winEl.className = 'gs-winning winning-player'; }
  else if (bVal > pVal + 1) { winEl.textContent = '🤖 Bot is winning!'; winEl.className = 'gs-winning winning-bot'; }
  else { winEl.textContent = 'Tied!'; winEl.className = 'gs-winning winning-tie'; }

  // Player stats
  const pPL = pVal - 10000;
  document.getElementById('gp-p-balance').textContent = `$${GAME.player.balance.toFixed(2)}`;
  document.getElementById('gp-p-holdings').textContent = `${GAME.player.holdings.toFixed(6)} ${info.symbol}`;
  const pPlEl = document.getElementById('gp-p-pl');
  pPlEl.textContent = `${pPL >= 0 ? '+' : ''}$${pPL.toFixed(2)}`;
  pPlEl.className = `mono ${pPL > 0 ? 'pnl-pos' : pPL < 0 ? 'pnl-neg' : 'pnl-zero'}`;

  // Bot stats
  const bPL = bVal - 10000;
  document.getElementById('gp-b-balance').textContent = `$${GAME.bot.balance.toFixed(2)}`;
  document.getElementById('gp-b-holdings').textContent = `${GAME.bot.holdings.toFixed(6)} ${info.symbol}`;
  const bPlEl = document.getElementById('gp-b-pl');
  bPlEl.textContent = `${bPL >= 0 ? '+' : ''}$${bPL.toFixed(2)}`;
  bPlEl.className = `mono ${bPL > 0 ? 'pnl-pos' : bPL < 0 ? 'pnl-neg' : 'pnl-zero'}`;

  // Update order button text
  const btn = document.getElementById('gp-place-order');
  btn.textContent = `${GAME.player.orderSide.toUpperCase()} ${info.symbol}`;
  btn.className = `primary-btn ${GAME.player.orderSide === 'buy' ? 'buy-color' : 'sell-color'}`;
}

function setupGameEvents() {
  document.getElementById('gp-buy-btn').onclick = () => {
    GAME.player.orderSide = 'buy';
    document.getElementById('gp-buy-btn').className = 'gp-side-btn gp-buy-active';
    document.getElementById('gp-sell-btn').className = 'gp-side-btn';
    updateGameUI();
  };
  document.getElementById('gp-sell-btn').onclick = () => {
    GAME.player.orderSide = 'sell';
    document.getElementById('gp-sell-btn').className = 'gp-side-btn gp-sell-active';
    document.getElementById('gp-buy-btn').className = 'gp-side-btn';
    updateGameUI();
  };

  document.querySelectorAll('.gp-ot').forEach(b => b.onclick = () => {
    document.querySelectorAll('.gp-ot').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    GAME.player.orderType = b.dataset.type;
    document.getElementById('gp-limit-row').classList.toggle('hidden', b.dataset.type === 'market');
  });

  document.querySelectorAll('.gp-pct').forEach(b => b.onclick = () => {
    const pct = +b.dataset.pct / 100;
    const price = getGamePrice();
    const max = GAME.player.orderSide === 'buy' ? GAME.player.balance : GAME.player.holdings * price;
    document.getElementById('gp-order-usd').value = (max * pct).toFixed(2);
  });

  document.getElementById('gp-place-order').onclick = placeGameOrder;
}

function placeGameOrder() {
  if (!GAME.active) return;
  const usd = parseFloat(document.getElementById('gp-order-usd').value);
  if (!usd || usd <= 0) return;

  const price = GAME.player.orderType === 'market'
    ? getGamePrice()
    : parseFloat(document.getElementById('gp-limit-price').value);
  if (!price) return;

  const amount = usd / price;
  const fee = usd * 0.001;
  const side = GAME.player.orderSide;

  if (GAME.player.orderType !== 'market') {
    GAME.player.openOrders.push({ side, price, usd, amount, fee, type: GAME.player.orderType });
    return;
  }

  executeGameTrade('player', side, price, usd, amount, fee);
  document.getElementById('gp-order-usd').value = '';
}

function executeGameTrade(who, side, price, usd, amount, fee) {
  const actor = GAME[who];
  const info = PAIRS[GAME.pair];

  if (side === 'buy') {
    if (usd + fee > actor.balance) return false;
    actor.balance -= usd + fee;
    actor.holdings += amount;
  } else {
    if (amount > actor.holdings) return false;
    actor.balance += usd - fee;
    actor.holdings -= amount;
    if (actor.holdings < 1e-10) actor.holdings = 0;
  }

  actor.trades.push({ side, price, usd, amount, fee, time: Date.now() });

  // Render trade in list
  const listId = who === 'player' ? 'gp-p-trades-list' : 'gp-b-trades-list';
  const list = document.getElementById(listId);
  const div = document.createElement('div');
  div.className = `gp-trade-item ${side === 'buy' ? 'gp-trade-buy' : 'gp-trade-sell'}`;
  div.innerHTML = `<span>${side.toUpperCase()} ${amount.toFixed(4)} ${info.symbol}</span><span class="mono">$${price.toFixed(info.decimals)}</span>`;
  list.prepend(div);

  updateGameUI();
  return true;
}

function checkGameLimitOrders(price) {
  const remaining = [];
  for (const o of GAME.player.openOrders) {
    let fill = false;
    if (o.type === 'limit' && o.side === 'buy' && price <= o.price) fill = true;
    if (o.type === 'limit' && o.side === 'sell' && price >= o.price) fill = true;
    if (fill) executeGameTrade('player', o.side, price, o.usd, o.amount, o.fee);
    else remaining.push(o);
  }
  GAME.player.openOrders = remaining;
}

// === BOT AI ===
let botState = { lastPrice: 0, gridLevels: [], lastTradePrice: 0, trend: 0, priceHistory: [] };

function scheduleBotTrade() {
  if (!GAME.active) return;
  const cfg = DIFF_CONFIG[GAME.difficulty];
  const delay = cfg.minInterval + Math.random() * (cfg.maxInterval - cfg.minInterval);
  GAME.botInterval = setTimeout(() => {
    if (!GAME.active) return;
    executeBotTrade();
    scheduleBotTrade();
  }, delay);
}

function executeBotTrade() {
  const cfg = DIFF_CONFIG[GAME.difficulty];
  const price = getGamePrice();
  const info = PAIRS[GAME.pair];

  // Track price history for trend
  botState.priceHistory.push(price);
  if (botState.priceHistory.length > 20) botState.priceHistory.shift();

  // Calculate trend
  if (botState.priceHistory.length >= 5) {
    const recent = botState.priceHistory.slice(-5);
    botState.trend = (recent[recent.length-1] - recent[0]) / recent[0];
  }

  // Mistake on easy
  if (cfg.mistakeRate > 0 && Math.random() < cfg.mistakeRate) {
    makeBotMistake(price, info);
    return;
  }

  // Setup grid levels on first trade
  if (botState.gridLevels.length === 0) {
    botState.lastPrice = price;
    botState.lastTradePrice = price;
    const range = price * 0.04; // 4% range
    for (let i = 0; i < 5; i++) {
      botState.gridLevels.push(price - range/2 + (range * i / 4));
    }
  }

  // Pick strategy
  const strats = cfg.strategies;
  const strat = strats[Math.floor(Math.random() * strats.length)];

  switch (strat) {
    case 'grid': botGridStrategy(price, info); break;
    case 'dip': botDipStrategy(price, info); break;
    case 'scalp': botScalpStrategy(price, info); break;
  }

  // Update strategy display
  const stratNames = { grid: '📊 Grid Trading', dip: '📉 Dip Buying', scalp: '⚡ Scalp Trading' };
  document.getElementById('gp-bot-strategy-text').textContent = stratNames[strat] || 'Analyzing...';
}

function botGridStrategy(price, info) {
  const dropFromStart = (GAME.startPrice - price) / GAME.startPrice;
  const riseFromStart = (price - GAME.startPrice) / GAME.startPrice;

  if (dropFromStart > 0.01 && GAME.bot.balance > 200) {
    // Buy on grid level
    const usd = Math.min(GAME.bot.balance * 0.15, 500);
    const amount = usd / price;
    if (executeGameTrade('bot', 'buy', price, usd, amount, usd * 0.001)) {
      addBotCommentary(`📊 Grid buy: price dropped ${(dropFromStart*100).toFixed(1)}% from start. Buying $${usd.toFixed(0)} worth.`);
    }
  } else if (riseFromStart > 0.015 && GAME.bot.holdings > 0) {
    // Sell on grid level
    const sellAmt = GAME.bot.holdings * 0.3;
    const usd = sellAmt * price;
    if (executeGameTrade('bot', 'sell', price, usd, sellAmt, usd * 0.001)) {
      addBotCommentary(`📊 Grid sell: price up ${(riseFromStart*100).toFixed(1)}%. Taking partial profit.`);
    }
  } else {
    addBotCommentary(`📊 Grid: price within range. Holding position. Waiting for movement.`);
  }
}

function botDipStrategy(price, info) {
  // Buy dips based on recent price history
  if (botState.priceHistory.length < 3) return;
  const recentHigh = Math.max(...botState.priceHistory.slice(-10));
  const dipPct = (recentHigh - price) / recentHigh;

  if (dipPct > 0.02 && GAME.bot.balance > 200) {
    const usd = Math.min(GAME.bot.balance * 0.2, 800);
    const amount = usd / price;
    if (executeGameTrade('bot', 'buy', price, usd, amount, usd * 0.001)) {
      addBotCommentary(`📉 Dip buy! Price dropped ${(dipPct*100).toFixed(1)}% from recent high ($${recentHigh.toFixed(info.decimals)}). Accumulating.`);
    }
  } else if (dipPct < -0.01 && GAME.bot.holdings > 0) {
    const sellAmt = GAME.bot.holdings * 0.25;
    const usd = sellAmt * price;
    if (executeGameTrade('bot', 'sell', price, usd, sellAmt, usd * 0.001)) {
      addBotCommentary(`📈 Price recovering above recent high. Selling some for profit.`);
    }
  } else {
    addBotCommentary(`📉 Dip watch: ${(dipPct*100).toFixed(1)}% from high. Need >2% dip to buy.`);
  }
}

function botScalpStrategy(price, info) {
  const lastTrade = GAME.bot.trades.length ? GAME.bot.trades[GAME.bot.trades.length-1] : null;

  if (botState.trend > 0.005 && GAME.bot.balance > 200) {
    // Uptrend: quick buy
    const usd = Math.min(GAME.bot.balance * 0.1, 300);
    const amount = usd / price;
    if (executeGameTrade('bot', 'buy', price, usd, amount, usd * 0.001)) {
      addBotCommentary(`⚡ Scalp buy: detected ${(botState.trend*100).toFixed(2)}% uptrend. Quick entry.`);
    }
  } else if (botState.trend < -0.003 && GAME.bot.holdings > 0) {
    // Downtrend: sell
    const sellAmt = GAME.bot.holdings * 0.4;
    const usd = sellAmt * price;
    if (executeGameTrade('bot', 'sell', price, usd, sellAmt, usd * 0.001)) {
      addBotCommentary(`⚡ Scalp sell: downtrend detected (${(botState.trend*100).toFixed(2)}%). Cutting position.`);
    }
  } else if (lastTrade && lastTrade.side === 'buy') {
    const pctGain = (price - lastTrade.price) / lastTrade.price;
    if (pctGain > 0.008 && GAME.bot.holdings > 0) {
      const sellAmt = GAME.bot.holdings * 0.5;
      const usd = sellAmt * price;
      if (executeGameTrade('bot', 'sell', price, usd, sellAmt, usd * 0.001)) {
        addBotCommentary(`⚡ Taking profit: ${(pctGain*100).toFixed(1)}% gain since last buy. Scalping!`);
      }
    } else {
      addBotCommentary(`⚡ Scalp: holding. Trend is sideways (${(botState.trend*100).toFixed(2)}%). Waiting for volatility.`);
    }
  } else {
    addBotCommentary(`⚡ Scalp: market is quiet. Watching for momentum shift.`);
  }
}

function makeBotMistake(price, info) {
  // Easy mode: bot makes a bad trade
  if (Math.random() > 0.5 && GAME.bot.holdings > 0) {
    // Sell at a bad time
    const sellAmt = GAME.bot.holdings * 0.2;
    const usd = sellAmt * price;
    if (executeGameTrade('bot', 'sell', price, usd, sellAmt, usd * 0.001)) {
      addBotCommentary(`🤔 Hmm, selling some here... not sure about the timing though.`);
    }
  } else if (GAME.bot.balance > 100) {
    // Buy at a questionable time
    const usd = Math.min(GAME.bot.balance * 0.1, 200);
    const amount = usd / price;
    if (executeGameTrade('bot', 'buy', price, usd, amount, usd * 0.001)) {
      addBotCommentary(`🤔 Buying a little... might be too early, we'll see.`);
    }
  }
}

function addBotCommentary(text) {
  GAME.bot.commentary.push({ text, time: Date.now() });
  const list = document.getElementById('gp-bot-commentary');
  const div = document.createElement('div');
  div.className = 'gp-comment-item';
  div.textContent = text;
  list.prepend(div);
  // Keep max 20
  while (list.children.length > 20) list.removeChild(list.lastChild);
}

// === MATCH END ===
function endMatch() {
  GAME.active = false;
  clearInterval(GAME.timerInterval);
  clearTimeout(GAME.botInterval);
  clearInterval(GAME.tickInterval);

  // Liquidate all holdings at final price
  const price = getGamePrice();
  const info = PAIRS[GAME.pair];

  // Calculate final values
  const pVal = gamePortfolioValue(GAME.player);
  const bVal = gamePortfolioValue(GAME.bot);
  const pPL = pVal - 10000;
  const bPL = bVal - 10000;
  const playerWins = pVal > bVal;
  const tie = Math.abs(pVal - bVal) < 1;

  // Show end modal
  document.getElementById('match-end-overlay').classList.remove('hidden');

  const winText = document.getElementById('match-winner-text');
  if (tie) winText.textContent = '🤝 IT\'S A TIE!';
  else if (playerWins) winText.textContent = '🏆 YOU WIN!';
  else winText.textContent = '🤖 BOT WINS!';

  document.getElementById('me-player-val').textContent = `$${pVal.toFixed(2)}`;
  document.getElementById('me-bot-val').textContent = `$${bVal.toFixed(2)}`;

  const pPlEl = document.getElementById('me-player-pl');
  pPlEl.textContent = `${pPL >= 0 ? '+' : ''}$${pPL.toFixed(2)}`;
  pPlEl.style.color = pPL >= 0 ? 'var(--green)' : 'var(--red)';

  const bPlEl = document.getElementById('me-bot-pl');
  bPlEl.textContent = `${bPL >= 0 ? '+' : ''}$${bPL.toFixed(2)}`;
  bPlEl.style.color = bPL >= 0 ? 'var(--green)' : 'var(--red)';

  // Winner glow
  const pScore = document.querySelector('.me-player');
  const bScore = document.querySelector('.me-bot');
  pScore.classList.remove('winner-glow','loser-glow');
  bScore.classList.remove('winner-glow','loser-glow');
  if (!tie) {
    if (playerWins) { pScore.classList.add('winner-glow'); bScore.classList.add('loser-glow'); }
    else { bScore.classList.add('winner-glow'); pScore.classList.add('loser-glow'); }
  }

  // Stats
  function bestTrade(trades) {
    if (!trades.length) return '$0.00';
    // Approximate: largest USD trade
    const best = trades.reduce((a, b) => b.usd > a.usd ? b : a, trades[0]);
    return `$${best.usd.toFixed(2)}`;
  }

  const statsEl = document.getElementById('match-end-stats');
  statsEl.innerHTML = `
    <div class="me-stat"><div class="me-stat-label">Your Trades</div><div class="me-stat-val">${GAME.player.trades.length}</div></div>
    <div class="me-stat"><div class="me-stat-label">Bot Trades</div><div class="me-stat-val">${GAME.bot.trades.length}</div></div>
    <div class="me-stat"><div class="me-stat-label">Your Best Trade</div><div class="me-stat-val">${bestTrade(GAME.player.trades)}</div></div>
    <div class="me-stat"><div class="me-stat-label">Bot Best Trade</div><div class="me-stat-val">${bestTrade(GAME.bot.trades)}</div></div>
    <div class="me-stat"><div class="me-stat-label">Duration</div><div class="me-stat-val">${formatDuration(GAME.duration)}</div></div>
    <div class="me-stat"><div class="me-stat-label">Difficulty</div><div class="me-stat-val">${GAME.difficulty.charAt(0).toUpperCase()+GAME.difficulty.slice(1)}</div></div>
  `;

  // Token Economy rewards
  let rewardsData = { total: 0, breakdown: [] };
  if (typeof TokenEconomy !== 'undefined') {
    rewardsData = TokenEconomy.trackChallengeEnd(playerWins, GAME.difficulty, pVal, bVal);
    const rewardsHTML = TokenEconomy.renderMatchRewards(rewardsData);
    if (rewardsHTML) {
      statsEl.insertAdjacentHTML('beforebegin', rewardsHTML);
    }
  }

  // Confetti for winner
  if (playerWins) spawnConfetti();

  // Save match history
  GAME.matchHistory.push({
    date: new Date().toISOString(),
    pair: GAME.pair,
    duration: GAME.duration,
    difficulty: GAME.difficulty,
    playerVal: pVal, botVal: bVal,
    playerTrades: GAME.player.trades.length,
    botTrades: GAME.bot.trades.length,
    winner: tie ? 'tie' : (playerWins ? 'player' : 'bot'),
  });
  localStorage.setItem('incentives-match-history', JSON.stringify(GAME.matchHistory));
}

function spawnConfetti() {
  const container = document.getElementById('match-end-confetti');
  container.innerHTML = '';
  const colors = ['#ff1744','#00c853','#2979ff','#ffd600','#aa00ff','#ff6d00'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 2 + 's';
    piece.style.animationDuration = (2 + Math.random() * 2) + 's';
    piece.style.width = (6 + Math.random() * 6) + 'px';
    piece.style.height = (6 + Math.random() * 6) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    container.appendChild(piece);
  }
}

function playAgain() {
  document.getElementById('match-end-overlay').classList.add('hidden');
  document.getElementById('game-view').classList.add('hidden');
  cleanupGame();
  openChallengeModal();
}

function exitGame() {
  document.getElementById('match-end-overlay').classList.add('hidden');
  document.getElementById('game-view').classList.add('hidden');
  cleanupGame();
}

function cleanupGame() {
  GAME.active = false;
  clearInterval(GAME.timerInterval);
  clearTimeout(GAME.botInterval);
  clearInterval(GAME.tickInterval);
  if (GAME.playerChart) { GAME.playerChart.remove(); GAME.playerChart = null; }
  if (GAME.botChart) { GAME.botChart.remove(); GAME.botChart = null; }
  botState = { lastPrice: 0, gridLevels: [], lastTradePrice: 0, trend: 0, priceHistory: [] };
}

// ============================================================
// === TOKEN ECONOMY ENGINE ===================================
// ============================================================
const TokenEconomy = (() => {
  const STORE_KEY = 'incentives-token-economy';
  const STARTING_BALANCE = 10000;

  // Achievement definitions
  const ACHIEVEMENTS = {
    first_trade:      { name: 'First Trade',         icon: '📈', desc: 'Place your first trade', reward: 10 },
    five_trades:      { name: 'Getting Started',     icon: '🔥', desc: 'Complete 5 trades', reward: 25, target: 5, track: 'tradeCount' },
    twenty_trades:    { name: 'Active Trader',       icon: '💪', desc: 'Complete 20 trades', reward: 50, target: 20, track: 'tradeCount' },
    all_order_types:  { name: 'Order Master',        icon: '🎯', desc: 'Use all order types (market, limit, stop-loss)', reward: 30 },
    setup_bot:        { name: 'Bot Builder',         icon: '🤖', desc: 'Set up a trading bot', reward: 20 },
    ask_10_questions: { name: 'Curious Mind',        icon: '❓', desc: 'Ask Mentor 10 questions', reward: 15, target: 10, track: 'mentorQuestions' },
    first_challenge:  { name: 'Challenger',          icon: '⚔️', desc: 'Play your first bot challenge', reward: 20 },
    first_win:        { name: 'First Victory',       icon: '🏆', desc: 'Win your first bot challenge', reward: 50 },
    beat_easy:        { name: 'Easy Win',            icon: '🟢', desc: 'Beat bot on Easy', reward: 25 },
    beat_medium:      { name: 'Medium Master',       icon: '🟡', desc: 'Beat bot on Medium', reward: 75 },
    beat_hard:        { name: 'Hard Dominator',      icon: '🔴', desc: 'Beat bot on Hard', reward: 200 },
  };

  // Shop items
  const SHOP_ITEMS = [
    { id: 'adv_indicators',  name: 'Advanced Chart Indicators', desc: 'RSI, MACD, Bollinger Bands & more', icon: '📊', cost: 200 },
    { id: 'extra_pairs',     name: 'Extra Trading Pairs',       desc: 'Unlock additional trading pairs',   icon: '💱', cost: 150 },
    { id: 'extreme_bot',     name: 'Extreme Bot Difficulty',    desc: 'The ultimate bot challenge',        icon: '💀', cost: 500 },
    { id: 'theme_neon',      name: 'Neon Theme',                desc: 'Cyberpunk-style neon theme',        icon: '🌈', cost: 100 },
    { id: 'theme_gold',      name: 'Gold Theme',                desc: 'Luxurious gold accent theme',       icon: '✨', cost: 100 },
  ];

  // Competition entry fees
  const ENTRY_FEES = { casual: 50, ranked: 100, tournament: 250 };
  const TOURNAMENT_SPLITS = [0.60, 0.25, 0.15];

  // State
  let data = null;
  let popupQueue = [];
  let showingPopup = false;
  let currentTxnFilter = 'all';

  function defaultData() {
    return {
      balance: STARTING_BALANCE,
      totalEarned: 0,
      achievements: {},        // { id: true }
      progress: { tradeCount: 0, mentorQuestions: 0, orderTypesUsed: {}, challengesPlayed: 0, challengesWon: 0, dailyWinDate: null },
      transactions: [],        // { date, type:'earned'|'spent', amount, desc, balance }
      unlockedFeatures: {},    // { id: true }
      wallet: null,            // { address, connected: true }
      welcomed: false,
    };
  }

  function load() {
    const raw = localStorage.getItem(STORE_KEY);
    data = raw ? JSON.parse(raw) : defaultData();
    if (!data.progress) data.progress = defaultData().progress;
    if (!data.unlockedFeatures) data.unlockedFeatures = {};
    if (!data.transactions) data.transactions = [];
    if (!data.totalBurned) data.totalBurned = 0;
    
    // One-time balance boost for agent deployment testing
    if (!data.agentDeploymentBoost && data.balance < 5000) {
      data.balance = Math.max(data.balance, 10000);
      data.agentDeploymentBoost = true;
      data.transactions.unshift({ 
        date: new Date().toISOString(), 
        type: 'earned', 
        amount: 10000 - (data.balance - 10000), 
        desc: 'Agent deployment system bonus', 
        balance: data.balance 
      });
      save();
    }
  }

  function save() { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }

  // --- Balance ---
  function getBalance() { return data.balance; }

  function earn(amount, desc) {
    data.balance += amount;
    data.totalEarned += amount;
    data.transactions.unshift({ date: new Date().toISOString(), type: 'earned', amount, desc, balance: data.balance });
    save();
    updateBalanceUI('earned');
  }

  function spend(amount, desc) {
    if (data.balance < amount) return false;
    data.balance -= amount;
    data.transactions.unshift({ date: new Date().toISOString(), type: 'spent', amount, desc, balance: data.balance });
    save();
    updateBalanceUI('spent');
    return true;
  }

  function canAfford(amount) { return data.balance >= amount; }

  // --- UI Updates ---
  function updateBalanceUI(anim) {
    const el = document.getElementById('incv-amount');
    if (el) {
      el.textContent = Math.floor(data.balance).toLocaleString();
      if (anim) {
        el.classList.remove('bal-earned', 'bal-spent');
        void el.offsetWidth; // reflow
        el.classList.add(anim === 'earned' ? 'bal-earned' : 'bal-spent');
      }
    }
    // Update wallet balance displays
    const wBal = document.getElementById('wallet-bal');
    if (wBal) wBal.textContent = Math.floor(data.balance).toLocaleString();
    const wdBal = document.getElementById('wd-incv-bal');
    if (wdBal) wdBal.textContent = Math.floor(data.balance).toLocaleString() + ' 💎';
    const shopBal = document.getElementById('shop-balance');
    if (shopBal) shopBal.textContent = Math.floor(data.balance).toLocaleString();
  }

  // --- Achievement Popup ---
  function showAchievementPopup(achId) {
    const ach = ACHIEVEMENTS[achId];
    if (!ach) return;
    popupQueue.push(ach);
    if (!showingPopup) processPopupQueue();
  }

  function processPopupQueue() {
    if (!popupQueue.length) { showingPopup = false; return; }
    showingPopup = true;
    const ach = popupQueue.shift();
    const container = document.getElementById('achievement-popup-container');
    const div = document.createElement('div');
    div.className = 'achievement-popup';
    div.innerHTML = `
      <div class="ach-popup-icon">${ach.icon}</div>
      <div class="ach-popup-info">
        <div class="ach-popup-title">🎉 Achievement Unlocked!</div>
        <div class="ach-popup-desc">${ach.name}</div>
        <div class="ach-popup-reward">+${ach.reward} INCENTIVES</div>
      </div>`;
    container.appendChild(div);
    setTimeout(() => {
      div.classList.add('dismissing');
      setTimeout(() => { div.remove(); processPopupQueue(); }, 300);
    }, 3000);
  }

  // --- Achievement Checking ---
  function unlockAchievement(id) {
    if (data.achievements[id]) return;
    data.achievements[id] = true;
    const ach = ACHIEVEMENTS[id];
    earn(ach.reward, `Achievement: ${ach.name}`);
    save();
    showAchievementPopup(id);
  }

  function checkProgressAchievements() {
    const p = data.progress;
    if (p.tradeCount >= 1) unlockAchievement('first_trade');
    if (p.tradeCount >= 5) unlockAchievement('five_trades');
    if (p.tradeCount >= 20) unlockAchievement('twenty_trades');
    if (p.mentorQuestions >= 10) unlockAchievement('ask_10_questions');
    const types = Object.keys(p.orderTypesUsed || {});
    if (types.includes('market') && types.includes('limit') && types.includes('stop')) unlockAchievement('all_order_types');
  }

  // Public tracking hooks
  function trackTrade(orderType) {
    data.progress.tradeCount++;
    if (orderType) data.progress.orderTypesUsed[orderType] = true;
    save();
    checkProgressAchievements();
  }

  function trackMentorQuestion() {
    data.progress.mentorQuestions++;
    save();
    checkProgressAchievements();
  }

  function trackBotSetup() {
    unlockAchievement('setup_bot');
  }

  function trackChallengeStart() {
    data.progress.challengesPlayed++;
    save();
    unlockAchievement('first_challenge');
  }

  function trackChallengeEnd(playerWins, difficulty, playerVal, botVal) {
    if (!playerWins) return { total: 0, breakdown: [] };

    const breakdown = [];
    let total = 0;

    // Difficulty rewards
    const diffRewards = { easy: 25, medium: 75, hard: 200 };
    const base = diffRewards[difficulty] || 25;

    // Daily bonus check
    const today = new Date().toDateString();
    let multiplier = 1;
    if (data.progress.dailyWinDate !== today) {
      multiplier = 2;
      data.progress.dailyWinDate = today;
    }

    const baseReward = base * multiplier;
    breakdown.push(`+${baseReward} INCENTIVES (${difficulty.charAt(0).toUpperCase()+difficulty.slice(1)} Win${multiplier === 2 ? ' - 2x Daily Bonus!' : ''})`);
    total += baseReward;

    // Margin bonus
    const margin = ((playerVal - botVal) / botVal) * 100;
    if (margin >= 10) {
      breakdown.push(`+50 INCENTIVES (10%+ margin bonus)`);
      total += 50;
    }

    // Award
    earn(total, `Bot Challenge Win (${difficulty})`);

    // Achievement unlocks
    data.progress.challengesWon++;
    unlockAchievement('first_win');
    if (difficulty === 'easy') unlockAchievement('beat_easy');
    if (difficulty === 'medium') unlockAchievement('beat_medium');
    if (difficulty === 'hard') unlockAchievement('beat_hard');
    save();

    return { total, breakdown };
  }

  // --- Burn Tracking ---
  if (!data.totalBurned) data.totalBurned = 0;

  function burnTokens(amount, reason) {
    data.totalBurned += amount;
    data.transactions.unshift({ date: new Date().toISOString(), type: 'burned', amount, desc: `🔥 Burned: ${reason}`, balance: data.balance });
    save();
    const burnEl = document.getElementById('total-burned');
    if (burnEl) burnEl.textContent = Math.floor(data.totalBurned).toLocaleString();
  }

  function getTotalBurned() { return data.totalBurned || 0; }

  // --- Competition Entry ---
  const BURN_RATE = 0.05; // 5% of entry fees burned

  function payEntryFee(type) {
    const fee = ENTRY_FEES[type];
    if (!fee) return true;
    if (!canAfford(fee)) return false;
    const burnAmount = fee * BURN_RATE;
    spend(fee, `${type.charAt(0).toUpperCase()+type.slice(1)} match entry fee`);
    burnTokens(burnAmount, `5% of ${type} entry fee (${fee} INCENTIVES)`);
    return true;
  }

  function calculatePrizePool(entries, type) {
    const fee = ENTRY_FEES[type] || 50;
    return entries * fee * (1 - BURN_RATE) * 0.9; // 5% burned, 10% platform fee, 85% to winners
  }

  // --- Shop ---
  function purchaseItem(id) {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item || data.unlockedFeatures[id]) return false;
    if (!spend(item.cost, `Purchased: ${item.name}`)) return false;
    data.unlockedFeatures[id] = true;
    save();
    renderShop();
    return true;
  }

  function isFeatureUnlocked(id) { return !!data.unlockedFeatures[id]; }

  // --- Wallet (simulated) ---
  // TODO: Replace with real Solana wallet adapter (e.g. @solana/wallet-adapter)
  function connectWallet() {
    // Simulated: generate a fake Solana-style address
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let addr = '';
    for (let i = 0; i < 44; i++) addr += chars[Math.floor(Math.random() * chars.length)];
    data.wallet = { address: addr, connected: true };
    save();
    updateWalletUI();
  }

  function disconnectWallet() {
    data.wallet = null;
    save();
    updateWalletUI();
    document.getElementById('wallet-dropdown').classList.add('hidden');
  }

  function updateWalletUI() {
    const connBtn = document.getElementById('connect-wallet-btn');
    const connDiv = document.getElementById('wallet-connected');
    if (data.wallet && data.wallet.connected) {
      connBtn.classList.add('hidden');
      connDiv.classList.remove('hidden');
      const addr = data.wallet.address;
      document.getElementById('wallet-addr-short').textContent = addr.slice(0,4) + '...' + addr.slice(-4);
      document.getElementById('wallet-bal').textContent = Math.floor(data.balance).toLocaleString();
      document.getElementById('wd-full-addr').textContent = addr.slice(0,8) + '...' + addr.slice(-8);
      document.getElementById('wd-incv-bal').textContent = Math.floor(data.balance).toLocaleString() + ' 💎';
    } else {
      connBtn.classList.remove('hidden');
      connDiv.classList.add('hidden');
    }
  }

  function toggleWallet() {
    if (data.wallet && data.wallet.connected) {
      toggleWalletDropdown();
    } else {
      connectWallet();
    }
  }

  function toggleWalletDropdown() {
    document.getElementById('wallet-dropdown').classList.toggle('hidden');
  }

  // --- Panels ---
  function toggleAchievements() {
    const el = document.getElementById('achievements-overlay');
    el.classList.toggle('hidden');
    if (!el.classList.contains('hidden')) renderAchievements();
  }

  function renderAchievements() {
    const grid = document.getElementById('achievements-grid');
    document.getElementById('ap-total-earned').textContent = Math.floor(data.totalEarned).toLocaleString();
    grid.innerHTML = Object.entries(ACHIEVEMENTS).map(([id, ach]) => {
      const unlocked = !!data.achievements[id];
      let progressHTML = '';
      if (ach.track && ach.target && !unlocked) {
        const cur = data.progress[ach.track] || 0;
        const pct = Math.min(100, (cur / ach.target) * 100);
        progressHTML = `<div class="ach-progress"><div class="ach-progress-fill" style="width:${pct}%"></div></div>
          <div class="ach-progress-text">${cur}/${ach.target}</div>`;
      }
      return `<div class="ach-card ${unlocked ? 'unlocked' : 'locked'}">
        <div class="ach-card-icon">${ach.icon}</div>
        <div class="ach-card-name">${ach.name}</div>
        <div class="ach-card-desc">${ach.desc}</div>
        <div class="ach-card-reward">+${ach.reward} 💎</div>
        ${progressHTML}
      </div>`;
    }).join('');
  }

  function toggleShop() {
    const el = document.getElementById('shop-overlay');
    el.classList.toggle('hidden');
    if (!el.classList.contains('hidden')) renderShop();
  }

  function renderShop() {
    document.getElementById('shop-balance').textContent = Math.floor(data.balance).toLocaleString();
    const container = document.getElementById('shop-items');
    container.innerHTML = SHOP_ITEMS.map(item => {
      const owned = !!data.unlockedFeatures[item.id];
      const affordable = data.balance >= item.cost;
      let btnHTML;
      if (owned) btnHTML = `<button class="shop-item-btn owned-btn" disabled>✓ Owned</button>`;
      else if (!affordable) btnHTML = `<button class="shop-item-btn" disabled>${item.cost} 💎</button>`;
      else btnHTML = `<button class="shop-item-btn" onclick="TokenEconomy.purchaseItem('${item.id}')">${item.cost} 💎</button>`;
      return `<div class="shop-item ${owned ? 'owned' : ''}">
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-info"><div class="shop-item-name">${item.name}</div><div class="shop-item-desc">${item.desc}</div></div>
        ${btnHTML}
      </div>`;
    }).join('');
  }

  function toggleTransactions() {
    const el = document.getElementById('txn-overlay');
    el.classList.toggle('hidden');
    if (!el.classList.contains('hidden')) renderTransactions();
  }

  function filterTxns(filter, btn) {
    currentTxnFilter = filter;
    document.querySelectorAll('.txn-filter').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderTransactions();
  }

  function renderTransactions() {
    const list = document.getElementById('txn-list');
    let txns = data.transactions;
    if (currentTxnFilter !== 'all') txns = txns.filter(t => t.type === currentTxnFilter);
    if (!txns.length) { list.innerHTML = '<p class="muted">No transactions yet</p>'; return; }
    list.innerHTML = txns.slice(0, 100).map(t => {
      const d = new Date(t.date);
      const dateStr = d.toLocaleDateString(undefined, { month:'short', day:'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' });
      return `<div class="txn-row">
        <div class="txn-date">${dateStr}</div>
        <div class="txn-type ${t.type}">${t.type === 'earned' ? '▲ EARN' : '▼ SPEND'}</div>
        <div class="txn-desc">${t.desc}</div>
        <div class="txn-amount ${t.type === 'earned' ? 'pos' : 'neg'}">${t.type === 'earned' ? '+' : '-'}${t.amount}</div>
        <div class="txn-bal">${Math.floor(t.balance)}</div>
      </div>`;
    }).join('');
  }

  // --- Welcome ---
  function showWelcome() {
    if (data.welcomed) return;
    data.welcomed = true;
    save();
    const div = document.createElement('div');
    div.className = 'welcome-banner';
    div.innerHTML = `
      <h2>Welcome to Incentives! 🎮</h2>
      <p>Here's your welcome bonus:</p>
      <div class="wb-amount">500 INCENTIVES 💎</div>
      <p style="font-size:12px;color:var(--muted)">Earn more by trading, completing achievements, and winning challenges!</p>
      <button onclick="this.parentElement.remove()">Let's Go! 🚀</button>`;
    document.body.appendChild(div);
    // Log the welcome bonus as a transaction
    data.transactions.unshift({ date: new Date().toISOString(), type: 'earned', amount: 500, desc: 'Welcome Bonus', balance: data.balance });
    save();
  }

  // --- Match End Rewards UI ---
  function renderMatchRewards(rewardsData) {
    if (!rewardsData || rewardsData.total === 0) return '';
    return `<div class="me-rewards">
      <div class="me-rewards-title">💎 INCENTIVES Earned</div>
      ${rewardsData.breakdown.map(l => `<div class="me-rewards-line">${l}</div>`).join('')}
      <div class="me-rewards-total">= ${rewardsData.total} INCENTIVES</div>
    </div>`;
  }

  // --- Init ---
  function init() {
    load();
    updateBalanceUI();
    updateWalletUI();
    showWelcome();
  }

  return {
    init, getBalance, earn, spend, canAfford, save, load,
    trackTrade, trackMentorQuestion, trackBotSetup, trackChallengeStart, trackChallengeEnd,
    payEntryFee, calculatePrizePool, purchaseItem, isFeatureUnlocked,
    toggleWallet, toggleWalletDropdown, disconnectWallet,
    toggleAchievements, toggleShop, toggleTransactions, filterTxns,
    renderMatchRewards, updateBalanceUI,
    payEntryFee, calculatePrizePool, purchaseItem, isFeatureUnlocked,
    burnTokens, getTotalBurned,
    ENTRY_FEES, TOURNAMENT_SPLITS,
  };
})();

// === HELP CENTER ===
function toggleHelpCenter() {
  const el = document.getElementById('help-center');
  el.classList.toggle('hidden');
  if (!el.classList.contains('hidden')) {
    const burnEl = document.getElementById('total-burned');
    if (burnEl) burnEl.textContent = Math.floor(TokenEconomy.getTotalBurned()).toLocaleString();
  }
}

function filterHelp(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('.help-section').forEach(s => {
    const searchText = (s.getAttribute('data-search') || '') + ' ' + s.textContent.toLowerCase();
    s.classList.toggle('hidden-section', q.length > 0 && !searchText.includes(q));
  });
}
