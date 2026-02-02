/**
 * Loyalty Routes
 * API endpoints for loyalty points management
 * @author Sowad Al-Mughni
 */

const express = require('express');
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { getPrisma } = require('../../prisma/client');

const JWT_SECRET = process.env.JWT_SECRET || 'nfticket-secret-key';

// Multi-chain RPC configuration
const RPC_ENDPOINTS = {
  1: process.env.ETHEREUM_RPC || 'https://eth.llamarpc.com',
  137: process.env.POLYGON_RPC || 'https://polygon.llamarpc.com',
  8453: process.env.BASE_RPC || 'https://mainnet.base.org',
  42161: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
  11155111: process.env.SEPOLIA_RPC || 'https://rpc.sepolia.org',
  80002: process.env.AMOY_RPC || 'https://rpc-amoy.polygon.technology',
  31337: 'http://127.0.0.1:8545',
};

// LoyaltyPoints contract addresses per chain
const LOYALTY_CONTRACTS = {
  31337: process.env.LOYALTY_CONTRACT_LOCAL || null,
  11155111: process.env.LOYALTY_CONTRACT_SEPOLIA || null,
  137: process.env.LOYALTY_CONTRACT_POLYGON || null,
  8453: process.env.LOYALTY_CONTRACT_BASE || null,
};

// LoyaltyPoints ABI (minimal for read operations)
const LOYALTY_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function getTier(address user) view returns (string tierName, uint256 discountBps)',
  'function pointsToNextTier(address user) view returns (uint256 needed, string nextTierName)',
  'function getAllTiers() view returns (tuple(string name, uint256 threshold, uint256 discountBps)[])',
  'function getEarningHistory(address user, uint256 limit) view returns (tuple(uint256 amount, string reason, uint256 timestamp)[])',
  'function getRedemptionHistory(address user, uint256 limit) view returns (tuple(uint256 amount, string reward, uint256 timestamp)[])',
  'function pointsPerTicketPurchase() view returns (uint256)',
  'function pointsPerAttendance() view returns (uint256)',
  'function pointsPerPOAP() view returns (uint256)',
  'function pointsPerReferral() view returns (uint256)',
];

// Provider cache
const providers = {};

function getProvider(chainId) {
  if (!providers[chainId]) {
    const rpc = RPC_ENDPOINTS[chainId];
    if (!rpc) throw new Error(`Unsupported chain: ${chainId}`);
    providers[chainId] = new ethers.JsonRpcProvider(rpc);
  }
  return providers[chainId];
}

function getLoyaltyContract(chainId) {
  const address = LOYALTY_CONTRACTS[chainId];
  if (!address) return null;
  
  const provider = getProvider(chainId);
  return new ethers.Contract(address, LOYALTY_ABI, provider);
}

// JWT verification middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// In-memory points tracking (for development/demo)
// In production, use PostgreSQL or query on-chain
const offChainPoints = new Map();
const earningHistory = new Map();
const redemptionHistory = new Map();

async function getOrCreateAccount(prisma, address) {
  return prisma.loyaltyAccount.upsert({
    where: { walletAddress: address },
    create: { walletAddress: address },
    update: {}
  });
}

// Initialize user points
function initUser(address) {
  const addr = address.toLowerCase();
  if (!offChainPoints.has(addr)) {
    offChainPoints.set(addr, 0);
    earningHistory.set(addr, []);
    redemptionHistory.set(addr, []);
  }
}

// ============ Public Routes ============

/**
 * GET /loyalty/tiers
 * Get all available tiers
 */
