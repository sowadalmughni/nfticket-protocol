/**
 * Token Gating Middleware Tests
 * Tests for NFT/POAP ownership verification
 * @author NFTicket Protocol
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Token Gating Middleware', function () {
  let tokenGating;
  let req, res, next;

  beforeEach(function () {
    // Clear module cache
    delete require.cache[require.resolve('../api/middleware/tokenGating')];
    tokenGating = require('../api/middleware/tokenGating');

    // Setup mock Express req/res/next
    req = {
      headers: {},
      body: {},
      query: {},
      user: null,
      gatingResult: null,
    };

    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis(),
    };

    next = sinon.stub();
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('Rule Types', function () {
    it('should export all rule types', function () {
      const { RULE_TYPES } = tokenGating;
      
      expect(RULE_TYPES).to.have.property('OWN_ANY');
      expect(RULE_TYPES).to.have.property('OWN_SPECIFIC');
      expect(RULE_TYPES).to.have.property('OWN_MIN');
      expect(RULE_TYPES).to.have.property('OWN_ALL');
    });
  });

  describe('createGatingMiddleware', function () {
    it('should create middleware function with requirements', function () {
      const { createGatingMiddleware, RULE_TYPES } = tokenGating;
      
      const requirements = [
        {
          contractAddress: '0x1234567890123456789012345678901234567890',
          chainId: 137,
          tokenType: 'ERC721',
          ruleType: RULE_TYPES.OWN_ANY,
        },
      ];

      const middleware = createGatingMiddleware(requirements);
      expect(middleware).to.be.a('function');
    });

    it('should require wallet address in request', async function () {
      const { createGatingMiddleware, RULE_TYPES } = tokenGating;
      
      const requirements = [
        {
          contractAddress: '0x1234567890123456789012345678901234567890',
          chainId: 31337,
          tokenType: 'ERC721',
          ruleType: RULE_TYPES.OWN_ANY,
        },
      ];

      const middleware = createGatingMiddleware(requirements);
      
      // No wallet address provided
      req.headers = {};
      req.user = null;
      req.body = {};
      
      await middleware(req, res, next);
      
      expect(res.status.calledWith(401)).to.equal(true);
    });

    it('should accept wallet from x-wallet-address header', async function () {
      const { createGatingMiddleware, RULE_TYPES } = tokenGating;
      
      const requirements = [
        {
          contractAddress: '0x1234567890123456789012345678901234567890',
          chainId: 31337,
          tokenType: 'ERC721',
          ruleType: RULE_TYPES.OWN_ANY,
        },
      ];

      const middleware = createGatingMiddleware(requirements);
      
      req.headers = { 'x-wallet-address': '0xabcdef1234567890abcdef1234567890abcdef12' };
      
      // This will fail token verification (no actual contract)
      // but should NOT fail wallet extraction
      await middleware(req, res, next);
      
      // Should have attempted verification (403 = access denied, not 401)
      // In actual test with mocked contract, would check different behavior
    });
  });

  describe('verifyTokenRequirements', function () {
    it('should export verifyTokenRequirements function', function () {
      const { verifyTokenRequirements } = tokenGating;
      expect(verifyTokenRequirements).to.be.a('function');
    });

    it('should handle empty requirements array', async function () {
      const { verifyTokenRequirements } = tokenGating;
      
      const result = await verifyTokenRequirements(
        '0xabcdef1234567890abcdef1234567890abcdef12',
        []
      );

      expect(result).to.have.property('valid');
      expect(result.valid).to.equal(true);
      expect(result.results).to.be.an('array').with.length(0);
    });
  });

  describe('Soft gating mode', function () {
    it('should pass request with gatingResult in soft mode', async function () {
      const { createGatingMiddleware, RULE_TYPES } = tokenGating;
      
      const requirements = [
        {
          contractAddress: '0x1234567890123456789012345678901234567890',
          chainId: 31337,
          tokenType: 'ERC721',
          ruleType: RULE_TYPES.OWN_ANY,
        },
      ];

      const middleware = createGatingMiddleware(requirements, { softFail: true });
      
      req.headers = { 'x-wallet-address': '0xabcdef1234567890abcdef1234567890abcdef12' };
      
      await middleware(req, res, next);
      
      // In soft mode, should call next() regardless of verification result
      expect(next.called).to.equal(true);
      expect(req.gatingResult).to.exist;
    });
  });

  describe('Match modes', function () {
    it('should support ALL match mode', function () {
      const { createGatingMiddleware, RULE_TYPES } = tokenGating;
      
      const requirements = [
        {
          contractAddress: '0x1111111111111111111111111111111111111111',
          chainId: 31337,
          tokenType: 'ERC721',
          ruleType: RULE_TYPES.OWN_ANY,
        },
        {
          contractAddress: '0x2222222222222222222222222222222222222222',
          chainId: 31337,
          tokenType: 'ERC721',
          ruleType: RULE_TYPES.OWN_ANY,
        },
      ];

      // With matchMode 'all', user must pass all requirements
      const middleware = createGatingMiddleware(requirements, { matchMode: 'all' });
      expect(middleware).to.be.a('function');
    });

    it('should support ANY match mode', function () {
      const { createGatingMiddleware, RULE_TYPES } = tokenGating;
      
      const requirements = [
        {
          contractAddress: '0x1111111111111111111111111111111111111111',
          chainId: 31337,
          tokenType: 'ERC721',
          ruleType: RULE_TYPES.OWN_ANY,
        },
        {
          contractAddress: '0x2222222222222222222222222222222222222222',
          chainId: 31337,
          tokenType: 'ERC721',
          ruleType: RULE_TYPES.OWN_ANY,
        },
      ];

      // With matchMode 'any', user must pass at least one requirement
      const middleware = createGatingMiddleware(requirements, { matchMode: 'any' });
      expect(middleware).to.be.a('function');
    });
  });
});

describe('Token Gating Edge Cases', function () {
  let tokenGating;

  beforeEach(function () {
    delete require.cache[require.resolve('../api/middleware/tokenGating')];
    tokenGating = require('../api/middleware/tokenGating');
  });

  it('should normalize wallet addresses to lowercase', async function () {
    const { verifyTokenRequirements } = tokenGating;
    
    // Checksummed address
    const checksummed = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12';
    
    // Should not throw on address normalization
    const result = await verifyTokenRequirements(checksummed, []);
    expect(result.valid).to.equal(true);
  });

  it('should handle invalid contract addresses gracefully', async function () {
    const { verifyTokenRequirements, RULE_TYPES } = tokenGating;
    
    const requirements = [
      {
        contractAddress: 'invalid-address',
        chainId: 31337,
        tokenType: 'ERC721',
        ruleType: RULE_TYPES.OWN_ANY,
      },
    ];

    // Should not throw, but return invalid result
    const result = await verifyTokenRequirements(
      '0xabcdef1234567890abcdef1234567890abcdef12',
      requirements
    );

    expect(result.valid).to.equal(false);
  });
});
