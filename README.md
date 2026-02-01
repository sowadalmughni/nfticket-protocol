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
| **Smart Contracts** | Solidity, Hardhat, OpenZeppelin | Core logic, ERC-721 extensions, AccessControl |
| **Web3 Integration** | Viem, Wagmi, Ethers.js | Blockchain interaction and wallet management |
| **Frontend** | React, Tailwind CSS | Responsive dashboard for organizers and users |
| **Mobile** | React Native | Cross-platform wallet and ticket viewer |
| **Indexing** | The Graph Protocol | Decentralized querying of on-chain data |
| **Backend API** | Express.js | Off-chain signature verification and proof generation |
| **Testing** | Hardhat Test Suite | Comprehensive unit and integration testing |

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

**Environment Variables**: Create a `.env` file in `backend/` based on the example.

```env
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_api_key
ETHERSCAN_API_KEY=your_etherscan_key
```

**Contract Parameters**:
Adjust default values in `scripts/deploy.js` to customize:
- `Royalty Cap` (Default: 500 basis points = 5%)
- `Max Price` (Default: 1 ETH)

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
