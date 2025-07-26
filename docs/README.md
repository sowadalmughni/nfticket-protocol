# NFTicket Anti-Scalping Protocol

**Author:** Sowad Al-Mughni

An open-source NFT ticketing protocol designed to combat scalping while providing artists and event organizers with resale control and royalty mechanisms. Built with ERC-721 smart contracts, mobile wallet integration, and POAP functionality.

## 🎯 Overview

The NFTicket Anti-Scalping Protocol addresses the post-pandemic challenge of event ticket scalping while enabling artists and organizers to maintain control over secondary sales and earn royalties. The protocol combines blockchain technology with user-friendly mobile applications to create a comprehensive ticketing ecosystem.

### Key Features

- **ERC-721 NFT Tickets** with on-chain royalty caps and maximum price controls
- **Mobile Wallet Integration** with offline QR code signature verification
- **POAP Distribution** with "scan-to-airdrop" functionality for marketing
- **Anti-Scalping Mechanisms** including price caps and royalty enforcement
- **White-label Solution** for easy deployment by event organizers

### Technology Stack

- **Smart Contracts:** Solidity, Hardhat, OpenZeppelin
- **Web3 Integration:** Viem, Wagmi
- **Frontend:** React, Tailwind CSS
- **Mobile:** React Native
- **Testing:** Hardhat Test Suite

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Git
- MetaMask or compatible Web3 wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/nfticket-protocol.git
cd nfticket-protocol

# Install dependencies
npm install

# Install mobile app dependencies
cd mobile-app/NFTicketApp
npm install
cd ../..

# Install dashboard dependencies
cd nfticket-dashboard
pnpm install
cd ..
```

### Smart Contract Deployment

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost

# Deploy to testnet (configure network in hardhat.config.js)
npx hardhat run scripts/deploy.js --network sepolia
```

### Running the Dashboard

```bash
cd nfticket-dashboard
pnpm run dev
```

The dashboard will be available at `http://localhost:5173`

### Running the Mobile App

```bash
cd mobile-app/NFTicketApp

# For iOS
npx react-native run-ios

# For Android
npx react-native run-android
```

## 📋 Project Structure

```
nfticket-protocol/
├── contracts/                 # Smart contracts
│   ├── NFTicket.sol          # Main ERC-721 ticket contract
│   └── POAPDistributor.sol   # POAP distribution contract
├── scripts/                  # Deployment scripts
├── test/                     # Contract tests
├── mobile-app/              # React Native mobile application
│   └── NFTicketApp/
│       ├── src/
│       │   ├── components/   # Reusable components
│       │   ├── screens/      # App screens
│       │   └── services/     # Web3 and API services
│       └── package.json
├── nfticket-dashboard/      # React web dashboard
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Dashboard pages
│   │   └── lib/             # Utilities and configurations
│   └── package.json
├── Docs/                    # Documentation
│   ├── Implementation.md    # Technical implementation details
│   └── project_structure.md # Project structure overview
└── README.md               # This file
```

## 🎫 How It Works

### Ticket Lifecycle

1. **Event Creation:** Organizers deploy an NFTicket contract with specific parameters
2. **Ticket Minting:** Individual tickets are minted as ERC-721 NFTs with metadata
3. **Primary Sales:** Tickets are sold directly to consumers at face value
4. **Secondary Market:** Resales are controlled by smart contract with price caps and royalties
5. **Event Entry:** QR codes enable offline verification at venues
6. **POAP Distribution:** Attendees can claim commemorative POAPs after the event

### Anti-Scalping Mechanisms

- **Price Caps:** Maximum resale price enforced by smart contract
- **Royalty System:** Percentage of resale value goes back to organizers/artists
- **Transfer Restrictions:** Controlled transfer mechanisms prevent bulk scalping
- **Identity Verification:** Optional KYC integration for high-value events

## 🏗️ Architecture

### Smart Contracts

#### NFTicket.sol
The main ERC-721 contract that handles:
- Ticket minting and metadata management
- Price cap enforcement on transfers
- Royalty distribution to organizers
- Event information storage
- Ticket usage tracking

#### POAPDistributor.sol
Manages POAP (Proof of Attendance Protocol) tokens:
- Batch minting for event attendees
- Claim verification against ticket ownership
- Supply management and distribution controls
- Event-specific POAP metadata

### Mobile Application

