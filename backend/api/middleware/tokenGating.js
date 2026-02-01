/**
 * Token Gating Middleware
 * Verifies NFT/POAP ownership for exclusive content access
 * @author Sowad Al-Mughni
 */

const { ethers } = require('ethers');

// Multi-chain RPC configuration (reuse from SignerService)
const RPC_URLS = {
  1: process.env.RPC_URL_MAINNET || 'https://rpc.ankr.com/eth',
  137: process.env.RPC_URL_POLYGON || 'https://rpc.ankr.com/polygon',
  8453: process.env.RPC_URL_BASE || 'https://mainnet.base.org',
  42161: process.env.RPC_URL_ARBITRUM || 'https://arb1.arbitrum.io/rpc',
  11155111: process.env.RPC_URL_SEPOLIA || 'https://rpc.ankr.com/eth_sepolia',
  84532: process.env.RPC_URL_BASE_SEPOLIA || 'https://sepolia.base.org',
  421614: process.env.RPC_URL_ARBITRUM_SEPOLIA || 'https://sepolia-rollup.arbitrum.io/rpc',
  31337: process.env.RPC_URL || 'http://127.0.0.1:8545',
};

// Minimal ABIs for token verification
const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
];

const ERC1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
];

// Provider cache
const providers = new Map();

function getProvider(chainId) {
  if (!providers.has(chainId)) {
    const rpcUrl = RPC_URLS[chainId] || RPC_URLS[31337];
    providers.set(chainId, new ethers.JsonRpcProvider(rpcUrl));
  }
  return providers.get(chainId);
}

/**
 * Gating rule types
 */
const RULE_TYPES = {
  OWN_ANY: 'own_any',           // Own at least 1 token from contract
  OWN_SPECIFIC: 'own_specific', // Own a specific token ID
  OWN_MIN: 'own_min',           // Own at least N tokens
  OWN_ALL: 'own_all',           // Own all specified tokens
};

/**
 * Verify a single token requirement
 */
async function verifyTokenRequirement(walletAddress, requirement) {
  const { contractAddress, chainId, tokenType, ruleType, tokenId, minCount } = requirement;
  
  const provider = getProvider(chainId || 31337);
  const abi = tokenType === 'ERC1155' ? ERC1155_ABI : ERC721_ABI;
  const contract = new ethers.Contract(contractAddress, abi, provider);

  try {
    switch (ruleType) {
      case RULE_TYPES.OWN_ANY: {
        const balance = await contract.balanceOf(walletAddress);
        return { 
          valid: balance > 0n,
          balance: Number(balance),
          requirement 
        };
      }

      case RULE_TYPES.OWN_SPECIFIC: {
        if (tokenType === 'ERC1155') {
          const balance = await contract.balanceOf(walletAddress, tokenId);
          return { 
            valid: balance > 0n,
            balance: Number(balance),
            requirement 
          };
        } else {
          const owner = await contract.ownerOf(tokenId);
          return { 
            valid: owner.toLowerCase() === walletAddress.toLowerCase(),
            isOwner: owner.toLowerCase() === walletAddress.toLowerCase(),
            requirement 
          };
        }
      }

      case RULE_TYPES.OWN_MIN: {
        const balance = await contract.balanceOf(walletAddress);
        return { 
          valid: balance >= BigInt(minCount || 1),
          balance: Number(balance),
          required: minCount,
          requirement 
        };
      }

      default:
        return { valid: false, error: 'Unknown rule type', requirement };
    }
  } catch (error) {
    console.error(`Token verification error for ${contractAddress}:`, error.message);
    return { valid: false, error: error.message, requirement };
  }
}

/**
 * Verify all token requirements for a gating rule
 */
async function verifyGatingRule(walletAddress, gatingRule) {
  const { requirements, requireAll } = gatingRule;
  
  const results = await Promise.all(
    requirements.map(req => verifyTokenRequirement(walletAddress, req))
  );

  const passed = requireAll 
    ? results.every(r => r.valid)
    : results.some(r => r.valid);

  return {
    passed,
    results,
    rule: gatingRule.id,
    requireAll
  };
}

/**
 * Middleware factory: Create token gating middleware for specific rules
 */
function createGatingMiddleware(gatingRules) {
  return async (req, res, next) => {
    const walletAddress = req.user?.address;

    if (!walletAddress) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Get the rule ID from route params or query
    const ruleId = req.params.ruleId || req.query.ruleId;
    
    if (!ruleId) {
      return res.status(400).json({ 
        error: 'Gating rule ID required',
        code: 'RULE_ID_REQUIRED'
      });
    }

    const rule = gatingRules.find(r => r.id === ruleId);
    
    if (!rule) {
      return res.status(404).json({ 
        error: 'Gating rule not found',
        code: 'RULE_NOT_FOUND'
      });
    }

    try {
      const verification = await verifyGatingRule(walletAddress, rule);

      if (!verification.passed) {
        return res.status(403).json({
          error: 'Token requirements not met',
          code: 'ACCESS_DENIED',
          details: verification.results.filter(r => !r.valid),
          requiredTokens: rule.requirements.map(r => ({
            contract: r.contractAddress,
            chainId: r.chainId,
            type: r.ruleType
          }))
        });
      }

      // Add verification result to request for downstream use
      req.gatingVerification = verification;
      next();
    } catch (error) {
      console.error('Gating verification error:', error);
      return res.status(500).json({ 
        error: 'Verification failed',
        code: 'VERIFICATION_ERROR'
      });
    }
  };
}

/**
 * Check eligibility without blocking (for UI display)
 */
async function checkEligibility(walletAddress, gatingRules) {
  const results = await Promise.all(
    gatingRules.map(async (rule) => {
      const verification = await verifyGatingRule(walletAddress, rule);
      return {
        ruleId: rule.id,
        name: rule.name,
        description: rule.description,
        eligible: verification.passed,
        reward: rule.reward,
        details: verification.results
      };
    })
  );

  return {
    wallet: walletAddress,
    eligibleCount: results.filter(r => r.eligible).length,
    totalRules: results.length,
    rules: results
  };
}

module.exports = {
  RULE_TYPES,
  verifyTokenRequirement,
  verifyGatingRule,
  createGatingMiddleware,
  checkEligibility,
  getProvider,
};
