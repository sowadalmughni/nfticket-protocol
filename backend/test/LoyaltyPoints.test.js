const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LoyaltyPoints", function () {
  let loyaltyPoints;
  let owner, minter, user1, user2;

  beforeEach(async function () {
    [owner, minter, user1, user2] = await ethers.getSigners();

    const LoyaltyPoints = await ethers.getContractFactory("LoyaltyPoints");
    loyaltyPoints = await LoyaltyPoints.deploy(owner.address);
    await loyaltyPoints.waitForDeployment();

    // Grant minter role
    const MINTER_ROLE = await loyaltyPoints.MINTER_ROLE();
    await loyaltyPoints.grantRole(MINTER_ROLE, minter.address);
  });

  describe("Deployment", function () {
    it("Should set correct name and symbol", async function () {
      expect(await loyaltyPoints.name()).to.equal("NFTicket Loyalty Points");
      expect(await loyaltyPoints.symbol()).to.equal("NTLP");
    });

    it("Should set correct decimals", async function () {
      expect(await loyaltyPoints.decimals()).to.equal(0);
    });

    it("Should grant admin role to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await loyaltyPoints.DEFAULT_ADMIN_ROLE();
      expect(await loyaltyPoints.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should initialize default tiers", async function () {
      const tiers = await loyaltyPoints.getAllTiers();
      expect(tiers.length).to.equal(5);
      expect(tiers[0].name).to.equal("Bronze");
      expect(tiers[4].name).to.equal("Diamond");
    });
  });

  describe("Points Awarding", function () {
    it("Should award points to user", async function () {
      await loyaltyPoints.connect(minter).awardPoints(user1.address, 100, "Test award");
      expect(await loyaltyPoints.balanceOf(user1.address)).to.equal(100);
    });

    it("Should update total supply", async function () {
      await loyaltyPoints.connect(minter).awardPoints(user1.address, 100, "Test");
      await loyaltyPoints.connect(minter).awardPoints(user2.address, 200, "Test");
      expect(await loyaltyPoints.totalSupply()).to.equal(300);
    });

    it("Should emit PointsEarned event", async function () {
      await expect(loyaltyPoints.connect(minter).awardPoints(user1.address, 100, "Ticket Purchase"))
        .to.emit(loyaltyPoints, "PointsEarned")
        .withArgs(user1.address, 100, "Ticket Purchase");
    });

    it("Should revert for non-minter", async function () {
      await expect(loyaltyPoints.connect(user1).awardPoints(user1.address, 100, "Test"))
        .to.be.reverted;
    });

    it("Should award for ticket purchase", async function () {
      await loyaltyPoints.connect(minter).awardForTicketPurchase(user1.address);
      expect(await loyaltyPoints.balanceOf(user1.address)).to.equal(100);
    });

    it("Should award for attendance", async function () {
      await loyaltyPoints.connect(minter).awardForAttendance(user1.address);
      expect(await loyaltyPoints.balanceOf(user1.address)).to.equal(50);
    });

    it("Should award for POAP", async function () {
      await loyaltyPoints.connect(minter).awardForPOAP(user1.address);
      expect(await loyaltyPoints.balanceOf(user1.address)).to.equal(25);
    });

    it("Should award for referral", async function () {
      await loyaltyPoints.connect(minter).awardForReferral(user1.address, user2.address);
      expect(await loyaltyPoints.balanceOf(user1.address)).to.equal(200); // Referrer
      expect(await loyaltyPoints.balanceOf(user2.address)).to.equal(100); // Referred (half)
    });
  });

  describe("Tiers", function () {
    it("Should return Bronze tier for new user", async function () {
      const [tierName, discountBps] = await loyaltyPoints.getTier(user1.address);
      expect(tierName).to.equal("Bronze");
      expect(discountBps).to.equal(0);
    });

    it("Should upgrade to Silver at 500 points", async function () {
      await loyaltyPoints.connect(minter).awardPoints(user1.address, 500, "Test");
      const [tierName, discountBps] = await loyaltyPoints.getTier(user1.address);
      expect(tierName).to.equal("Silver");
      expect(discountBps).to.equal(500); // 5%
    });

    it("Should upgrade to Gold at 2000 points", async function () {
      await loyaltyPoints.connect(minter).awardPoints(user1.address, 2000, "Test");
      const [tierName, discountBps] = await loyaltyPoints.getTier(user1.address);
      expect(tierName).to.equal("Gold");
      expect(discountBps).to.equal(1000); // 10%
    });

    it("Should emit TierReached event on upgrade", async function () {
      await expect(loyaltyPoints.connect(minter).awardPoints(user1.address, 500, "Test"))
        .to.emit(loyaltyPoints, "TierReached")
        .withArgs(user1.address, "Silver", 500);
    });

    it("Should calculate points to next tier", async function () {
      await loyaltyPoints.connect(minter).awardPoints(user1.address, 300, "Test");
      const [needed, nextTierName] = await loyaltyPoints.pointsToNextTier(user1.address);
      expect(needed).to.equal(200); // 500 - 300
      expect(nextTierName).to.equal("Silver");
    });

    it("Should return Max Tier for Diamond holders", async function () {
      await loyaltyPoints.connect(minter).awardPoints(user1.address, 10000, "Test");
      const [needed, nextTierName] = await loyaltyPoints.pointsToNextTier(user1.address);
      expect(needed).to.equal(0);
      expect(nextTierName).to.equal("Max Tier");
    });
  });

  describe("Redemption", function () {
    beforeEach(async function () {
      await loyaltyPoints.connect(minter).awardPoints(user1.address, 1000, "Setup");
    });

    it("Should redeem points", async function () {
      await loyaltyPoints.connect(user1).redeemPoints(200, "Discount code");
      expect(await loyaltyPoints.balanceOf(user1.address)).to.equal(800);
    });

    it("Should emit PointsRedeemed event", async function () {
      await expect(loyaltyPoints.connect(user1).redeemPoints(200, "Free drink"))
        .to.emit(loyaltyPoints, "PointsRedeemed")
        .withArgs(user1.address, 200, "Free drink");
    });

    it("Should revert for insufficient points", async function () {
      await expect(loyaltyPoints.connect(user1).redeemPoints(2000, "Test"))
        .to.be.revertedWith("Insufficient points");
    });

    it("Should decrease total supply on redemption", async function () {
      await loyaltyPoints.connect(user1).redeemPoints(200, "Test");
      expect(await loyaltyPoints.totalSupply()).to.equal(800);
    });
  });

  describe("Non-Transferable (Soulbound)", function () {
    beforeEach(async function () {
      await loyaltyPoints.connect(minter).awardPoints(user1.address, 1000, "Setup");
    });

    it("Should revert on transfer", async function () {
      await expect(loyaltyPoints.connect(user1).transfer(user2.address, 100))
        .to.be.revertedWith("Points are non-transferable");
    });

    it("Should revert on transferFrom", async function () {
      await expect(loyaltyPoints.connect(user1).transferFrom(user1.address, user2.address, 100))
        .to.be.revertedWith("Points are non-transferable");
    });

    it("Should revert on approve", async function () {
      await expect(loyaltyPoints.connect(user1).approve(user2.address, 100))
        .to.be.revertedWith("Points are non-transferable");
    });

    it("Should return 0 allowance", async function () {
      expect(await loyaltyPoints.allowance(user1.address, user2.address)).to.equal(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should update earning rates", async function () {
      await loyaltyPoints.setEarningRates(150, 75, 30, 250);
      expect(await loyaltyPoints.pointsPerTicketPurchase()).to.equal(150);
      expect(await loyaltyPoints.pointsPerAttendance()).to.equal(75);
      expect(await loyaltyPoints.pointsPerPOAP()).to.equal(30);
      expect(await loyaltyPoints.pointsPerReferral()).to.equal(250);
    });

    it("Should add new tier", async function () {
      await loyaltyPoints.addTier("Legendary", 50000, 5000);
      const tiers = await loyaltyPoints.getAllTiers();
      expect(tiers.length).to.equal(6);
      expect(tiers[5].name).to.equal("Legendary");
    });

    it("Should update existing tier", async function () {
      await loyaltyPoints.updateTier(1, "Silver+", 600, 600);
      const tiers = await loyaltyPoints.getAllTiers();
      expect(tiers[1].name).to.equal("Silver+");
      expect(tiers[1].threshold).to.equal(600);
      expect(tiers[1].discountBps).to.equal(600);
    });

    it("Should revert for non-admin", async function () {
      await expect(loyaltyPoints.connect(user1).setEarningRates(100, 50, 25, 200))
        .to.be.reverted;
    });
  });

  describe("History", function () {
    it("Should track earning history", async function () {
      await loyaltyPoints.connect(minter).awardPoints(user1.address, 100, "First award");
      await loyaltyPoints.connect(minter).awardPoints(user1.address, 200, "Second award");
      
      const history = await loyaltyPoints.getEarningHistory(user1.address, 10);
      expect(history.length).to.equal(2);
      expect(history[0].amount).to.equal(200); // Most recent first
      expect(history[0].reason).to.equal("Second award");
      expect(history[1].amount).to.equal(100);
    });

    it("Should track redemption history", async function () {
      await loyaltyPoints.connect(minter).awardPoints(user1.address, 1000, "Setup");
      await loyaltyPoints.connect(user1).redeemPoints(100, "Discount");
      await loyaltyPoints.connect(user1).redeemPoints(200, "Free item");
      
      const history = await loyaltyPoints.getRedemptionHistory(user1.address, 10);
      expect(history.length).to.equal(2);
      expect(history[0].amount).to.equal(200); // Most recent first
      expect(history[0].reward).to.equal("Free item");
    });

    it("Should limit history results", async function () {
      for (let i = 0; i < 5; i++) {
        await loyaltyPoints.connect(minter).awardPoints(user1.address, 10, `Award ${i}`);
      }
      
      const history = await loyaltyPoints.getEarningHistory(user1.address, 3);
      expect(history.length).to.equal(3);
    });
  });
});
