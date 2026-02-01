/**
 * Redis-based Nonce Storage Service
 * Persistent storage for rotating QR code nonces
 * Replaces in-memory Map with Redis for production use
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const NONCE_PREFIX = 'nfticket:nonce:';
const NONCE_TTL_SECONDS = 300; // 5 minutes - longer than proof expiration for safety

let redisClient = null;
let useRedis = false;

// In-memory fallback for development
const inMemoryNonces = new Map();

/**
 * Initialize Redis connection
 */
async function initRedis() {
  if (process.env.NODE_ENV === 'development' && !process.env.REDIS_URL) {
    console.log('[NonceStorage] Using in-memory storage (development mode)');
    return false;
  }

  try {
    const { createClient } = require('redis');
    
    redisClient = createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('[NonceStorage] Max Redis reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('[NonceStorage] Redis error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('[NonceStorage] Connected to Redis');
    });

    redisClient.on('reconnecting', () => {
      console.log('[NonceStorage] Reconnecting to Redis...');
    });

    await redisClient.connect();
    useRedis = true;
    return true;
  } catch (error) {
    console.warn('[NonceStorage] Redis not available, falling back to in-memory:', error.message);
    return false;
  }
}

/**
 * Mark a nonce as used
 * @param {string} nonce - The nonce to mark as used
 * @param {number} expiresAt - Unix timestamp when nonce expires
 */
async function markNonceUsed(nonce, expiresAt) {
  const nonceKey = `${NONCE_PREFIX}${nonce}`;
  
  if (useRedis && redisClient) {
    try {
      // Set with TTL based on expiration
      const ttl = Math.max(expiresAt - Math.floor(Date.now() / 1000), 1);
      await redisClient.setEx(nonceKey, ttl, String(expiresAt));
      return true;
    } catch (error) {
      console.error('[NonceStorage] Redis setEx error:', error.message);
      // Fall back to in-memory
      inMemoryNonces.set(nonce, expiresAt);
      return true;
    }
  }

  // In-memory fallback
  inMemoryNonces.set(nonce, expiresAt);
  return true;
}

/**
 * Check if a nonce has been used
 * @param {string} nonce - The nonce to check
 * @returns {Promise<boolean>} True if nonce was already used
 */
async function isNonceUsed(nonce) {
  const nonceKey = `${NONCE_PREFIX}${nonce}`;
  
  if (useRedis && redisClient) {
    try {
      const result = await redisClient.get(nonceKey);
      return result !== null;
    } catch (error) {
      console.error('[NonceStorage] Redis get error:', error.message);
      // Fall back to in-memory check
      return inMemoryNonces.has(nonce);
    }
  }

  // In-memory fallback
  return inMemoryNonces.has(nonce);
}

/**
 * Cleanup expired nonces (for in-memory fallback only)
 * Redis handles TTL automatically
 */
function cleanupExpiredNonces() {
  if (useRedis) return; // Redis handles TTL automatically

  const now = Math.floor(Date.now() / 1000);
  let cleaned = 0;
  
  for (const [nonce, expiresAt] of inMemoryNonces.entries()) {
    if (expiresAt < now) {
      inMemoryNonces.delete(nonce);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[NonceStorage] Cleaned ${cleaned} expired nonces. Active: ${inMemoryNonces.size}`);
  }
}

/**
 * Get storage stats
 */
async function getStats() {
  if (useRedis && redisClient) {
    try {
      const keys = await redisClient.keys(`${NONCE_PREFIX}*`);
      return {
        type: 'redis',
        activeNonces: keys.length,
        connected: redisClient.isOpen,
      };
    } catch (error) {
      return {
        type: 'redis',
        activeNonces: 0,
        connected: false,
        error: error.message,
      };
    }
  }

  return {
    type: 'in-memory',
    activeNonces: inMemoryNonces.size,
    connected: true,
  };
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('[NonceStorage] Redis connection closed');
    } catch (error) {
      console.error('[NonceStorage] Error closing Redis:', error.message);
    }
  }
}

// Start cleanup interval for in-memory fallback
setInterval(cleanupExpiredNonces, 60000);

module.exports = {
  initRedis,
  markNonceUsed,
  isNonceUsed,
  cleanupExpiredNonces,
  getStats,
  shutdown,
};
