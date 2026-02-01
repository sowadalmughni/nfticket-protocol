# NFTicket Anti-Scalping Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/sowadalmughni/nfticket-protocol/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Twitter Follow](https://img.shields.io/twitter/follow/sowadalmughni?style=social)](https://twitter.com/sowadalmughni)

**Author:** Md. Sowad Al-Mughni

An open-source NFT ticketing protocol designed to combat scalping while providing artists and event organizers with resale control and royalty mechanisms. Built with **ERC-721** smart contracts, **React Native** mobile wallet integration, and **POAP** functionality for attendance verification.

## 🎯 Overview

The **NFTicket Anti-Scalping Protocol** addresses the post-pandemic challenge of event ticket scalping while enabling artists and organizers to maintain control over secondary sales and earn royalties. The protocol combines blockchain technology with user-friendly mobile applications to create a comprehensive ticketing ecosystem that benefits everyone—except scalpers.

## ✨ Key Features

- **🎫 ERC-721 NFT Tickets**: Secure, transfer-restricted digital assets with on-chain metadata.
- **🛡️ Anti-Scalping Engine**:
  - **Price Caps**: Smart contracts enforce a strict maximum resale price.
  - **Royalty Enforcement**: Automated royalty distribution to organizers on every secondary sale.
- **📱 Mobile & Offline Integration**:
  - **QR Verification**: Offline-first cryptographic signatures for venue entry.
  - **Wallet Integration**: Compatible with MetaMask and WalletConnect.
- **🏆 POAP Distribution**: "Scan-to-airdrop" mechanisms to reward attendees with soulbound Proof of Attendance tokens.
- **🔎 Decentralized Indexing**: Powered by **The Graph** for high-performance data querying.
- **🏭 White-label Ready**: Modular architecture allowing easy deployment for any event organizer.

## 🏗️ System Architecture

```mermaid
graph TD
    User[📱 Mobile App User] -->|Signs Message| QR[QR Code]
    QR -->|Scanned by| Validator[Validator Device]
    Validator -->|Verifies Sig| API[Validator API]
    User -->|Mints/Transfers| Chain[Blockchain (Ethereum/Polygon)]
    API -.->|Reads State| Chain
    Subgraph[The Graph Node] -->|Indexes Events| Chain
    Dashboard[💻 Web Dashboard] -->|Queries Data| Subgraph
    Dashboard -->|Deploys Contracts| Chain
    Organizer[Event Organizer] -->|Manages Events| Dashboard
```

## 🛠️ Technology Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Smart Contracts** | Solidity 0.8.24, Hardhat, OpenZeppelin | Core logic, ERC-721 extensions, AccessControl |
| **Web3 Integration** | Viem, Wagmi, Ethers.js | Blockchain interaction and wallet management |
| **Frontend** | React + Vite, Tailwind CSS, shadcn/ui | Responsive dashboard for organizers and users |
| **Mobile** | React Native | Cross-platform wallet and ticket viewer |
| **Indexing** | The Graph Protocol | Decentralized querying of on-chain data |
| **Backend API** | Express.js | Off-chain signature verification and proof generation |
| **Payments** | Stripe | Fiat-to-crypto ticket purchases |
| **Seat Selection** | seats.io | Interactive venue seat maps |
| **Caching** | Redis | Persistent nonce storage for QR verification |
| **Deployment** | Docker, Docker Compose | Production containerization |
| **Testing** | Hardhat, Mocha, Chai | Comprehensive unit and integration testing |

## 🔗 Multi-Chain Support

NFTicket Protocol supports deployment across multiple EVM-compatible chains:

| Network | Chain ID | Status | Use Case |
|---------|----------|--------|----------|
| **Polygon** | 137 | ✅ Primary | Low gas fees, fast confirmations |
| **Polygon Amoy** | 80002 | ✅ Testnet | Development and testing |
| **Ethereum** | 1 | ✅ Supported | High-value events |
| **Sepolia** | 11155111 | ✅ Testnet | Development and testing |
| **Base** | 8453 | ✅ Supported | Coinbase ecosystem |
| **Arbitrum** | 42161 | ✅ Supported | Low fees with Ethereum security |

### Deploying to Different Networks

```bash
cd backend

# Deploy to Polygon (recommended for production)
npm run deploy:polygon

# Deploy to Sepolia testnet
npm run deploy:sepolia

# Deploy to Base
npm run deploy:base

# Deploy to Arbitrum
npm run deploy:arbitrum
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ and **npm** or **pnpm**
- **Git**
- **MetaMask** or compatible Web3 wallet

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/sowadalmughni/nfticket-protocol.git
    cd nfticket-protocol
    ```

2.  **Install Root Dependencies**
    ```bash
    npm install
    ```

3.  **Backend & API Setup**
    ```bash
    cd backend
    npm install
    # Compile contracts to generate artifacts
    npx hardhat compile
    # (Optional) Run local validator API
    # node api/server.js
    cd ..
    ```

4.  **Dashboard Setup**
    ```bash
    cd frontend/nfticket-dashboard
    pnpm install
    cd ../..
    ```

5.  **Mobile App Setup**
    ```bash
    cd frontend/mobile-app/NFTicketApp
    npm install
    cd ../../..
    ```

### Smart Contract Deployment

1.  **Run Tests**
    ```bash
    cd backend
    npx hardhat test
    ```

2.  **Deploy Contracts**
    ```bash
    # Deploy to local Hardhat Network
    npx hardhat node
    npx hardhat run scripts/deploy.js --network localhost

    # Deploy to Sepolia Testnet
    npx hardhat run scripts/deploy.js --network sepolia
    ```

