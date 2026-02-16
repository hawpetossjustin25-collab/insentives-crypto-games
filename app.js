// === SECURITY: Input Sanitization ===
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]*>/g, '').trim();
}

// === SECURITY: localStorage XOR obfuscation ===
const _LS_KEY = 'iNc3nT1v3s_0bF';
function _xorCipher(text, key) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    out += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return out;
}

// === NOTIFICATION SYSTEM ===
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
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
    backgroundColor: type === 'success' ? '#00c853' : 
                     type === 'error' ? '#ff1744' : 
                     type === 'warning' ? '#ff9800' : '#2196f3'
  });
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }, 4000);
}

// === TOKEN ECONOMY ENGINE ===
const TokenEconomy = (() => {
  const STORE_KEY = 'incentives-token-economy';
  const STARTING_BALANCE = 10000;

  let data = null;

  function defaultData() {
    return {
      balance: STARTING_BALANCE,
      totalEarned: 0,
      achievements: {},
      progress: { tradeCount: 0, mentorQuestions: 0, orderTypesUsed: {}, challengesPlayed: 0, challengesWon: 0, dailyWinDate: null },
      transactions: [],
      unlockedFeatures: {},
      wallet: null,
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
      save();
    }
  }

  function save() { 
    localStorage.setItem(STORE_KEY, JSON.stringify(data)); 
  }

  function getBalance() { 
    return data.balance; 
  }

  function addTokens(amount, reason) {
    data.balance += amount;
    data.totalEarned += amount;
    save();
    updateBalanceUI();
    showNotification(`+${amount} INCENTIVES tokens (${reason})`, 'success');
  }

  function updateBalanceUI() {
    const el = document.getElementById('incv-amount');
    if (el) {
      el.textContent = Math.floor(data.balance).toLocaleString();
    }
  }

  // Initialize
  load();
  
  return {
    getBalance,
    addTokens,
    updateBalanceUI,
    load,
    save
  };
})();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  TokenEconomy.updateBalanceUI();
  showNotification('Game loaded successfully!', 'success');
});
