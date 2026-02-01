/**
 * Token-Gated Content Routes
 * Endpoints for exclusive content based on NFT/POAP ownership
 * @author Sowad Al-Mughni
 */

const express = require('express');
const router = express.Router();
const { 
  createGatingMiddleware, 
  checkEligibility, 
  RULE_TYPES 
} = require('../middleware/tokenGating');

// In-memory gating rules storage (move to database in production)
let gatingRules = [
  {
    id: 'vip-lounge',
    name: 'VIP Lounge Access',
    description: 'Exclusive access to VIP streaming lounge',
    requirements: [
      {
        contractAddress: process.env.NFTICKET_CONTRACT || '0x0000000000000000000000000000000000000000',
        chainId: 31337,
        tokenType: 'ERC721',
        ruleType: RULE_TYPES.OWN_ANY,
      }
    ],
    requireAll: true,
    reward: {
      type: 'access',
      contentUrl: '/gated/content/vip-stream',
      name: 'VIP Livestream'
    },
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'loyal-fan',
    name: 'Loyal Fan Perks',
    description: 'Exclusive perks for fans with 3+ POAPs',
    requirements: [
      {
        contractAddress: process.env.POAP_CONTRACT || '0x0000000000000000000000000000000000000000',
        chainId: 31337,
        tokenType: 'ERC721',
        ruleType: RULE_TYPES.OWN_MIN,
        minCount: 3
      }
    ],
    requireAll: true,
    reward: {
      type: 'discount',
      discountPercent: 20,
      name: '20% Off Merchandise'
    },
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'collector-badge',
    name: 'Collector Badge',
    description: 'Special badge for ticket collectors',
    requirements: [
      {
        contractAddress: process.env.NFTICKET_CONTRACT || '0x0000000000000000000000000000000000000000',
        chainId: 31337,
        tokenType: 'ERC721',
        ruleType: RULE_TYPES.OWN_MIN,
        minCount: 5
      }
    ],
    requireAll: true,
    reward: {
      type: 'badge',
      badgeId: 'collector-gold',
      name: 'Gold Collector Badge'
    },
    active: true,
    createdAt: new Date().toISOString()
  }
];

// Create gating middleware with current rules
const gatingMiddleware = () => createGatingMiddleware(gatingRules.filter(r => r.active));

/**
 * GET /gated/rules
 * List all gating rules (public - for UI display)
 */
router.get('/rules', (req, res) => {
  const activeRules = gatingRules.filter(r => r.active).map(rule => ({
    id: rule.id,
    name: rule.name,
    description: rule.description,
    reward: rule.reward,
    requirementsCount: rule.requirements.length,
    requireAll: rule.requireAll
  }));

  res.json({
    count: activeRules.length,
    rules: activeRules
  });
});

/**
 * GET /gated/rules/:ruleId
 * Get detailed rule information
 */
router.get('/rules/:ruleId', (req, res) => {
  const rule = gatingRules.find(r => r.id === req.params.ruleId);
  
  if (!rule) {
    return res.status(404).json({ error: 'Rule not found' });
  }

  res.json({
    ...rule,
    requirements: rule.requirements.map(r => ({
      contractAddress: r.contractAddress,
      chainId: r.chainId,
      tokenType: r.tokenType,
      ruleType: r.ruleType,
      minCount: r.minCount
    }))
  });
});

/**
 * POST /gated/check-eligibility
 * Check eligibility for all rules (requires auth)
 */
router.post('/check-eligibility', async (req, res) => {
  const walletAddress = req.user?.address || req.body.address;

  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address required' });
  }

  try {
    const activeRules = gatingRules.filter(r => r.active);
    const eligibility = await checkEligibility(walletAddress, activeRules);
    res.json(eligibility);
  } catch (error) {
    console.error('Eligibility check error:', error);
    res.status(500).json({ error: 'Failed to check eligibility' });
  }
});

/**
 * GET /gated/my-perks
 * Get all unlocked perks for authenticated user
 */
