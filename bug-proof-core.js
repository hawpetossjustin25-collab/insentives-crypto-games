// === BUG-PROOF CODING FOUNDATION ===
// Prevents common errors and provides safe defaults

window.BugProof = {
  // === SAFE FUNCTION CALLS ===
  safeCall: function(func, defaultReturn = null, ...args) {
    try {
      if (typeof func === 'function') {
        return func(...args);
      }
      console.warn('Function not available:', func);
      return defaultReturn;
    } catch (error) {
      console.warn('Function call failed:', error.message);
      return defaultReturn;
    }
  },

  // === SAFE PROPERTY ACCESS ===
  safeGet: function(obj, path, defaultValue = null) {
    try {
      if (!obj) return defaultValue;
      
      const keys = path.split('.');
      let result = obj;
      
      for (const key of keys) {
        if (result == null || result[key] === undefined) {
          return defaultValue;
        }
        result = result[key];
      }
      
      return result;
    } catch {
      return defaultValue;
    }
  },

  // === SAFE DOM OPERATIONS ===
  safeQuery: function(selector, defaultElement = null) {
    try {
      const element = document.querySelector(selector);
      return element || defaultElement;
    } catch {
      console.warn('DOM query failed:', selector);
      return defaultElement;
    }
  },

  safeById: function(id, defaultElement = null) {
    try {
      const element = document.getElementById(id);
      return element || defaultElement;
    } catch {
      console.warn('getElementById failed:', id);
      return defaultElement;
    }
  },

  // === SAFE API CALLS ===
  safeFetch: async function(url, options = {}, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        if (response.status === 429) {
          // Rate limited - wait and retry
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        return response;
      } catch (error) {
        console.warn(`Fetch attempt ${attempt + 1} failed:`, error.message);
        
        if (attempt === retries - 1) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  },

  // === SAFE STORAGE ===
  safeStorage: {
    get: function(key, defaultValue = null) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
      } catch {
        return defaultValue;
      }
    },
    
    set: function(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn('Storage failed:', error.message);
        return false;
      }
    }
  },

  // === ERROR HANDLER ===
  handleError: function(error, context = 'Unknown') {
    console.error(`[${context}] Error:`, error);
    
    // Show user-friendly message
    this.safeCall(showNotification, null, 
      'Something went wrong - please try again', 'warning'
    );
    
    return false;
  },

  // === ENSURE FUNCTIONS EXIST ===
  ensureFunction: function(name, fallback) {
    const parts = name.split('.');
    let obj = window;
    
    // Navigate to parent object
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    
    // Check if function exists
    const funcName = parts[parts.length - 1];
    if (typeof obj[funcName] !== 'function') {
      obj[funcName] = fallback;
      console.log(`✅ Created missing function: ${name}`);
    }
  },

  // === INITIALIZE SAFETY NETS ===
  init: function() {
    // Create missing showNotification if needed
    this.ensureFunction('showNotification', function(message, type = 'info') {
      console.log(`[${type.toUpperCase()}] ${message}`);
      
      // Simple visual notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        padding: 12px 20px; border-radius: 6px; color: white; font-weight: 600;
        background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#ff9800'};
      `;
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => notification.remove(), 4000);
    });

    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleError(event.error, 'Global Error');
    });

    // Promise rejection handler  
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'Promise Rejection');
      event.preventDefault();
    });

    console.log('🛡️ Bug-proof foundation ready!');
  }
};

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BugProof.init());
} else {
  BugProof.init();
}
