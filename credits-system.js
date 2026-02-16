// === INCENTIVES CREDITS SYSTEM ===
// Core economic engine for agentic agents platform

class IncentivesCredits {
  constructor() {
    this.conversionRate = 10; // 1 INCENTIVES = 10 Credits
    this.userCredits = new Map();
    this.transactions = [];
    this.services = new Map();
    this.initialized = false;
    
    // Service pricing (in credits)
    this.servicePrices = {
      message: 1,           // Telegram/Discord message
      apiCall: 5,           // Market data API call
      aiAnalysis: 10,       // AI trading analysis
      tradingSignal: 15,    // Premium trading signal
      agentDeployment: 100, // Deploy new agent
      agentRental: 50       // Rent agent per day
    };
    
    this.init();
  }
  
  async init() {
    try {
      // Load existing data
      await this.loadCreditsData();
      
      // Initialize services
      this.initializeServices();
      
      // Set up UI
      this.setupCreditsUI();
      
      this.initialized = true;
      console.log('💳 Credits system initialized');
      
      BugProof.safeCall(showNotification, null, 
        '💳 Credits system ready!', 'success'
      );
      
    } catch (error) {
      BugProof.handleError(error, 'Credits Init');
    }
  }
  
  // === CORE CREDITS OPERATIONS ===
  
  async convertIncentivesToCredits(userId, incentivesAmount) {
    try {
      // Validate input
      if (!userId || incentivesAmount <= 0) {
        throw new Error('Invalid conversion parameters');
      }
      
      // Check user's INCENTIVES balance
      const incentivesBalance = await this.getIncentivesBalance(userId);
      if (incentivesBalance < incentivesAmount) {
        throw new Error('Insufficient INCENTIVES balance');
      }
      
      // Calculate credits to receive
      const creditsToAdd = Math.floor(incentivesAmount * this.conversionRate);
      
      // Execute conversion
      await this.deductIncentives(userId, incentivesAmount);
      await this.addCredits(userId, creditsToAdd);
      
      // Record transaction
      this.recordTransaction({
        userId,
        type: 'conversion',
        incentivesSpent: incentivesAmount,
        creditsReceived: creditsToAdd,
        rate: this.conversionRate,
        timestamp: Date.now()
      });
      
      // Update UI
      this.updateCreditsUI(userId);
      
      BugProof.safeCall(showNotification, null,
        `✅ Converted ${incentivesAmount} INCENTIVES to ${creditsToAdd} Credits!`,
        'success'
      );
      
      return { success: true, creditsReceived: creditsToAdd };
      
    } catch (error) {
      BugProof.handleError(error, 'Credits Conversion');
      return { success: false, error: error.message };
    }
  }
  
  async spendCredits(userId, service, amount, metadata = {}) {
    try {
      // Get service cost
      const cost = this.servicePrices[service] || amount;
      
      // Check user's credits balance
      const balance = this.getCreditsBalance(userId);
      if (balance < cost) {
        throw new Error('Insufficient credits balance');
      }
      
      // Deduct credits
      await this.deductCredits(userId, cost);
      
      // Record transaction
      this.recordTransaction({
        userId,
        type: 'spend',
        service,
        creditsSpent: cost,
        metadata,
        timestamp: Date.now()
      });
      
      // Update UI
      this.updateCreditsUI(userId);
      
      return { success: true, creditsSpent: cost };
      
    } catch (error) {
      BugProof.handleError(error, 'Credits Spending');
      return { success: false, error: error.message };
    }
  }
  
  async earnCredits(userId, amount, source = 'reward', metadata = {}) {
    try {
      if (amount <= 0) return { success: false, error: 'Invalid amount' };
      
      // Add credits
      await this.addCredits(userId, amount);
      
      // Record transaction
      this.recordTransaction({
        userId,
        type: 'earn',
        source,
        creditsEarned: amount,
        metadata,
        timestamp: Date.now()
      });
      
      // Update UI
      this.updateCreditsUI(userId);
      
      BugProof.safeCall(showNotification, null,
        `💰 Earned ${amount} Credits from ${source}!`,
        'success'
      );
      
      return { success: true, creditsEarned: amount };
      
    } catch (error) {
      BugProof.handleError(error, 'Credits Earning');
      return { success: false, error: error.message };
    }
  }
  
  // === BALANCE OPERATIONS ===
  
  getCreditsBalance(userId) {
    return BugProof.safeGet(this.userCredits, userId, 0) || 0;
  }
  
  async getIncentivesBalance(userId) {
    try {
      // In real implementation, this would check the user's wallet
      // For now, simulate with TokenEconomy if available
      if (window.TokenEconomy && typeof TokenEconomy.getBalance === 'function') {
        return TokenEconomy.getBalance();
      }
      
      // Fallback for testing
      return BugProof.safeStorage.get(`incentives_balance_${userId}`, 1000);
    } catch (error) {
      console.warn('Could not get INCENTIVES balance:', error);
      return 0;
    }
  }
  
  async addCredits(userId, amount) {
    const current = this.getCreditsBalance(userId);
    this.userCredits.set(userId, current + amount);
    await this.saveCreditsData();
  }
  
