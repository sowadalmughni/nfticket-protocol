/**
 * Stripe Payment Routes for NFTicket
 * Handles fiat-to-crypto ticket purchases via Stripe
 * @author NFTicket Protocol
 */

const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const { getPrisma } = require('../../prisma/client');

const nfticketArtifact = require('../../artifacts/contracts/NFTicket.sol/NFTicket.json');

const PAYMENTS_CHAIN_ID = parseInt(process.env.PAYMENTS_CHAIN_ID || process.env.CHAIN_ID || '137');

const RPC_URLS = {
  1: process.env.RPC_URL_MAINNET,
  137: process.env.RPC_URL_POLYGON,
  8453: process.env.RPC_URL_BASE,
  42161: process.env.RPC_URL_ARBITRUM,
  11155111: process.env.RPC_URL_SEPOLIA,
  80002: process.env.RPC_URL_POLYGON_AMOY,
  31337: process.env.RPC_URL,
};

const TICKET_METADATA_BASE_URL = process.env.TICKET_METADATA_BASE_URL || 'https://api.nfticket.example.com/tickets/';

// Validate Stripe configuration
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('WARNING: STRIPE_SECRET_KEY not set - payment routes disabled');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Ticket price in cents (for Stripe)
const DEFAULT_TICKET_PRICE_CENTS = 5000; // $50.00

/**
 * POST /payments/create-checkout-session
 * Create a Stripe checkout session for ticket purchase
 */
