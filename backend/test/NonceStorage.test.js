/**
 * NonceStorage Service Tests
 * Tests for Redis-based nonce storage with in-memory fallback
 * @author NFTicket Protocol
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('NonceStorage', function () {
  let NonceStorage;

  beforeEach(function () {
    // Clear module cache to get fresh instance
    delete require.cache[require.resolve('../services/NonceStorage')];
    
    // Set development mode to use in-memory storage
    process.env.NODE_ENV = 'development';
    delete process.env.REDIS_URL;
    
    // Import fresh module
    NonceStorage = require('../services/NonceStorage');
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('In-memory storage (development mode)', function () {
    it('should initialize without Redis in development mode', async function () {
      const result = await NonceStorage.initRedis();
      expect(result).to.equal(false);
    });

    it('should mark nonce as used', async function () {
      const nonce = 'test-nonce-123';
      const expiresAt = Math.floor(Date.now() / 1000) + 300;

      const result = await NonceStorage.markNonceUsed(nonce, expiresAt);
      expect(result).to.equal(true);
    });

    it('should detect used nonce', async function () {
      const nonce = 'test-nonce-456';
      const expiresAt = Math.floor(Date.now() / 1000) + 300;

      // Initially not used
      const initialCheck = await NonceStorage.isNonceUsed(nonce);
      expect(initialCheck).to.equal(false);

      // Mark as used
      await NonceStorage.markNonceUsed(nonce, expiresAt);

      // Now should be detected as used
      const afterCheck = await NonceStorage.isNonceUsed(nonce);
      expect(afterCheck).to.equal(true);
    });

    it('should handle multiple nonces independently', async function () {
      const nonce1 = 'nonce-1';
      const nonce2 = 'nonce-2';
      const nonce3 = 'nonce-3';
      const expiresAt = Math.floor(Date.now() / 1000) + 300;

      await NonceStorage.markNonceUsed(nonce1, expiresAt);
      await NonceStorage.markNonceUsed(nonce3, expiresAt);

      expect(await NonceStorage.isNonceUsed(nonce1)).to.equal(true);
      expect(await NonceStorage.isNonceUsed(nonce2)).to.equal(false);
      expect(await NonceStorage.isNonceUsed(nonce3)).to.equal(true);
    });

    it('should return storage stats', async function () {
      const nonce = 'stats-test-nonce';
      const expiresAt = Math.floor(Date.now() / 1000) + 300;

      await NonceStorage.markNonceUsed(nonce, expiresAt);
      
      const stats = await NonceStorage.getStats();
      expect(stats).to.have.property('totalNonces');
      expect(stats).to.have.property('usingRedis');
      expect(stats.usingRedis).to.equal(false);
      expect(stats.totalNonces).to.be.at.least(1);
    });
  });

  describe('Expired nonce cleanup', function () {
    it('should cleanup expired nonces', async function () {
      const expiredNonce = 'expired-nonce';
      const validNonce = 'valid-nonce';
      
      // Set one expired (in the past)
      const pastExpiry = Math.floor(Date.now() / 1000) - 60;
      const futureExpiry = Math.floor(Date.now() / 1000) + 300;

      await NonceStorage.markNonceUsed(expiredNonce, pastExpiry);
      await NonceStorage.markNonceUsed(validNonce, futureExpiry);

      // Run cleanup
      NonceStorage.cleanupExpiredNonces();

      // Expired should be removed, valid should remain
      expect(await NonceStorage.isNonceUsed(expiredNonce)).to.equal(false);
      expect(await NonceStorage.isNonceUsed(validNonce)).to.equal(true);
    });
  });

  describe('Generate nonce', function () {
    it('should generate unique nonces', async function () {
      const nonces = new Set();
      
      for (let i = 0; i < 100; i++) {
        const nonce = NonceStorage.generateNonce();
        expect(nonces.has(nonce)).to.equal(false);
        nonces.add(nonce);
      }

      expect(nonces.size).to.equal(100);
    });

    it('should generate nonces of expected format', async function () {
      const nonce = NonceStorage.generateNonce();
      
      // Should be a hex string
      expect(nonce).to.match(/^[a-f0-9]+$/);
      
      // Should be reasonable length (32 bytes = 64 hex chars)
      expect(nonce.length).to.be.at.least(32);
    });
  });
});

describe('NonceStorage with Redis URL', function () {
  beforeEach(function () {
    delete require.cache[require.resolve('../services/NonceStorage')];
    process.env.NODE_ENV = 'production';
    // Use invalid URL to test fallback
    process.env.REDIS_URL = 'redis://invalid-host:6379';
  });

  afterEach(function () {
    delete process.env.REDIS_URL;
    process.env.NODE_ENV = 'development';
  });

  it('should fallback to in-memory when Redis unavailable', async function () {
    this.timeout(5000); // Allow time for connection attempt
    
    const NonceStorage = require('../services/NonceStorage');
    
    // This should fail to connect but not throw
    const result = await NonceStorage.initRedis();
    
    // Falls back gracefully
    expect(result).to.equal(false);
    
    // Should still work with in-memory fallback
    const nonce = 'fallback-test';
    await NonceStorage.markNonceUsed(nonce, Math.floor(Date.now() / 1000) + 300);
    expect(await NonceStorage.isNonceUsed(nonce)).to.equal(true);
  });
});
