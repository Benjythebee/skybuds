import { expect } from "chai";
import { ethers } from "hardhat";
import { SkyBuds } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SkyBuds NFT Contract", function () {
  let skyBuds: SkyBuds;
  let owner: SignerWithAddress;
  let collector1: SignerWithAddress;
  let collector2: SignerWithAddress;
  let metadataURI: string;

  beforeEach(async function () {
    // Get signers
    [owner, collector1, collector2] = await ethers.getSigners();

    // Deploy the contract
    const SkyBudsFactory = await ethers.getContractFactory("SkyBuds");
    skyBuds = await SkyBudsFactory.deploy();
    skyBuds.connect(owner);
    // Sample metadata URI for testing
    metadataURI = "QmXnnyufdzAZPk8u46J1qbNcPQGBwJdLx9PZ3NxvgVKynY";
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await skyBuds.owner()).to.equal(owner.address);
    });

    it("Should set the correct name and symbol", async function () {
      expect(await skyBuds.name()).to.equal("SkyBuds");
      expect(await skyBuds.symbol()).to.equal("SKB");
    });
  });

  describe("Base URI", function () {
    it("Should set the correct token URI for a minted token", async function () {
      await skyBuds.mint('skybudName', metadataURI);
      const tokenId = 1; // First minted token
      
      expect(await skyBuds.tokenURI(tokenId)).to.equal(`ipfs://${metadataURI}`);
    });
  });

  describe("Minting", function () {

    it("Should increment the token ID after minting", async function () {
      await skyBuds.mint('skybudName', metadataURI);
      await skyBuds.mint('skybudName2', metadataURI);
      
      // First token (ID 0) should be owned by collector1
      expect(await skyBuds.ownerOf(1)).to.equal(owner.address);
      
      // Second token (ID 1) should be owned by collector2
      expect(await skyBuds.ownerOf(2)).to.equal(owner.address);
    });

    it("Should emit Transfer event on successful mint", async function () {
      await expect(skyBuds.mint('ownerbuds', metadataURI))
        .to.emit(skyBuds, "Transfer")
        .withArgs(ethers.ZeroAddress, owner.address, 1);
    });

    it("Should fail when minting with empty name", async function () {
      await expect(
        skyBuds.mint('', metadataURI)
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should fail when minting name that exists", async function () {
      await skyBuds.mint('skybudName', metadataURI);

      await expect(
        skyBuds.mint('skybudName', metadataURI)
      ).to.be.revertedWith("Name already taken");
    });

    it("Name exists should work when name exists", async function () {
      await skyBuds.mint('skybudName', metadataURI);

      const bool = await skyBuds.isNameTaken('skybudName');
      expect(bool).to.equal(true);
    });
  });

  describe("Token URI", function () {
    it("Should set the correct token URI for a minted token", async function () {
      await skyBuds.mint('skbudNma', metadataURI);
      const tokenId = 1; // First minted token
      
      expect(await skyBuds.tokenURI(tokenId)).to.equal(`ipfs://${metadataURI}`);
    });

    it("Should fail to get token URI for non-existent token", async function () {
      const nonExistentTokenId = 999;
      
      await expect(
        skyBuds.tokenURI(nonExistentTokenId)
      ).to.be.revertedWithCustomError(
        skyBuds,
        "ERC721NonexistentToken"
      );
    });
  });

  describe("Ownership", function () {
    it("Should allow only owner to transfer ownership", async function () {
      await skyBuds.transferOwnership(collector1.address);
      expect(await skyBuds.owner()).to.equal(collector1.address);
    });

    it("Should fail when non-owner tries to transfer ownership", async function () {
      await expect(
        skyBuds.connect(collector1).transferOwnership(collector2.address)
      ).to.be.revertedWithCustomError(
        skyBuds,
        "OwnableUnauthorizedAccount"
      );
    });
  });
});