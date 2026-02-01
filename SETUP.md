# NFTicket Protocol - Setup Guide

This guide walks you through setting up NFTicket Protocol for development or self-hosting. NFTicket is a fully open-source, decentralized event ticketing system with anti-scalping protections, rotating QR codes, and POAP distribution.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (5 minutes)](#quick-start-5-minutes)
- [Full Setup](#full-setup)
  - [1. Backend & Smart Contracts](#1-backend--smart-contracts)
  - [2. Deploy Contracts to Testnet](#2-deploy-contracts-to-testnet)
  - [3. Frontend Dashboard](#3-frontend-dashboard)
  - [4. Mobile App](#4-mobile-app)
  - [5. Subgraph (Optional)](#5-subgraph-optional)
- [Configuration Reference](#configuration-reference)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** v18+ and npm/pnpm
- **Git** for version control
- **A crypto wallet** (MetaMask recommended) with testnet MATIC
- **Free testnet MATIC** from [Polygon Amoy Faucet](https://faucet.polygon.technology/)

### Optional (for full features)

- **WalletConnect Project ID** - [Get one free](https://cloud.walletconnect.com/)
- **Firebase Project** - For push notifications
- **The Graph Studio account** - For subgraph deployment

---

## Quick Start (5 minutes)

For local development without deploying contracts:

```bash
# Clone the repository
git clone https://github.com/sowadalmughni/nfticket-protocol.git
cd nfticket-protocol

# Install backend dependencies
cd backend
npm install
cp .env.example .env
npm run api:dev  # Starts API on http://localhost:3001

# In a new terminal - Install and run dashboard
cd frontend/nfticket-dashboard
pnpm install  # or npm install
cp .env.example .env
pnpm dev  # Opens http://localhost:5173
```

The app will run in **demo mode** with mock data until you deploy contracts.

---

## Full Setup

### 1. Backend & Smart Contracts

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` with your values:

```env
# REQUIRED: Generate a private key for signing QR proofs
# Run: node -e "console.log('0x' + require('crypto').randomBytes(32).toString('hex'))"
SIGNER_PRIVATE_KEY=0x...

# REQUIRED in production: JWT secret for API auth
JWT_SECRET=your-secure-random-string

# REQUIRED for deployment: Wallet private key with testnet MATIC
DEPLOYER_PRIVATE_KEY=0x...
```

**Compile contracts:**

```bash
npm run compile
```

**Run tests:**

```bash
npm run test        # Smart contract tests
npm run test:api    # API tests
npm run test:all    # All tests
```

### 2. Deploy Contracts to Testnet

We recommend **Polygon Amoy** testnet for low gas costs.

**Get testnet MATIC:**
1. Visit [Polygon Amoy Faucet](https://faucet.polygon.technology/)
2. Connect your wallet and request MATIC

**Deploy:**

```bash
npm run deploy:polygon-amoy
```

**Expected output:**

```
🚀 Starting NFTicket Protocol deployment...
📝 Deploying contracts with account: 0x...
✅ NFTicket deployed to: 0xABC...
✅ POAPDistributor deployed to: 0xDEF...

📝 Environment Variables (copy to .env):
──────────────────────────────────────────
VITE_CONTRACT_AMOY_NFTICKET=0xABC...
VITE_CONTRACT_AMOY_POAP=0xDEF...
CONTRACT_AMOY=0xABC...
──────────────────────────────────────────
```

**Copy these addresses** to your `.env` files in:
- `backend/.env`
- `frontend/nfticket-dashboard/.env`
- `frontend/mobile-app/NFTicketApp/.env`

### 3. Frontend Dashboard

```bash
cd frontend/nfticket-dashboard
pnpm install  # or npm install
cp .env.example .env
```

Edit `frontend/nfticket-dashboard/.env`:

```env
# WalletConnect (required for wallet connections)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# Contract addresses from deployment
VITE_CONTRACT_AMOY_NFTICKET=0xABC...
VITE_CONTRACT_AMOY_POAP=0xDEF...

# API URL
VITE_API_URL=http://localhost:3001
```

**Run development server:**

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173)

### 4. Mobile App

```bash
cd frontend/mobile-app/NFTicketApp
npm install
cp .env.example .env
```

Edit `.env` with your contract addresses:

```env
API_URL=http://localhost:3001  # Use your machine's IP for real devices
DEFAULT_NETWORK=polygon_amoy
CONTRACT_AMOY_NFTICKET=0xABC...
CONTRACT_AMOY_POAP=0xDEF...
```

**Install react-native-config** (for environment variables):

```bash
npm install react-native-config
cd ios && pod install && cd ..
```

**Run on Android:**

```bash
npm run android
```

**Run on iOS:**

```bash
npm run ios
```

### 5. Subgraph (Optional)

The subgraph enables historical data queries and analytics.

```bash
cd subgraph
npm install
cp .env.example .env
```

**Update `subgraph.yaml`** with your deployed contract address:

```yaml
source:
  address: "0xABC..."  # Your NFTicket contract address
  startBlock: 12345    # Block number when contract was deployed
```

**Generate types:**

```bash
npm run codegen
```

**Deploy to The Graph Studio:**

1. Create a subgraph at [The Graph Studio](https://thegraph.com/studio/)
2. Authenticate: `graph auth --studio YOUR_DEPLOY_KEY`
3. Deploy: `graph deploy --studio nfticket-amoy`

---

## Configuration Reference

### Environment Variables

| Variable | Component | Required | Description |
|----------|-----------|----------|-------------|
| `SIGNER_PRIVATE_KEY` | Backend | ✅ Prod | Private key for signing QR proofs |
| `JWT_SECRET` | Backend | ✅ Prod | JWT authentication secret |
| `DEPLOYER_PRIVATE_KEY` | Backend | ✅ Deploy | Wallet for deploying contracts |
| `VITE_WALLETCONNECT_PROJECT_ID` | Dashboard | ⚠️ | WalletConnect integration |
| `VITE_CONTRACT_AMOY_NFTICKET` | Dashboard | ⚠️ | NFTicket contract address |
| `VITE_CONTRACT_AMOY_POAP` | Dashboard | ⚠️ | POAP contract address |
| `FCM_SERVER_KEY` | Backend | ❌ | Firebase push notifications |
| `REDIS_URL` | Backend | ❌ | Production nonce storage |

### Supported Networks

| Network | Chain ID | Config Name | Use Case |
|---------|----------|-------------|----------|
| Polygon Amoy | 80002 | `polygonAmoy` | **Development** (recommended) |
| Polygon | 137 | `polygon` | Production |
| Ethereum Sepolia | 11155111 | `sepolia` | Testing |
| Ethereum Mainnet | 1 | `mainnet` | Production (high gas) |
| Base | 8453 | `base` | Production (low gas) |
| Arbitrum | 42161 | `arbitrum` | Production (low gas) |

---

## Production Deployment

### Checklist

- [ ] Deploy contracts to mainnet (Polygon/Base recommended for low gas)
- [ ] Set all environment variables in production
- [ ] Configure Redis for persistent nonce storage
- [ ] Set up Firebase for push notifications
- [ ] Deploy subgraph to The Graph Network (decentralized)
- [ ] Enable HTTPS on all endpoints
- [ ] Set `NODE_ENV=production`

### Security

1. **Never commit `.env` files** - they're in `.gitignore`
2. **Rotate secrets** after any accidental exposure
3. **Use different keys** for `SIGNER_PRIVATE_KEY` and `DEPLOYER_PRIVATE_KEY`
4. **Validate all inputs** - contracts have built-in protections

### Docker Deployment

```bash
# Backend
cd backend
docker build -t nfticket-backend .
docker run -p 3001:3001 --env-file .env nfticket-backend

# Dashboard
cd frontend/nfticket-dashboard
docker build -t nfticket-dashboard .
docker run -p 80:80 nfticket-dashboard
```

---

## Troubleshooting

### "Contracts not configured" message

App is running in demo mode. Deploy contracts and update `.env`:

```bash
cd backend
npm run deploy:polygon-amoy
# Copy addresses to all .env files
```

### "WalletConnect not working"

Get a free Project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com/) and add to `.env`:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### "Insufficient funds" during deployment

Get free testnet MATIC from [faucet.polygon.technology](https://faucet.polygon.technology/)

### Mobile app can't connect to API

Use your machine's local IP instead of `localhost`:

```env
API_URL=http://192.168.1.100:3001
```

Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

### Subgraph codegen errors

Ensure schema.graphql has proper `@entity` directives:

```graphql
type Ticket @entity(immutable: false) {
  # ...
}
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE)
