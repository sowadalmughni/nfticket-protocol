/**
 * Stripe Payment Routes for NFTicket
 * Handles fiat-to-crypto ticket purchases via Stripe
 * @author NFTicket Protocol
 */

const express = require('express');
const router = express.Router();

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
      event = JSON.parse(req.body);
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
  const { eventId, walletAddress, ticketType, quantity } = session.metadata;

  console.log('Processing successful payment:', {
    sessionId: session.id,
    eventId,
    walletAddress,
    ticketType,
    quantity,
    amountTotal: session.amount_total,
  });

  // TODO: Implement ticket minting logic
  // 1. Connect to contract using admin signer
  // 2. Call mintTicket(walletAddress, tokenURI, price)
  // 3. Store transaction hash in database
  // 4. Send confirmation email/notification

  // For now, log the pending mint
  console.log(`PENDING MINT: ${quantity}x ${ticketType} ticket(s) for ${walletAddress} (Event: ${eventId})`);

  // Store in pending mints (implement with database)
  // await db.pendingMints.create({
  //   sessionId: session.id,
  //   walletAddress,
  //   eventId,
  //   ticketType,
  //   quantity: parseInt(quantity),
  //   amountPaid: session.amount_total,
  //   status: 'pending',
  // });
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
