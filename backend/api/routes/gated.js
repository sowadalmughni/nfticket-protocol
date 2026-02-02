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
const { getPrisma } = require('../../prisma/client');

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

async function loadGatingRules() {
  const prisma = getPrisma();
  if (!prisma) return gatingRules;

  const rules = await prisma.gatingRule.findMany({
    include: { requirements: true }
  });

  return rules.map(rule => ({
    id: rule.id,
    name: rule.name,
    description: rule.description || '',
    requirements: rule.requirements.map(r => ({
      contractAddress: r.contractAddress,
      chainId: r.chainId,
      tokenType: r.tokenType,
      ruleType: r.ruleType,
      tokenId: r.tokenId || undefined,
      minCount: r.minCount || undefined,
    })),
    requireAll: rule.requireAll,
    reward: rule.reward,
    active: rule.active,
    createdAt: rule.createdAt?.toISOString?.() || rule.createdAt,
    updatedAt: rule.updatedAt?.toISOString?.() || rule.updatedAt,
  }));
}

// Create gating middleware with current rules
const gatingMiddleware = () => async (req, res, next) => {
  try {
    const rules = await loadGatingRules();
    return createGatingMiddleware(rules.filter(r => r.active))(req, res, next);
  } catch (error) {
    console.error('Failed to load gating rules:', error);
    return res.status(500).json({ error: 'Failed to load gating rules' });
  }
};

/**
 * GET /gated/rules
 * List all gating rules (public - for UI display)
 */
router.get('/rules', (req, res) => {
  loadGatingRules().then((rules) => {
    const activeRules = rules.filter(r => r.active).map(rule => ({
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
  }).catch((error) => {
    console.error('Fetch rules error:', error);
    res.status(500).json({ error: 'Failed to fetch rules' });
  });
});

/**
 * GET /gated/rules/:ruleId
 * Get detailed rule information
 */
router.get('/rules/:ruleId', (req, res) => {
  loadGatingRules().then((rules) => {
    const rule = rules.find(r => r.id === req.params.ruleId);
    
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
        tokenId: r.tokenId,
        minCount: r.minCount
      }))
    });
  }).catch((error) => {
    console.error('Fetch rule error:', error);
    res.status(500).json({ error: 'Failed to fetch rule' });
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
    const activeRules = (await loadGatingRules()).filter(r => r.active);
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
    const activeRules = (await loadGatingRules()).filter(r => r.active);
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
  loadGatingRules().then((rules) => {
    const rule = rules.find(r => r.id === req.params.ruleId);

    res.json({
      success: true,
      message: 'Access granted',
      ruleId: req.params.ruleId,
      reward: rule?.reward,
      verification: req.gatingVerification
    });
  }).catch((error) => {
    console.error('Access fetch rule error:', error);
    res.status(500).json({ error: 'Failed to load rule' });
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

  const prisma = getPrisma();
  if (prisma) {
    prisma.gatingRule.findUnique({ where: { id } }).then((existing) => {
      if (existing) {
        return res.status(409).json({ error: 'Rule ID already exists' });
      }

      return prisma.gatingRule.create({
        data: {
          id,
          name,
          description: description || '',
          requireAll: requireAll !== false,
          reward,
          active: true,
          requirements: {
            create: requirements.map(r => ({
              contractAddress: r.contractAddress,
              chainId: r.chainId || 31337,
              tokenType: r.tokenType || 'ERC721',
              ruleType: r.ruleType || RULE_TYPES.OWN_ANY,
              tokenId: r.tokenId ? String(r.tokenId) : null,
              minCount: r.minCount || null,
            }))
          }
        },
        include: { requirements: true }
      });
    }).then((created) => {
      if (!created) return;
      res.status(201).json({ success: true, rule: newRule });
    }).catch((error) => {
      console.error('Create rule error:', error);
      res.status(500).json({ error: 'Failed to create rule' });
    });
    return;
  }

  if (gatingRules.find(r => r.id === id)) {
    return res.status(409).json({ error: 'Rule ID already exists' });
  }

  gatingRules.push(newRule);

  res.status(201).json({ success: true, rule: newRule });
});

/**
 * PUT /gated/admin/rules/:ruleId
 * Update a gating rule
 */
router.put('/admin/rules/:ruleId', (req, res) => {
  const { name, description, requirements, requireAll, reward, active } = req.body;

  const prisma = getPrisma();
  if (prisma) {
    prisma.gatingRule.findUnique({ where: { id: req.params.ruleId }, include: { requirements: true } })
      .then((existing) => {
        if (!existing) {
          return res.status(404).json({ error: 'Rule not found' });
        }

        const updateData = {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(requireAll !== undefined && { requireAll }),
          ...(reward && { reward }),
          ...(active !== undefined && { active }),
        };

        const requirementsUpdate = requirements ? {
          deleteMany: {},
          create: requirements.map(r => ({
            contractAddress: r.contractAddress,
            chainId: r.chainId || 31337,
            tokenType: r.tokenType || 'ERC721',
            ruleType: r.ruleType || RULE_TYPES.OWN_ANY,
            tokenId: r.tokenId ? String(r.tokenId) : null,
            minCount: r.minCount || null,
          }))
        } : undefined;

        return prisma.gatingRule.update({
          where: { id: req.params.ruleId },
          data: {
            ...updateData,
            ...(requirementsUpdate ? { requirements: requirementsUpdate } : {})
          },
          include: { requirements: true }
        });
      }).then((updated) => {
        if (!updated) return;
        res.json({ success: true, rule: updated });
      }).catch((error) => {
        console.error('Update rule error:', error);
        res.status(500).json({ error: 'Failed to update rule' });
      });
    return;
  }

    const index = gatingRules.findIndex(r => r.id === req.params.ruleId);
  
    if (index === -1) {
      return res.status(404).json({ error: 'Rule not found' });
    }

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

  res.json({ success: true, rule: gatingRules[index] });
});

/**
 * DELETE /gated/admin/rules/:ruleId
 * Delete a gating rule
 */
router.delete('/admin/rules/:ruleId', (req, res) => {
  const prisma = getPrisma();
  if (prisma) {
    prisma.gatingRule.delete({ where: { id: req.params.ruleId } }).then(() => {
      res.json({ success: true, deleted: req.params.ruleId });
    }).catch((error) => {
      console.error('Delete rule error:', error);
      res.status(500).json({ error: 'Failed to delete rule' });
    });
    return;
  }

  const index = gatingRules.findIndex(r => r.id === req.params.ruleId);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Rule not found' });
  }

  const deleted = gatingRules.splice(index, 1)[0];

  res.json({ success: true, deleted: deleted.id });
});

module.exports = router;