  async deductCredits(userId, amount) {
    const current = this.getCreditsBalance(userId);
    if (current < amount) {
      throw new Error('Insufficient credits');
    }
    this.userCredits.set(userId, current - amount);
    await this.saveCreditsData();
  }
  
  async deductIncentives(userId, amount) {
    try {
      // In real implementation, this would deduct from user's wallet
      // For now, simulate with TokenEconomy if available
      if (window.TokenEconomy && typeof TokenEconomy.spend === 'function') {
        return TokenEconomy.spend(amount, 'Credits conversion');
      }
      
      // Fallback for testing
      const current = BugProof.safeStorage.get(`incentives_balance_${userId}`, 1000);
      if (current < amount) {
        throw new Error('Insufficient INCENTIVES');
      }
      BugProof.safeStorage.set(`incentives_balance_${userId}`, current - amount);
    } catch (error) {
      throw new Error('Failed to deduct INCENTIVES: ' + error.message);
    }
  }
  
  // === SERVICE INTEGRATIONS ===
  
  initializeServices() {
    // Register available services
    this.services.set('message', {
      name: 'Messaging',
      description: 'Send Telegram/Discord messages',
      cost: this.servicePrices.message,
      execute: this.executeMessageService.bind(this)
    });
    
    this.services.set('apiCall', {
      name: 'Market Data',
      description: 'Premium market data API calls',
      cost: this.servicePrices.apiCall,
      execute: this.executeApiService.bind(this)
    });
    
    this.services.set('aiAnalysis', {
      name: 'AI Analysis',
      description: 'Advanced trading analysis',
      cost: this.servicePrices.aiAnalysis,
      execute: this.executeAiService.bind(this)
    });
  }
  
