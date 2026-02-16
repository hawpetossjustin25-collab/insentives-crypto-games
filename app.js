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
  // Return cached candles if they exist and have enough data
  // (candles are timeframe-specific via the key, so each tf gets its own set)
  if (ss.candles[key] && ss.candles[key].length > 50) return ss.candles[key];
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
  const floatBtn = document.getElementById('radio-float-btn');
  if (radioOn) {
    if (container) container.classList.add('radio-on');
    if (btn) { btn.textContent = 'ON'; btn.style.color = '#00ff41'; btn.style.borderColor = '#00ff41'; }
    if (floatBtn) floatBtn.classList.add('radio-active');
    radioTickerItems = [generateRadioHeadline(), generateRadioHeadline(), generateRadioHeadline()];
    const ticker = document.getElementById('radio-ticker');
    if (ticker) ticker.textContent = radioTickerItems.join('  ///  ');
    radioInterval = setInterval(updateRadioTicker, 6000);
  } else {
    if (container) container.classList.remove('radio-on');
    if (btn) { btn.textContent = 'OFF'; btn.style.color = '#ff4444'; btn.style.borderColor = '#333'; }
    if (floatBtn) floatBtn.classList.remove('radio-active');
    if (radioInterval) clearInterval(radioInterval);
    radioInterval = null;
  }
}

function setupRadio() {
  const muteBtn = document.getElementById('radio-mute');
  if (muteBtn) {
    muteBtn.onclick = function() {
      const vol = document.getElementById('radio-vol');
      if (parseInt(vol.value) > 0) { vol.dataset.prev = vol.value; vol.value = 0; this.textContent = '🔇'; }
      else { vol.value = vol.dataset.prev || 50; this.textContent = '🔊'; }
    };
  }
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
      if (key === 'notifications' && settings[key]) requestNotificationPermission();
      if (key === 'soundEffects' && settings[key]) playSound('click');
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
  // Show loading indicator on chart
  const container = document.getElementById('chart-container');
  let loader = document.getElementById('chart-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'chart-loader';
    loader.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;color:var(--muted);font-size:14px;pointer-events:none;';
    container.style.position = 'relative';
    container.appendChild(loader);
  }
  loader.textContent = '⏳ Loading...';
  loader.style.display = 'block';

  const candles = await fetchCandles(tf);
  loader.style.display = 'none';
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
  playSound('trade');
  sendNotification(`Trade Executed`, `${side.toUpperCase()} ${amount.toFixed(4)} ${PAIRS[pair].symbol} at ${cs()}${price.toFixed(PAIRS[pair].decimals)}`);
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

// === AGENT DEPLOYMENT ===
const DEPLOYED_AGENTS = JSON.parse(localStorage.getItem('incentives-deployed-agents') || '{}');

function deployAgent(botType) {
  try {
    const card = document.querySelector(`.gp-deploy-card[data-bot="${botType}"]`);
    const amountSelect = card.querySelector('.gp-deploy-amount');
    const deployAmount = parseInt(amountSelect.value);
    const incentivesCost = parseInt(amountSelect.selectedOptions[0].textContent.match(/\((\d+,?\d*) 💎\)/)[1].replace(',', ''));
    
    // Check if user has enough INCENTIVES tokens
    const currentBalance = TokenEconomy.getBalance();
    if (currentBalance < incentivesCost) {
      showNotification('❌ Insufficient INCENTIVES tokens', 'error');
      return;
    }
    
    // Check if already deployed
    if (DEPLOYED_AGENTS[botType]) {
      showNotification('⚠️ Agent already deployed', 'warning');
      return;
    }
    
    // Deduct tokens
    TokenEconomy.spendTokens(incentivesCost, 'agent-deployment');
    
    // Create deployed agent
    const agent = {
      botType: botType,
      deployedAmount: deployAmount,
      costTokens: incentivesCost,
      deployedAt: Date.now(),
      status: 'active',
      totalPL: 0,
      trades: 0,
      walletAddress: generateMockWalletAddress()
    };
    
    DEPLOYED_AGENTS[botType] = agent;
    localStorage.setItem('incentives-deployed-agents', JSON.stringify(DEPLOYED_AGENTS));
    
    // Update UI
    updateDeployedAgentsUI();
    
    // Show success
    showNotification(`🚀 ${getBotName(botType)} deployed with $${deployAmount}!`, 'success');
    
    // Start mock trading after 5 seconds
    setTimeout(() => startMockAgentTrading(botType), 5000);
    
  } catch (error) {
    console.error('Deploy agent error:', error);
    showNotification('❌ Deployment failed', 'error');
  }
}

function updateDeployedAgentsUI() {
  Object.keys(DEPLOYED_AGENTS).forEach(botType => {
    const agent = DEPLOYED_AGENTS[botType];
    const statusEl = document.getElementById(`${botType}-agent-status`);
    const deployBtn = document.querySelector(`.gp-deploy-card[data-bot="${botType}"] .gp-deploy-btn`);
    const card = document.querySelector(`.gp-deploy-card[data-bot="${botType}"]`);
    
    if (agent.status === 'active') {
      card.setAttribute('data-deployed', 'true');
      deployBtn.disabled = true;
      deployBtn.textContent = '✅ Deployed';
      
      const pl = agent.totalPL;
      const plText = pl >= 0 ? `+$${pl.toFixed(2)}` : `-$${Math.abs(pl).toFixed(2)}`;
      const plClass = pl >= 0 ? 'status-profit' : 'status-loss';
      statusEl.innerHTML = `💼 $${agent.deployedAmount} • ${agent.trades} trades • <span class="${plClass}">${plText}</span>`;
      statusEl.className = 'gp-deploy-status status-active';
    }
  });
}

function startMockAgentTrading(botType) {
  if (!DEPLOYED_AGENTS[botType]) return;
  
  // Simulate trading every 2-8 minutes
  const interval = 120000 + Math.random() * 360000; // 2-8 min
  
  setTimeout(() => {
    simulateAgentTrade(botType);
    startMockAgentTrading(botType); // Recurse
  }, interval);
}

function simulateAgentTrade(botType) {
  const agent = DEPLOYED_AGENTS[botType];
  if (!agent || agent.status !== 'active') return;
  
  // Generate mock trade based on bot strategy
  let profitChance, avgProfit;
  
  switch (botType) {
    case 'scalp':
      profitChance = 0.65; // 65% win rate
      avgProfit = agent.deployedAmount * 0.003; // 0.3% avg
      break;
    case 'dip':
      profitChance = 0.58; // 58% win rate  
      avgProfit = agent.deployedAmount * 0.008; // 0.8% avg
      break;
    case 'grid':
      profitChance = 0.70; // 70% win rate
      avgProfit = agent.deployedAmount * 0.005; // 0.5% avg
      break;
    default:
      profitChance = 0.60;
      avgProfit = agent.deployedAmount * 0.005;
  }
  
  const isWin = Math.random() < profitChance;
  const tradeResult = isWin ? 
    avgProfit * (0.5 + Math.random()) : 
    -avgProfit * (0.3 + Math.random() * 0.7);
  
  // Update agent stats
  agent.totalPL += tradeResult;
  agent.trades += 1;
  
  // Update storage
  DEPLOYED_AGENTS[botType] = agent;
  localStorage.setItem('incentives-deployed-agents', JSON.stringify(DEPLOYED_AGENTS));
  
  // Update UI
  updateDeployedAgentsUI();
  
  // Notification for significant trades
  if (Math.abs(tradeResult) > agent.deployedAmount * 0.01) {
    const botName = getBotName(botType);
    const result = tradeResult >= 0 ? `+$${tradeResult.toFixed(2)}` : `-$${Math.abs(tradeResult).toFixed(2)}`;
    showNotification(`${getAgentIcon(botType)} ${botName}: ${result}`, tradeResult >= 0 ? 'success' : 'warning');
  }
}

function getBotName(botType) {
  const names = { scalp: 'Scalping Agent', dip: 'Dip Buying Agent', grid: 'Grid Trading Agent' };
  return names[botType] || 'Trading Agent';
}

function getAgentIcon(botType) {
  const icons = { scalp: '⚡', dip: '📉', grid: '📊' };
  return icons[botType] || '🤖';
}

function generateMockWalletAddress() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
  document.getElementById('mentor-send').onclick = () => sendMentorMsg();
  document.getElementById('mentor-input').onkeydown = e => { if (e.key === 'Enter') sendMentorMsg(); };
  document.getElementById('mentor-voice').onclick = () => alert('Voice call coming in Phase 2!');

  // Quick reply buttons
  document.querySelectorAll('.quick-reply-btn').forEach(btn => {
    btn.onclick = () => {
      const query = btn.dataset.query;
      const queryMap = {
        'market-analysis': 'What\'s the current market price and analysis?',
        'trading-tips': 'Give me some trading strategy tips',
        'explain-pl': 'Explain my P/L and portfolio',
        'whats-hot': 'What\'s hot and trending right now?',
      };
      sendMentorMsg(queryMap[query] || query);
    };
  });

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
    if (e.key === 'Escape') { closeChallengeModal(); closeSettings(); closeShareModal(); }
    if (e.key >= '1' && e.key <= '6') {
      const btns = document.querySelectorAll('.tf-btn');
      const idx = parseInt(e.key) - 1;
      if (btns[idx]) btns[idx].click();
    }
  });
}

