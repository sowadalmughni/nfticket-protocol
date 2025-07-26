# NFTicket Protocol Deployment Guide

**Author:** Sowad Al-Mughni

This comprehensive guide covers the deployment of the NFTicket Anti-Scalping Protocol across different environments, from local development to production mainnet deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development Deployment](#local-development-deployment)
4. [Testnet Deployment](#testnet-deployment)
5. [Mainnet Deployment](#mainnet-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Mobile App Distribution](#mobile-app-distribution)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js:** Version 18.0.0 or higher
- **npm/pnpm:** Latest stable version
- **Git:** For version control
- **Operating System:** macOS, Linux, or Windows with WSL2

### Required Accounts and Services

1. **Ethereum Wallet:** MetaMask or hardware wallet for deployment
2. **Infura/Alchemy:** For RPC endpoints (free tier sufficient for testing)
3. **Etherscan:** API key for contract verification
4. **WalletConnect:** Project ID for mobile wallet integration
5. **GitHub:** For code repository and CI/CD

### Development Tools

```bash
# Install global dependencies
npm install -g @hardhat/cli
npm install -g react-native-cli
npm install -g expo-cli  # Optional for Expo workflow
```

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/nfticket-protocol.git
cd nfticket-protocol

# Install root dependencies
npm install

# Install smart contract dependencies
npm install

# Install dashboard dependencies
cd nfticket-dashboard
pnpm install
cd ..

# Install mobile app dependencies
cd mobile-app/NFTicketApp
npm install
cd ../..
```

### 2. Environment Configuration

Create environment files for different deployment stages:

#### `.env.local` (Local Development)
```env
# Local Hardhat Network
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL=http://localhost:8545
CHAIN_ID=31337

# Contract Addresses (will be populated after deployment)
NFTICKET_CONTRACT_ADDRESS=
POAP_DISTRIBUTOR_CONTRACT_ADDRESS=

# API Keys (use test keys)
ETHERSCAN_API_KEY=your_test_etherscan_api_key
WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

#### `.env.testnet` (Sepolia Testnet)
```env
# Sepolia Testnet
PRIVATE_KEY=your_testnet_private_key
RPC_URL=https://sepolia.infura.io/v3/your_project_id
CHAIN_ID=11155111

# Contract Addresses
NFTICKET_CONTRACT_ADDRESS=
POAP_DISTRIBUTOR_CONTRACT_ADDRESS=

# API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key
WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

#### `.env.mainnet` (Production)
```env
# Ethereum Mainnet
PRIVATE_KEY=your_mainnet_private_key
RPC_URL=https://mainnet.infura.io/v3/your_project_id
CHAIN_ID=1

# Contract Addresses
NFTICKET_CONTRACT_ADDRESS=
POAP_DISTRIBUTOR_CONTRACT_ADDRESS=

# API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key
WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### 3. Security Considerations

⚠️ **Critical Security Notes:**

- Never commit private keys to version control
- Use hardware wallets for mainnet deployments
- Implement multi-signature wallets for production contracts
- Regular security audits before mainnet deployment

```bash
# Add environment files to .gitignore
echo ".env*" >> .gitignore
echo "!.env.example" >> .gitignore
```

## Local Development Deployment

### 1. Start Local Hardhat Network

```bash
# Terminal 1: Start local blockchain
npx hardhat node

# The command will output 20 test accounts with private keys
# Use the first account for deployment
```

### 2. Deploy Smart Contracts

```bash
# Terminal 2: Deploy contracts to local network
npx hardhat run scripts/deploy.js --network localhost

# Expected output:
# NFTicket deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
# POAPDistributor deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### 3. Update Configuration Files

Update the contract addresses in your environment files and frontend configurations:

```javascript
// nfticket-dashboard/src/lib/wagmi.js
export const CONTRACT_ADDRESSES = {
  [31337]: { // Local network
    nfticket: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    poapDistributor: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  },
  // ... other networks
}
```

### 4. Start Frontend Applications

```bash
# Terminal 3: Start dashboard
cd nfticket-dashboard
pnpm run dev

# Terminal 4: Start mobile app (optional)
cd mobile-app/NFTicketApp
npx react-native start
```

### 5. Test Local Deployment

1. Open dashboard at `http://localhost:5173`
2. Connect MetaMask to local network (RPC: `http://localhost:8545`, Chain ID: `31337`)
3. Import one of the test accounts using the private key from Hardhat output
4. Test contract interactions through the dashboard

## Testnet Deployment

### 1. Prepare Testnet Environment

```bash
# Get Sepolia ETH from faucets
# - https://sepoliafaucet.com/
# - https://faucet.sepolia.dev/
# Ensure your deployment account has at least 0.1 ETH
```

### 2. Configure Hardhat for Testnet

Update `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 20000000000, // 20 gwei
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
```

### 3. Deploy to Testnet

```bash
# Load testnet environment
cp .env.testnet .env

# Deploy contracts
npx hardhat run scripts/deploy.js --network sepolia

# Verify contracts on Etherscan
npx hardhat verify --network sepolia NFTICKET_ADDRESS "Event Name" "Event Description" 1234567890 "Event Venue" 500 1000000000000000000 0xYourAddress
npx hardhat verify --network sepolia POAP_ADDRESS "POAP Name" "POAP Description" 1234567890 "Event Location" 1000 "https://api.example.com/metadata/"
```

### 4. Update Frontend for Testnet

```javascript
// Update contract addresses in wagmi configuration
export const CONTRACT_ADDRESSES = {
  [11155111]: { // Sepolia
    nfticket: '0xYourDeployedNFTicketAddress',
    poapDistributor: '0xYourDeployedPOAPAddress',
  },
}
```

### 5. Test Testnet Deployment

1. Switch MetaMask to Sepolia network
2. Test all contract functions through dashboard
3. Verify transactions on Sepolia Etherscan
4. Test mobile app connectivity

## Mainnet Deployment

⚠️ **Warning:** Mainnet deployment involves real funds and irreversible transactions. Complete thorough testing on testnets first.

### 1. Pre-Deployment Checklist

- [ ] All tests passing on local and testnet environments
- [ ] Security audit completed (recommended for production)
- [ ] Gas price optimization reviewed
- [ ] Contract parameters finalized
- [ ] Deployment account funded with sufficient ETH
- [ ] Backup and recovery procedures documented

### 2. Gas Optimization

```bash
# Analyze gas usage
REPORT_GAS=true npx hardhat test

# Optimize contract deployment
npx hardhat run scripts/estimate-gas.js --network mainnet
```

### 3. Mainnet Deployment Process

```bash
# Load mainnet environment
cp .env.mainnet .env

# Final contract compilation
npx hardhat clean
npx hardhat compile

# Deploy with gas price monitoring
npx hardhat run scripts/deploy-mainnet.js --network mainnet

# Verify contracts immediately after deployment
npx hardhat verify --network mainnet NFTICKET_ADDRESS [constructor args]
npx hardhat verify --network mainnet POAP_ADDRESS [constructor args]
```

### 4. Post-Deployment Verification

```bash
# Verify contract functionality
npx hardhat run scripts/verify-deployment.js --network mainnet

# Test critical functions
npx hardhat run scripts/test-mainnet.js --network mainnet
```

### 5. Update Production Configuration

```javascript
// Update all frontend applications with mainnet addresses
export const CONTRACT_ADDRESSES = {
  [1]: { // Mainnet
    nfticket: '0xYourMainnetNFTicketAddress',
    poapDistributor: '0xYourMainnetPOAPAddress',
  },
}
```

## Frontend Deployment

### Dashboard Deployment

#### Option 1: Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Build and deploy
cd nfticket-dashboard
npm run build
vercel --prod
```

#### Option 2: Netlify Deployment

```bash
# Build application
cd nfticket-dashboard
npm run build

# Deploy to Netlify (drag and drop dist folder or use CLI)
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Option 3: AWS S3 + CloudFront

```bash
# Build application
npm run build

# Upload to S3 bucket
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Environment Variables for Production

Configure environment variables in your hosting platform:

```env
VITE_CHAIN_ID=1
VITE_RPC_URL=https://mainnet.infura.io/v3/your_project_id
VITE_NFTICKET_ADDRESS=0xYourMainnetAddress
VITE_POAP_ADDRESS=0xYourMainnetPOAPAddress
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Mobile App Distribution

### iOS App Store Distribution

#### 1. Prepare iOS Build

```bash
cd mobile-app/NFTicketApp

# Install iOS dependencies
cd ios && pod install && cd ..

# Configure app signing in Xcode
open ios/NFTicketApp.xcworkspace
```

#### 2. App Store Configuration

1. **App Store Connect Setup:**
   - Create app record
   - Configure app information
   - Set up pricing and availability
   - Add app screenshots and metadata

2. **Build and Upload:**
```bash
# Create release build
npx react-native run-ios --configuration Release

# Archive and upload via Xcode
# Product > Archive > Distribute App
```

### Android Play Store Distribution

#### 1. Generate Signed APK

```bash
cd mobile-app/NFTicketApp/android

# Generate keystore (first time only)
keytool -genkey -v -keystore nfticket-release-key.keystore -alias nfticket -keyalg RSA -keysize 2048 -validity 10000

# Build signed APK
./gradlew assembleRelease
```

#### 2. Play Store Upload

1. **Google Play Console Setup:**
   - Create app listing
   - Configure store presence
   - Set up pricing and distribution
   - Add screenshots and descriptions

2. **Upload APK:**
   - Upload signed APK to Play Console
   - Complete content rating questionnaire
   - Submit for review

### White-label Customization

#### Configuration Template

```javascript
// config/branding.js
export const BRANDING_CONFIG = {
  appName: "Your Event App",
  primaryColor: "#1E40AF",
  secondaryColor: "#3B82F6",
  logoUrl: "./assets/your-logo.png",
  splashScreen: "./assets/splash.png",
  defaultContracts: {
    nfticket: "0xYourContractAddress",
    poap: "0xYourPOAPAddress"
  },
  supportEmail: "support@yourdomain.com",
  websiteUrl: "https://yourdomain.com"
};
```

#### Build Script for White-label

```bash
#!/bin/bash
# scripts/build-whitelabel.sh

BRAND_NAME=$1
CONFIG_FILE="config/brands/${BRAND_NAME}.json"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "Brand configuration not found: $CONFIG_FILE"
  exit 1
fi

# Update app configuration
node scripts/apply-branding.js $BRAND_NAME

# Build applications
cd nfticket-dashboard
npm run build
cd ../mobile-app/NFTicketApp
npx react-native run-android --variant=release
```

## Monitoring and Maintenance

### Contract Monitoring

#### 1. Event Monitoring Setup

```javascript
// scripts/monitor-events.js
const { ethers } = require("ethers");

async function monitorNFTicketEvents() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(
    process.env.NFTICKET_ADDRESS,
    NFTicketABI,
    provider
  );

  // Monitor ticket minting
  contract.on("TicketMinted", (tokenId, to, uri, event) => {
    console.log(`Ticket minted: ${tokenId} to ${to}`);
    // Send notification, update database, etc.
  });

  // Monitor transfers with royalties
  contract.on("TicketTransferred", (tokenId, from, to, price, royalty, event) => {
    console.log(`Ticket ${tokenId} transferred for ${ethers.utils.formatEther(price)} ETH`);
    // Track secondary market activity
  });
}
```

#### 2. Health Checks

```javascript
// scripts/health-check.js
async function performHealthCheck() {
  const checks = [
    checkContractStatus,
    checkRPCConnectivity,
    checkFrontendStatus,
    checkMobileAppAPI
  ];

  const results = await Promise.all(checks.map(check => check()));
  
  if (results.some(result => !result.healthy)) {
    // Send alerts
    await sendSlackAlert("NFTicket system health check failed");
  }
}
```

### Performance Monitoring

#### 1. Gas Usage Tracking

```javascript
// Monitor gas usage for optimization
async function trackGasUsage() {
  const transactions = await getRecentTransactions();
  
  const gasAnalysis = transactions.map(tx => ({
    function: tx.functionName,
    gasUsed: tx.gasUsed,
    gasPrice: tx.gasPrice,
    cost: tx.gasUsed * tx.gasPrice
  }));

  // Identify optimization opportunities
  const highGasFunctions = gasAnalysis
    .filter(tx => tx.gasUsed > 200000)
    .sort((a, b) => b.gasUsed - a.gasUsed);

  console.log("High gas usage functions:", highGasFunctions);
}
```

#### 2. Frontend Performance

```javascript
// Dashboard performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  analytics.track('Web Vital', {
    name: metric.name,
    value: metric.value,
    id: metric.id,
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Backup and Recovery

#### 1. Contract State Backup

```javascript
// scripts/backup-contract-state.js
async function backupContractState() {
  const contract = new ethers.Contract(address, abi, provider);
  
  // Backup critical state
  const backup = {
    timestamp: Date.now(),
    totalSupply: await contract.totalSupply(),
    royaltyCap: await contract.royaltyCap(),
    maxPrice: await contract.maxPrice(),
    eventInfo: await contract.getEventInfo(),
    // Add other critical state variables
  };

  // Store backup securely
  await storeBackup(backup);
}
```

#### 2. Database Backup (if applicable)

```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="/backups/nfticket"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application database
pg_dump nfticket_db > "$BACKUP_DIR/nfticket_$TIMESTAMP.sql"

# Backup to cloud storage
aws s3 cp "$BACKUP_DIR/nfticket_$TIMESTAMP.sql" s3://your-backup-bucket/
```

## Troubleshooting

### Common Deployment Issues

#### 1. Gas Estimation Failures

**Problem:** Transaction fails with "gas estimation failed" error.

**Solutions:**
```javascript
// Increase gas limit manually
const tx = await contract.mintTicket(to, uri, price, {
  gasLimit: 300000 // Increase from estimated value
});

// Check for revert reasons
try {
  await contract.callStatic.mintTicket(to, uri, price);
} catch (error) {
  console.log("Revert reason:", error.reason);
}
```

#### 2. Contract Verification Failures

**Problem:** Etherscan verification fails.

**Solutions:**
```bash
# Ensure exact compiler version match
npx hardhat verify --network mainnet CONTRACT_ADDRESS \
  --constructor-args scripts/verify-args.js

# Use flattened contract if needed
npx hardhat flatten contracts/NFTicket.sol > NFTicket-flattened.sol
```

#### 3. Frontend Connection Issues

**Problem:** Web3 connection fails or shows incorrect network.

**Solutions:**
```javascript
// Add network switching functionality
async function switchToCorrectNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1' }], // Mainnet
    });
  } catch (switchError) {
    // Network not added to MetaMask
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig],
      });
    }
  }
}
```

#### 4. Mobile App Build Issues

**Problem:** React Native build fails.

**Solutions:**
```bash
# Clear caches
npx react-native start --reset-cache
cd ios && rm -rf build && cd ..
cd android && ./gradlew clean && cd ..

