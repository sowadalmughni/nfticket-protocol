/**
 * NFTicket Protocol Deployment Script
 * Deploys NFTicket and POAPDistributor contracts
 * @author Sowad Al-Mughni
 */

const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting NFTicket Protocol deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // NFTicket contract parameters
  const eventName = "Web3 Conference 2024";
  const eventDescription = "The premier Web3 and blockchain conference featuring the latest in decentralized technology";
  const eventDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now
  const venue = "Convention Center, San Francisco";
  const royaltyCap = 500; // 5% in basis points
  const maxPrice = ethers.parseEther("1.0"); // 1 ETH max price
  const royaltyRecipient = deployer.address;

  console.log("🎫 NFTicket Contract Parameters:");
  console.log("   Event Name:", eventName);
  console.log("   Event Description:", eventDescription);
  console.log("   Event Date:", new Date(eventDate * 1000).toISOString());
  console.log("   Venue:", venue);
  console.log("   Royalty Cap:", royaltyCap / 100, "%");
  console.log("   Max Price:", ethers.utils.formatEther(maxPrice), "ETH");
  console.log("   Royalty Recipient:", royaltyRecipient);
  console.log();

  // Deploy NFTicket contract
  console.log("📦 Deploying NFTicket contract...");
  const NFTicket = await ethers.getContractFactory("NFTicket");
  const nfticket = await NFTicket.deploy(
    eventName,
    eventDescription,
    eventDate,
    venue,
    royaltyCap,
    maxPrice,
    royaltyRecipient
  );

  await nfticket.waitForDeployment();
  const nfticketAddress = await nfticket.getAddress();
  console.log("✅ NFTicket deployed to:", nfticketAddress);
  console.log("🔗 Transaction hash:", nfticket.deploymentTransaction().hash);
  console.log();

  // POAP contract parameters
  const poapEventName = "Web3 Conference 2024 POAP";
  const poapEventDescription = "Proof of attendance for Web3 Conference 2024";
  const poapLocation = "San Francisco, CA";
  const maxSupply = 1000;
  const baseTokenURI = "https://api.nfticket.example.com/poap/metadata/";

  console.log("🏆 POAP Contract Parameters:");
  console.log("   Event Name:", poapEventName);
  console.log("   Event Description:", poapEventDescription);
  console.log("   Location:", poapLocation);
  console.log("   Max Supply:", maxSupply);
  console.log("   Base Token URI:", baseTokenURI);
  console.log();

  // Deploy POAPDistributor contract
  console.log("📦 Deploying POAPDistributor contract...");
  const POAPDistributor = await ethers.getContractFactory("POAPDistributor");
  const poapDistributor = await POAPDistributor.deploy(
    poapEventName,
    poapEventDescription,
    eventDate,
    poapLocation,
    baseTokenURI,
    maxSupply
  );

  await poapDistributor.waitForDeployment();
  const poapDistributorAddress = await poapDistributor.getAddress();
  console.log("✅ POAPDistributor deployed to:", poapDistributorAddress);
  console.log("🔗 Transaction hash:", poapDistributor.deploymentTransaction().hash);
  console.log();

  // Verify deployment by calling contract functions
  console.log("🔍 Verifying deployments...");
  
  try {
    const nftEventInfo = await nfticket.getEventInfo();
    console.log("✅ NFTicket contract verification successful");
    console.log("   Event Name:", nftEventInfo.name);
    console.log("   Event Date:", new Date(nftEventInfo.date * 1000).toISOString());
    
    const poapEventInfo = await poapDistributor.getEventInfo();
    console.log("✅ POAP contract verification successful");
    console.log("   Event Name:", poapEventInfo.name);
    console.log("   Max Supply:", poapEventInfo.maxSup.toString());
    console.log("   Distribution Active:", poapEventInfo.active);
  } catch (error) {
    console.error("❌ Contract verification failed:", error.message);
  }

  console.log();
  console.log("🎉 Deployment completed successfully!");
  console.log();
  console.log("📋 Contract Addresses:");
  console.log("   NFTicket:", nfticket.address);
  console.log("   POAPDistributor:", poapDistributor.address);
  console.log();
  console.log("🔧 Next Steps:");
  console.log("1. Verify contracts on Etherscan:");
  console.log(`   npx hardhat verify --network ${network.name} ${nfticket.address} "${eventName}" "${eventDescription}" ${eventDate} "${venue}" ${royaltyCap} ${maxPrice} ${royaltyRecipient}`);
  console.log(`   npx hardhat verify --network ${network.name} ${poapDistributor.address} "${poapEventName}" "${poapEventDescription}" ${eventDate} "${poapLocation}" ${maxSupply} "${baseTokenURI}"`);
  console.log();
  console.log("2. Update frontend configuration with contract addresses");
  console.log("3. Test contract functionality through dashboard");
  console.log("4. Configure POAP metadata and images");
  console.log();

  // Save deployment info to file
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      NFTicket: {
        address: nfticket.address,
        transactionHash: nfticket.deployTransaction.hash,
        parameters: {
          eventName,
          eventDescription,
          eventDate,
          venue,
          royaltyCap,
          maxPrice: maxPrice.toString(),
          royaltyRecipient
        }
      },
      POAPDistributor: {
        address: poapDistributor.address,
        transactionHash: poapDistributor.deployTransaction.hash,
        parameters: {
          eventName: poapEventName,
          eventDescription: poapEventDescription,
          eventDate,
          location: poapLocation,
          maxSupply,
          baseTokenURI
        }
      }
    }
  };

  const fs = require('fs');
  const deploymentPath = `deployments/${network.name}-${Date.now()}.json`;
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync('deployments')) {
    fs.mkdirSync('deployments');
  }
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