// === MENTOR (contextual AI) ===
function getMentorResponse(text) {
  const lower = text.toLowerCase();
  const info = pairInfo();
  const sym = info.symbol;
  const held = state.holdings[sym] || 0;
  const portfolio = state.balance + Object.entries(state.holdings).reduce((sum, [s, h]) => {
    if (s === sym) return sum + h * currentPrice;
    return sum + h * (state.costBases[s] || 0);
  }, 0);
  const pl = portfolio - 10000;

  // === Nova command detection: Radio controls ===
  if (/\b(turn on radio|radio on)\b/i.test(lower)) {
    if (!radioOn) toggleRadio();
    return "Done! Radio is now on 📻 Tune in for live market updates!";
  }
  if (/\b(turn off radio|radio off)\b/i.test(lower)) {
    if (radioOn) toggleRadio();
    return "Radio turned off 📻🔇";
  }
  if (/\b(volume up|turn up)\b/i.test(lower)) {
    const vol = document.getElementById('radio-vol');
    if (vol) { vol.value = Math.min(100, parseInt(vol.value) + 20); }
    return `Volume up! 🔊 Now at ${vol ? vol.value : '?'}%`;
  }
  if (/\b(volume down|turn down)\b/i.test(lower)) {
    const vol = document.getElementById('radio-vol');
    if (vol) { vol.value = Math.max(0, parseInt(vol.value) - 20); }
    return `Volume down 🔉 Now at ${vol ? vol.value : '?'}%`;
  }

  // === Nova command detection: Execute trades ===
  const buyMatch = lower.match(/\bbuy\s+(?:(\d+(?:\.\d+)?)\s+)?(\w+)?\b/);
  if (buyMatch && !/\b(advice|tip|should|when|how)\b/i.test(lower)) {
    const amt = parseFloat(buyMatch[1]) || 100;
    const assetHint = buyMatch[2] || '';
    if (currentPrice > 0) {
      const usdAmt = amt;
      const ethAmt = usdAmt / currentPrice;
      const fee = usdAmt * 0.001;
      if (usdAmt + fee <= state.balance) {
        executeTrade('buy', currentPrice, usdAmt, ethAmt, fee, 'manual', currentPair);
        return `Bought $${usdAmt.toFixed(2)} of ${sym} at ${cs()}${currentPrice.toFixed(info.decimals)}! 📈`;
      } else {
        return `Insufficient balance! You have ${cs()}${state.balance.toFixed(2)} but need ${cs()}${(usdAmt+fee).toFixed(2)}.`;
      }
    }
    return "Can't execute trade right now — price not available. Try again in a moment!";
  }
  const sellMatch = lower.match(/\bsell\s+(?:(\d+(?:\.\d+)?)\s+)?(\w+)?\b/);
  if (sellMatch && !/\b(advice|tip|should|when|how)\b/i.test(lower)) {
    const amt = parseFloat(sellMatch[1]) || 0;
    const held = state.holdings[sym] || 0;
    if (currentPrice > 0 && held > 0) {
      const sellAmt = amt > 0 ? Math.min(amt / currentPrice, held) : held;
      const usdAmt = sellAmt * currentPrice;
      const fee = usdAmt * 0.001;
      executeTrade('sell', currentPrice, usdAmt, sellAmt, fee, 'manual', currentPair);
      return `Sold ${sellAmt.toFixed(4)} ${sym} at ${cs()}${currentPrice.toFixed(info.decimals)} for ${cs()}${usdAmt.toFixed(2)}! 📉`;
    }
    if (held <= 0) return `You don't hold any ${sym} to sell!`;
    return "Can't execute trade right now — price not available.";
  }

  // Greetings
  if (/^(hi|hello|hey|sup|yo|howdy|greetings)\b/i.test(lower)) {
    return `Hey there! 👋 I'm Nova, your trading mentor. ${currentPrice > 0 ? `${sym} is at ${cs()}${currentPrice.toFixed(info.decimals)} right now.` : ''} How can I help you today?`;
  }
  // Help
  if (/\b(help|what can you|how do i|tutorial|guide|getting started)\b/i.test(lower)) {
    return `Here's what I can help with:\n📊 **Market Analysis** — current price action & trends\n💡 **Trading Tips** — strategies for beginners & advanced\n📈 **P/L Explanation** — understand your profits/losses\n🔥 **What's Hot** — trending pairs & opportunities\n\nJust ask, or use the quick reply buttons below! 🎯`;
  }
  // Buy advice
  if (/\b(buy|long|accumulate|enter|entry)\b/i.test(lower)) {
    if (currentPrice > 0) {
      return `Thinking about buying ${sym}? Current price: ${cs()}${currentPrice.toFixed(info.decimals)}. 📊\n\n💡 Tips:\n• Don't go all-in — use the 25% or 50% buttons\n• Set a stop-loss to limit downside risk\n• Consider DCA if you're unsure about timing\n• Your available balance: ${cs()}${state.balance.toFixed(2)}`;
    }
    return `Before buying, always check the chart for support levels and set a stop-loss! Never risk more than 2-5% of your portfolio on a single trade. 🎯`;
  }
  // Sell advice
  if (/\b(sell|short|exit|take profit|tp)\b/i.test(lower)) {
    if (held > 0) {
      const value = held * currentPrice;
      const basis = state.costBases[sym] || 0;
      const tradePL = basis > 0 ? ((currentPrice - basis) / basis * 100).toFixed(1) : '?';
      return `You're holding ${held.toFixed(4)} ${sym} (worth ${cs()}${value.toFixed(2)}). Your avg cost: ${cs()}${basis.toFixed(info.decimals)} (${tradePL}% P/L).\n\n💡 Consider:\n• Taking partial profits (sell 25-50%)\n• Setting a trailing stop to lock in gains\n• Keep some for potential further upside`;
    }
    return `You don't currently hold any ${sym}. You need to buy first before selling! 📊`;
  }
  // Strategy
  if (/\b(strategy|strategies|approach|method|plan)\b/i.test(lower)) {
    return `Here are some popular strategies:\n\n📊 **Grid Trading** — Set buy/sell orders at intervals. Great for ranging markets.\n📉 **DCA** — Buy fixed $ amounts regularly. Reduces timing risk.\n⚡ **Scalping** — Quick trades on small moves. Needs active monitoring.\n🎯 **Swing Trading** — Hold for days/weeks based on trends.\n\nFor beginners, I recommend DCA or Grid bots — check the Bots tab! 🤖`;
  }
  // Price / market
  if (/\b(price|market|how much|current|what'?s .* at|worth)\b/i.test(lower)) {
    if (currentPrice > 0) {
      return `${info.icon} ${sym} is currently at ${cs()}${currentPrice.toFixed(info.decimals)}.\n\nYour portfolio: ${cs()}${portfolio.toFixed(2)} (${pl >= 0 ? '+' : ''}${cs()}${pl.toFixed(2)} P/L)\nBalance: ${cs()}${state.balance.toFixed(2)}\n${held > 0 ? `Holdings: ${held.toFixed(4)} ${sym}` : 'No holdings in this pair'}`;
    }
    return `I'm still fetching the latest price. Give it a moment and try again! 📡`;
  }
  // P/L explanation
  if (/\b(p\/l|p&l|profit|loss|pnl|explain.*pl|how.*doing)\b/i.test(lower)) {
    return `📈 **Your Portfolio Breakdown:**\nStarting capital: ${cs()}10,000.00\nCurrent value: ${cs()}${portfolio.toFixed(2)}\nTotal P/L: ${pl >= 0 ? '+' : ''}${cs()}${pl.toFixed(2)} (${((pl/10000)*100).toFixed(1)}%)\n\nBalance: ${cs()}${state.balance.toFixed(2)}\n${held > 0 ? `${sym} held: ${held.toFixed(4)} (${cs()}${(held*currentPrice).toFixed(2)})` : 'No current holdings'}\nTotal trades: ${state.tradeHistory.length}`;
  }
  // What's hot
  if (/\b(hot|trending|best|top|movers|pick|recommend)\b/i.test(lower)) {
    const picks = ['SOL is showing strong momentum 🚀', 'BTC ETF inflows remain strong 📈', 'NVDA AI hype continues ⚡', 'INCENTIVES token gaining traction 💎'];
    return `🔥 **What's Hot Right Now:**\n• ${picks[Math.floor(Math.random()*picks.length)]}\n• Volatility is ${Math.random()>0.5?'high — great for scalping!':'moderate — good for grid bots.'}\n• ${info.icon} ${sym} current: ${cs()}${currentPrice.toFixed(info.decimals)}\n\n💡 Remember: "hot" doesn't always mean "buy." Do your own research!`;
  }
  // Risk
  if (/\b(risk|safe|danger|careful|worried|scared|afraid)\b/i.test(lower)) {
    return `⚠️ **Risk Management Tips:**\n• Never invest more than you can afford to lose\n• Use stop-loss orders (the "stop" order type)\n• Don't put more than 5-10% in a single trade\n• Diversify across multiple assets\n• Take profits when you're up — greed kills gains!\n\nYour current exposure: ${held > 0 ? `${((held*currentPrice)/portfolio*100).toFixed(0)}% in ${sym}` : 'None — you\'re all cash'}`;
  }
  // Bot related
  if (/\b(bot|automat|grid|dca|custom bot)\b/i.test(lower)) {
    return `🤖 **Trading Bots:**\nCheck the "Bots" tab to set up automated strategies:\n\n📊 **Grid Bot** — Auto buy low / sell high in a range\n📉 **DCA Bot** — Regular buys at fixed intervals\n⚙️ **Custom Bot** — Build your own with RSI, price triggers, etc.\n\nBots trade with your main balance. Start small to test!`;
  }
  // Challenge / game
  if (/\b(challenge|game|match|compete|battle|vs)\b/i.test(lower)) {
    return `⚔️ **Bot Challenge Mode:**\nClick "Challenge" to compete against an AI trader!\n\n🟢 Easy — Bot makes mistakes, slower trades\n🟡 Medium — Smart grid + dip strategies\n🔴 Hard — Full arsenal, fast & aggressive\n\nWin to earn INCENTIVES tokens! 💎`;
  }

  // Fallback — generic but still useful
  const fallbacks = [
    `That's a great question! In crypto trading, timing and risk management are everything. ${sym} is at ${cs()}${currentPrice.toFixed(info.decimals)} right now. 📊`,
    `Remember: never invest more than you can afford to lose! Start small. Your balance is ${cs()}${state.balance.toFixed(2)}. 💡`,
    `Limit orders can help you get better prices. Try setting one below ${cs()}${currentPrice.toFixed(info.decimals)}! 🎯`,
    `DCA (Dollar Cost Averaging) is a solid strategy for beginners — check out the DCA bot in the Bots tab! 📈`,
    `The market is volatile right now. Consider using stop-loss orders to protect your positions! ⚠️`,
    `Grid bots work best in ranging markets. Look for support and resistance levels on the chart! 🤖`,
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

function sendMentorMsg(queryText) {
  const input = document.getElementById('mentor-input');
  const text = queryText || sanitize(input.value.trim());
  if (!text) return;
  const msgs = document.getElementById('mentor-messages');
  // Only show user message if typed (not quick reply internal query)
  const displayText = queryText || text;
  msgs.innerHTML += `<div class="mentor-msg user">${displayText}</div>`;
  if (!queryText) input.value = '';
  msgs.scrollTop = msgs.scrollHeight;
  novaRemember(text, 'main-chat');
  if (typeof TokenEconomy !== 'undefined') TokenEconomy.trackMentorQuestion();

  // Show typing indicator
  const typing = document.getElementById('mentor-typing');
  if (typing) typing.classList.remove('hidden');

  setTimeout(() => {
    if (typing) typing.classList.add('hidden');
    const response = getMentorResponse(text);
    msgs.innerHTML += `<div class="mentor-msg bot">${response.replace(/\n/g, '<br>')}</div>`;
    msgs.scrollTop = msgs.scrollHeight;
    playSound('notification');
  }, 600 + Math.random() * 800);
}

function toggleMentor() {
  document.getElementById('mentor-body').classList.toggle('hidden');
  document.getElementById('mentor-toggle').textContent = document.getElementById('mentor-body').classList.contains('hidden') ? '▼' : '▲';
}

function closeModal() { closeChallengeModal(); }

// === RESIZABLE GAME PANEL DIVIDER ===
function initGamePanelResize() {
  const divider = document.querySelector('#game-panels .gp-divider');
  const panels = document.getElementById('game-panels');
  const playerPanel = panels.querySelector('.gp-player');
  const botPanel = panels.querySelector('.gp-bot');
  if (!divider || !playerPanel || !botPanel) return;
  let dragging = false, startX = 0, startPlayerW = 0, totalW = 0;
  divider.addEventListener('mousedown', e => {
    dragging = true; startX = e.clientX;
    startPlayerW = playerPanel.getBoundingClientRect().width;
    totalW = panels.clientWidth - divider.offsetWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const newW = Math.max(200, Math.min(totalW - 200, startPlayerW + dx));
    const pct = (newW / totalW) * 100;
    playerPanel.style.flex = 'none';
    botPanel.style.flex = 'none';
    playerPanel.style.width = pct + '%';
    botPanel.style.width = (100 - pct) + '%';
  });
  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
}

// === SOUND EFFECTS (Web Audio API) ===
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playSound(type) {
  if (!settings.soundEffects) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    switch (type) {
      case 'trade':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
        break;
      case 'notification':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        osc.frequency.setValueAtTime(784, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now); osc.stop(now + 0.35);
        break;
      case 'click':
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now); osc.stop(now + 0.05);
        break;
      case 'matchStart':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.3);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
        break;
      case 'matchEnd':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(784, now);
        osc.frequency.setValueAtTime(659, now + 0.15);
        osc.frequency.setValueAtTime(523, now + 0.3);
        osc.frequency.setValueAtTime(392, now + 0.45);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now); osc.stop(now + 0.6);
        break;
      default:
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    }
  } catch (e) { /* audio not available */ }
}