Built with React Native for cross-platform compatibility:
- **Wallet Integration:** Connect with MetaMask, WalletConnect, and other providers
- **QR Code Generation:** Offline-capable ticket verification
- **POAP Collection:** View and manage collected POAPs
- **Ticket Management:** Transfer, view, and use tickets

### Web Dashboard

React-based admin interface for event organizers:
- **Event Management:** Create and configure events
- **Contract Deployment:** Deploy NFTicket contracts with custom parameters
- **Analytics:** Track sales, transfers, and usage metrics
- **POAP Management:** Configure and distribute commemorative tokens

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Wallet private key for deployment (use test accounts only)
PRIVATE_KEY=your_private_key_here

# RPC URLs for different networks
MAINNET_RPC_URL=https://mainnet.infura.io/v3/your_project_id
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
POLYGON_RPC_URL=https://polygon-rpc.com

# Etherscan API keys for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# WalletConnect project ID
WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### Contract Parameters

When deploying NFTicket contracts, configure:

- **Event Name:** Display name for the event
- **Event Description:** Detailed event information
- **Event Date:** Unix timestamp of event date
- **Venue:** Event location
- **Royalty Cap:** Maximum royalty percentage (e.g., 10%)
- **Max Price:** Maximum resale price in ETH
- **Royalty Recipient:** Address to receive royalty payments

## 🧪 Testing

### Smart Contract Tests

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/NFTicket.test.js

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test

# Run tests with coverage
npx hardhat coverage
```

### Frontend Testing

```bash
# Dashboard tests
cd nfticket-dashboard
npm test

# Mobile app tests
cd mobile-app/NFTicketApp
npm test
```

## 🚀 Deployment

### Testnet Deployment

1. Configure your network in `hardhat.config.js`
2. Fund your deployment account with testnet ETH
3. Deploy contracts:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

4. Verify contracts on Etherscan:

```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS "Constructor" "Arguments"
```

### Mainnet Deployment

⚠️ **Warning:** Mainnet deployment involves real funds. Test thoroughly on testnets first.

1. Ensure sufficient ETH for gas fees
2. Double-check all contract parameters
3. Deploy with mainnet configuration:

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

### Frontend Deployment

The dashboard can be deployed to any static hosting service:

```bash
cd nfticket-dashboard
npm run build
# Deploy the 'dist' folder to your hosting service
```

## 📱 Mobile App Distribution

### iOS App Store

1. Configure app signing in Xcode
2. Build release version
3. Submit to App Store Connect

### Google Play Store

1. Generate signed APK
2. Upload to Google Play Console
3. Complete store listing

### White-label Customization

The mobile app supports white-label customization:

1. Update app name and branding in configuration files
2. Replace logos and color schemes
3. Configure default contract addresses
4. Build and distribute custom versions

## 🎨 Viral Marketing Features

### Real-time Secondary Sales Graph

Artists can share live secondary market data:

```javascript
// Example integration for social media sharing
const shareSecondaryMarketData = async (contractAddress) => {
  const salesData = await getSecondaryMarketData(contractAddress);
  const chartImage = generateSalesChart(salesData);
  
  // Share to Twitter/X
  shareToTwitter({
    text: "Check out the real-time secondary market for my event! 🎫📈",
    image: chartImage,
    hashtags: ["NFTicket", "Web3Events", "AntiScalping"]
  });
};
```

### Ticket NFT Avatars

Fans can use their ticket NFTs as profile pictures:

```javascript
// Generate avatar from ticket NFT
const generateTicketAvatar = (ticketMetadata) => {
  return {
    image: ticketMetadata.image,
    frame: "nfticket-frame.png",
    eventName: ticketMetadata.eventName,
    ticketNumber: ticketMetadata.tokenId
  };
};
```

## 🤝 Contributing

We welcome contributions from the community! Please read our contributing guidelines:

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Style

- Use Prettier for code formatting
- Follow Solidity style guide for smart contracts
- Use ESLint configuration for JavaScript/TypeScript
- Write comprehensive tests for new features

### Reporting Issues

Please use GitHub Issues to report bugs or request features. Include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenZeppelin for secure smart contract libraries
- The Ethereum community for ERC-721 standards
- POAP Protocol for inspiration on attendance verification
- React Native and React communities for mobile and web frameworks

## 📞 Support

For support and questions:

- GitHub Issues: [Create an issue](https://github.com/your-username/nfticket-protocol/issues)
- Documentation: [Full documentation](./Docs/)
- Community: Join our discussions in GitHub Discussions

---

**Built with ❤️ for the Web3 community by Sowad Al-Mughni**