router.post('/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment system not configured' });
  }

  const { eventId, ticketType, quantity, walletAddress, metadata } = req.body;

  if (!eventId || !walletAddress) {
    return res.status(400).json({ error: 'eventId and walletAddress required' });
  }

  try {
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `NFTicket - ${ticketType || 'General Admission'}`,
              description: `Event ID: ${eventId}`,
              images: ['https://nfticket.io/ticket-preview.png'], // Update with actual image
            },
            unit_amount: metadata?.priceInCents || DEFAULT_TICKET_PRICE_CENTS,
          },
          quantity: quantity || 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/events/${eventId}`,
      metadata: {
        eventId,
        ticketType: ticketType || 'general',
        walletAddress: walletAddress.toLowerCase(),
        quantity: String(quantity || 1),
        ...metadata,
      },
    });

    res.json({ 
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * POST /payments/webhook
 * Handle Stripe webhook events
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment system not configured' });
  }

  const sig = req.headers['stripe-signature'];

  let event;

  try {
    if (STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } else {
      // In development, parse the body directly (less secure)
      event = JSON.parse(req.body.toString('utf8'));
      console.warn('WARNING: Webhook signature verification disabled - set STRIPE_WEBHOOK_SECRET');
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleSuccessfulPayment(session);
      break;

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.error('Payment failed:', failedPayment.id, failedPayment.last_payment_error?.message);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

/**
 * Handle successful payment - mint NFT ticket
 */
async function handleSuccessfulPayment(session) {
  const metadata = session.metadata || {};
  const { eventId, walletAddress, ticketType, quantity } = metadata;

  if (!eventId || !walletAddress) {
    console.error('Minting failed: Missing eventId or walletAddress in Stripe metadata');
    return;
  }

  console.log('Processing successful payment:', {
    sessionId: session.id,
    eventId,
    walletAddress,
    ticketType,
    quantity,
    amountTotal: session.amount_total,
  });

  const minterKey = process.env.MINTER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY || process.env.SIGNER_PRIVATE_KEY;
  if (!minterKey) {
    console.error('Minting failed: MINTER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY is not set');
    return;
  }

  const rpcUrl = RPC_URLS[PAYMENTS_CHAIN_ID];
  if (!rpcUrl) {
    console.error(`Minting failed: No RPC URL configured for chain ${PAYMENTS_CHAIN_ID}`);
    return;
  }

  const contractAddress = resolveContractAddress(PAYMENTS_CHAIN_ID);
  if (!contractAddress) {
    console.error(`Minting failed: No contract address configured for chain ${PAYMENTS_CHAIN_ID}`);
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(minterKey, provider);
  const contract = new ethers.Contract(contractAddress, nfticketArtifact.abi, signer);

  const qty = Math.max(parseInt(quantity || '1', 10), 1);
  const priceInWei = metadata?.priceInWei ? BigInt(metadata.priceInWei) : 0n;
  if (priceInWei === 0n) {
    console.warn('Minting warning: priceInWei missing; using 0 for originalPrice');
  }

  const seatInfo = {
    section: metadata?.section,
    row: metadata?.row,
    seatNumber: metadata?.seatNumber,
    category: metadata?.category || 'General'
  };

  const minted = [];

  for (let i = 0; i < qty; i += 1) {
    const tokenURI = metadata?.tokenURI || `${TICKET_METADATA_BASE_URL}${eventId}/${session.id}/${i + 1}`;

    let tx;
    if (seatInfo.section && seatInfo.row && seatInfo.seatNumber) {
      tx = await contract.mintTicketWithSeat(
        walletAddress,
        tokenURI,
        priceInWei,
        seatInfo.section,
        seatInfo.row,
        seatInfo.seatNumber,
        seatInfo.category
      );
    } else {
      tx = await contract.mintTicket(walletAddress, tokenURI, priceInWei);
    }

    const receipt = await tx.wait();
    const tokenId = extractTokenIdFromReceipt(receipt, contract.interface);

    minted.push({
      tokenId: tokenId?.toString() || null,
      txHash: receipt.hash,
      tokenURI
    });
  }

  console.log('Minted tickets:', minted);

  const prisma = getPrisma();
  if (prisma) {
    const amountTotal = session.amount_total != null
      ? (session.amount_total / 100).toFixed(2)
      : null;

    await prisma.paymentSession.upsert({
      where: { sessionId: session.id },
      create: {
        sessionId: session.id,
        eventId,
        walletAddress: walletAddress.toLowerCase(),
        ticketType: ticketType || 'general',
        quantity: qty,
        amountTotal: amountTotal ? amountTotal : undefined,
        currency: session.currency ? session.currency.toUpperCase() : 'USD',
        status: session.payment_status || 'completed',
      },
      update: {
        status: session.payment_status || 'completed',
        amountTotal: amountTotal ? amountTotal : undefined,
      }
    });

    for (const mintedTicket of minted) {
      await prisma.ticket.create({
        data: {
          tokenId: mintedTicket.tokenId,
          tokenUri: mintedTicket.tokenURI,
          walletAddress: walletAddress.toLowerCase(),
          eventId,
          ticketType: ticketType || 'general',
          txHash: mintedTicket.txHash,
          chainId: PAYMENTS_CHAIN_ID,
          paidWithFiat: true,
          amountPaid: amountTotal ? amountTotal : undefined,
          currency: session.currency ? session.currency.toUpperCase() : 'USD',
          stripeSessionId: session.id,
          status: 'minted',
        }
      });
    }
  }

  // TODO: Send confirmation email/notification
}

function resolveContractAddress(chainId) {
  if (process.env.NFTICKET_CONTRACT_ADDRESS) return process.env.NFTICKET_CONTRACT_ADDRESS;

  const addressByChain = {
    1: process.env.CONTRACT_MAINNET,
    137: process.env.CONTRACT_POLYGON,
    8453: process.env.CONTRACT_BASE,
    42161: process.env.CONTRACT_ARBITRUM,
    11155111: process.env.CONTRACT_SEPOLIA,
    80002: process.env.CONTRACT_AMOY,
    31337: process.env.NFTICKET_CONTRACT_ADDRESS,
  };

  return addressByChain[chainId];
}

function extractTokenIdFromReceipt(receipt, iface) {
  try {
    for (const log of receipt.logs || []) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === 'TicketMinted') {
          return parsed.args?.tokenId;
        }
      } catch (error) {
        // Ignore non-matching logs
      }
    }
  } catch (error) {
    console.warn('Failed to parse tokenId from receipt:', error.message);
  }
  return null;
}

/**
 * GET /payments/session/:sessionId
 * Get payment session status
 */
router.get('/session/:sessionId', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment system not configured' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    
    res.json({
      id: session.id,
      status: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
      customerEmail: session.customer_details?.email,
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    res.status(404).json({ error: 'Session not found' });
  }
});

/**
 * GET /payments/config
 * Get public Stripe configuration
 */
router.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    enabled: !!stripe,
  });
});

module.exports = router;
