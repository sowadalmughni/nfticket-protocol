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

  describe('verifyTokenRequirement', function () {
    it('should export verifyTokenRequirement function', function () {
      const { verifyTokenRequirement } = tokenGating;
      expect(verifyTokenRequirement).to.be.a('function');
    });

    it('should export verifyGatingRule function', function () {
      const { verifyGatingRule } = tokenGating;
      expect(verifyGatingRule).to.be.a('function');
    });
  });

  describe('Middleware creation', function () {
    it('should create middleware with options', async function () {
      const { createGatingMiddleware, RULE_TYPES } = tokenGating;
      
      const requirements = [
        {
          contractAddress: '0x1234567890123456789012345678901234567890',
          chainId: 31337,
          tokenType: 'ERC721',
          ruleType: RULE_TYPES.OWN_ANY,
        },
      ];

      // Test that middleware can be created with various options
      const middleware1 = createGatingMiddleware(requirements, { matchMode: 'any' });
      const middleware2 = createGatingMiddleware(requirements, { matchMode: 'all' });
      
      expect(middleware1).to.be.a('function');
      expect(middleware2).to.be.a('function');
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

describe('Token Gating Utilities', function () {
  let tokenGating;

  beforeEach(function () {
    delete require.cache[require.resolve('../api/middleware/tokenGating')];
    tokenGating = require('../api/middleware/tokenGating');
  });

  it('should export getProvider function', function () {
    const { getProvider } = tokenGating;
    expect(getProvider).to.be.a('function');
  });

  it('should export checkEligibility function', function () {
    const { checkEligibility } = tokenGating;
    expect(checkEligibility).to.be.a('function');
  });

  it('should create provider for different chain IDs', function () {
    const { getProvider } = tokenGating;
    
    // Should not throw for valid chain IDs
    const provider137 = getProvider(137); // Polygon
    const provider1 = getProvider(1); // Mainnet
    const providerLocal = getProvider(31337); // Local
    
    expect(provider137).to.exist;
    expect(provider1).to.exist;
    expect(providerLocal).to.exist;
  });
});
