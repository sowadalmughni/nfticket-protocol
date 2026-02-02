/**
 * Theme Routes
 * API endpoints for white-label theming
 * @author Sowad Al-Mughni
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { getPrisma } = require('../../prisma/client');

const JWT_SECRET = process.env.JWT_SECRET || 'nfticket-secret-key';

// In-memory theme storage (use Prisma in production)
// This serves as a fallback and development mode
const themes = new Map();
const organizers = new Map();

// Default theme configuration
const DEFAULT_THEME = {
  primaryColor: '#3B82F6',
  secondaryColor: '#10B981',
  accentColor: '#8B5CF6',
  backgroundColor: '#FFFFFF',
  surfaceColor: '#F9FAFB',
  textColor: '#111827',
  textSecondary: '#6B7280',
  logoUrl: null,
  faviconUrl: null,
  bannerUrl: null,
  fontFamily: 'Inter',
  headingFont: 'Inter',
  customCss: null,
  mobileHeaderColor: '#FFFFFF',
  mobileTabBarColor: '#FFFFFF',
  mobileAccentColor: '#3B82F6',
  showPoweredBy: true,
  customDomain: null,
};

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

// Check if user is organizer
async function requireOrganizer(req, res, next) {
  const address = req.user.address.toLowerCase();
  const prisma = getPrisma();

  if (prisma) {
    const organizer = await prisma.organizer.findUnique({
      where: { walletAddress: address }
    });

    if (!organizer) {
      return res.status(403).json({ error: 'Organizer access required' });
    }

    req.organizer = organizer;
    return next();
  }

  // In-memory fallback
  if (!organizers.has(address)) {
    return res.status(403).json({ error: 'Organizer access required' });
  }

  req.organizer = organizers.get(address);
  next();
}

// ============ Public Routes ============

/**
 * GET /themes/:slug
 * Get theme by organizer slug (public)
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const prisma = getPrisma();
    if (prisma) {
      const organizer = await prisma.organizer.findUnique({
        where: { slug: slug.toLowerCase() },
        include: { theme: true }
      });

      if (!organizer) {
        return res.json({
          theme: DEFAULT_THEME,
          organizer: null,
        });
      }

      const theme = organizer.theme || DEFAULT_THEME;
      return res.json({
        theme: { ...DEFAULT_THEME, ...theme },
        organizer: {
          name: organizer.name,
          slug: organizer.slug,
        },
      });
    }

    // In-memory fallback
    let organizer = null;
    for (const [, org] of organizers) {
      if (org.slug === slug.toLowerCase()) {
        organizer = org;
        break;
      }
    }

    if (!organizer) {
      return res.json({
        theme: DEFAULT_THEME,
        organizer: null,
      });
    }

    const theme = themes.get(organizer.id) || DEFAULT_THEME;

    res.json({
      theme: { ...DEFAULT_THEME, ...theme },
      organizer: { name: organizer.name, slug: organizer.slug },
    });
  } catch (error) {
    console.error('Fetch theme error:', error);
    res.status(500).json({ error: 'Failed to fetch theme' });
  }
});

/**
 * GET /themes/by-domain/:domain
 * Get theme by custom domain
 */
router.get('/by-domain/:domain', async (req, res) => {
  try {
    const { domain } = req.params;

    const prisma = getPrisma();
    if (prisma) {
      const theme = await prisma.theme.findFirst({
        where: { customDomain: domain },
        include: { organizer: true }
      });

      if (!theme) {
        return res.json({
          theme: DEFAULT_THEME,
          organizer: null,
        });
      }

      return res.json({
        theme: { ...DEFAULT_THEME, ...theme },
        organizer: theme.organizer ? {
          name: theme.organizer.name,
          slug: theme.organizer.slug,
        } : null,
      });
    }

    // In-memory fallback
    for (const [organizerId, theme] of themes) {
      if (theme.customDomain === domain) {
        const organizer = organizers.get(organizerId);
        return res.json({
          theme: { ...DEFAULT_THEME, ...theme },
          organizer: organizer ? { name: organizer.name, slug: organizer.slug } : null,
        });
      }
    }

    res.json({ theme: DEFAULT_THEME, organizer: null });
  } catch (error) {
    console.error('Fetch theme by domain error:', error);
    res.status(500).json({ error: 'Failed to fetch theme' });
  }
});