### Running the Applications

**Web Dashboard**
```bash
cd frontend/nfticket-dashboard
pnpm run dev
# Access at http://localhost:5173
```

**Mobile App**
```bash
cd frontend/mobile-app/NFTicketApp
# iOS
npx react-native run-ios
# Android
npx react-native run-android
```

## 📁 Project Structure

```bash
nfticket-protocol/
├── backend/                  # Smart contracts and backend services
│   ├── contracts/            # Solidity contracts (NFTicket.sol, POAPDistributor.sol)
│   ├── api/                  # Express.js Validator API for QR proofs
│   └── test/                 # Hardhat unit tests
├── frontend/
│   ├── mobile-app/           # React Native mobile application
│   └── nfticket-dashboard/   # React web dashboard for organizers
├── subgraph/                 # The Graph subgraph definition
│   ├── schema.graphql        # GraphQL schema
│   └── subgraph.yaml         # Subgraph manifest
├── docs/                     # Technical documentation
├── CONTRIBUTING.md           # Contribution guidelines
└── README.md                 # Project documentation
```

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in `backend/` based on `.env.example`:

```env
# Required - Wallet private key for signing
SIGNER_PRIVATE_KEY=your_wallet_private_key

# Required - JWT secret for API authentication
JWT_SECRET=your_secure_jwt_secret_at_least_32_chars

# RPC URLs (defaults provided, but recommended to use your own)
RPC_URL_POLYGON=https://polygon-rpc.com
RPC_URL_MAINNET=https://rpc.ankr.com/eth
RPC_URL_SEPOLIA=https://rpc.ankr.com/eth_sepolia

# Stripe Integration (required for fiat payments)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Redis (optional - falls back to in-memory in development)
REDIS_URL=redis://localhost:6379

# Contract verification
ETHERSCAN_API_KEY=your_etherscan_key
POLYGONSCAN_API_KEY=your_polygonscan_key
```

### Dashboard Environment Variables

Create a `.env` file in `frontend/nfticket-dashboard/`:

```env
# Contract addresses (from deployment)
VITE_CONTRACT_ADDRESS=0xYourNFTicketContractAddress
VITE_POAP_CONTRACT_ADDRESS=0xYourPOAPContractAddress
VITE_LOYALTY_CONTRACT_ADDRESS=0xYourLoyaltyContractAddress

# Subgraph URLs (from The Graph deployment)
VITE_SUBGRAPH_POLYGON=https://api.thegraph.com/subgraphs/name/your-org/nfticket-polygon
VITE_SUBGRAPH_SEPOLIA=https://api.thegraph.com/subgraphs/name/your-org/nfticket-sepolia

# seats.io (for seat selection)
VITE_SEATSIO_PUBLIC_KEY=your_seatsio_public_workspace_key

# WalletConnect (optional)
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### Contract Parameters

Adjust default values in `scripts/deploy.js` to customize:
- `Royalty Cap` (Default: 500 basis points = 5%)
- `Max Price` (Default: 1 ETH)

## 💳 Stripe Payment Integration

NFTicket supports fiat-to-crypto ticket purchases via Stripe:

### Setup

1. Create a [Stripe account](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Set up webhooks pointing to `/api/payments/webhook`

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payments/create-checkout-session` | POST | Create Stripe checkout session |
| `/api/payments/webhook` | POST | Handle Stripe webhook events |
| `/api/payments/session/:sessionId` | GET | Get session status |

### Flow

1. User selects tickets → Frontend calls `create-checkout-session`
2. User redirected to Stripe Checkout
3. On success, webhook triggers → Backend mints NFT to user's wallet

## 🪑 Seat Selection (seats.io)

Interactive venue seat selection powered by [seats.io](https://seats.io):

### Setup

1. Create a seats.io account and workspace
2. Design your venue chart in the seats.io designer
3. Add your public key to environment variables

### Usage

```jsx
import { SeatingChart, useSeatSelection } from '@/components/SeatingChart'

function EventPage({ eventId }) {
  const { selectedSeats, totalPrice, clearSelection } = useSeatSelection()
  
  return (
    <SeatingChart
      eventId={eventId}
      onSelectionChange={(seats) => console.log(seats)}
    />
  )
}
```

## 🐳 Docker Deployment

Production deployment with Docker Compose:

### Quick Start

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| `api` | 3000 | Backend API server |
| `dashboard` | 80 | Frontend dashboard (nginx) |
| `redis` | 6379 | Nonce storage cache |

### Production Configuration

1. Copy `.env.example` files and configure for production
2. Set `NODE_ENV=production`
3. Use a reverse proxy (nginx/Traefik) for SSL termination
4. Configure Redis persistence for nonce storage

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

1.  Fork the repo
2.  Create your feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes
4.  Push to the branch
5.  Open a Pull Request

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenZeppelin** for rock-solid contract libraries.
- **The Graph** for making indexing easy.
- **POAP** for the inspiration on attendance protocols.

---

## 📞 Support

For support, feature requests, or enterprise inquiries:

- **Primary Contact:** Md. Sowad Al-Mughni (sowad@kitalonlabs.com)
- **Company:** Kitalon Labs
- **GitHub Issues:** [Open an Issue](https://github.com/sowadalmughni/nfticket-protocol/issues)

**Maintained by Kitalon Labs — Md. Sowad Al-Mughni**

*Made with ❤️ for the decentralized future.*
