import { expect } from 'chai';
import { network } from 'hardhat';
import frontendUtil from '@arcologynetwork/frontend-util/utils/util.js';

const { ethers } = await network.connect();

/**
 * ConcurrentERC721 JavaScript Tests
 * Tests for Arcology-specific concurrent operations (minting, burning, transfers, totalSupply)
 * These tests require the Arcology DevNet to be running
 *
 * Key Changes from OpenZeppelin Version:
 * - Token IDs are generated using Runtime.uuid() (not sequential)
 * - Token IDs will be large random numbers, not 0, 1, 2, etc.
 * - All mints return unique token IDs
 * - No collision risk in parallel minting
 */
describe('ConcurrentERC721', function () {
  let nft;
  let minter, alice, bob, carol;

  beforeEach(async function () {
    // Get signers
    [minter, alice, bob, carol] = await ethers.getSigners();

    // Deploy ConcurrentERC721 using Hardhat Ignition
    const ConcurrentERC721Factory = await ethers.getContractFactory(
      'ConcurrentERC721'
    );
    nft = await ConcurrentERC721Factory.deploy('Test NFT', 'TNFT');
    await nft.waitForDeployment();

    console.log(`Deployed ConcurrentERC721 at ${await nft.getAddress()}`);
  });

  // ============ Initial State Tests ============

  describe('Initial State', function () {
    it('should have zero total supply', async function () {
      const totalSupply = await nft.totalSupply();
      expect(totalSupply).to.equal(0n);
    });

    it('should set deployer as minter', async function () {
      const minterAddress = await nft.minter();
      expect(minterAddress).to.equal(minter.address);
    });

    it('should have correct metadata', async function () {
      expect(await nft.name()).to.equal('Test NFT');
      expect(await nft.symbol()).to.equal('TNFT');
    });
  });

  // ============ Minting Tests ============

  describe('Minting', function () {
    it('should mint NFT to address with UUID-generated token ID', async function () {
      const tx = await nft.mint(alice.address);
      const receipt = await tx.wait();

      // Check events
      const transferEvent = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === 'Transfer'
      );
      expect(transferEvent).to.not.be.undefined;
      expect(transferEvent.args.from).to.equal(ethers.ZeroAddress);
      expect(transferEvent.args.to).to.equal(alice.address);

      const tokenId = transferEvent.args.tokenId;
      console.log(`  Minted token ID (UUID-based): ${tokenId}`);

      // Token ID should be a large number from keccak256(Runtime.uuid())
      expect(tokenId).to.be.greaterThan(0n);

      const xxx = await nft.ownerOf.staticCall(tokenId);

      // Check state
      expect(await nft.ownerOf.staticCall(tokenId)).to.equal(alice.address);
      expect(await nft.balanceOf(alice.address)).to.equal(1n);
      expect(await nft.totalSupply()).to.equal(1n);
    });

    it('should generate unique token IDs for sequential mints', async function () {
      const tx1 = await nft.mint(alice.address);
      const receipt1 = await tx1.wait();
      const tokenId1 = receipt1.logs.find(
        (log) => log.fragment?.name === 'Transfer'
      ).args.tokenId;

      const tx2 = await nft.mint(bob.address);
      const receipt2 = await tx2.wait();
      const tokenId2 = receipt2.logs.find(
        (log) => log.fragment?.name === 'Transfer'
      ).args.tokenId;

      const tx3 = await nft.mint(carol.address);
      const receipt3 = await tx3.wait();
      const tokenId3 = receipt3.logs.find(
        (log) => log.fragment?.name === 'Transfer'
      ).args.tokenId;

      console.log(`  Token IDs: ${tokenId1}, ${tokenId2}, ${tokenId3}`);

      // All token IDs should be unique
      expect(tokenId1).to.not.equal(tokenId2);
      expect(tokenId1).to.not.equal(tokenId3);
      expect(tokenId2).to.not.equal(tokenId3);

      // Verify ownership
      expect(await nft.ownerOf.staticCall(tokenId1)).to.equal(alice.address);
      expect(await nft.ownerOf.staticCall(tokenId2)).to.equal(bob.address);
      expect(await nft.ownerOf.staticCall(tokenId3)).to.equal(carol.address);
      expect(await nft.totalSupply()).to.equal(3n);
    });

    it('should mint multiple NFTs to same address', async function () {
      await (await nft.mint(alice.address)).wait();
      await (await nft.mint(alice.address)).wait();

      expect(await nft.balanceOf(alice.address)).to.equal(2n);
      expect(await nft.totalSupply()).to.equal(2n);
    });

    it('should revert when non-minter tries to mint', async function () {
      await expect(nft.connect(alice).mint(bob.address)).to.revert(ethers);
    });

    it('should revert when minting to zero address', async function () {
      await expect(nft.mint(ethers.ZeroAddress)).to.revert(ethers);
    });
  });

  // ============ Burn Tests ============

  describe('Burning', function () {
    let tokenId;

    beforeEach(async function () {
      // Mint a token to alice for burn tests
      const tx = await nft.mint(alice.address);
      const receipt = await tx.wait();
      tokenId = receipt.logs.find((log) => log.fragment?.name === 'Transfer')
        .args.tokenId;
    });

    it('should burn NFT by owner', async function () {
      const beforeSupply = await nft.totalSupply();
      const beforeBalance = await nft.balanceOf(alice.address);

      await (await nft.connect(alice).burn(tokenId)).wait();

      expect(await nft.totalSupply()).to.equal(beforeSupply - 1n);
      expect(await nft.balanceOf(alice.address)).to.equal(beforeBalance - 1n);

      // ownerOf should revert for burned token
      await expect(nft.ownerOf(tokenId)).to.revert(ethers);
    });

    it('should burn NFT by approved address', async function () {
      // Alice approves bob to manage the token
      await (await nft.connect(alice).approve(bob.address, tokenId)).wait();

      // Bob burns the token
      await (await nft.connect(bob).burn(tokenId)).wait();

      expect(await nft.balanceOf(alice.address)).to.equal(0n);
      await expect(nft.ownerOf(tokenId)).to.revert(ethers);
    });

    it('should burn NFT by operator', async function () {
      // Alice approves bob as operator for all tokens
      await (
        await nft.connect(alice).setApprovalForAll(bob.address, true)
      ).wait();

      // Bob burns the token
      await (await nft.connect(bob).burn(tokenId)).wait();

      expect(await nft.balanceOf(alice.address)).to.equal(0n);
      await expect(nft.ownerOf(tokenId)).to.revert(ethers);
    });

    it('should revert when non-owner/approved tries to burn', async function () {
      await expect(nft.connect(bob).burn(tokenId)).to.revert(ethers);
    });

    it('should handle burn and re-mint correctly', async function () {
      // Burn token
      await (await nft.connect(alice).burn(tokenId)).wait();
      expect(await nft.totalSupply()).to.equal(0n);

      // Mint new token - will get a different UUID-based token ID
      const tx = await nft.mint(bob.address);
      const receipt = await tx.wait();
      const newTokenId = receipt.logs.find(
        (log) => log.fragment?.name === 'Transfer'
      ).args.tokenId;

      expect(newTokenId).to.not.equal(tokenId); // Different UUID
      expect(await nft.ownerOf.staticCall(newTokenId)).to.equal(bob.address);
      expect(await nft.totalSupply()).to.equal(1n);
    });
  });

  // ============ Transfer Tests ============

  describe('Transfers', function () {
    let tokenId;

    beforeEach(async function () {
      // Mint a token to alice
      const tx = await nft.mint(alice.address);
      const receipt = await tx.wait();
      tokenId = receipt.logs.find((log) => log.fragment?.name === 'Transfer')
        .args.tokenId;
    });

    it('should transfer NFT from owner', async function () {
      await (
        await nft
          .connect(alice)
          .transferFrom(alice.address, bob.address, tokenId)
      ).wait();

      expect(await nft.ownerOf.staticCall(tokenId)).to.equal(bob.address);
      expect(await nft.balanceOf(alice.address)).to.equal(0n);
      expect(await nft.balanceOf(bob.address)).to.equal(1n);
    });

    it('should transfer NFT by approved address', async function () {
      await (await nft.connect(alice).approve(bob.address, tokenId)).wait();

      await (
        await nft
          .connect(bob)
          .transferFrom(alice.address, carol.address, tokenId)
      ).wait();

      expect(await nft.ownerOf.staticCall(tokenId)).to.equal(carol.address);
      expect(await nft.balanceOf(carol.address)).to.equal(1n);
    });

    it('should transfer NFT by operator', async function () {
      await (
        await nft.connect(alice).setApprovalForAll(bob.address, true)
      ).wait();

      await (
        await nft
          .connect(bob)
          .transferFrom(alice.address, carol.address, tokenId)
      ).wait();

      expect(await nft.ownerOf.staticCall(tokenId)).to.equal(carol.address);
    });

    it('should clear approval after transfer', async function () {
      await (await nft.connect(alice).approve(bob.address, tokenId)).wait();
      expect(await nft.getApproved.staticCall(tokenId)).to.equal(bob.address);

      await (
        await nft
          .connect(alice)
          .transferFrom(alice.address, carol.address, tokenId)
      ).wait();

      expect(await nft.getApproved.staticCall(tokenId)).to.equal(
        ethers.ZeroAddress
      );
    });

    it('should use safeTransferFrom', async function () {
      await (
        await nft
          .connect(alice)
          ['safeTransferFrom(address,address,uint256)'](
            alice.address,
            bob.address,
            tokenId
          )
      ).wait();

      expect(await nft.ownerOf.staticCall(tokenId)).to.equal(bob.address);
    });
  });

  // ============ Parallel Operations Tests (Arcology-specific) ============

  describe('Parallel Operations', function () {
    it('should handle parallel minting with unique UUIDs', async function () {
      const beforeSupply = await nft.totalSupply();

      // Execute parallel mints to different addresses
      const txs = [
        frontendUtil.generateTx(
          ([nft, to]) => nft.mint(to),
          nft,
          alice.address
        ),
        frontendUtil.generateTx(([nft, to]) => nft.mint(to), nft, bob.address),
        frontendUtil.generateTx(
          ([nft, to]) => nft.mint(to),
          nft,
          carol.address
        ),
      ];

      const receipts = await Promise.all(txs);

      // Extract token IDs from receipts
      const tokenIds = receipts.map((receipt) => {
        const transferEvent = receipt.logs.find(
          (log) => log.fragment && log.fragment.name === 'Transfer'
        );
        return transferEvent.args.tokenId;
      });

      console.log(`  Parallel mint token IDs: ${tokenIds}`);

      // Verify each address received a unique token
      expect(await nft.balanceOf(alice.address)).to.equal(1n);
      expect(await nft.balanceOf(bob.address)).to.equal(1n);
      expect(await nft.balanceOf(carol.address)).to.equal(1n);

      // Verify total supply increased by 3
      expect(await nft.totalSupply()).to.equal(beforeSupply + 3n);

      // Verify all token IDs are unique (no UUID collisions)
      expect(tokenIds[0]).to.not.equal(tokenIds[1]);
      expect(tokenIds[0]).to.not.equal(tokenIds[2]);
      expect(tokenIds[1]).to.not.equal(tokenIds[2]);

      // Verify ownership
      const owners = await Promise.all(
        tokenIds.map((id) => nft.ownerOf.staticCall(id))
      );
      const uniqueOwners = new Set(owners);
      expect(uniqueOwners.size).to.equal(3); // All three should be different
      expect(uniqueOwners.has(alice.address)).to.be.true;
      expect(uniqueOwners.has(bob.address)).to.be.true;
      expect(uniqueOwners.has(carol.address)).to.be.true;
    });

    it('should handle large batch parallel minting without collisions', async function () {
      const batchSize = 10;
      const recipients = await Promise.all(
        Array(batchSize)
          .fill()
          .map(() => ethers.Wallet.createRandom().address)
      );

      const beforeSupply = await nft.totalSupply();

      // Create parallel mint transactions
      const txs = recipients.map((recipient) =>
        frontendUtil.generateTx(([nft, to]) => nft.mint(to), nft, recipient)
      );

      const receipts = await Promise.all(txs);

      // Extract all token IDs
      const tokenIds = receipts.map((receipt) => {
        const transferEvent = receipt.logs.find(
          (log) => log.fragment && log.fragment.name === 'Transfer'
        );
        return transferEvent.args.tokenId.toString();
      });

      console.log(
        `  ${batchSize} parallel mints - checking for UUID collisions...`
      );

      // Verify no collisions (all token IDs unique)
      const uniqueTokenIds = new Set(tokenIds);
      expect(uniqueTokenIds.size).to.equal(batchSize);

      // Verify total supply
      expect(await nft.totalSupply()).to.equal(
        beforeSupply + BigInt(batchSize)
      );

      // Verify each recipient got exactly 1 token
      for (const recipient of recipients) {
        expect(await nft.balanceOf(recipient)).to.equal(1n);
      }
    });

    it('should handle parallel transfers from different owners', async function () {
      // Setup: Mint tokens to alice, bob, carol
      const tx1 = await nft.mint(alice.address);
      const receipt1 = await tx1.wait();
      const token1 = receipt1.logs.find(
        (log) => log.fragment?.name === 'Transfer'
      ).args.tokenId;

      const tx2 = await nft.mint(bob.address);
      const receipt2 = await tx2.wait();
      const token2 = receipt2.logs.find(
        (log) => log.fragment?.name === 'Transfer'
      ).args.tokenId;

      const tx3 = await nft.mint(carol.address);
      const receipt3 = await tx3.wait();
      const token3 = receipt3.logs.find(
        (log) => log.fragment?.name === 'Transfer'
      ).args.tokenId;

      // Create recipient addresses
      const recipients = await Promise.all([
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
      ]);

      // Execute parallel transfers
      const txs = [
        frontendUtil.generateTx(
          ([nft, from, to, tokenId]) =>
            nft.connect(from).transferFrom(from.address, to, tokenId),
          nft,
          alice,
          recipients[0],
          token1
        ),
        frontendUtil.generateTx(
          ([nft, from, to, tokenId]) =>
            nft.connect(from).transferFrom(from.address, to, tokenId),
          nft,
          bob,
          recipients[1],
          token2
        ),
        frontendUtil.generateTx(
          ([nft, from, to, tokenId]) =>
            nft.connect(from).transferFrom(from.address, to, tokenId),
          nft,
          carol,
          recipients[2],
          token3
        ),
      ];

      await frontendUtil.waitingTxs(txs);

      // Verify ownership changed
      expect(await nft.ownerOf.staticCall(token1)).to.equal(recipients[0]);
      expect(await nft.ownerOf.staticCall(token2)).to.equal(recipients[1]);
      expect(await nft.ownerOf.staticCall(token3)).to.equal(recipients[2]);

      // Verify original owners have zero balance
      expect(await nft.balanceOf(alice.address)).to.equal(0n);
      expect(await nft.balanceOf(bob.address)).to.equal(0n);
      expect(await nft.balanceOf(carol.address)).to.equal(0n);

      // Verify new owners have balance
      expect(await nft.balanceOf(recipients[0])).to.equal(1n);
      expect(await nft.balanceOf(recipients[1])).to.equal(1n);
      expect(await nft.balanceOf(recipients[2])).to.equal(1n);
    });

    it('should handle parallel burns by different owners', async function () {
      // Setup: Mint tokens to alice, bob, carol
      const tx1 = await nft.mint(alice.address);
      const receipt1 = await tx1.wait();
      const token1 = receipt1.logs.find(
        (log) => log.fragment?.name === 'Transfer'
      ).args.tokenId;

      const tx2 = await nft.mint(bob.address);
      const receipt2 = await tx2.wait();
      const token2 = receipt2.logs.find(
        (log) => log.fragment?.name === 'Transfer'
      ).args.tokenId;

      const tx3 = await nft.mint(carol.address);
      const receipt3 = await tx3.wait();
      const token3 = receipt3.logs.find(
        (log) => log.fragment?.name === 'Transfer'
      ).args.tokenId;

      const beforeSupply = await nft.totalSupply();
      expect(beforeSupply).to.equal(3n);

      // Execute parallel burns
      const txs = [
        frontendUtil.generateTx(
          ([nft, owner, tokenId]) => nft.connect(owner).burn(tokenId),
          nft,
          alice,
          token1
        ),
        frontendUtil.generateTx(
          ([nft, owner, tokenId]) => nft.connect(owner).burn(tokenId),
          nft,
          bob,
          token2
        ),
        frontendUtil.generateTx(
          ([nft, owner, tokenId]) => nft.connect(owner).burn(tokenId),
          nft,
          carol,
          token3
        ),
      ];

      await frontendUtil.waitingTxs(txs);

      // Verify total supply decreased
      expect(await nft.totalSupply()).to.equal(0n);

      // Verify all owners have zero balance
      expect(await nft.balanceOf(alice.address)).to.equal(0n);
      expect(await nft.balanceOf(bob.address)).to.equal(0n);
      expect(await nft.balanceOf(carol.address)).to.equal(0n);

      // Verify tokens don't exist
      await expect(nft.ownerOf(token1)).to.revert(ethers);
      await expect(nft.ownerOf(token2)).to.revert(ethers);
      await expect(nft.ownerOf(token3)).to.revert(ethers);
    });
  });

  // ============ TotalSupply Accuracy Tests ============

  describe('TotalSupply Accuracy', function () {
    it('should maintain accurate totalSupply under concurrent operations', async function () {
      const initialSupply = await nft.totalSupply();

      // Mint 5 tokens in parallel
      const mintTxs = Array(5)
        .fill()
        .map(() =>
          frontendUtil.generateTx(
            ([nft, to]) => nft.mint(to),
            nft,
            ethers.Wallet.createRandom().address
          )
        );

      await frontendUtil.waitingTxs(mintTxs);
      expect(await nft.totalSupply()).to.equal(initialSupply + 5n);

      // Get signers for burning
      const [_, s1, s2, s3] = await ethers.getSigners();

      // Mint to known addresses so we can burn them
      const tx1 = await nft.mint(s1.address);
      const receipt1 = await tx1.wait();
      const token1 = receipt1.logs.find(
        (log) => log.fragment?.name === 'Transfer'
      ).args.tokenId;

      const tx2 = await nft.mint(s2.address);
      const receipt2 = await tx2.wait();
      const token2 = receipt2.logs.find(
        (log) => log.fragment?.name === 'Transfer'
      ).args.tokenId;

      const tx3 = await nft.mint(s3.address);
      const receipt3 = await tx3.wait();
      const token3 = receipt3.logs.find(
        (log) => log.fragment?.name === 'Transfer'
      ).args.tokenId;

      const afterMintSupply = await nft.totalSupply();

      // Burn 3 tokens in parallel
      const burnTxs = [
        frontendUtil.generateTx(
          ([nft, signer, tokenId]) => nft.connect(signer).burn(tokenId),
          nft,
          s1,
          token1
        ),
        frontendUtil.generateTx(
          ([nft, signer, tokenId]) => nft.connect(signer).burn(tokenId),
          nft,
          s2,
          token2
        ),
        frontendUtil.generateTx(
          ([nft, signer, tokenId]) => nft.connect(signer).burn(tokenId),
          nft,
          s3,
          token3
        ),
      ];

      await frontendUtil.waitingTxs(burnTxs);
      expect(await nft.totalSupply()).to.equal(afterMintSupply - 3n);
    });
  });

  // ============ UUID Uniqueness Stress Test ============

  describe('UUID Uniqueness', function () {
    it('should generate unique token IDs even with 10 parallel mints', async function () {
      this.timeout(60000); // 60 second timeout for large batch

      const batchSize = 10;
      const recipients = await Promise.all(
        Array(batchSize)
          .fill()
          .map(() => ethers.Wallet.createRandom().address)
      );

      console.log(
        `  Testing UUID uniqueness with ${batchSize} parallel mints...`
      );

      // Create parallel mint transactions
      const txs = recipients.map((recipient) =>
        frontendUtil.generateTx(([nft, to]) => nft.mint(to), nft, recipient)
      );

      const receipts = await Promise.all(txs);

      // Extract all token IDs
      const tokenIds = receipts.map((receipt) => {
        const transferEvent = receipt.logs.find(
          (log) => log.fragment && log.fragment.name === 'Transfer'
        );
        return transferEvent.args.tokenId.toString();
      });

      // Verify no collisions (all token IDs unique)
      const uniqueTokenIds = new Set(tokenIds);
      expect(uniqueTokenIds.size).to.equal(batchSize);
      console.log(
        `  ✓ All ${batchSize} token IDs are unique (zero collisions)`
      );

      // Verify total supply
      expect(await nft.totalSupply()).to.equal(BigInt(batchSize));
    });
  });
});