# Update dependencies
npm update
cd ios && pod update && cd ..
```

### Performance Optimization

#### 1. Contract Gas Optimization

```solidity
// Use events instead of storage for historical data
event TicketHistory(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price);

// Pack structs efficiently
struct TicketInfo {
    uint128 price;      // Instead of uint256
    uint64 timestamp;   // Instead of uint256
    bool used;
    address owner;      // 20 bytes
}
```

#### 2. Frontend Optimization

```javascript
// Implement caching for contract calls
const useContractCache = (contractCall, dependencies) => {
  return useMemo(() => {
    return contractCall();
  }, dependencies);
};

// Lazy load components
const EventsPage = lazy(() => import('./pages/Events'));
const POAPsPage = lazy(() => import('./pages/POAPs'));
```

### Security Considerations

#### 1. Smart Contract Security

```solidity
// Implement reentrancy protection
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTicket is ERC721, ReentrancyGuard {
    function transferWithPrice(
        address from,
        address to,
        uint256 tokenId,
        uint256 salePrice
    ) external payable nonReentrant {
        // Transfer logic
    }
}
```

#### 2. Frontend Security

```javascript
// Validate all user inputs
const validateAddress = (address) => {
  return ethers.utils.isAddress(address);
};

// Sanitize metadata
const sanitizeMetadata = (metadata) => {
  return {
    name: DOMPurify.sanitize(metadata.name),
    description: DOMPurify.sanitize(metadata.description),
    image: validateImageUrl(metadata.image)
  };
};
```

---

This deployment guide provides comprehensive instructions for deploying the NFTicket Anti-Scalping Protocol across all environments. Follow the security best practices and testing procedures to ensure a successful deployment.

For additional support, refer to the main README.md or create an issue in the GitHub repository.

