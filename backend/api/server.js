const express = require('express');
const cors = require('cors');
const signerService = require('../services/SignerService');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3001;

// Endpoint for the mobile scanner to verify a QR code
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

// Endpoint for the frontend to request a fresh proof (Simulating a secure enclave)
app.post('/generate-proof', async (req, res) => {
    const { tokenId, owner } = req.body;
    try {
        // In reality, this endpoint would authenticate the user before generating a proof
        const proof = await signerService.generateTicketProof(tokenId, owner);
        res.json(proof);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
  console.log(`Validator API running on http://localhost:${PORT}`);
});
