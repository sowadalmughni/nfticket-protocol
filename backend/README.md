# NFTicket Protocol - Backend

This directory contains the core logic for the NFTicket ecosystem, including:

1.  **Smart Contracts:** Solidity contracts (`contracts/`)
2.  **Validator API:** Express.js off-chain validation service (`api/`)
3.  **Deploy Scripts:** Hardhat deployment scripts (`scripts/`)

## Directory Structure

```
backend/
├── api/             # Express.js Server for QR Verification
├── contracts/       # Solidity Source
│   ├── NFTicket.sol
│   └── POAPDistributor.sol
├── scripts/         # Deploy & Maintenance Scripts
└── test/            # Hardhat Unit Tests
```

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Copy default env file and fill in your keys:
    ```bash
    cp .env.example .env
    ```
    *Required:* `PRIVATE_KEY`, `SEPOLIA_RPC_URL` (for testnet).

## Smart Contracts

### Compile
```bash
npx hardhat compile
```

### Test
Run the full test suite (gas reporter enabled by default):
```bash
npx hardhat test
```

### Deploy
```bash
# Local
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost

# Sepolia
npx hardhat run scripts/deploy.js --network sepolia
```

## Validator API

The API provides endpoints for the mobile app scanner.

### Run Locally
```bash
node api/server.js
```
Server will start on `http://localhost:3001`.

### Endpoints
*   `POST /verify`: Verify a signed QR code payload.
*   `POST /generate-proof`: (Dev only) Simulate proof generation.

---
*Maintained by Kitalon Labs*
