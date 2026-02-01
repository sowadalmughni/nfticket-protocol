/**
 * Payment Routes Tests
 * Tests for Stripe payment integration
 * @author NFTicket Protocol
 */

const { expect } = require('chai');
const sinon = require('sinon');
const express = require('express');
const request = require('supertest');

describe('Payment Routes', function () {
  let app;
  let mockStripe;

  // Mock Stripe API
  const createMockStripe = () => ({
    checkout: {
      sessions: {
        create: sinon.stub(),
        retrieve: sinon.stub(),
      },
    },
    webhooks: {
      constructEvent: sinon.stub(),
    },
  });

  beforeEach(function () {
    // Set required env vars before importing
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock';
    process.env.FRONTEND_URL = 'http://localhost:5173';

    // Clear module cache to allow re-import with new env vars
    delete require.cache[require.resolve('../api/routes/payments')];
    
    mockStripe = createMockStripe();
  });

  afterEach(function () {
    sinon.restore();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  describe('POST /create-checkout-session', function () {
    it('should require eventId and walletAddress', async function () {
      // Import fresh module
      const paymentsRouter = require('../api/routes/payments');
      
      app = express();
      app.use(express.json());
      app.use('/payments', paymentsRouter);

      const response = await request(app)
        .post('/payments/create-checkout-session')
        .send({});

      expect(response.status).to.equal(400);
      expect(response.body.error).to.include('eventId and walletAddress required');
    });

    it('should create checkout session with valid params', async function () {
      // This test requires mocking the stripe module more deeply
      // For integration testing, use Stripe test mode
      this.skip();
    });
  });

  describe('GET /session/:sessionId', function () {
    it('should require sessionId parameter', async function () {
      const paymentsRouter = require('../api/routes/payments');
      
      app = express();
      app.use(express.json());
      app.use('/payments', paymentsRouter);

      const response = await request(app)
        .get('/payments/session/');

      // Express returns 404 for missing route param
      expect(response.status).to.equal(404);
    });
  });

  describe('Webhook handling', function () {
    it('should return 400 for invalid webhook signature', async function () {
      const paymentsRouter = require('../api/routes/payments');
      
      app = express();
      // Don't parse JSON for webhook route (it uses raw body)
      app.use('/payments', paymentsRouter);

      const response = await request(app)
        .post('/payments/webhook')
        .set('stripe-signature', 'invalid_sig')
        .set('content-type', 'application/json')
        .send(JSON.stringify({ type: 'test' }));

      // Should fail signature verification
      expect(response.status).to.equal(400);
    });
  });
});

describe('Payment System Disabled', function () {
  beforeEach(function () {
    // Ensure STRIPE_SECRET_KEY is not set
    delete process.env.STRIPE_SECRET_KEY;
    delete require.cache[require.resolve('../api/routes/payments')];
  });

  it('should return 503 when Stripe is not configured', async function () {
    const paymentsRouter = require('../api/routes/payments');
    
    const app = express();
    app.use(express.json());
    app.use('/payments', paymentsRouter);

    const response = await request(app)
      .post('/payments/create-checkout-session')
      .send({ eventId: '123', walletAddress: '0x1234' });

    expect(response.status).to.equal(503);
    expect(response.body.error).to.equal('Payment system not configured');
  });
});
