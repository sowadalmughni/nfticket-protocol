const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const signerService = require('../services/SignerService');
const gatedRoutes = require('./routes/gated');
const loyaltyRoutes = require('./routes/loyalty');
const themesRoutes = require('./routes/themes');
const paymentsRoutes = require('./routes/payments');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3001;

// Security: Require JWT_SECRET in production
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}
const JWT_SECRET = process.env.JWT_SECRET || 'nfticket-dev-secret-DO-NOT-USE-IN-PRODUCTION';

// Firebase Cloud Messaging - required for push notifications
if (!process.env.FCM_SERVER_KEY && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: FCM_SERVER_KEY not set - push notifications disabled');
}
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || '';

// In-memory device token storage (use database in production)
const deviceTokens = new Map(); // Map<walletAddress, { token, platform, lastSeen }>

// Notification types
const NOTIFICATION_TYPES = {
  TICKET_PURCHASED: 'ticket_purchased',
  TICKET_TRANSFERRED: 'ticket_transferred',
  TICKET_USED: 'ticket_used',
  POAP_CLAIMED: 'poap_claimed',
  EVENT_REMINDER: 'event_reminder',
};

// Middleware: Verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// POST /auth/login - Authenticate wallet signature and issue JWT
app.post('/auth/login', async (req, res) => {
  const { address, signature, message } = req.body;

  if (!address || !signature || !message) {
    return res.status(400).json({ error: 'Missing address, signature, or message' });
  }

  try {
    // Verify the signature matches the address
    const isValid = await signerService.verifyWalletSignature(address, message, signature);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Issue JWT token (valid for 24 hours)
    const token = jwt.sign(
      { address: address.toLowerCase(), iat: Math.floor(Date.now() / 1000) },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      token,
      expiresIn: 86400 // 24 hours in seconds
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// POST /auth/nonce - Get a nonce message for wallet signing
app.get('/auth/nonce', (req, res) => {
  const nonce = Math.floor(Math.random() * 1000000);
  const timestamp = Math.floor(Date.now() / 1000);
  const message = `Sign this message to authenticate with NFTicket Protocol.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
  
  res.json({ message, nonce, timestamp });
});

// Endpoint for the mobile scanner to verify a QR code (public endpoint)
app.post('/verify', (req, res) => {
  const { data, signature } = req.body;

  if (!data || !signature) {
    return res.status(400).json({ error: "Missing data or signature" });
  }

  try {
    const result = signerService.verifyTicketProof(data, signature);
    
    if (result.valid) {
      res.json({ success: true, message: "Ticket Valid", signer: result.signer });
    } else {
      res.status(401).json({ success: false, message: result.reason });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Endpoint for generating a fresh proof (PROTECTED - requires authentication)
// Supports multi-chain via chainId parameter
app.post('/generate-proof', authenticateToken, async (req, res) => {
  const { tokenId, chainId } = req.body;
  const owner = req.user.address; // Get owner from authenticated JWT
  const chain = chainId || 31337; // Default to local chain

  if (tokenId === undefined) {
    return res.status(400).json({ error: 'Token ID is required' });
  }

  try {
    // Verify on-chain ownership before generating proof
    const ownershipResult = await signerService.verifyOnChainOwnership(tokenId, owner, chain);
    
    if (!ownershipResult.valid) {
      return res.status(403).json({ 
        error: 'Ownership verification failed',
        reason: ownershipResult.reason,
        chainId: chain
      });
    }

    // Generate the proof with chain-specific domain
    const proof = await signerService.generateTicketProof(tokenId, owner, chain);
    res.json(proof);
  } catch (error) {
    console.error('Generate proof error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /generate-proof/refresh - Quickly refresh an existing proof (PROTECTED)
// This endpoint skips on-chain verification if recent proof was valid
// Supports multi-chain via chainId parameter
app.post('/generate-proof/refresh', authenticateToken, async (req, res) => {
  const { tokenId, lastProofTimestamp, chainId } = req.body;
  const owner = req.user.address;
  const chain = chainId || 31337;

  if (tokenId === undefined) {
    return res.status(400).json({ error: 'Token ID is required' });
  }

  try {
    // If last proof was generated less than 60 seconds ago, skip on-chain check
    const now = Math.floor(Date.now() / 1000);
    const skipOnChain = lastProofTimestamp && (now - lastProofTimestamp) < 60;

    if (!skipOnChain) {
      // Full on-chain verification
      const ownershipResult = await signerService.verifyOnChainOwnership(tokenId, owner, chain);
      if (!ownershipResult.valid) {
        return res.status(403).json({ 
          error: 'Ownership verification failed',
          reason: ownershipResult.reason,
          chainId: chain
        });
      }
    }

    // Generate fresh proof with new nonce (chain-specific)
    const proof = await signerService.generateTicketProof(tokenId, owner, chain);
    res.json(proof);
  } catch (error) {
    console.error('Refresh proof error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /proof/config - Get proof configuration for clients
app.get('/proof/config', (req, res) => {
  res.json({
    expirationSeconds: signerService.getProofExpiration(),
    refreshRecommended: signerService.getProofExpiration() - 3,
    rotatingEnabled: true,
    supportedChains: signerService.getSupportedChains()
  });
});

// GET /chains - Get supported chains and their configuration
app.get('/chains', (req, res) => {
  const chains = signerService.getSupportedChains();
  const chainInfo = {
    1: { name: 'Ethereum Mainnet', explorer: 'https://etherscan.io' },
    137: { name: 'Polygon', explorer: 'https://polygonscan.com' },
    8453: { name: 'Base', explorer: 'https://basescan.org' },
    42161: { name: 'Arbitrum One', explorer: 'https://arbiscan.io' },
    11155111: { name: 'Sepolia Testnet', explorer: 'https://sepolia.etherscan.io' },
    84532: { name: 'Base Sepolia', explorer: 'https://sepolia.basescan.org' },
    421614: { name: 'Arbitrum Sepolia', explorer: 'https://sepolia.arbiscan.io' },
    31337: { name: 'Local Hardhat', explorer: null },
  };
  
  res.json({
    supported: chains,
    info: chainInfo,
    recommended: 8453 // Base for lowest gas
  });
});

// GET /stats - Get service stats (for monitoring)
app.get('/stats', authenticateToken, (req, res) => {
  res.json({
    nonceStats: signerService.getNonceStats(),
    signerAddress: signerService.getSignerAddress(),
    supportedChains: signerService.getSupportedChains(),
    uptime: process.uptime()
  });
});

// ==========================================
// PUSH NOTIFICATION ENDPOINTS
// ==========================================

// POST /notifications/register - Register device for push notifications
app.post('/notifications/register', authenticateToken, (req, res) => {
  const { deviceToken, platform } = req.body;
  const walletAddress = req.user.address;

  if (!deviceToken) {
    return res.status(400).json({ error: 'Device token is required' });
  }

  if (!platform || !['ios', 'android', 'web'].includes(platform)) {
    return res.status(400).json({ error: 'Valid platform required (ios, android, web)' });
  }

  // Store device token linked to wallet
  deviceTokens.set(walletAddress.toLowerCase(), {
    token: deviceToken,
    platform,
    lastSeen: new Date().toISOString(),
    registeredAt: deviceTokens.get(walletAddress.toLowerCase())?.registeredAt || new Date().toISOString()
  });

  console.log(`[Notifications] Registered ${platform} device for ${walletAddress.slice(0, 10)}...`);
  
  res.json({ 
    success: true, 
    message: 'Device registered for notifications' 
  });
});

// DELETE /notifications/unregister - Unregister device
app.delete('/notifications/unregister', authenticateToken, (req, res) => {
  const walletAddress = req.user.address;
  
  const deleted = deviceTokens.delete(walletAddress.toLowerCase());
  
  res.json({ 
    success: true, 
    message: deleted ? 'Device unregistered' : 'No device was registered' 
  });
});

// POST /notifications/send - Send notification to a wallet (internal/admin use)
app.post('/notifications/send', authenticateToken, async (req, res) => {
  const { targetAddress, type, title, body, data } = req.body;

  if (!targetAddress || !type || !title) {
    return res.status(400).json({ error: 'targetAddress, type, and title are required' });
  }

  const deviceInfo = deviceTokens.get(targetAddress.toLowerCase());
  
  if (!deviceInfo) {
    return res.status(404).json({ error: 'No device registered for this address' });
  }

  try {
    // Send via Firebase Cloud Messaging
    const result = await sendPushNotification(deviceInfo.token, {
      type,
      title,
      body: body || '',
      data: data || {}
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error('Push notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// POST /notifications/broadcast - Send to multiple wallets
app.post('/notifications/broadcast', authenticateToken, async (req, res) => {
  const { addresses, type, title, body, data } = req.body;

  if (!addresses || !Array.isArray(addresses) || !type || !title) {
    return res.status(400).json({ error: 'addresses array, type, and title are required' });
  }

  const results = {
    sent: 0,
    failed: 0,
    notRegistered: 0
  };

  for (const address of addresses) {
    const deviceInfo = deviceTokens.get(address.toLowerCase());
    
    if (!deviceInfo) {
      results.notRegistered++;
      continue;
    }

    try {
      await sendPushNotification(deviceInfo.token, { type, title, body: body || '', data: data || {} });
      results.sent++;
    } catch (error) {
      results.failed++;
    }
  }

  res.json({ success: true, results });
});

// GET /notifications/status - Check notification registration status
app.get('/notifications/status', authenticateToken, (req, res) => {
  const walletAddress = req.user.address;
  const deviceInfo = deviceTokens.get(walletAddress.toLowerCase());
  
  res.json({
    registered: !!deviceInfo,
    platform: deviceInfo?.platform || null,
    registeredAt: deviceInfo?.registeredAt || null
  });
});

/**
 * Send push notification via Firebase Cloud Messaging
 */
async function sendPushNotification(deviceToken, { type, title, body, data }) {
  if (!FCM_SERVER_KEY) {
    console.warn('[Notifications] FCM_SERVER_KEY not configured - notification logged only');
    console.log(`[Notifications] Would send: ${title} - ${body}`);
    return { mock: true, logged: true };
  }

  const message = {
    to: deviceToken,
    notification: {
      title,
      body,
      sound: 'default',
    },
    data: {
      ...data,
      type,
      timestamp: Date.now().toString()
    },
    // Platform-specific options
    android: {
      priority: 'high',
      notification: {
        channelId: 'nfticket-default',
        icon: 'ic_notification'
      }
    },
    apns: {
      payload: {
        aps: {
          badge: 1,
          sound: 'default'
        }
      }
    }
  };

  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `key=${FCM_SERVER_KEY}`
    },
    body: JSON.stringify(message)
  });

  if (!response.ok) {
    throw new Error(`FCM error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Utility: Send ticket event notification
 * Call this from other parts of the app when ticket events occur
 */
async function notifyTicketEvent(walletAddress, eventType, ticketData) {
  const templates = {
    [NOTIFICATION_TYPES.TICKET_PURCHASED]: {
      title: '🎫 Ticket Purchased!',
      body: `You purchased a ticket for ${ticketData.eventName || 'an event'}`
    },
    [NOTIFICATION_TYPES.TICKET_TRANSFERRED]: {
      title: '↔️ Ticket Transferred',
      body: `Ticket #${ticketData.tokenId} was transferred`
    },
    [NOTIFICATION_TYPES.TICKET_USED]: {
      title: '✅ Ticket Validated',
      body: `Ticket #${ticketData.tokenId} was successfully validated at the venue`
    },
    [NOTIFICATION_TYPES.POAP_CLAIMED]: {
      title: '🏆 POAP Claimed!',
      body: `You received a POAP for attending ${ticketData.eventName || 'an event'}`
    },
    [NOTIFICATION_TYPES.EVENT_REMINDER]: {
      title: '⏰ Event Reminder',
      body: `${ticketData.eventName} starts in ${ticketData.timeUntil || '1 hour'}`
    }
  };

  const template = templates[eventType];
  if (!template) return;

  const deviceInfo = deviceTokens.get(walletAddress.toLowerCase());
  if (!deviceInfo) return;

  try {
    await sendPushNotification(deviceInfo.token, {
      type: eventType,
      ...template,
      data: ticketData
    });
  } catch (error) {
    console.error(`Failed to send ${eventType} notification:`, error);
  }
}

// Export for use in other modules
module.exports.notifyTicketEvent = notifyTicketEvent;
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;

// ==========================================
// TOKEN-GATED CONTENT ROUTES
// ==========================================

// Mount gated routes with optional JWT auth (some routes are public)
app.use('/gated', (req, res, next) => {
  // Try to authenticate but don't require it for all routes
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
}, gatedRoutes);

// Loyalty routes - /loyalty/*
app.use('/loyalty', loyaltyRoutes);

// Theme routes - /themes/*
app.use('/themes', themesRoutes);

// Payment routes - /payments/* (Stripe integration)
app.use('/payments', paymentsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Validator API running on http://localhost:${PORT}`);
  console.log(`QR Proof expiration: ${signerService.getProofExpiration()} seconds (rotating)`);
  console.log(`Token-gated content: /gated/*`);
  console.log(`Loyalty points: /loyalty/*`);
  console.log(`Stripe payments: /payments/*`);
});