/**
 * GET /themes
 * Get default theme configuration
 */
router.get('/', (req, res) => {
  res.json({
    defaultTheme: DEFAULT_THEME,
    availableColors: [
      { name: 'Blue', value: '#3B82F6' },
      { name: 'Green', value: '#10B981' },
      { name: 'Purple', value: '#8B5CF6' },
      { name: 'Red', value: '#EF4444' },
      { name: 'Orange', value: '#F97316' },
      { name: 'Pink', value: '#EC4899' },
      { name: 'Indigo', value: '#6366F1' },
      { name: 'Teal', value: '#14B8A6' },
    ],
    availableFonts: [
      'Inter',
      'Roboto',
      'Open Sans',
      'Lato',
      'Montserrat',
      'Poppins',
      'Source Sans Pro',
      'Raleway',
    ],
  });
});

// ============ Organizer Routes ============

/**
 * POST /themes/register
 * Register as an organizer
 */
router.post('/register', verifyToken, async (req, res) => {
  try {
    const address = req.user.address.toLowerCase();
    const { name, slug, email } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const prisma = getPrisma();
    if (prisma) {
      try {
        const organizer = await prisma.organizer.create({
          data: {
            name,
            slug: slug.toLowerCase(),
            email: email || null,
            walletAddress: address,
            theme: { create: { ...DEFAULT_THEME } },
          },
          include: { theme: true }
        });

        return res.status(201).json({
          organizer,
          theme: organizer.theme || DEFAULT_THEME,
        });
      } catch (dbError) {
        if (dbError.code === 'P2002') {
          return res.status(400).json({ error: 'Slug or wallet already registered' });
        }
        throw dbError;
      }
    }

    // In-memory fallback
    for (const [, org] of organizers) {
      if (org.slug === slug.toLowerCase()) {
        return res.status(400).json({ error: 'Slug already taken' });
      }
    }

    const organizerId = `org_${Date.now()}`;
    const organizer = {
      id: organizerId,
      name,
      slug: slug.toLowerCase(),
      email: email || null,
      walletAddress: address,
      createdAt: new Date(),
    };

    organizers.set(address, organizer);
    themes.set(organizerId, { ...DEFAULT_THEME });

    res.status(201).json({ organizer, theme: DEFAULT_THEME });
  } catch (error) {
    console.error('Register organizer error:', error);
    res.status(500).json({ error: 'Failed to register organizer' });
  }
});

/**
 * GET /themes/my-theme
 * Get current organizer's theme
 */
router.get('/my-theme', verifyToken, async (req, res) => {
  try {
    const address = req.user.address.toLowerCase();
    const prisma = getPrisma();
    if (prisma) {
      const organizer = await prisma.organizer.findUnique({
        where: { walletAddress: address },
        include: { theme: true }
      });

      if (!organizer) {
        return res.status(404).json({ error: 'Not registered as organizer' });
      }

      return res.json({
        organizer: { id: organizer.id, name: organizer.name, slug: organizer.slug },
        theme: { ...DEFAULT_THEME, ...organizer.theme },
      });
    }

    // In-memory fallback
    const organizer = organizers.get(address);

    if (!organizer) {
      return res.status(404).json({ error: 'Not registered as organizer' });
    }

    const theme = themes.get(organizer.id) || DEFAULT_THEME;

    res.json({
      organizer: { id: organizer.id, name: organizer.name, slug: organizer.slug },
      theme: { ...DEFAULT_THEME, ...theme },
    });
  } catch (error) {
    console.error('Fetch my theme error:', error);
    res.status(500).json({ error: 'Failed to fetch theme' });
  }
});