router.get('/tiers', async (req, res) => {
  try {
    const chainId = parseInt(req.query.chainId) || 31337;
    const contract = getLoyaltyContract(chainId);

    if (contract) {
      // Fetch from contract
      const tiers = await contract.getAllTiers();
      return res.json({
        tiers: tiers.map(t => ({
          name: t.name,
          threshold: Number(t.threshold),
          discountPercent: Number(t.discountBps) / 100,
        })),
      });
    }

    // Default tiers (off-chain)
    res.json({
      tiers: [
        { name: 'Bronze', threshold: 0, discountPercent: 0 },
        { name: 'Silver', threshold: 500, discountPercent: 5 },
        { name: 'Gold', threshold: 2000, discountPercent: 10 },
        { name: 'Platinum', threshold: 5000, discountPercent: 15 },
        { name: 'Diamond', threshold: 10000, discountPercent: 25 },
      ],
    });
  } catch (error) {
    console.error('Fetch tiers error:', error);
    res.status(500).json({ error: 'Failed to fetch tiers' });
  }
});

/**
 * GET /loyalty/earning-rates
 * Get current earning rates
 */
router.get('/earning-rates', async (req, res) => {
  try {
    const chainId = parseInt(req.query.chainId) || 31337;
    const contract = getLoyaltyContract(chainId);

    if (contract) {
      const [ticketPurchase, attendance, poap, referral] = await Promise.all([
        contract.pointsPerTicketPurchase(),
        contract.pointsPerAttendance(),
        contract.pointsPerPOAP(),
        contract.pointsPerReferral(),
      ]);

      return res.json({
        ticketPurchase: Number(ticketPurchase),
        attendance: Number(attendance),
        poap: Number(poap),
        referral: Number(referral),
      });
    }

    // Default rates (off-chain)
    res.json({
      ticketPurchase: 100,
      attendance: 50,
      poap: 25,
      referral: 200,
    });
  } catch (error) {
    console.error('Fetch earning rates error:', error);
    res.status(500).json({ error: 'Failed to fetch earning rates' });
  }
});

// ============ Authenticated Routes ============

/**
 * GET /loyalty/balance
 * Get user's points balance and tier
 */
