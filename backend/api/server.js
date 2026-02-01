const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const signerService = require('../services/SignerService');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'nfticket-dev-secret-change-in-production';

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
app.post('/generate-proof', authenticateToken, async (req, res) => {
  const { tokenId } = req.body;
  const owner = req.user.address; // Get owner from authenticated JWT

  if (tokenId === undefined) {
    return res.status(400).json({ error: 'Token ID is required' });
  }

  try {
    // Verify on-chain ownership before generating proof
    const ownershipResult = await signerService.verifyOnChainOwnership(tokenId, owner);
    
    if (!ownershipResult.valid) {
      return res.status(403).json({ 
        error: 'Ownership verification failed',
        reason: ownershipResult.reason 
      });
    }

    // Generate the proof
    const proof = await signerService.generateTicketProof(tokenId, owner);
    res.json(proof);
  } catch (error) {
    console.error('Generate proof error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Validator API running on http://localhost:${PORT}`);
});