router.get('/my-perks', async (req, res) => {
  const walletAddress = req.user?.address;

  if (!walletAddress) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const activeRules = gatingRules.filter(r => r.active);
    const eligibility = await checkEligibility(walletAddress, activeRules);
    
    const unlockedPerks = eligibility.rules
      .filter(r => r.eligible)
      .map(r => ({
        ruleId: r.ruleId,
        name: r.name,
        reward: r.reward
      }));

    res.json({
      wallet: walletAddress,
      unlockedCount: unlockedPerks.length,
      perks: unlockedPerks
    });
  } catch (error) {
    console.error('My perks error:', error);
    res.status(500).json({ error: 'Failed to get perks' });
  }
});

/**
 * GET /gated/access/:ruleId
 * Access gated content (protected by token gating)
 */
router.get('/access/:ruleId', gatingMiddleware(), (req, res) => {
  const rule = gatingRules.find(r => r.id === req.params.ruleId);
  
  res.json({
    success: true,
    message: 'Access granted',
    ruleId: req.params.ruleId,
    reward: rule.reward,
    verification: req.gatingVerification
  });
});

/**
 * GET /gated/content/:contentId
 * Serve gated content (for internal routing after verification)
 */
router.get('/content/:contentId', (req, res) => {
  // This would serve actual content in production
  // Content could be:
  // - Streaming URLs
  // - Download links
  // - Exclusive articles
  // - Discount codes
  
  const contentId = req.params.contentId;
  
  // Mock content for demo
  const mockContent = {
    'vip-stream': {
      type: 'stream',
      title: 'VIP Backstage Livestream',
      streamUrl: 'https://stream.example.com/vip/live',
      expiresAt: Date.now() + 3600000 // 1 hour
    },
    'exclusive-download': {
      type: 'download',
      title: 'Exclusive Album Preview',
      downloadUrl: 'https://cdn.example.com/exclusive/album-preview.zip',
      expiresAt: Date.now() + 86400000 // 24 hours
    }
  };

  const content = mockContent[contentId];
  
  if (!content) {
    return res.status(404).json({ error: 'Content not found' });
  }

  res.json(content);
});

// ==========================================
// ADMIN ROUTES (require admin auth in production)
// ==========================================

/**
 * POST /gated/admin/rules
 * Create a new gating rule
 */
router.post('/admin/rules', (req, res) => {
  const { id, name, description, requirements, requireAll, reward } = req.body;

  if (!id || !name || !requirements || !reward) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (gatingRules.find(r => r.id === id)) {
    return res.status(409).json({ error: 'Rule ID already exists' });
  }

  const newRule = {
    id,
    name,
    description: description || '',
    requirements: requirements.map(r => ({
      contractAddress: r.contractAddress,
      chainId: r.chainId || 31337,
      tokenType: r.tokenType || 'ERC721',
      ruleType: r.ruleType || RULE_TYPES.OWN_ANY,
      tokenId: r.tokenId,
      minCount: r.minCount
    })),
    requireAll: requireAll !== false,
    reward,
    active: true,
    createdAt: new Date().toISOString()
  };

  gatingRules.push(newRule);

  res.status(201).json({
    success: true,
    rule: newRule
  });
});

/**
 * PUT /gated/admin/rules/:ruleId
 * Update a gating rule
 */
router.put('/admin/rules/:ruleId', (req, res) => {
  const index = gatingRules.findIndex(r => r.id === req.params.ruleId);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Rule not found' });
  }

  const { name, description, requirements, requireAll, reward, active } = req.body;

  gatingRules[index] = {
    ...gatingRules[index],
    ...(name && { name }),
    ...(description !== undefined && { description }),
    ...(requirements && { requirements }),
    ...(requireAll !== undefined && { requireAll }),
    ...(reward && { reward }),
    ...(active !== undefined && { active }),
    updatedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    rule: gatingRules[index]
  });
});

/**
 * DELETE /gated/admin/rules/:ruleId
 * Delete a gating rule
 */
router.delete('/admin/rules/:ruleId', (req, res) => {
  const index = gatingRules.findIndex(r => r.id === req.params.ruleId);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Rule not found' });
  }

  const deleted = gatingRules.splice(index, 1)[0];

  res.json({
    success: true,
    deleted: deleted.id
  });
});

module.exports = router;