  async executeMessageService(userId, params) {
    try {
      const { platform, message, recipient } = params;
      
      // Simulate message sending
      console.log(`📱 Sending ${platform} message:`, message);
      
      // In real implementation, integrate with actual messaging APIs
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, messageId: Date.now() };
    } catch (error) {
      throw new Error('Message service failed: ' + error.message);
    }
  }
  
  async executeApiService(userId, params) {
    try {
      const { endpoint, symbol } = params;
      
      // Simulate API call
      console.log(`📊 Fetching data for:`, symbol);
      
      // In real implementation, make actual API calls
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { 
        success: true, 
        data: { symbol, price: Math.random() * 1000 }
      };
    } catch (error) {
      throw new Error('API service failed: ' + error.message);
    }
  }
  
  async executeAiService(userId, params) {
    try {
      const { analysis_type, data } = params;
      
      // Simulate AI analysis
      console.log(`🤖 Running AI analysis:`, analysis_type);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return { 
        success: true, 
        analysis: `AI analysis complete for ${analysis_type}`
      };
    } catch (error) {
      throw new Error('AI service failed: ' + error.message);
    }
  }
  
  // === UI INTEGRATION ===
  
  setupCreditsUI() {
    // Create credits display if it doesn't exist
    this.createCreditsDisplay();
    
    // Set up event listeners
    this.setupCreditsEvents();
  }
  
  createCreditsDisplay() {
    // Check if credits display already exists
    if (BugProof.safeById('credits-display')) return;
    
    // Find INCENTIVES balance element to add credits next to it
    const incentivesBalance = BugProof.safeById('incentives-balance');
    if (!incentivesBalance) return;
    
    // Create credits display
    const creditsDisplay = document.createElement('div');
    creditsDisplay.id = 'credits-display';
    creditsDisplay.className = 'incentives-bal';
    creditsDisplay.style.marginRight = '12px';
    creditsDisplay.innerHTML = `
      <span class="incv-icon">💳</span>
      <span id="credits-amount" class="mono">0</span>
      <span class="incv-label">CREDITS</span>
    `;
    
    // Add click handler for credits menu
    creditsDisplay.onclick = () => this.openCreditsMenu();
    
    // Insert before INCENTIVES display
    incentivesBalance.parentNode.insertBefore(creditsDisplay, incentivesBalance);
  }
  
  setupCreditsEvents() {
    // Add conversion button to INCENTIVES display
    const incentivesBalance = BugProof.safeById('incentives-balance');
    if (incentivesBalance) {
      incentivesBalance.addEventListener('click', (e) => {
        if (e.shiftKey) { // Shift+click to open conversion
          e.preventDefault();
          this.openConversionModal();
        }
      });
    }
  }
  
  updateCreditsUI(userId = 'default') {
    const balance = this.getCreditsBalance(userId);
    const creditsAmount = BugProof.safeById('credits-amount');
    
    if (creditsAmount) {
      creditsAmount.textContent = balance.toLocaleString();
      
      // Animate balance change
      creditsAmount.style.transform = 'scale(1.1)';
      setTimeout(() => {
        creditsAmount.style.transform = 'scale(1)';
      }, 200);
    }
  }
  
  openCreditsMenu() {
    // Create credits menu modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="credits-modal" onclick="event.stopPropagation()">
        <h2>💳 Credits Management</h2>
        
        <div class="credits-balance">
          <div class="balance-row">
            <span>Credits Balance:</span>
            <span class="mono">${this.getCreditsBalance('default')}</span>
          </div>
          <div class="balance-row">
            <span>INCENTIVES Balance:</span>
            <span class="mono">${BugProof.safeGet(window.TokenEconomy, 'getBalance', () => 0)()}</span>
          </div>
        </div>
        
        <div class="credits-actions">
          <button onclick="creditsSystem.openConversionModal(); this.closest('.modal-overlay').remove()">
            🔄 Convert INCENTIVES → Credits
          </button>
          <button onclick="creditsSystem.showTransactionHistory(); this.closest('.modal-overlay').remove()">
            📜 Transaction History
          </button>
          <button onclick="creditsSystem.showServicePrices(); this.closest('.modal-overlay').remove()">
            💰 Service Prices
          </button>
        </div>
        
        <button onclick="this.closest('.modal-overlay').remove()" style="margin-top: 16px;">
          Close
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.onclick = () => modal.remove();
  }
  
  openConversionModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="credits-modal" onclick="event.stopPropagation()">
        <h2>🔄 Convert to Credits</h2>
        <p>Exchange rate: 1 INCENTIVES = ${this.conversionRate} Credits</p>
        
        <div class="conversion-form">
          <label>INCENTIVES to convert:</label>
          <input type="number" id="incentives-to-convert" min="1" step="1" value="10">
          
          <div class="conversion-preview">
            <span>You will receive: </span>
            <span id="credits-preview" class="mono">100</span>
            <span> Credits</span>
          </div>
          
          <button onclick="creditsSystem.executeConversion(); this.closest('.modal-overlay').remove()">
            ✅ Convert Now
          </button>
        </div>
        
        <button onclick="this.closest('.modal-overlay').remove()" style="margin-top: 16px;">
          Cancel
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Set up preview updates
    const input = modal.querySelector('#incentives-to-convert');
    const preview = modal.querySelector('#credits-preview');
    
    input.oninput = () => {
      const amount = parseFloat(input.value) || 0;
      preview.textContent = (amount * this.conversionRate).toLocaleString();
    };
    
    modal.onclick = () => modal.remove();
  }
  
  async executeConversion() {
    const input = BugProof.safeQuery('#incentives-to-convert input[type="number"]');
    const amount = parseFloat(input?.value || 0);
    
    if (amount <= 0) {
      BugProof.safeCall(showNotification, null, 'Please enter a valid amount', 'warning');
      return;
    }
    
    const result = await this.convertIncentivesToCredits('default', amount);
    if (result.success) {
      // Update both displays
      this.updateCreditsUI('default');
      if (window.TokenEconomy && typeof TokenEconomy.updateBalanceUI === 'function') {
        TokenEconomy.updateBalanceUI();
      }
    }
  }
  
  // === DATA PERSISTENCE ===
  
  async loadCreditsData() {
    try {
      const data = BugProof.safeStorage.get('incentives_credits_data', {});
      
      if (data.userCredits) {
        this.userCredits = new Map(data.userCredits);
      }
      
      if (data.transactions) {
        this.transactions = data.transactions;
      }
      
      if (data.conversionRate) {
        this.conversionRate = data.conversionRate;
      }
      
    } catch (error) {
      console.warn('Failed to load credits data:', error);
    }
  }
  
  async saveCreditsData() {
    try {
      const data = {
        userCredits: Array.from(this.userCredits.entries()),
        transactions: this.transactions.slice(-1000), // Keep last 1000 transactions
        conversionRate: this.conversionRate,
        lastSaved: Date.now()
      };
      
      BugProof.safeStorage.set('incentives_credits_data', data);
    } catch (error) {
      console.warn('Failed to save credits data:', error);
    }
  }
  
  recordTransaction(transaction) {
    this.transactions.push(transaction);
    this.saveCreditsData();
  }
  
  // === UTILITY METHODS ===
  
  showTransactionHistory() {
    console.log('📜 Transaction History:', this.transactions);
    BugProof.safeCall(showNotification, null, 'Transaction history logged to console', 'info');
  }
  
  showServicePrices() {
    console.log('💰 Service Prices:', this.servicePrices);
    BugProof.safeCall(showNotification, null, 'Service prices logged to console', 'info');
  }
  
  getSystemStats() {
    return {
      totalUsers: this.userCredits.size,
      totalTransactions: this.transactions.length,
      totalCreditsIssued: Array.from(this.userCredits.values()).reduce((sum, balance) => sum + balance, 0),
      conversionRate: this.conversionRate,
      servicesAvailable: this.services.size
    };
  }
}

// === INITIALIZE CREDITS SYSTEM ===
let creditsSystem = null;

// Wait for bug-proof system to be ready
function initCreditsSystem() {
  if (window.BugProof && !creditsSystem) {
    creditsSystem = new IncentivesCredits();
    window.creditsSystem = creditsSystem; // Make globally available
    console.log('💳 Credits system started');
  }
}

// Initialize when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initCreditsSystem, 1000); // Wait for other systems
  });
} else {
  setTimeout(initCreditsSystem, 1000);
}