router.get('/balance', verifyToken, async (req, res) => {
  try {
    const address = req.user.address.toLowerCase();
    const chainId = parseInt(req.query.chainId) || 31337;

    const contract = getLoyaltyContract(chainId);
    if (contract) {
      const [balance, tier, nextTier] = await Promise.all([
        contract.balanceOf(address),
        contract.getTier(address),
        contract.pointsToNextTier(address),
      ]);

      return res.json({
        points: Number(balance),
        tier: {
          name: tier.tierName,
          discountPercent: Number(tier.discountBps) / 100,
        },
        nextTier: {
          name: nextTier.nextTierName,
          pointsNeeded: Number(nextTier.needed),
        },
      });
    }

    const prisma = getPrisma();
    if (prisma) {
      const account = await getOrCreateAccount(prisma, address);
      const points = account.points || 0;

      const tiers = [
        { name: 'Bronze', threshold: 0, discountPercent: 0 },
        { name: 'Silver', threshold: 500, discountPercent: 5 },
        { name: 'Gold', threshold: 2000, discountPercent: 10 },
        { name: 'Platinum', threshold: 5000, discountPercent: 15 },
        { name: 'Diamond', threshold: 10000, discountPercent: 25 },
      ];

      let currentTier = tiers[0];
      let nextTier = tiers[1];

      for (let i = tiers.length - 1; i >= 0; i--) {
        if (points >= tiers[i].threshold) {
          currentTier = tiers[i];
          nextTier = tiers[i + 1] || null;
          break;
        }
      }

      return res.json({
        points,
        tier: currentTier,
        nextTier: nextTier ? {
          name: nextTier.name,
          pointsNeeded: nextTier.threshold - points,
        } : null,
      });
    }

    initUser(address);

    // Off-chain points
    const points = offChainPoints.get(address) || 0;
    const tiers = [
      { name: 'Bronze', threshold: 0, discountPercent: 0 },
      { name: 'Silver', threshold: 500, discountPercent: 5 },
      { name: 'Gold', threshold: 2000, discountPercent: 10 },
      { name: 'Platinum', threshold: 5000, discountPercent: 15 },
      { name: 'Diamond', threshold: 10000, discountPercent: 25 },
    ];

    let currentTier = tiers[0];
    let nextTier = tiers[1];

    for (let i = tiers.length - 1; i >= 0; i--) {
      if (points >= tiers[i].threshold) {
        currentTier = tiers[i];
        nextTier = tiers[i + 1] || null;
        break;
      }
    }

    res.json({
      points,
      tier: currentTier,
      nextTier: nextTier ? {
        name: nextTier.name,
        pointsNeeded: nextTier.threshold - points,
      } : null,
    });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

/**
 * GET /loyalty/history
 * Get user's earning and redemption history
 */
router.get('/history', verifyToken, async (req, res) => {
  try {
    const address = req.user.address.toLowerCase();
    const limit = parseInt(req.query.limit) || 20;
    const chainId = parseInt(req.query.chainId) || 31337;

    const contract = getLoyaltyContract(chainId);
    if (contract) {
      const [earnings, redemptions] = await Promise.all([
        contract.getEarningHistory(address, limit),
        contract.getRedemptionHistory(address, limit),
      ]);

      return res.json({
        earnings: earnings.map(e => ({
          amount: Number(e.amount),
          reason: e.reason,
          timestamp: Number(e.timestamp) * 1000,
        })),
        redemptions: redemptions.map(r => ({
          amount: Number(r.amount),
          reward: r.reward,
          timestamp: Number(r.timestamp) * 1000,
        })),
      });
    }

    const prisma = getPrisma();
    if (prisma) {
      const [earnings, redemptions] = await Promise.all([
        prisma.loyaltyEarning.findMany({
          where: { walletAddress: address },
          orderBy: { timestamp: 'desc' },
          take: limit,
        }),
        prisma.loyaltyRedemption.findMany({
          where: { walletAddress: address },
          orderBy: { timestamp: 'desc' },
          take: limit,
        })
      ]);

      return res.json({
        earnings: earnings.map(e => ({
          amount: e.amount,
          reason: e.reason,
          timestamp: new Date(e.timestamp).getTime(),
        })),
        redemptions: redemptions.map(r => ({
          amount: r.amount,
          reward: r.reward,
          timestamp: new Date(r.timestamp).getTime(),
        })),
      });
    }

    initUser(address);

    // Off-chain history
    res.json({
      earnings: earningHistory.get(address) || [],
      redemptions: redemptionHistory.get(address) || [],
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * POST /loyalty/redeem
 * Redeem points for a reward
 */
router.post('/redeem', verifyToken, async (req, res) => {
  try {
    const address = req.user.address.toLowerCase();
    const { amount, reward } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!reward) {
      return res.status(400).json({ error: 'Reward description required' });
    }

    const prisma = getPrisma();
    if (prisma) {
      const account = await getOrCreateAccount(prisma, address);
      if (account.points < amount) {
        return res.status(400).json({ error: 'Insufficient points' });
      }

      const [updated] = await prisma.$transaction([
        prisma.loyaltyAccount.update({
          where: { walletAddress: address },
          data: { points: { decrement: amount } }
        }),
        prisma.loyaltyRedemption.create({
          data: { walletAddress: address, amount, reward }
        })
      ]);

      return res.json({
        success: true,
        newBalance: updated.points,
        redemption: { amount, reward },
      });
    }

    initUser(address);

    const currentPoints = offChainPoints.get(address) || 0;
    if (currentPoints < amount) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    offChainPoints.set(address, currentPoints - amount);

    const history = redemptionHistory.get(address) || [];
    history.unshift({
      amount,
      reward,
      timestamp: Date.now(),
    });
    redemptionHistory.set(address, history);

    res.json({
      success: true,
      newBalance: offChainPoints.get(address),
      redemption: { amount, reward },
    });
  } catch (error) {
    console.error('Redeem error:', error);
    res.status(500).json({ error: 'Failed to redeem points' });
  }
});

// ============ Internal/Admin Routes ============

/**
 * POST /loyalty/award
 * Award points to a user (internal use)
 */
router.post('/award', async (req, res) => {
  try {
    const { address, amount, reason, apiKey } = req.body;

    // Simple API key auth for internal services
    const internalKey = process.env.INTERNAL_API_KEY || 'internal-key';
    if (apiKey !== internalKey) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const addr = address.toLowerCase();
    const prisma = getPrisma();

    if (prisma) {
      await getOrCreateAccount(prisma, addr);

      const [updated] = await prisma.$transaction([
        prisma.loyaltyAccount.update({
          where: { walletAddress: addr },
          data: { points: { increment: amount } }
        }),
        prisma.loyaltyEarning.create({
          data: { walletAddress: addr, amount, reason: reason || 'Points Awarded' }
        })
      ]);

      return res.json({
        success: true,
        newBalance: updated.points,
        awarded: { amount, reason },
      });
    }

    initUser(addr);

    const currentPoints = offChainPoints.get(addr) || 0;
    offChainPoints.set(addr, currentPoints + amount);

    const history = earningHistory.get(addr) || [];
    history.unshift({
      amount,
      reason: reason || 'Points Awarded',
      timestamp: Date.now(),
    });
    earningHistory.set(addr, history);

    res.json({
      success: true,
      newBalance: offChainPoints.get(addr),
      awarded: { amount, reason },
    });
  } catch (error) {
    console.error('Award error:', error);
    res.status(500).json({ error: 'Failed to award points' });
  }
});

/**
 * GET /loyalty/leaderboard
 * Get top point holders
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const prisma = getPrisma();
    if (prisma) {
      const accounts = await prisma.loyaltyAccount.findMany({
        orderBy: { points: 'desc' },
        take: limit,
      });

      return res.json({
        leaderboard: accounts.map((e, index) => ({
          rank: index + 1,
          address: e.walletAddress,
          points: e.points,
        }))
      });
    }

    // Convert map to sorted array
    const entries = Array.from(offChainPoints.entries())
      .map(([address, points]) => ({ address, points }))
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);

    res.json({
      leaderboard: entries.map((e, index) => ({
        rank: index + 1,
        address: e.address,
        points: e.points,
      })),
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * GET /loyalty/stats
 * Get overall loyalty program stats
 */
router.get('/stats', async (req, res) => {
  try {
    const prisma = getPrisma();
    if (prisma) {
      const accounts = await prisma.loyaltyAccount.findMany({
        select: { points: true }
      });

      const totalUsers = accounts.length;
      const totalPoints = accounts.reduce((sum, a) => sum + (a.points || 0), 0);

      const tierCounts = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0, Diamond: 0 };
      const thresholds = { Diamond: 10000, Platinum: 5000, Gold: 2000, Silver: 500, Bronze: 0 };

      for (const account of accounts) {
        for (const [tier, threshold] of Object.entries(thresholds)) {
          if (account.points >= threshold) {
            tierCounts[tier]++;
            break;
          }
        }
      }

      return res.json({
        totalUsers,
        totalPoints,
        averagePoints: totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0,
        tierDistribution: tierCounts,
      });
    }

    const totalUsers = offChainPoints.size;
    const totalPoints = Array.from(offChainPoints.values()).reduce((sum, p) => sum + p, 0);
    
    // Count users by tier
    const tierCounts = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0, Diamond: 0 };
    const thresholds = { Diamond: 10000, Platinum: 5000, Gold: 2000, Silver: 500, Bronze: 0 };

    for (const points of offChainPoints.values()) {
      for (const [tier, threshold] of Object.entries(thresholds)) {
        if (points >= threshold) {
          tierCounts[tier]++;
          break;
        }
      }
    }

    res.json({
      totalUsers,
      totalPoints,
      averagePoints: totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0,
      tierDistribution: tierCounts,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
