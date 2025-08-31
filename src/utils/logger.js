// Simple console logger for development
const logger = {
  info: (...args) => {
    console.log(`[${new Date().toISOString()}] INFO:`, ...args);
  },
  
  error: (...args) => {
    console.error(`[${new Date().toISOString()}] ERROR:`, ...args);
  },
  
  warn: (...args) => {
    console.warn(`[${new Date().toISOString()}] WARN:`, ...args);
  },
  
  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${new Date().toISOString()}] DEBUG:`, ...args);
    }
  }
};

module.exports = { logger };