/**
 * PUT /themes/my-theme
 * Update current organizer's theme
 */
router.put('/my-theme', verifyToken, async (req, res) => {
  try {
    const address = req.user.address.toLowerCase();
    const updates = req.body;

    // Validate color values
    const colorFields = [
      'primaryColor', 'secondaryColor', 'accentColor',
      'backgroundColor', 'surfaceColor', 'textColor', 'textSecondary',
      'mobileHeaderColor', 'mobileTabBarColor', 'mobileAccentColor'
    ];

    for (const field of colorFields) {
      if (updates[field] && !/^#[0-9A-Fa-f]{6}$/.test(updates[field])) {
        return res.status(400).json({ error: `Invalid color format for ${field}` });
      }
    }

    const prisma = getPrisma();
    if (prisma) {
      const organizer = await prisma.organizer.findUnique({
        where: { walletAddress: address },
        include: { theme: true }
      });

      if (!organizer) {
        return res.status(403).json({ error: 'Organizer access required' });
      }

      const updatedTheme = await prisma.theme.upsert({
        where: { organizerId: organizer.id },
        create: { organizerId: organizer.id, ...DEFAULT_THEME, ...updates },
        update: { ...updates }
      });

      return res.json({
        theme: { ...DEFAULT_THEME, ...updatedTheme },
      });
    }

    // In-memory fallback
    const organizer = organizers.get(address);
    if (!organizer) {
      return res.status(403).json({ error: 'Organizer access required' });
    }

    const currentTheme = themes.get(organizer.id) || {};
    const updatedTheme = {
      ...currentTheme,
      ...updates,
      updatedAt: new Date(),
    };

    themes.set(organizer.id, updatedTheme);

    res.json({ theme: { ...DEFAULT_THEME, ...updatedTheme } });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

/**
 * POST /themes/preview
 * Generate preview URL for theme
 */
router.post('/preview', verifyToken, async (req, res) => {
  try {
    const { theme } = req.body;
    
    // Generate a temporary preview token
    const previewToken = jwt.sign(
      { theme, exp: Math.floor(Date.now() / 1000) + 3600 }, // 1 hour
      JWT_SECRET
    );

    res.json({
      previewUrl: `/preview?token=${previewToken}`,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Generate preview error:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

/**
 * GET /themes/css/:slug
 * Get CSS variables for a theme
 */
router.get('/css/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const prisma = getPrisma();
    let theme = DEFAULT_THEME;

    if (prisma) {
      const organizer = await prisma.organizer.findUnique({
        where: { slug: slug.toLowerCase() },
        include: { theme: true }
      });

      if (organizer?.theme) {
        theme = { ...DEFAULT_THEME, ...organizer.theme };
      }
    } else {
      for (const [, org] of organizers) {
        if (org.slug === slug.toLowerCase()) {
          theme = { ...DEFAULT_THEME, ...themes.get(org.id) };
          break;
        }
      }
    }

    const css = `
:root {
  --nft-primary: ${theme.primaryColor};
  --nft-secondary: ${theme.secondaryColor};
  --nft-accent: ${theme.accentColor};
  --nft-background: ${theme.backgroundColor};
  --nft-surface: ${theme.surfaceColor};
  --nft-text: ${theme.textColor};
  --nft-text-secondary: ${theme.textSecondary};
  --nft-font-family: '${theme.fontFamily}', system-ui, sans-serif;
  --nft-heading-font: '${theme.headingFont}', system-ui, sans-serif;
  --nft-mobile-header: ${theme.mobileHeaderColor};
  --nft-mobile-tabbar: ${theme.mobileTabBarColor};
  --nft-mobile-accent: ${theme.mobileAccentColor};
}

${theme.customCss || ''}
`.trim();

    res.type('text/css').send(css);
  } catch (error) {
    console.error('Generate CSS error:', error);
    res.status(500).json({ error: 'Failed to generate CSS' });
  }
});

module.exports = router;