// === BROWSER NOTIFICATIONS ===
function sendNotification(title, body) {
  if (!settings.notifications) return;
  if (Notification.permission === 'granted') {
    try { new Notification(title, { body, icon: '💎' }); } catch(e) {}
  }
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// === INIT ===
async function init() {
  applySettings();
  initChart();
  setupEvents();
  setupSettingsEvents();
  setupRadio();
  initNovaResize();
  setupNovaAcademy();

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
  updateDeployedAgentsUI();
  
  // Start mock trading for any existing deployed agents
  Object.keys(DEPLOYED_AGENTS).forEach(botType => {
    if (DEPLOYED_AGENTS[botType].status === 'active') {
      startMockAgentTrading(botType);
    }
  });
  try { TokenEconomy.init(); } catch(e) { console.error('TokenEconomy init failed:', e); }
}

init().catch(e => console.error('Init error:', e));

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
  // Populate asset selector with optgroups
  const sel = document.getElementById('cm-asset');
  sel.innerHTML = '';
  const catLabels = { crypto: '🪙 Crypto', stock: '📈 Stocks', oil: '🛢️ Oil & Gas', incentives: '💎 Incentives' };
  const catGroups = {};
  Object.entries(PAIRS).forEach(([k, v]) => {
    const cat = v.category || 'crypto';
    if (!catGroups[cat]) catGroups[cat] = [];
    catGroups[cat].push({ key: k, info: v });
  });
  Object.entries(catGroups).forEach(([cat, items]) => {
    const grp = document.createElement('optgroup');
    grp.label = catLabels[cat] || cat;
    items.forEach(({ key, info }) => {
      const opt = document.createElement('option');
      opt.value = key; opt.textContent = `${info.icon} ${info.name}`;
      if (key === currentPair) opt.selected = true;
      grp.appendChild(opt);
    });
    sel.appendChild(grp);
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
  if (isSimulated(GAME.pair)) {
    const ss = getSimState(GAME.pair);
    return ss.price || PAIRS[GAME.pair].simBase;
  }
  // For non-simulated pairs, use game-cached price or currentPrice
  return GAME._livePrice || currentPrice;
}

function gamePortfolioValue(who) {
  return who.balance + who.holdings * getGamePrice();
}

async function startMatch() {
  GAME.pair = document.getElementById('cm-asset').value;
  GAME.duration = +document.querySelector('.cm-dur.active').dataset.dur;
  GAME.difficulty = document.querySelector('.cm-diff.active').dataset.diff;
  GAME.timeRemaining = GAME.duration;
  GAME.active = true;

  // Reset player & bot
  GAME.player = { balance: 10000, holdings: 0, trades: [], orderSide: 'buy', orderType: 'market', openOrders: [] };
  GAME.bot = { balance: 10000, holdings: 0, trades: [], commentary: [] };
  GAME.playerBotBalance = 0;
  GAME.playerBotPL = 0;
  GAME._livePrice = 0;

  closeChallengeModal();
  if (typeof TokenEconomy !== 'undefined') TokenEconomy.trackChallengeStart();
  document.getElementById('game-view').classList.remove('hidden');

  const info = PAIRS[GAME.pair];
  document.getElementById('gs-asset-name').textContent = `${info.icon} ${info.name}`;

  // Ensure we have a valid price before starting
  let price = getGamePrice();
  if (!price || price === 0) {
    try {
      if (isSimulated(GAME.pair)) {
        simTick(GAME.pair);
        price = getSimState(GAME.pair).price;
      } else {
        const savedPair = currentPair;
        currentPair = GAME.pair;
        price = await fetchTicker();
        currentPrice = price; // Store it so getGamePrice() works
        currentPair = savedPair;
      }
      if (!price || price === 0) {
        alert('Could not fetch price for this pair. Please try again or pick a different asset.');
        GAME.active = false;
        document.getElementById('game-view').classList.add('hidden');
        return;
      }
    } catch (e) {
      console.error('Failed to fetch price for match:', e);
      alert('Could not fetch price. Please try again.');
      GAME.active = false;
      document.getElementById('game-view').classList.add('hidden');
      return;
    }
  }

  // Init charts with error handling
  try {
    initGameCharts();
  } catch (e) {
    console.error('Failed to init game charts:', e);
    alert('Chart initialization failed. Please try again.');
    GAME.active = false;
    document.getElementById('game-view').classList.add('hidden');
    return;
  }

  // Set start price
  GAME.startPrice = price;
  updateGameUI();
  playSound('matchStart');
  setupGameEvents();
  initGamePanelResize();

  // Start timer
  GAME.timerInterval = setInterval(gameTick, 1000);

  // Start bot AI
  scheduleBotTrade();

  // Start price feed for game
  GAME.tickInterval = setInterval(async () => {
    if (!GAME.active) return;
    // Ensure price updates for the game pair
    if (isSimulated(GAME.pair)) {
      simTick(GAME.pair);
    } else {
      // Fetch live price for the game's crypto pair
      try {
        const r = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${GAME.pair}`);
        const d = await r.json();
        if (!d.error || !d.error.length) {
          const key = Object.keys(d.result)[0];
          GAME._livePrice = +d.result[key].c[0];
        }
      } catch(e) {}
    }
    const p = getGamePrice();
    updateGameCharts(p);
    checkGameLimitOrders(p);
    updateGameUI();
    updateOrderFlowDisplay();
  }, 2000);

  // Setup game panel tabs, player bots, nova chat
  setupGamePanelTabs();
  setupPlayerBotToggles();
  setupNovaGameChat();
  initNovaResize();

  // Initial bot commentary
  addBotCommentary(`Match started! Trading ${info.symbol} for ${formatDuration(GAME.duration)}. Let's go! 🚀`);

  // Initial Nova message
  addNovaGameMsg('bot', `⚔️ Match started! You vs Bot on ${info.symbol}. ${formatDuration(GAME.duration)} on the clock. Good luck! Use the Bots tab to deploy automated strategies.`);
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

  // Update portfolio tab
  updatePortfolioTab();
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
    const t = b.dataset.type;
    document.getElementById('gp-limit-row').classList.toggle('hidden', t !== 'limit');
    document.getElementById('gp-stop-row').classList.toggle('hidden', t !== 'stop-loss');
    document.getElementById('gp-tp-row').classList.toggle('hidden', t !== 'take-profit');
    document.getElementById('gp-trail-row').classList.toggle('hidden', t !== 'trailing-stop');
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

  const currentP = getGamePrice();
  if (!currentP || currentP <= 0) return;
  const otype = GAME.player.orderType;
  const side = GAME.player.orderSide;
  let triggerPrice;

  if (otype === 'market') {
    triggerPrice = currentP;
  } else if (otype === 'limit') {
    triggerPrice = parseFloat(document.getElementById('gp-limit-price').value);
  } else if (otype === 'stop-loss') {
    triggerPrice = parseFloat(document.getElementById('gp-stop-price').value);
  } else if (otype === 'take-profit') {
    triggerPrice = parseFloat(document.getElementById('gp-tp-price').value);
  } else if (otype === 'trailing-stop') {
    const trailPct = parseFloat(document.getElementById('gp-trail-pct').value);
    if (!trailPct) return;
    const amount = usd / currentP;
    const fee = usd * 0.001;
    GAME.player.openOrders.push({ side, price: currentP, usd, amount, fee, type: 'trailing-stop', trailPct, highSincePlaced: currentP, lowSincePlaced: currentP });
    document.getElementById('gp-order-usd').value = '';
    addBotCommentary(`📋 Player placed trailing stop ${side} (${trailPct}%)`);
    return;
  }

  if (!triggerPrice) return;
  const amount = usd / triggerPrice;
  const fee = usd * 0.001;

  if (otype === 'market') {
    executeGameTrade('player', side, triggerPrice, usd, amount, fee);
    document.getElementById('gp-order-usd').value = '';
  } else {
    GAME.player.openOrders.push({ side, price: triggerPrice, usd, amount, fee, type: otype });
    addBotCommentary(`📋 Player placed ${otype} ${side} @ $${triggerPrice.toFixed(2)}`);
    document.getElementById('gp-order-usd').value = '';
  }
}

function executeGameTrade(who, side, price, usd, amount, fee, source) {
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

  const tradeEntry = { side, price, usd, amount, fee, time: Date.now(), source: source || 'manual' };
  actor.trades.push(tradeEntry);

  // Track player bot-specific P/L
  if (who === 'player' && source && source !== 'manual') {
    if (!GAME.playerBotBalance) GAME.playerBotBalance = 0;
    if (!GAME.playerBotPL) GAME.playerBotPL = 0;
    if (side === 'sell') {
      GAME.playerBotBalance += usd - fee;
      GAME.playerBotPL += usd - fee;
    } else {
      GAME.playerBotBalance -= usd + fee;
      GAME.playerBotPL -= usd + fee;
    }
    updateBotMoneyDisplay();
  }

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

function updateBotMoneyDisplay() {
  const el = document.getElementById('gs-player-bots-val');
  if (el) {
    const val = GAME.playerBotPL || 0;
    el.textContent = `${val >= 0 ? '+' : ''}$${val.toFixed(2)}`;
    el.style.color = val >= 0 ? 'var(--green)' : 'var(--red)';
  }
  const botEl = document.getElementById('gs-bot-bots-val');
  if (botEl) {
    const bPL = gamePortfolioValue(GAME.bot) - 10000;
    botEl.textContent = `${bPL >= 0 ? '+' : ''}$${bPL.toFixed(2)}`;
    botEl.style.color = bPL >= 0 ? 'var(--green)' : 'var(--red)';
  }
}

function checkGameLimitOrders(price) {
  const remaining = [];
  for (const o of GAME.player.openOrders) {
    let fill = false;
    if (o.type === 'limit' && o.side === 'buy' && price <= o.price) fill = true;
    if (o.type === 'limit' && o.side === 'sell' && price >= o.price) fill = true;
    if (o.type === 'stop-loss' && o.side === 'sell' && price <= o.price) fill = true;
    if (o.type === 'stop-loss' && o.side === 'buy' && price >= o.price) fill = true;
    if (o.type === 'take-profit' && o.side === 'sell' && price >= o.price) fill = true;
    if (o.type === 'take-profit' && o.side === 'buy' && price <= o.price) fill = true;
    if (o.type === 'trailing-stop') {
      if (o.side === 'sell') {
        if (price > o.highSincePlaced) o.highSincePlaced = price;
        const dropPct = (o.highSincePlaced - price) / o.highSincePlaced * 100;
        if (dropPct >= o.trailPct) fill = true;
      } else {
        if (price < o.lowSincePlaced) o.lowSincePlaced = price;
        const risePct = (price - o.lowSincePlaced) / o.lowSincePlaced * 100;
        if (risePct >= o.trailPct) fill = true;
      }
    }
    if (fill) {
      executeGameTrade('player', o.side, price, o.usd, o.usd / price, o.fee);
      addBotCommentary(`✅ ${o.type} ${o.side} filled @ $${price.toFixed(2)}`);
    }
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

  // Update strategy display with animated card
  const stratNames = { grid: '📊 Grid Trading', dip: '📉 Dip Buying', scalp: '⚡ Scalp Trading' };
  const stratDetails = {
    grid: `Range: $${(price * 0.96).toFixed(2)} - $${(price * 1.04).toFixed(2)} | Holdings: ${GAME.bot.holdings.toFixed(4)}`,
    dip: `Watching for ${(2).toFixed(1)}%+ dips | Recent high: $${Math.max(...(botState.priceHistory.length ? botState.priceHistory.slice(-10) : [price])).toFixed(2)}`,
    scalp: `Trend: ${(botState.trend * 100).toFixed(2)}% | Quick trades enabled`,
  };
  document.getElementById('gp-bot-strategy-text').textContent = stratNames[strat] || 'Analyzing...';
  document.getElementById('gp-bot-strategy-detail').textContent = stratDetails[strat] || '';
  // Animate strategy card on change
  const card = document.getElementById('gp-bot-strategy-card');
  card.style.animation = 'none';
  card.offsetHeight;
  card.style.animation = 'stratFlash 0.5s ease';
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

  // Sound & notification
  playSound('matchEnd');
  sendNotification('Match Complete!', tie ? 'It\'s a tie!' : playerWins ? `You won! Portfolio: $${pVal.toFixed(2)}` : `Bot wins. Portfolio: $${pVal.toFixed(2)}`);

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
  // Stop player bots
  stopAllPlayerBots();
}

// ============================================================
// === GAME PANEL TABS ========================================
// ============================================================
function setupGamePanelTabs() {
  document.querySelectorAll('.gp-tab').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.gp-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.gp-tab-content').forEach(c => c.classList.add('hidden'));
      const tabId = 'gp-tab-' + btn.dataset.gptab;
      document.getElementById(tabId).classList.remove('hidden');
    };
  });
}

// ============================================================
// === PLAYER TRADING BOTS (Challenge Mode) ===================
// ============================================================
const PLAYER_BOTS = {
  scalp: { active: false, interval: null, priceHistory: [], lastBuyPrice: 0, holding: 0, trades: 0 },
  dip:   { active: false, interval: null, recentHigh: 0, holding: 0, buyPrice: 0, trades: 0 },
  grid:  { active: false, interval: null, upper: 0, lower: 0, holding: 0, trades: 0 },
};

function togglePlayerBot(type) {
  const bot = PLAYER_BOTS[type];
  const checkbox = document.getElementById(`pbot-${type}-toggle`);
  if (checkbox.checked) {
    startPlayerBot(type);
  } else {
    stopPlayerBot(type);
  }
}

function startPlayerBot(type) {
  const bot = PLAYER_BOTS[type];
  if (bot.active || !GAME.active) return;
  bot.active = true;
  bot.holding = 0;
  bot.trades = 0;
  const card = document.getElementById(`pbot-${type}-card`);
  card.classList.add('bot-active');
  updatePlayerBotStatus(type, '🟢 Active');

  const price = getGamePrice();

  switch (type) {
    case 'scalp':
      bot.priceHistory = [price];
      bot.lastBuyPrice = 0;
      bot.interval = setInterval(() => playerScalpTick(), 3000);
      break;
    case 'dip':
      bot.recentHigh = price;
      bot.buyPrice = 0;
      bot.interval = setInterval(() => playerDipTick(), 4000);
      break;
    case 'grid':
      const rangePct = parseFloat(document.getElementById('pbot-grid-range').value) || 2;
      bot.upper = price * (1 + rangePct / 100);
      bot.lower = price * (1 - rangePct / 100);
      bot.interval = setInterval(() => playerGridTick(), 5000);
      break;
  }
}

function stopPlayerBot(type) {
  const bot = PLAYER_BOTS[type];
  bot.active = false;
  if (bot.interval) { clearInterval(bot.interval); bot.interval = null; }
  const card = document.getElementById(`pbot-${type}-card`);
  card.classList.remove('bot-active');
  updatePlayerBotStatus(type, '💤 Idle');
  const checkbox = document.getElementById(`pbot-${type}-toggle`);
  checkbox.checked = false;
}

function stopAllPlayerBots() {
  ['scalp', 'dip', 'grid'].forEach(t => stopPlayerBot(t));
}

function updatePlayerBotStatus(type, text) {
  const el = document.getElementById(`pbot-${type}-status`);
  el.textContent = text;
  el.className = 'gp-bot-card-status' + (text.includes('Active') || text.includes('Trading') ? ' status-trading' : '');
}

function playerBotTrade(side, usd, source) {
  if (!GAME.active) return false;
  const price = getGamePrice();
  if (!price || price <= 0) return false;
  const amount = usd / price;
  const fee = usd * 0.001;
  const result = executeGameTrade('player', side, price, usd, amount, fee, source);
  if (result) {
    addNovaGameMsg('bot', `🤖 Your ${source} bot ${side === 'buy' ? 'bought' : 'sold'} $${usd.toFixed(0)} at $${price.toFixed(2)}`);
  }
  return result;
}

function playerScalpTick() {
  if (!GAME.active || !PLAYER_BOTS.scalp.active) return;
  const bot = PLAYER_BOTS.scalp;
  const price = getGamePrice();
  if (!price || price <= 0) return;
  const profitTarget = parseFloat(document.getElementById('pbot-scalp-profit').value) || 0.3;
  const tradeSize = parseFloat(document.getElementById('pbot-scalp-size').value) || 200;

  bot.priceHistory.push(price);
  if (bot.priceHistory.length > 20) bot.priceHistory.shift();

  if (bot.holding > 0 && bot.lastBuyPrice > 0) {
    const gain = (price - bot.lastBuyPrice) / bot.lastBuyPrice * 100;
    if (gain >= profitTarget) {
      const usd = bot.holding * price;
      if (playerBotTrade('sell', usd, 'Scalping')) {
        bot.holding = 0;
        bot.lastBuyPrice = 0;
        bot.trades++;
        updatePlayerBotStatus('scalp', `🟢 Trading (${bot.trades} trades)`);
      }
    } else if (gain < -0.8) {
      const usd = bot.holding * price;
      if (playerBotTrade('sell', usd, 'Scalping')) {
        bot.holding = 0;
        bot.lastBuyPrice = 0;
        bot.trades++;
      }
    }
  } else if (bot.priceHistory.length >= 2 && GAME.player.balance >= tradeSize) {
    // Buy on any flat or small dip from previous tick
    const prev = bot.priceHistory[bot.priceHistory.length - 2];
    const change = (price - prev) / prev * 100;
    if (change <= 0.05) {
      if (playerBotTrade('buy', tradeSize, 'Scalping')) {
        bot.holding = tradeSize / price;
        bot.lastBuyPrice = price;
        bot.trades++;
        updatePlayerBotStatus('scalp', `🟢 Trading (${bot.trades} trades)`);
      }
    }
  }
}

function playerDipTick() {
  if (!GAME.active || !PLAYER_BOTS.dip.active) return;
  const bot = PLAYER_BOTS.dip;
  const price = getGamePrice();
  if (!price || price <= 0) return;
  const threshold = parseFloat(document.getElementById('pbot-dip-threshold').value) || 1.5;
  const tradeSize = parseFloat(document.getElementById('pbot-dip-size').value) || 300;

  if (price > bot.recentHigh) bot.recentHigh = price;

  const dipPct = (bot.recentHigh - price) / bot.recentHigh * 100;

  if (bot.holding > 0) {
    const gain = (price - bot.buyPrice) / bot.buyPrice * 100;
    if (gain >= threshold * 0.4 || gain < -(threshold * 1.5)) {
      const usd = bot.holding * price;
      if (playerBotTrade('sell', usd, 'Dip Buying')) {
        bot.holding = 0;
        bot.buyPrice = 0;
        bot.recentHigh = price;
        bot.trades++;
        updatePlayerBotStatus('dip', `🟢 Active (${bot.trades} trades)`);
      }
    }
  } else if (dipPct >= threshold * 0.5 && GAME.player.balance >= tradeSize) {
    // Buy when price dips from recent high (lowered threshold for more action)
    if (playerBotTrade('buy', tradeSize, 'Dip Buying')) {
      bot.holding = tradeSize / price;
      bot.buyPrice = price;
      bot.trades++;
      updatePlayerBotStatus('dip', `🟢 Bought dip! (${bot.trades} trades)`);
    }
  }
}

function playerGridTick() {
  if (!GAME.active || !PLAYER_BOTS.grid.active) return;
  const bot = PLAYER_BOTS.grid;
  const price = getGamePrice();
  if (!price || price <= 0) return;
  const tradeSize = parseFloat(document.getElementById('pbot-grid-size').value) || 250;
  const mid = (bot.upper + bot.lower) / 2;

  // Recenter grid if price has drifted far outside range
  if (price > bot.upper * 1.02 || price < bot.lower * 0.98) {
    const rangePct = parseFloat(document.getElementById('pbot-grid-range').value) || 2;
    bot.upper = price * (1 + rangePct / 100);
    bot.lower = price * (1 - rangePct / 100);
  }

  if (bot.holding > 0 && price >= mid) {
    // Sell in upper half of range
    const usd = bot.holding * price;
    if (playerBotTrade('sell', usd, 'Grid')) {
      bot.holding = 0;
      bot.trades++;
      updatePlayerBotStatus('grid', `🟢 Sold upper half (${bot.trades} trades)`);
    }
  } else if (bot.holding === 0 && price <= mid && GAME.player.balance >= tradeSize) {
    // Buy in lower half of range
    if (playerBotTrade('buy', tradeSize, 'Grid')) {
      bot.holding = tradeSize / price;
      bot.trades++;
      updatePlayerBotStatus('grid', `🟢 Bought lower half (${bot.trades} trades)`);
    }
  }
}

// ============================================================
// === NOVA GAME CHAT =========================================
// ============================================================
function setupNovaGameChat() {
  // Start with Nova collapsed so charts/trading are visible
  document.getElementById('nova-game-body').classList.add('hidden');
  document.getElementById('nova-game-chat').style.height = '40px';
  document.getElementById('nova-game-send').onclick = () => {
    const input = document.getElementById('nova-game-input');
    const text = sanitize(input.value.trim());
    if (!text) return;
    addNovaGameMsg('user', text);
    input.value = '';
    setTimeout(() => {
      addNovaGameMsg('bot', getMentorGameResponse(text));
    }, 400 + Math.random() * 400);
  };
  document.getElementById('nova-game-input').onkeydown = e => {
    if (e.key === 'Enter') document.getElementById('nova-game-send').click();
  };
  document.querySelectorAll('.nova-game-qr').forEach(btn => {
    btn.onclick = () => {
      const q = btn.dataset.q;
      const qMap = {
        'how-am-i-doing': 'How am I doing?',
        'what-bot-doing': "What's the bot doing?",
        'tips-to-win': 'Tips to win',
        'should-i-trade': 'Should I buy or sell right now?',
      };
      const text = qMap[q] || q;
      addNovaGameMsg('user', text);
      setTimeout(() => {
        addNovaGameMsg('bot', getMentorGameResponse(text));
      }, 400 + Math.random() * 400);
    };
  });
}

function initNovaResize() {
  // Game Nova resize
  const gameHandle = document.getElementById('nova-game-resize');
  const gameChat = document.getElementById('nova-game-chat');
  if (gameHandle && gameChat) {
    let dragging = false, startY = 0, startH = 0;
    gameHandle.addEventListener('mousedown', e => {
      dragging = true; startY = e.clientY; startH = gameChat.offsetHeight;
      document.body.style.cursor = 'ns-resize'; document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const dy = startY - e.clientY;
      gameChat.style.height = Math.max(80, Math.min(600, startH + dy)) + 'px';
      gameChat.style.maxHeight = 'none';
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false; document.body.style.cursor = ''; document.body.style.userSelect = '';
    });
  }
  // Main Nova resize (left edge to make wider/narrower)
  const mentor = document.getElementById('ai-mentor');
  if (mentor) {
    const handle = document.createElement('div');
    handle.className = 'resize-handle-left';
    mentor.prepend(handle);
    let dragging = false, startX = 0, startW = 0;
    handle.addEventListener('mousedown', e => {
      dragging = true; startX = e.clientX; startW = mentor.offsetWidth;
      document.body.style.cursor = 'ew-resize'; document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const dx = startX - e.clientX;
      mentor.style.width = Math.max(200, Math.min(600, startW + dx)) + 'px';
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false; document.body.style.cursor = ''; document.body.style.userSelect = '';
    });
  }
}

function toggleNovaGameChat() {
  const body = document.getElementById('nova-game-body');
  const chat = document.getElementById('nova-game-chat');
  body.classList.toggle('hidden');
  const collapsed = body.classList.contains('hidden');
  document.getElementById('nova-game-toggle').textContent = collapsed ? '▼' : '▲';
  chat.style.height = collapsed ? '40px' : '150px';
}

// === NOVA SHARED MEMORY (cross-chat context) ===
const novaMemory = { topics: [], lastQuestions: [], facts: [] };
function novaRemember(topic, detail) {
  novaMemory.topics.push({ topic, detail, time: Date.now() });
  if (novaMemory.topics.length > 50) novaMemory.topics.shift();
}
function novaRecall(query) {
  const q = query.toLowerCase();
  return novaMemory.topics.filter(t => t.topic.toLowerCase().includes(q) || t.detail.toLowerCase().includes(q)).slice(-5);
}
function novaContextSummary() {
  if (novaMemory.topics.length === 0) return '';
  const recent = novaMemory.topics.slice(-5);
  return '\n\n(You previously discussed: ' + recent.map(t => t.topic).join(', ') + ')';
}

function addNovaGameMsg(who, text) {
  const msgs = document.getElementById('nova-game-messages');
  const div = document.createElement('div');
  div.className = `nova-game-msg ${who}`;
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  if (who === 'user') novaRemember(text, 'game-chat');
}

// === NOVA ACADEMY CHAT ===
function toggleNovaAcademy() {
  const body = document.getElementById('nova-academy-body');
  body.classList.toggle('hidden');
  document.getElementById('nova-academy-toggle').textContent = body.classList.contains('hidden') ? '▼' : '▲';
}

function sendNovaAcademyQuick(text) {
  addNovaAcademyMsg('user', text);
  setTimeout(() => {
    addNovaAcademyMsg('bot', getNovaAcademyResponse(text));
  }, 400 + Math.random() * 400);
}

function addNovaAcademyMsg(who, text) {
  const msgs = document.getElementById('nova-academy-messages');
  const div = document.createElement('div');
  div.className = `mentor-msg ${who}`;
  div.innerHTML = text.replace(/\n/g, '<br>');
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  if (who === 'user') novaRemember(text, 'academy-chat');
}

function setupNovaAcademy() {
  const send = document.getElementById('nova-academy-send');
  const input = document.getElementById('nova-academy-input');
  if (!send || !input) return;
  send.onclick = () => {
    const text = sanitize(input.value.trim());
    if (!text) return;
    addNovaAcademyMsg('user', text);
    input.value = '';
    setTimeout(() => {
      addNovaAcademyMsg('bot', getNovaAcademyResponse(text));
    }, 400 + Math.random() * 400);
  };
  input.onkeydown = e => { if (e.key === 'Enter') send.click(); };
}

function getNovaAcademyResponse(text) {
  const lower = text.toLowerCase();
  const recalled = novaRecall(text);
  let contextNote = recalled.length > 0 ? `\n\n💡 (Related to what you asked before about: ${recalled.map(r=>r.topic).join(', ')})` : '';

  if (/delta/i.test(lower)) {
    return `📊 **Delta** measures the difference between buying and selling volume at each price level.\n\n• Positive delta = more aggressive buyers (market buy orders)\n• Negative delta = more aggressive sellers (market sell orders)\n• Watch for delta divergence: price going up but delta going down = weakening momentum\n\nIn the live ladder next to me, green bars are bids (buyers) and red are asks (sellers). The delta number at the bottom shows net pressure.${contextNote}`;
  }
  if (/ladder|price ladder|read.*ladder|how.*read/i.test(lower)) {
    return `📡 **Reading the Price Ladder:**\n\n1. **Center** = current price\n2. **Left (green)** = bid volume (buyers waiting)\n3. **Right (red)** = ask volume (sellers waiting)\n4. **Big green bars** = strong buying interest (support)\n5. **Big red bars** = strong selling pressure (resistance)\n\n🎯 Look for:\n• Imbalances — one side much larger than the other\n• Absorption — large orders getting eaten without price moving\n• Thin levels — gaps in the ladder where price could move fast${contextNote}`;
  }
  if (/vwap/i.test(lower)) {
    return `📈 **VWAP (Volume Weighted Average Price):**\n\nVWAP = Σ(Price × Volume) / Σ(Volume)\n\n• It's the average price weighted by how much traded at each level\n• Institutions use VWAP as a benchmark — they try to buy below and sell above\n• Price above VWAP = bullish bias, below = bearish bias\n• VWAP acts as dynamic support/resistance\n\n🎯 Pro tip: Look for price to bounce off VWAP during trends. If it breaks through with volume, the trend may be reversing.${contextNote}`;
  }
  if (/cvd|cumulative.*delta|volume.*delta/i.test(lower)) {
    return `📊 **CVD (Cumulative Volume Delta):**\n\nCVD is a running total of delta over time.\n\n• Rising CVD = sustained buying pressure\n• Falling CVD = sustained selling pressure\n• **Divergence is key:** Price up + CVD down = hidden selling (bearish)\n• Price down + CVD up = hidden buying (bullish)\n\n🎯 CVD divergence often predicts reversals before they happen. It's one of the most powerful order flow signals.${contextNote}`;
  }
  if (/poc|point.*control/i.test(lower)) {
    return `🎯 **POC (Point of Control):**\n\nThe price level where the MOST volume traded.\n\n• POC acts like a magnet — price tends to revisit it\n• If price moves away from POC, it often comes back\n• Multiple POCs from different sessions = strong S/R zones\n• POC migration (moving up/down over days) shows trend direction\n\n💡 Use POC for mean-reversion entries: buy when price dips below POC, sell when it rises above.${contextNote}`;
  }
  if (/imbalance|stacking/i.test(lower)) {
    return `⚡ **Imbalance Stacking:**\n\nWhen 3+ consecutive price levels show the same directional imbalance.\n\n• Buy imbalance stacking = 3+ levels where buy vol >> sell vol = bullish\n• Sell imbalance stacking = 3+ levels where sell vol >> buy vol = bearish\n• The more levels stacked, the stronger the signal\n• Often marks the start of a strong move\n\n🎯 Look for imbalance stacking near support/resistance for high-probability entries.${contextNote}`;
  }
  if (/absorb|absorption/i.test(lower)) {
    return `🛡️ **Absorption:**\n\nWhen large limit orders "absorb" aggressive market orders without price moving.\n\n• Bid absorption = large buy limits eating market sells → price won't go lower (support)\n• Ask absorption = large sell limits eating market buys → price won't go higher (resistance)\n• Followed by exhaustion of the aggressive side → price reverses\n\n🎯 Absorption is one of the strongest order flow signals. When you see heavy selling but price stays flat = someone is absorbing all the selling.${contextNote}`;
  }
  if (/iceberg|hidden/i.test(lower)) {
    return `🧊 **Iceberg Orders:**\n\nLarge orders split into small visible pieces to hide the true size.\n\n• Institutions use icebergs to avoid moving the market\n• You spot them when a price level keeps getting refilled after being hit\n• Repeated fills at the same price = likely iceberg\n• Often found at key support/resistance levels\n\n🎯 If you see a level that keeps refilling, don't fade it — there's a big player defending that level.${contextNote}`;
  }
  if (/strategy|best.*strat|how.*trade|approach/i.test(lower)) {
    return `🎯 **Best Order Flow Strategies:**\n\n1. **Absorption + Reversal:** Wait for absorption at a level, then trade the reversal\n2. **Delta Divergence:** Price new high but delta declining → short\n3. **Imbalance Breakout:** Enter on stacked imbalances in breakout direction\n4. **VWAP Mean Reversion:** Buy below VWAP, sell above in ranging markets\n5. **POC Magnet:** Trade back toward POC after price moves away\n\n💡 Combine 2-3 signals for higher probability. Never trade on a single indicator alone.${contextNote}`;
  }
  if (/footprint/i.test(lower)) {
    return `👣 **Footprint Charts:**\n\nShows exact buy vs sell volume at EACH price level within a candle.\n\n• Each cell shows: buys × sells\n• Diagonal imbalances reveal aggressive buying/selling\n• Finished auction theory: when one side completely dominates\n• Much more info than regular candles — you see the "why" behind each move\n\n🎯 Look for: high-volume nodes (where the battle happened), zero prints (no opposition), and diagonal patterns.${contextNote}`;
  }
  if (/value.*area|va high|va low/i.test(lower)) {
    return `📏 **Value Area (VA High / VA Low):**\n\nThe price range where 70% of the day's volume traded.\n\n• VA High = upper boundary, VA Low = lower boundary\n• Inside VA = fair value, market agrees on price\n• Price above VA High = potentially overextended (sell opportunity)\n• Price below VA Low = potentially undervalued (buy opportunity)\n• Opening outside VA → likely rotation back inside\n\n🎯 Use VA for mean-reversion: fade moves outside the value area.${contextNote}`;
  }

  // Fallback with context awareness
  const fallbacks = [
    `Great question! Let me think about that in the context of order flow... The key is always watching the delta and volume at each price level. What specifically would you like to know more about?`,
    `That's an interesting topic! In order flow trading, everything comes back to understanding who is buying and selling, and at what price. Try asking about specific concepts like delta, VWAP, or absorption.`,
    `I'd love to help with that! Order flow gives you an edge because you see the actual supply and demand. Ask me about any concept in the cards above, or about specific trading strategies.`,
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)] + contextNote;
}

function getMentorGameResponse(text) {
  const lower = text.toLowerCase();
  const price = getGamePrice();
  const info = PAIRS[GAME.pair];
  const pVal = gamePortfolioValue(GAME.player);
  const bVal = gamePortfolioValue(GAME.bot);
  const pPL = pVal - 10000;
  const bPL = bVal - 10000;
  const diff = pVal - bVal;
  const timeLeft = GAME.timeRemaining;
  const mins = Math.floor(timeLeft / 60);

  // How am I doing
  if (/how.*doing|my.*score|my.*performance/i.test(lower)) {
    if (diff > 100) return `You're doing great! 🎉 You're ahead by $${diff.toFixed(0)}. Portfolio: $${pVal.toFixed(0)} (${pPL >= 0 ? '+' : ''}$${pPL.toFixed(0)}). ${mins} min left — keep it up!`;
    if (diff < -100) return `You're behind by $${Math.abs(diff).toFixed(0)} 😬. Your P/L: ${pPL >= 0 ? '+' : ''}$${pPL.toFixed(0)}, Bot P/L: ${bPL >= 0 ? '+' : ''}$${bPL.toFixed(0)}. Try enabling the scalping bot to catch up!`;
    return `It's neck and neck! You: $${pVal.toFixed(0)}, Bot: $${bVal.toFixed(0)}. Only $${Math.abs(diff).toFixed(0)} difference. ${mins} min remaining.`;
  }

  // What's the bot doing
  if (/bot.*doing|bot.*strategy|what.*bot/i.test(lower)) {
    const strat = document.getElementById('gp-bot-strategy-text').textContent;
    const botTrades = GAME.bot.trades.length;
    return `The bot is using "${strat}" strategy. It's made ${botTrades} trades so far. Bot P/L: ${bPL >= 0 ? '+' : ''}$${bPL.toFixed(0)}. It holds ${GAME.bot.holdings.toFixed(4)} ${info.symbol}.`;
  }

  // Tips to win
  if (/tips|advice|help.*win|how.*win/i.test(lower)) {
    if (diff < -200) return `The bot is ahead by $${Math.abs(diff).toFixed(0)} — consider using the scalping bot to make quick trades, or go aggressive with a larger position if you see a dip!`;
    if (diff > 200) return `You're winning by $${diff.toFixed(0)}! 🏆 Play it safe now — reduce position size, maybe turn off aggressive bots. Don't give back your lead!`;
    if (GAME.player.holdings === 0 && GAME.player.balance > 9000) return `You haven't traded much! The clock is ticking with ${mins} min left. Get in the market — try the 25% or 50% buttons for a quick entry.`;
    return `Match is close! Use your bots: Scalp bot for quick gains, Dip bot to catch pullbacks. Keep watching the bot's strategy — trade against it when possible.`;
  }

  // Should I buy/sell
  if (/should.*buy|should.*sell|buy or sell/i.test(lower)) {
    if (GAME.player.holdings > 0) {
      const holdVal = GAME.player.holdings * price;
      if (holdVal > GAME.player.balance * 2) return `You're heavily invested. Consider selling 25-50% to lock in some gains and reduce risk.`;
      return `You have ${GAME.player.holdings.toFixed(4)} ${info.symbol}. Current trend: ${botState.trend > 0 ? 'upward 📈' : 'downward 📉'}. ${botState.trend > 0 ? 'Hold or add more.' : 'Consider taking some profit.'}`;
    }
    return `You're all cash. ${botState.trend > 0 ? 'Market trending up — good time to buy!' : 'Market dipping — could be a buying opportunity if you believe in a recovery.'} Try 25% of balance for a safe entry.`;
  }

  // Fallback
  const responses = [
    `${info.symbol} at $${price.toFixed(info.decimals)}. You: $${pVal.toFixed(0)} vs Bot: $${bVal.toFixed(0)}. ${mins} min left!`,
    `Quick tip: Enable the Bots tab for automated strategies! Scalp bot works great in volatile markets.`,
    `The bot has made ${GAME.bot.trades.length} trades. Keep up the pace — or let your bots do the work!`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

// === ORDER FLOW VISUALIZATION ===
function generateOrderFlowData(price) {
  if (!price || price <= 0) return [];
  const levels = [];
  const info = PAIRS[GAME.pair];
  const step = price * 0.002; // 0.2% per level
  for (let i = -7; i <= 7; i++) {
    const lvlPrice = price + i * step;
    const dist = Math.abs(i);
    const baseBid = Math.max(5, Math.floor(Math.random() * 200 * (1 / (dist + 1))));
    const baseAsk = Math.max(5, Math.floor(Math.random() * 200 * (1 / (dist + 1))));
    // Bias: more bids below, more asks above
    const bid = i <= 0 ? baseBid * (1 + Math.random()) : baseBid * 0.5;
    const ask = i >= 0 ? baseAsk * (1 + Math.random()) : baseAsk * 0.5;
    levels.push({ price: lvlPrice, bid: Math.floor(bid), ask: Math.floor(ask), isCurrent: i === 0 });
  }
  return levels;
}

function updateOrderFlowDisplay() {
  const container = document.getElementById('ofa-ladder-rows');
  const deltaEl = document.getElementById('ofa-delta-val');
  if (!container || !GAME.active) return;
  const price = getGamePrice();
  if (!price) return;
  const levels = generateOrderFlowData(price);
  const info = PAIRS[GAME.pair];
  const maxVol = Math.max(...levels.map(l => Math.max(l.bid, l.ask)), 1);
  let totalDelta = 0;
  let html = '';
  for (const l of levels.reverse()) {
    totalDelta += l.bid - l.ask;
    const bidPct = (l.bid / maxVol * 100).toFixed(0);
    const askPct = (l.ask / maxVol * 100).toFixed(0);
    const cls = l.isCurrent ? ' current-price' : '';
    html += `<div class="ofa-ladder-row${cls}">` +
      `<span class="ofa-vol-col">${l.bid}</span>` +
      `<span class="ofa-bar-col bid-side"><span class="ofa-bid-bar" style="width:${bidPct}%"></span></span>` +
      `<span class="ofa-price-col">$${l.price.toFixed(info.decimals)}</span>` +
      `<span class="ofa-bar-col ask-side"><span class="ofa-ask-bar" style="width:${askPct}%"></span></span>` +
      `<span class="ofa-vol-col">${l.ask}</span></div>`;
  }
  container.innerHTML = html;
  const deltaBox = document.getElementById('ofa-delta-box');
  deltaEl.textContent = (totalDelta >= 0 ? '+' : '') + totalDelta;
  deltaEl.className = totalDelta >= 0 ? 'ofa-delta-pos' : 'ofa-delta-neg';
}

// === PORTFOLIO TAB UPDATES ===
function updatePortfolioTab() {
  if (!GAME.active) return;
  const price = getGamePrice();
  const holdingsVal = GAME.player.holdings * price;
  const totalVal = GAME.player.balance + holdingsVal;
  const pl = totalVal - 10000;
  document.getElementById('gp-port-cash').textContent = `$${GAME.player.balance.toFixed(2)}`;
  document.getElementById('gp-port-holdings').textContent = `$${holdingsVal.toFixed(2)}`;
  document.getElementById('gp-port-total').textContent = `$${totalVal.toFixed(2)}`;
  const plEl = document.getElementById('gp-port-pl');
  plEl.textContent = `${pl >= 0 ? '+' : ''}$${pl.toFixed(2)}`;
  plEl.style.color = pl >= 0 ? 'var(--green)' : 'var(--red)';

  // Mirror trades list
  const list = document.getElementById('gp-port-trades-list');
  const src = document.getElementById('gp-p-trades-list');
  list.innerHTML = src.innerHTML;
}

function setupPlayerBotToggles() {
  ['scalp', 'dip', 'grid'].forEach(type => {
    const checkbox = document.getElementById(`pbot-${type}-toggle`);
    checkbox.checked = false;
    checkbox.onchange = () => togglePlayerBot(type);
  });
}

// ============================================================
// === TOKEN ECONOMY ENGINE ===================================
// ============================================================
const TokenEconomy = (() => {
  const STORE_KEY = 'incentives-token-economy';
  const STARTING_BALANCE = 500;

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
      </div>
      <button class="ach-popup-share" onclick="event.stopPropagation();openShareModal('achievement',{name:'${ach.name.replace(/'/g,"\\'")}'})">📤</button>`;
    container.appendChild(div);
    setTimeout(() => {
      div.classList.add('dismissing');
      setTimeout(() => { div.remove(); processPopupQueue(); }, 4000);
    }, 3500);
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
  function burnTokens(amount, reason) {
    if (!data) load();
    if (!data.totalBurned) data.totalBurned = 0;
    data.totalBurned += amount;
    data.transactions.unshift({ date: new Date().toISOString(), type: 'burned', amount, desc: `🔥 Burned: ${reason}`, balance: data.balance });
    save();
    const burnEl = document.getElementById('total-burned');
    if (burnEl) burnEl.textContent = Math.floor(data.totalBurned).toLocaleString();
  }

  function getTotalBurned() { return (data && data.totalBurned) || 0; }

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

// === SOCIAL SHARING ===
const SHARE_URL = 'https://hawpetossjustin25-collab.github.io/insentives-crypto-games/';
const SHARE_GITHUB_URL = 'https://github.com/hawpetossjustin25-collab/insentives-crypto-games';
let _shareContext = { type: 'general', data: {} };

function getShareText(type, data) {
  const url = SHARE_URL;
  switch (type) {
    case 'match': {
      const asset = data.asset || 'ETH/USD';
      const pl = data.pl || '$0.00';
      const won = data.won;
      if (won) return `🏆 I beat the AI bot trading ${asset}! P/L: ${pl}. Play free: ${url} #IncentivesGame`;
      return `🤖 The bot got me this time on ${asset}. P/L: ${pl}. Can you beat it? ${url} #IncentivesGame`;
    }
    case 'achievement':
      return `🎖️ Just unlocked '${data.name || 'Achievement'}' in Incentives Crypto Games! ${url} #IncentivesGame`;
    case 'challenge': {
      const asset = data.asset || pairInfo().name;
      return `⚔️ I challenge you to beat my score on ${asset}! Play now: ${url} #IncentivesGame`;
    }
    default:
      return `🎮 I'm trading crypto, stocks & oil in Incentives Crypto Games — free to play! ${url} #IncentivesGame`;
  }
}

function openShareModal(type, data) {
  _shareContext = { type, data: data || {} };

  // Fill in match data from GAME state if sharing match result
  if (type === 'match' && GAME.matchHistory.length > 0) {
    const last = GAME.matchHistory[GAME.matchHistory.length - 1];
    const info = PAIRS[last.pair] || {};
    const pl = last.playerVal - 10000;
    _shareContext.data = {
      asset: info.name || last.pair,
      pl: `${pl >= 0 ? '+' : ''}$${pl.toFixed(2)}`,
      won: last.winner === 'player',
    };
  }
  if (type === 'challenge') {
    _shareContext.data.asset = pairInfo().name;
  }

  const text = getShareText(_shareContext.type, _shareContext.data);
  const titles = { general: '📤 Share Game', match: '📤 Share Result', achievement: '📤 Share Achievement', challenge: '⚔️ Challenge a Friend' };
  document.getElementById('share-modal-title').textContent = titles[type] || '📤 Share';
  document.getElementById('share-preview').textContent = text;
  document.getElementById('share-copy-text').value = text;
  document.getElementById('share-toast').classList.add('hidden');
  document.getElementById('share-overlay').classList.remove('hidden');
}

function closeShareModal() {
  document.getElementById('share-overlay').classList.add('hidden');
}

function shareGame(platform) {
  const text = getShareText(_shareContext.type, _shareContext.data);
  const url = SHARE_URL;

  // Try Web Share API first (mobile)
  if (platform === 'native' && navigator.share) {
    navigator.share({ title: 'Incentives Crypto Games', text, url }).catch(() => {});
    return;
  }

  switch (platform) {
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
      break;
    case 'facebook':
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
      break;
    case 'telegram':
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
      break;
    case 'discord':
      navigator.clipboard.writeText(`**Incentives Crypto Games**\n${text}`).then(() => showShareToast('Copied for Discord!'));
      return;
    case 'snapchat':
      navigator.clipboard.writeText(text).then(() => showShareToast('Copied for Snapchat!'));
      return;
    case 'github':
      window.open(SHARE_GITHUB_URL, '_blank');
      return;
  }
  closeShareModal();
}

function copyShareText() {
  const text = document.getElementById('share-copy-text').value;
  navigator.clipboard.writeText(text).then(() => showShareToast('Copied!'));
}

function showShareToast(msg) {
  const toast = document.getElementById('share-toast');
  toast.textContent = '✅ ' + msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2000);
}

// === MARKET OVERVIEW & STATS SECTIONS ===
function populateMarketOverview() {
  const grid = document.getElementById('market-overview-grid');
  if (!grid) return;
  grid.innerHTML = Object.entries(PAIRS).map(([key, p]) => {
    const price = isSimulated(key) ? (getSimState(key).price || p.simBase || 0) : (key === currentPair ? currentPrice : 0);
    const priceStr = price > 0 ? `$${price.toFixed(p.decimals)}` : '—';
    return `<div class="market-card" onclick="document.getElementById('market-selector').value='${key}';switchPair('${key}')">
      <div class="mc-icon">${p.icon}</div>
      <div class="mc-name">${p.symbol}/USD</div>
      <div class="mc-price">${priceStr}</div>
    </div>`;
  }).join('');
}

function updatePerformanceStats() {
  const trades = state.tradeHistory || [];
  document.getElementById('stat-total-trades').textContent = trades.length;
  const sells = trades.filter(t => t.side === 'sell');
  const wins = sells.filter(t => {
    const buys = trades.filter(b => b.side === 'buy' && b.pair === t.pair && new Date(b.time) < new Date(t.time));
    if (!buys.length) return false;
    const lastBuy = buys[buys.length - 1];
    return t.price > lastBuy.price;
  });
  document.getElementById('stat-win-rate').textContent = sells.length ? Math.round(wins.length / sells.length * 100) + '%' : '0%';
  const best = trades.reduce((max, t) => t.usd > max ? t.usd : max, 0);
  document.getElementById('stat-best-trade').textContent = `$${best.toFixed(2)}`;
  const sym = pairInfo().symbol;
  const held = state.holdings[sym] || 0;
  const portfolio = state.balance + Object.entries(state.holdings).reduce((sum, [s, h]) => s === sym ? sum + h * currentPrice : sum + h * (state.costBases[s] || 0), 0);
  document.getElementById('stat-total-pl').textContent = `${portfolio - 10000 >= 0 ? '+' : ''}$${(portfolio - 10000).toFixed(2)}`;
}

// Populate on load and periodically
setTimeout(() => { populateMarketOverview(); updatePerformanceStats(); }, 3000);
setInterval(() => { populateMarketOverview(); updatePerformanceStats(); }, 15000);


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

// ============================================================
// === NEWS READER =============================================
// ============================================================
const NEWS_ARTICLES = [
  { headline: "Bitcoin ETF Sees Record $2.4B Inflows in Single Day", summary: "Institutional investors pile into Bitcoin spot ETFs as prices surge past $70k. BlackRock's IBIT leads with $1.1B alone. Analysts predict sustained momentum through Q2.", category: "Crypto", sentiment: "🟢" },
  { headline: "Ethereum Dencun Upgrade Slashes L2 Fees by 90%", summary: "The long-awaited Dencun upgrade is live, dramatically reducing transaction costs on Layer 2 networks. Arbitrum and Optimism see gas fees drop to pennies.", category: "Crypto", sentiment: "🟢" },
  { headline: "NVIDIA Reports 265% Revenue Growth, Beats All Estimates", summary: "Data center revenue alone hits $18.4B as AI chip demand continues to outpace supply. Stock jumps 12% in after-hours trading.", category: "Stock", sentiment: "🟢" },
  { headline: "Oil Prices Drop 4% on Surprise Inventory Build", summary: "US crude inventories rose by 7.2 million barrels, far exceeding the expected 1.5M draw. WTI falls below $72 per barrel.", category: "Oil", sentiment: "🔴" },
  { headline: "Federal Reserve Signals June Rate Cut Unlikely", summary: "Fed Chair Powell indicates inflation remains 'too high' for near-term cuts. Markets reprice expectations, pushing first cut to September.", category: "Stock", sentiment: "🔴" },
  { headline: "Solana Hits All-Time High in Daily Active Addresses", summary: "Over 2.5 million unique wallets transacted on Solana in 24 hours. Meme coin mania and DePIN protocols drive unprecedented activity.", category: "Crypto", sentiment: "🟢" },
  { headline: "Tesla Cuts Prices Again Across All Models", summary: "The EV maker reduces prices by 5-8% globally amid intensifying competition from Chinese manufacturers. Margins under pressure.", category: "Stock", sentiment: "🔴" },
  { headline: "OPEC+ Extends Production Cuts Through Q3 2025", summary: "Saudi Arabia leads the cartel in maintaining 2.2M bpd voluntary cuts. Oil prices stabilize around $78 but analysts warn of demand concerns.", category: "Oil", sentiment: "🟡" },
  { headline: "Apple AI Features Drive iPhone 16 Pre-Order Records", summary: "New Apple Intelligence features generate massive consumer interest. Pre-orders exceed iPhone 15 launch by 35%.", category: "Stock", sentiment: "🟢" },
  { headline: "XRP Surges 25% on SEC Settlement Rumors", summary: "Reports suggest Ripple and SEC are nearing a $150M settlement. If confirmed, XRP could be relisted on major US exchanges.", category: "Crypto", sentiment: "🟢" },
  { headline: "Natural Gas Prices Spike on Arctic Blast Forecast", summary: "Henry Hub futures jump 8% as meteorologists predict severe cold snap across eastern US. Storage levels already below 5-year average.", category: "Oil", sentiment: "🟢" },
  { headline: "Meta's Llama 4 Challenges GPT-5 in Benchmarks", summary: "Meta releases its latest open-source AI model, matching or exceeding GPT-5 on several key benchmarks. Stock rises 4%.", category: "Stock", sentiment: "🟢" },
  { headline: "DeFi TVL Crosses $200B for First Time", summary: "Total value locked in decentralized finance protocols reaches a new milestone. Aave, Lido, and MakerDAO lead the charge.", category: "Crypto", sentiment: "🟢" },
  { headline: "Exxon Announces $60B Share Buyback Program", summary: "The oil giant commits to one of the largest buyback programs in history, funded by strong upstream profits. Dividend also raised 5%.", category: "Oil", sentiment: "🟢" },
  { headline: "Amazon AWS Revenue Accelerates to 19% Growth", summary: "Cloud computing demand surges as enterprises adopt AI workloads. AWS margins expand to 37%, beating analyst expectations.", category: "Stock", sentiment: "🟢" },
  { headline: "Cardano Launches Midnight Privacy Sidechain", summary: "The long-anticipated privacy-focused sidechain goes live on Cardano. Early adoption shows promise for institutional DeFi use cases.", category: "Crypto", sentiment: "🟡" },
  { headline: "Brent Crude Falls Below $75 on China Demand Fears", summary: "Weak Chinese manufacturing data sparks sell-off in energy markets. Brent drops 3.2% as traders reassess global demand outlook.", category: "Oil", sentiment: "🔴" },
  { headline: "AMD MI300X Gains Ground in AI Data Center Market", summary: "AMD's latest AI accelerator captures 10% of the data center GPU market. Major cloud providers confirm large orders.", category: "Stock", sentiment: "🟢" },
  { headline: "Dogecoin Integration with X Payments Confirmed", summary: "Elon Musk's X platform adds DOGE as a payment option for premium features. DOGE price jumps 15% on the announcement.", category: "Crypto", sentiment: "🟢" },
  { headline: "US Oil Production Hits Record 13.4M Barrels Per Day", summary: "Shale producers continue to defy expectations with efficiency gains. Record output puts downward pressure on global prices.", category: "Oil", sentiment: "🔴" },
  { headline: "Netflix Subscriber Growth Beats Estimates by 40%", summary: "Ad-supported tier drives 13.1M new subscribers in Q4. Stock surges to all-time high above $750.", category: "Stock", sentiment: "🟢" },
  { headline: "INCENTIVES Token Listed on Major CEX", summary: "INCENTIVES gains listing on a top-10 centralized exchange. Trading volume spikes 500% as new liquidity enters the market.", category: "Crypto", sentiment: "🟢" },
  { headline: "Chevron Discovers Major Offshore Reserve in Gulf", summary: "Estimated 1.2B barrel equivalent discovery in deepwater Gulf of Mexico. Development expected to begin 2026.", category: "Oil", sentiment: "🟢" },
  { headline: "Google Gemini Ultra Achieves AGI-Level Reasoning", summary: "Google claims breakthrough in multi-step reasoning with Gemini Ultra 2.0. Skeptics demand independent verification.", category: "Stock", sentiment: "🟡" },
  { headline: "Bitcoin Hashrate Hits Record 700 EH/s Post-Halving", summary: "Despite reduced block rewards, mining difficulty reaches all-time highs. Miners investing heavily in next-gen ASIC hardware.", category: "Crypto", sentiment: "🟡" },
  { headline: "OPEC Downgrades 2025 Global Oil Demand Forecast", summary: "The cartel cuts its demand growth estimate by 300K bpd citing EV adoption and weak Chinese industrial output.", category: "Oil", sentiment: "🔴" },
  { headline: "Microsoft Copilot Enterprise Adoption Triples", summary: "Enterprise customers using Microsoft's AI assistant triple in Q1. Revenue contribution expected to exceed $10B annually.", category: "Stock", sentiment: "🟢" },
  { headline: "Avalanche Launches Subnet for Institutional Finance", summary: "Ava Labs partners with major banks to launch a permissioned subnet for tokenized assets. $500M in RWAs committed.", category: "Crypto", sentiment: "🟢" },
  { headline: "US Strategic Petroleum Reserve Hits 20-Year Low", summary: "After years of drawdowns, SPR levels drop to 347M barrels. Calls grow for refilling but prices remain elevated.", category: "Oil", sentiment: "🟡" },
  { headline: "Intel Foundry Secures $8.5B CHIPS Act Funding", summary: "Intel receives the largest CHIPS Act award to build advanced fabs in Ohio and Arizona. Production expected by 2027.", category: "Stock", sentiment: "🟢" },
  { headline: "Chainlink CCIP Processes $10T in Cross-Chain Value", summary: "Chainlink's cross-chain protocol reaches a milestone in cumulative value transferred. SWIFT integration driving institutional adoption.", category: "Crypto", sentiment: "🟢" },
  { headline: "European Natural Gas Storage at 95% Capacity", summary: "Mild winter leaves EU storage nearly full. Prices drop to 18-month low as oversupply concerns emerge.", category: "Oil", sentiment: "🔴" },
];

let newsFilter = 'All';
let newsRefreshInterval = null;

function openNewsModal() {
  let modal = document.getElementById('news-modal-overlay');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'news-modal-overlay';
    modal.className = 'modal-overlay';
    modal.onclick = function(e) { if (e.target === this) closeNewsModal(); };
    modal.innerHTML = `
      <div class="news-modal">
        <div class="news-header">
          <h2>📰 Market News</h2>
          <div class="news-filters">
            <button class="news-filter-btn active" data-cat="All">All</button>
            <button class="news-filter-btn" data-cat="Crypto">🪙 Crypto</button>
            <button class="news-filter-btn" data-cat="Stock">📈 Stock</button>
            <button class="news-filter-btn" data-cat="Oil">🛢️ Oil</button>
          </div>
          <button class="settings-close" onclick="closeNewsModal()">✕</button>
        </div>
        <div class="news-content" id="news-content"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('.news-filter-btn').forEach(btn => {
      btn.onclick = () => {
        modal.querySelectorAll('.news-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        newsFilter = btn.dataset.cat;
        renderNews();
      };
    });
  }
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  renderNews();
  if (newsRefreshInterval) clearInterval(newsRefreshInterval);
  newsRefreshInterval = setInterval(renderNews, 30000);
}

function closeNewsModal() {
  const modal = document.getElementById('news-modal-overlay');
  if (modal) { modal.classList.add('hidden'); modal.style.display = 'none'; }
  if (newsRefreshInterval) { clearInterval(newsRefreshInterval); newsRefreshInterval = null; }
}

function renderNews() {
  const container = document.getElementById('news-content');
  if (!container) return;
  let articles = [...NEWS_ARTICLES].sort(() => Math.random() - 0.5);
  if (newsFilter !== 'All') articles = articles.filter(a => a.category === newsFilter);
  const now = Date.now();
  container.innerHTML = articles.map((a, i) => {
    const mins = Math.floor(Math.random() * 120) + 1;
    const timeStr = mins < 60 ? `${mins}m ago` : `${Math.floor(mins/60)}h ${mins%60}m ago`;
    return `<div class="news-card">
      <div class="news-card-top">
        <span class="news-badge news-badge-${a.category.toLowerCase()}">${a.category}</span>
        <span class="news-sentiment">${a.sentiment}</span>
        <span class="news-time">${timeStr}</span>
      </div>
      <div class="news-headline">${a.headline}</div>
      <div class="news-summary">${a.summary}</div>
    </div>`;
  }).join('');
}

// ============================================================
// === FLOATING RADIO ==========================================
// ============================================================
function initFloatingRadio() {
  // Floating radio already exists in HTML, just ensure popup state sync
  if (!document.getElementById('radio-float-btn')) {
    const floatBtn = document.createElement('div');
    floatBtn.id = 'radio-float-btn';
    floatBtn.innerHTML = '📻';
    floatBtn.title = 'Market Radio';
    floatBtn.onclick = toggleRadioPopup;
    document.body.appendChild(floatBtn);
  }
}

// ============================================================
// === RESIZABLE PANELS ========================================
// ============================================================
function initResizePanels() {
  const app = document.getElementById('app');
  const chartSection = document.getElementById('chart-section');
  const rightPanel = document.getElementById('right-panel');
  if (!app || !chartSection || !rightPanel) return;

  let handle = document.getElementById('main-resize-handle');
  if (!handle) {
    handle = document.createElement('div');
    handle.id = 'main-resize-handle';
    handle.className = 'resize-handle';
    app.insertBefore(handle, rightPanel);
  }

  let dragging = false, startX, startChartW, startPanelW;

  handle.addEventListener('mousedown', (e) => {
    dragging = true;
    startX = e.clientX;
    startChartW = chartSection.offsetWidth;
    startPanelW = rightPanel.offsetWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const newChartW = Math.max(300, startChartW + dx);
    const newPanelW = Math.max(200, startPanelW - dx);
    chartSection.style.flex = 'none';
    chartSection.style.width = newChartW + 'px';
    rightPanel.style.flex = 'none';
    rightPanel.style.width = newPanelW + 'px';
    if (chart) chart.applyOptions({ width: chartSection.querySelector('#chart-container').clientWidth });
  });

  document.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}

// (initGamePanelResize defined earlier in file)

// ============================================================
// === EXTRA SECTIONS (Scrollable Page) ========================
// ============================================================
function initExtraSections() {
  // Market Overview
  const marketOverview = document.createElement('section');
  marketOverview.id = 'market-overview-section';
  marketOverview.className = 'extra-section';
  let pairCards = '';
  Object.entries(PAIRS).forEach(([key, info]) => {
    const ss = isSimulated(key) ? getSimState(key) : null;
    const price = ss ? ss.price : 0;
    pairCards += `<div class="mini-price-card" data-pair="${key}">
      <div class="mpc-icon">${info.icon}</div>
      <div class="mpc-info">
        <div class="mpc-name">${info.symbol}/USD</div>
        <div class="mpc-price mono" id="mpc-${key}">$${price ? price.toFixed(info.decimals) : '—'}</div>
      </div>
      <div class="mpc-change mono" id="mpc-chg-${key}">0.00%</div>
    </div>`;
  });
  marketOverview.innerHTML = `<h2 class="section-title">📊 Market Overview</h2><div class="mini-price-grid">${pairCards}</div>`;

  // Performance
  const performance = document.createElement('section');
  performance.id = 'performance-section';
  performance.className = 'extra-section';
  performance.innerHTML = `<h2 class="section-title">📈 Your Performance</h2>
    <div class="perf-grid">
      <div class="perf-card"><div class="perf-label">Total Trades</div><div class="perf-value mono" id="perf-trades">${state.tradeHistory.length}</div></div>
      <div class="perf-card"><div class="perf-label">Win Rate</div><div class="perf-value mono" id="perf-winrate">—</div></div>
      <div class="perf-card"><div class="perf-label">Avg P/L per Trade</div><div class="perf-value mono" id="perf-avg-pl">—</div></div>
      <div class="perf-card"><div class="perf-label">Best Trade</div><div class="perf-value mono" id="perf-best">—</div></div>
      <div class="perf-card"><div class="perf-label">Matches Won</div><div class="perf-value mono" id="perf-wins">${GAME.matchHistory.filter(m=>m.winner==='player').length}</div></div>
      <div class="perf-card"><div class="perf-label">Matches Played</div><div class="perf-value mono" id="perf-matches">${GAME.matchHistory.length}</div></div>
    </div>`;

  // Leaderboard
  const leaderboard = document.createElement('section');
  leaderboard.id = 'leaderboard-section';
  leaderboard.className = 'extra-section';
  leaderboard.innerHTML = `<h2 class="section-title">🏆 Leaderboard</h2>
    <div class="leaderboard-placeholder">
      <div class="lb-row lb-header"><span>#</span><span>Player</span><span>P/L</span><span>Win Rate</span></div>
      <div class="lb-row lb-you"><span>1</span><span>👤 You</span><span class="mono pnl-pos">+$${(state.tradeHistory.length * 12.5).toFixed(2)}</span><span>—</span></div>
      <div class="lb-row"><span>2</span><span>🤖 GridMaster_99</span><span class="mono pnl-pos">+$1,247.80</span><span>68%</span></div>
      <div class="lb-row"><span>3</span><span>🐋 WhaleHunter</span><span class="mono pnl-pos">+$998.30</span><span>62%</span></div>
      <div class="lb-row"><span>4</span><span>📈 DipBuyer2024</span><span class="mono pnl-pos">+$756.10</span><span>55%</span></div>
      <div class="lb-row"><span>5</span><span>⚡ ScalpKing</span><span class="mono pnl-pos">+$501.44</span><span>71%</span></div>
      <div class="lb-coming">🔜 Live multiplayer leaderboards coming soon!</div>
    </div>`;

  // Trading Academy
  const academy = document.createElement('section');
  academy.id = 'academy-section';
  academy.className = 'extra-section';
  academy.innerHTML = `<h2 class="section-title">📚 Trading Academy</h2>
    <div class="academy-grid">
      <div class="academy-card"><div class="ac-icon">📊</div><h3>Candlestick Patterns</h3><p>Learn to read doji, hammer, engulfing and more chart patterns that signal reversals.</p></div>
      <div class="academy-card"><div class="ac-icon">📉</div><h3>Support & Resistance</h3><p>Identify key price levels where buying or selling pressure tends to emerge.</p></div>
      <div class="academy-card"><div class="ac-icon">🎯</div><h3>Risk Management</h3><p>Position sizing, stop-losses, and the 2% rule every trader should know.</p></div>
      <div class="academy-card"><div class="ac-icon">🤖</div><h3>Bot Strategies</h3><p>Grid trading, DCA, and custom bot setups for hands-free profit generation.</p></div>
      <div class="academy-card"><div class="ac-icon">⚡</div><h3>Scalping 101</h3><p>Quick trades, tight stops, and high win rates. Master the art of the quick flip.</p></div>
      <div class="academy-card"><div class="ac-icon">🧠</div><h3>Trading Psychology</h3><p>Fear, greed, FOMO — understand your emotions and how they sabotage trades.</p></div>
    </div>`;

  // Append all sections after bottom-section
  const bottomSection = document.getElementById('bottom-section');
  bottomSection.after(marketOverview, performance, leaderboard, academy);

  // Update market overview prices periodically
  setInterval(() => {
    Object.entries(PAIRS).forEach(([key, info]) => {
      const el = document.getElementById('mpc-' + key);
      if (!el) return;
      let price = 0;
      if (isSimulated(key)) {
        const ss = getSimState(key);
        price = ss.price || 0;
      } else if (key === currentPair) {
        price = currentPrice;
      }
      if (price > 0) el.textContent = '$' + price.toFixed(info.decimals);
    });
  }, 5000);
}

// ============================================================
// === GAME EXTRA SECTIONS =====================================
// ============================================================
function initGameExtraSections() {
  const gameView = document.getElementById('game-view');
  if (!gameView) return;
  // Remove old extra sections if present
  gameView.querySelectorAll('.game-extra-section').forEach(el => el.remove());

  const matchStats = document.createElement('section');
  matchStats.className = 'game-extra-section extra-section';
  matchStats.innerHTML = `<h2 class="section-title">📊 Match Statistics</h2>
    <div class="perf-grid" id="game-match-stats">
      <div class="perf-card"><div class="perf-label">Your Trades</div><div class="perf-value mono" id="gms-p-trades">0</div></div>
      <div class="perf-card"><div class="perf-label">Bot Trades</div><div class="perf-value mono" id="gms-b-trades">0</div></div>
      <div class="perf-card"><div class="perf-label">Your Win Rate</div><div class="perf-value mono" id="gms-p-winrate">—</div></div>
      <div class="perf-card"><div class="perf-label">Time Elapsed</div><div class="perf-value mono" id="gms-elapsed">0:00</div></div>
    </div>`;

  const tradeComparison = document.createElement('section');
  tradeComparison.className = 'game-extra-section extra-section';
  tradeComparison.innerHTML = `<h2 class="section-title">⚖️ Trade Comparison</h2>
    <div class="trade-comparison-table" id="game-trade-comparison">
      <div class="tc-header"><span>Time</span><span>👤 You</span><span>🤖 Bot</span></div>
      <div class="tc-body" id="tc-body"><p class="muted">Trades will appear here as the match progresses...</p></div>
    </div>`;

  const novaAnalysis = document.createElement('section');
  novaAnalysis.className = 'game-extra-section extra-section';
  novaAnalysis.innerHTML = `<h2 class="section-title">🧠 Nova's Match Analysis</h2>
    <div class="nova-analysis" id="game-nova-analysis">
      <p class="muted">Nova will provide analysis as the match progresses...</p>
    </div>`;

  // Insert before game-close-btn
  const closeBtn = document.getElementById('game-close-btn');
  gameView.insertBefore(matchStats, closeBtn);
  gameView.insertBefore(tradeComparison, closeBtn);
  gameView.insertBefore(novaAnalysis, closeBtn);
}

// === BOT P/L TRACKING ===
GAME.playerBotPL = 0;

// Patch startMatch to init extra game sections and bot PL display
const _origStartMatch = startMatch;
// We override via wrapping the init call below

// ============================================================
// === INIT PATCHES ============================================
// ============================================================
const _origInit = init;
// Re-run extra inits after main init
(function patchInit() {
  // Wait for DOM + original init to complete
  setTimeout(() => {
    initFloatingRadio();
    initResizePanels();
    initExtraSections();
  }, 500);
})();

// Patch startMatch to add game extras
const _origStartMatchFn = startMatch;
const _patchedStartMatch = async function() {
  await _origStartMatchFn.apply(this, arguments);
  if (GAME.active) {
    GAME.playerBotPL = 0;
    initGameExtraSections();
    initGamePanelResize();
    // Add bot PL display to scorebar
    let botPLEl = document.getElementById('gs-player-bot-pl');
    if (!botPLEl) {
      botPLEl = document.createElement('span');
      botPLEl.id = 'gs-player-bot-pl';
      botPLEl.className = 'gs-trades';
      botPLEl.textContent = '🤖 Bots P/L: $0.00';
      document.querySelector('.gs-left').appendChild(botPLEl);
    }
  }
};
// Replace cm-start-btn handler
document.getElementById('cm-start-btn').onclick = _patchedStartMatch;

// Patch updateGameUI to show bot PL
const _origUpdateGameUI = updateGameUI;
updateGameUI = function() {
  _origUpdateGameUI();
  const botPLEl = document.getElementById('gs-player-bot-pl');
  if (botPLEl) {
    // Calculate player bot P/L from bot trades
    let botPL = 0;
    ['scalp', 'dip', 'grid'].forEach(type => {
      const bot = PLAYER_BOTS[type];
      if (bot.active && bot.holding > 0) {
        botPL += bot.holding * getGamePrice() - (bot.holding * (bot.lastBuyPrice || bot.buyPrice || 0));
      }
    });
    GAME.playerBotPL = botPL;
    botPLEl.textContent = `🤖 Bots P/L: ${botPL >= 0 ? '+' : ''}$${botPL.toFixed(2)}`;
    botPLEl.style.color = botPL >= 0 ? 'var(--green)' : 'var(--red)';
  }
  // Update game extra sections
  const gmsEl = document.getElementById('gms-p-trades');
  if (gmsEl && GAME.active) {
    gmsEl.textContent = GAME.player.trades.length;
    document.getElementById('gms-b-trades').textContent = GAME.bot.trades.length;
    const elapsed = GAME.duration - GAME.timeRemaining;
    document.getElementById('gms-elapsed').textContent = Math.floor(elapsed/60) + ':' + (elapsed%60).toString().padStart(2,'0');
  }
};
