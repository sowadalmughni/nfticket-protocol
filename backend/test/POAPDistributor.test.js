const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("POAPDistributor", function () {
  let POAPDistributor;
  let poapDistributor;
  let nfticket;
  let owner;
  let minter;
  let distributor;
  let claimer1;
  let claimer2;
  let addrs;

  const eventName = "Test POAP Event";
  const eventDescription = "A test POAP distribution event";
  const eventDate = Math.floor(Date.now() / 1000) + 86400; // Tomorrow
  const eventLocation = "Virtual";
  const baseTokenURI = "https://example.com/poap/";
  const maxSupply = 10;

  beforeEach(async function () {
    [owner, minter, distributor, claimer1, claimer2, ...addrs] = await ethers.getSigners();

    // Deploy a mock NFTicket contract for testing POAP claim with ticket verification
    const NFTicketFactory = await ethers.getContractFactory("NFTicket");
    nfticket = await NFTicketFactory.deploy(
      "Mock Event",
      "Mock Description",
      eventDate,
      "Mock Venue",
      0,
      0,
      owner.address
    );
    await nfticket.waitForDeployment();

    POAPDistributor = await ethers.getContractFactory("POAPDistributor");
    poapDistributor = await POAPDistributor.deploy(
      eventName,
      eventDescription,
      eventDate,
      eventLocation,
      baseTokenURI,
      maxSupply
    );
    await poapDistributor.waitForDeployment();

    // Grant minter and distributor roles
    const MINTER_ROLE = await poapDistributor.MINTER_ROLE();
    const DISTRIBUTOR_ROLE = await poapDistributor.DISTRIBUTOR_ROLE();
    await poapDistributor.grantRole(MINTER_ROLE, minter.address);
    await poapDistributor.grantRole(DISTRIBUTOR_ROLE, distributor.address);
  });

  describe("Deployment", function () {
    it("Should set the right event information", async function () {
      const eventInfo = await poapDistributor.getEventInfo();
      expect(eventInfo.name).to.equal(eventName);
      expect(eventInfo.description).to.equal(eventDescription);
      expect(eventInfo.date).to.equal(eventDate);
      expect(eventInfo.location).to.equal(eventLocation);
      expect(eventInfo.claimed).to.equal(0);
      expect(eventInfo.maxSup).to.equal(maxSupply);
      expect(eventInfo.active).to.be.true;
    });

    it("Should set the base token URI", async function () {
      expect(await poapDistributor.baseTokenURI()).to.equal(baseTokenURI);
    });

    it("Should grant roles correctly", async function () {
      const DEFAULT_ADMIN_ROLE = await poapDistributor.DEFAULT_ADMIN_ROLE();
      const ADMIN_ROLE = await poapDistributor.ADMIN_ROLE();
      const MINTER_ROLE = await poapDistributor.MINTER_ROLE();
      const DISTRIBUTOR_ROLE = await poapDistributor.DISTRIBUTOR_ROLE();

      expect(await poapDistributor.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await poapDistributor.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
      expect(await poapDistributor.hasRole(MINTER_ROLE, owner.address)).to.be.true;
      expect(await poapDistributor.hasRole(DISTRIBUTOR_ROLE, owner.address)).to.be.true;
      expect(await poapDistributor.hasRole(MINTER_ROLE, minter.address)).to.be.true;
      expect(await poapDistributor.hasRole(DISTRIBUTOR_ROLE, distributor.address)).to.be.true;
    });
  });

  describe("POAP Claiming", function () {
    it("Should allow claiming POAP with NFTicket verification", async function () {
      // Mint an NFTicket to claimer1
      const nfticketTokenId = 0;
      await nfticket.connect(owner).mintTicket(claimer1.address, "https://example.com/nfticket/0", ethers.parseEther("0.1"));
      const nfticketAddress = await nfticket.getAddress();

      await expect(
        poapDistributor.connect(distributor).claimPOAP(claimer1.address, nfticketAddress, nfticketTokenId)
      )
        .to.emit(poapDistributor, "POAPClaimed")
        .withArgs(claimer1.address, 0);

      expect(await poapDistributor.ownerOf(0)).to.equal(claimer1.address);
      expect(await poapDistributor.tokenURI(0)).to.equal(baseTokenURI + "0");
      expect(await poapDistributor.hasClaimed(claimer1.address)).to.be.true;
      expect(await poapDistributor.totalClaimed()).to.equal(1);
    });

    it("Should allow claiming POAP directly (without NFTicket verification)", async function () {
      await expect(poapDistributor.connect(distributor).claimPOAPDirect(claimer1.address))
        .to.emit(poapDistributor, "POAPClaimed")
        .withArgs(claimer1.address, 0);

      expect(await poapDistributor.ownerOf(0)).to.equal(claimer1.address);
      expect(await poapDistributor.tokenURI(0)).to.equal(baseTokenURI + "0");
      expect(await poapDistributor.hasClaimed(claimer1.address)).to.be.true;
      expect(await poapDistributor.totalClaimed()).to.equal(1);
    });

    it("Should allow batch claiming POAPs", async function () {
      const claimers = [claimer1.address, claimer2.address];
      await expect(poapDistributor.connect(distributor).batchClaimPOAP(claimers))
        .to.emit(poapDistributor, "POAPClaimed")
        .withArgs(claimer1.address, 0)
        .and.to.emit(poapDistributor, "POAPClaimed")
        .withArgs(claimer2.address, 1);

      expect(await poapDistributor.ownerOf(0)).to.equal(claimer1.address);
      expect(await poapDistributor.ownerOf(1)).to.equal(claimer2.address);
      expect(await poapDistributor.hasClaimed(claimer1.address)).to.be.true;
      expect(await poapDistributor.hasClaimed(claimer2.address)).to.be.true;
      expect(await poapDistributor.totalClaimed()).to.equal(2);
    });

    it("Should prevent claiming POAP if distribution is not active", async function () {
      await poapDistributor.connect(owner).setDistributionActive(false);
      await expect(poapDistributor.connect(distributor).claimPOAPDirect(claimer1.address))
        .to.be.revertedWith("POAP: distribution is not active");
    });

    it("Should prevent claiming POAP if already claimed", async function () {
      await poapDistributor.connect(distributor).claimPOAPDirect(claimer1.address);
      await expect(poapDistributor.connect(distributor).claimPOAPDirect(claimer1.address))
        .to.be.revertedWith("POAP: address has already claimed");
    });

    it("Should prevent claiming POAP if max supply reached", async function () {
      // Claim all available POAPs
      for (let i = 0; i < maxSupply; i++) {
        await poapDistributor.connect(distributor).claimPOAPDirect(addrs[i].address);
      }
      expect(await poapDistributor.totalClaimed()).to.equal(maxSupply);

      await expect(poapDistributor.connect(distributor).claimPOAPDirect(claimer1.address))
        .to.be.revertedWith("POAP: maximum supply reached");
    });

    it("Should prevent batch claiming POAP if it would exceed max supply", async function () {
      // Claim maxSupply - 1 POAPs
      for (let i = 0; i < maxSupply - 1; i++) {
        await poapDistributor.connect(distributor).claimPOAPDirect(addrs[i].address);
      }
      expect(await poapDistributor.totalClaimed()).to.equal(maxSupply - 1);

      // Try to batch claim 2 more, exceeding max supply
      await expect(poapDistributor.connect(distributor).batchClaimPOAP([claimer1.address, claimer2.address]))
        .to.be.revertedWith("POAP: would exceed maximum supply");
    });

    it("Should prevent claiming POAP with invalid NFTicket verification", async function () {
      // Mint an NFTicket to claimer2, but claimer1 tries to use it
      const nfticketTokenId = 0;
      await nfticket.connect(owner).mintTicket(claimer2.address, "https://example.com/nfticket/0", ethers.parseEther("0.1"));
      const nfticketAddress = await nfticket.getAddress();

      await expect(
        poapDistributor.connect(distributor).claimPOAP(claimer1.address, nfticketAddress, nfticketTokenId)
      )
        .to.be.revertedWith("POAP: claimer does not own the specified ticket");
    });
  });

  describe("Admin Functions", function () {
    it("Should set distribution active status", async function () {
      await expect(poapDistributor.connect(owner).setDistributionActive(false))
        .to.emit(poapDistributor, "DistributionStatusChanged")
        .withArgs(false);
      expect(await poapDistributor.distributionActive()).to.be.false;

      await expect(poapDistributor.connect(owner).setDistributionActive(true))
        .to.emit(poapDistributor, "DistributionStatusChanged")
        .withArgs(true);
      expect(await poapDistributor.distributionActive()).to.be.true;
    });

    it("Should update max supply", async function () {
      const newMaxSupply = 20;
      await expect(poapDistributor.connect(owner).setMaxSupply(newMaxSupply))
        .to.emit(poapDistributor, "MaxSupplyUpdated")
        .withArgs(newMaxSupply);
      expect(await poapDistributor.maxSupply()).to.equal(newMaxSupply);
    });

    it("Should prevent updating max supply to less than total claimed", async function () {
      await poapDistributor.connect(distributor).claimPOAPDirect(claimer1.address);
      await expect(poapDistributor.connect(owner).setMaxSupply(0))
        .to.be.revertedWith("POAP: new max supply cannot be less than total claimed");
    });

    it("Should update base token URI", async function () {
      const newBaseURI = "https://new.example.com/poap/";
      await expect(poapDistributor.connect(owner).setBaseTokenURI(newBaseURI))
        .to.emit(poapDistributor, "BaseURIUpdated")
        .withArgs(newBaseURI);
      expect(await poapDistributor.baseTokenURI()).to.equal(newBaseURI);
    });

    it("Should prevent non-admin from calling admin functions", async function () {
      await expect(poapDistributor.connect(claimer1).setDistributionActive(false))
        .to.be.revertedWithCustomError(poapDistributor, "AccessControlUnauthorizedAccount");
      await expect(poapDistributor.connect(claimer1).setMaxSupply(20))
        .to.be.revertedWithCustomError(poapDistributor, "AccessControlUnauthorizedAccount");
      await expect(poapDistributor.connect(claimer1).setBaseTokenURI("test"))
        .to.be.revertedWithCustomError(poapDistributor, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Soulbound POAPs", function () {
    it("Should prevent POAP transfers", async function () {
      await poapDistributor.connect(distributor).claimPOAPDirect(claimer1.address);
      const tokenId = 0;

      await expect(poapDistributor.connect(claimer1).transferFrom(claimer1.address, claimer2.address, tokenId))
        .to.be.revertedWith("POAP: tokens are soulbound and cannot be transferred");

      await expect(poapDistributor.connect(claimer1).approve(claimer2.address, tokenId))
        .to.not.be.reverted; // Approve should still work, but transfer will fail

      await expect(poapDistributor.connect(claimer2).transferFrom(claimer1.address, claimer2.address, tokenId))
        .to.be.revertedWith("POAP: tokens are soulbound and cannot be transferred");
    });
  });
});

