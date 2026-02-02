# NFTicket Protocol - Next Steps & Pending Items

Last updated: February 2, 2026

## 🚀 Immediate Priority (This Week)

### ✅ Completed
- [x] Fix all hardcoded placeholder addresses in mobile app
- [x] Create centralized config system for mobile app
- [x] Update subgraph.yaml for Polygon Amoy testnet
- [x] Create comprehensive SETUP.md documentation
- [x] Remove `YOUR_ID` subgraph placeholders
- [x] Delete stale codegen_error.txt
- [x] Make all configuration environment-based

### 🔴 Critical - Blocks Production
- [ ] **Deploy contracts to Polygon Amoy testnet**
  - Task: Run `cd backend && npm run deploy:polygon-amoy`
  - Required: Get testnet MATIC from [faucet.polygon.technology](https://faucet.polygon.technology/)
  - Output: Save deployed contract addresses
  - Impact: Unblocks all placeholder issues

- [ ] **Update all .env files with deployed addresses**
  - Update: `backend/.env` → `VITE_CONTRACT_AMOY_NFTICKET`, `VITE_CONTRACT_AMOY_POAP`
  - Update: `frontend/nfticket-dashboard/.env` → Copy contract addresses
  - Update: `frontend/mobile-app/NFTicketApp/.env` → Copy contract addresses
  - Verify: App runs with real data instead of demo mode

- [ ] **Deploy subgraph to The Graph Studio**
  - Prerequisite: [Create account at thegraph.com/studio](https://thegraph.com/studio/)
  - Task: Update `subgraph/subgraph.yaml` with contract address
  - Task: Run `graph auth --studio YOUR_DEPLOY_KEY`
  - Task: Run `graph deploy --studio nfticket-amoy`
  - Output: Save subgraph deployment URL

- [ ] **Update dashboard subgraph URLs**
  - Update: `frontend/nfticket-dashboard/.env` → `VITE_SUBGRAPH_AMOY=<deployment-url>`
  - Verify: Dashboard queries live data from subgraph

---

## 🟠 High Priority (Production Readiness)

- [ ] **Configure Firebase for push notifications**
  - Create project: [console.firebase.google.com](https://console.firebase.google.com)
  - Download: `google-services.json` → `frontend/mobile-app/NFTicketApp/android/app/`
  - Download: `GoogleService-Info.plist` → `frontend/mobile-app/NFTicketApp/ios/`
  - Install: `npm install react-native-firebase`
  - Configure: Add `FCM_SERVER_KEY` to `backend/.env`

- [ ] **Set up WalletConnect integration**
  - Get Project ID: [cloud.walletconnect.com](https://cloud.walletconnect.com/)
  - Add to `.env`: `VITE_WALLETCONNECT_PROJECT_ID=your_project_id`
  - Test: Wallet connection flow on dashboard and mobile

- [ ] **Configure Redis for production nonce storage**
  - Set up: Redis instance (local or cloud provider)
  - Add to `backend/.env`: `REDIS_URL=redis://localhost:6379`
  - Verify: Nonce storage persists across restarts

- [ ] **Set strong secrets in production**
  - Generate: `SIGNER_PRIVATE_KEY` (different key than deployer)
  - Generate: `JWT_SECRET` (strong random string)
  - Verify: Both are different from deployment key
  - Never: Commit `.env` files

---

## 🟡 Medium Priority (Feature Completeness)

- [ ] **Implement seat selection (seats.io integration)**
  - Decision: Build custom UI or use seats.io widget?
  - If seats.io: Get account at [seats.io](https://app.seats.io/)
  - Task: Add `VITE_SEATSIO_PUBLIC_KEY` to dashboard
  - Task: Implement seat picker component

- [ ] **Add fiat payment option (Stripe integration)**
  - Get API keys: [dashboard.stripe.com](https://dashboard.stripe.com/apikeys)
  - Add to backend: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - Add to dashboard: `VITE_STRIPE_PUBLISHABLE_KEY`
  - Task: Implement checkout flow

- [ ] **Deploy to production networks**
  - Audit: Smart contracts with security firm (optional but recommended)
  - Deploy: NFTicket + POAPDistributor to Polygon mainnet
  - Deploy: LoyaltyPoints contract to Polygon mainnet
  - Verify: Contracts on block explorers

- [ ] **Set up automated testing pipeline**
  - Add: GitHub Actions workflow for tests
  - Add: Contract coverage reports
  - Add: Pre-commit hooks for linting

---

## 🟢 Nice-to-Have (Phase 2)

- [ ] **Mobile app push notification testing**
  - Test: Real device push notifications
  - Test: Notification deep linking
  - Test: Background vs foreground handling

- [ ] **Loyalty system Phase 2 features**
  - Implement: Tier progression UI
  - Implement: Points marketplace
  - Implement: Redemption flow

- [ ] **Analytics dashboard**
  - Add: Event statistics page
  - Add: User engagement metrics
  - Add: Revenue tracking

- [ ] **White-label customization panel**
  - Add: Branding configuration
  - Add: Custom colors/logos
  - Add: Email templates

- [ ] **L2 deployment** (if needed for scale)
  - Evaluate: Base vs Arbitrum vs zkSync
  - Deploy: Same contracts to secondary L2
  - Add: Cross-chain bridging (optional)

---

## 📋 Configuration Checklist

Before production launch, ensure:

- [ ] All `.env.example` files accurately document required variables
- [ ] No hardcoded addresses anywhere except contracts
- [ ] All contract addresses match deployed instances
- [ ] WalletConnect, Firebase, Stripe credentials configured
- [ ] Subgraph fully synced and responsive
- [ ] HTTPS enabled on all API endpoints
- [ ] CORS properly configured
- [ ] Rate limiting enabled on API
- [ ] Database backups configured
- [ ] Monitoring/alerting set up (Sentry, etc.)

---

## 🔗 Resources

| Task | Link |
|------|------|
| Polygon Faucet | [faucet.polygon.technology](https://faucet.polygon.technology/) |
| The Graph Studio | [thegraph.com/studio](https://thegraph.com/studio/) |
| WalletConnect Cloud | [cloud.walletconnect.com](https://cloud.walletconnect.com/) |
| Firebase Console | [console.firebase.google.com](https://console.firebase.google.com) |
| Stripe Dashboard | [dashboard.stripe.com](https://dashboard.stripe.com) |
| Seats.io | [app.seats.io](https://app.seats.io) |
| Polygon Amoy Testnet | [amoy.polygonscan.com](https://amoy.polygonscan.com) |

---

## 📞 Support

- See [SETUP.md](SETUP.md) for detailed setup instructions
- See [README.md](README.md) for project overview
- See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- Create an issue on GitHub for bugs or feature requests
