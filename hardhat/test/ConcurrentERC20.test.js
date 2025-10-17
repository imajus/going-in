import { expect } from 'chai';
import { network } from 'hardhat';
import frontendUtil from '@arcologynetwork/frontend-util/utils/util.js';

const { ethers } = await network.connect();

/**
 * ConcurrentERC20 JavaScript Tests
 * Tests for Arcology-specific concurrent operations (balanceOf, totalSupply, transfers, mints)
 * These tests require the Arcology DevNet to be running
 */
describe('ConcurrentERC20', function () {
  let token;
  let owner, alice, bob, carol;

  beforeEach(async function () {
    // Get signers
    [owner, alice, bob, carol] = await ethers.getSigners();

    // Deploy ConcurrentERC20
    const INITIAL_SUPPLY = ethers.parseEther('1000000'); // 1 million tokens
    const ConcurrentERC20Factory = await ethers.getContractFactory(
      'ConcurrentERC20'
    );
    token = await ConcurrentERC20Factory.deploy(
      'Test Token',
      'TEST',
      INITIAL_SUPPLY
    );
    await token.waitForDeployment();

    console.log(`Deployed ConcurrentERC20 at ${await token.getAddress()}`);
  });

  // ============ Initial Supply Tests ============

  describe('Initial Supply', function () {
    it('should have correct total supply', async function () {
      const expectedSupply = ethers.parseEther('1000000');
      const totalSupply = await token.totalSupply();
      expect(totalSupply).to.equal(expectedSupply);
    });

    it('should mint initial supply to deployer', async function () {
      const expectedSupply = ethers.parseEther('1000000');
      const ownerBalance = await token.balanceOf(owner.address);
      expect(ownerBalance).to.equal(expectedSupply);
    });

    it('should return zero balance for non-holder', async function () {
      const aliceBalance = await token.balanceOf(alice.address);
      expect(aliceBalance).to.equal(0n);
    });
  });

  // ============ Transfer Tests ============

  describe('Transfers', function () {
    it('should transfer tokens between accounts', async function () {
      const transferAmount = ethers.parseEther('1000');

      const tx = await token.transfer(alice.address, transferAmount);
      await tx.wait();

      const expectedSupply = ethers.parseEther('1000000');
      expect(await token.balanceOf(alice.address)).to.equal(transferAmount);
      expect(await token.balanceOf(owner.address)).to.equal(
        expectedSupply - transferAmount
      );
    });

    it('should transfer to multiple recipients', async function () {
      const amount1 = ethers.parseEther('1000');
      const amount2 = ethers.parseEther('2000');
      const amount3 = ethers.parseEther('3000');

      await (await token.transfer(alice.address, amount1)).wait();
      await (await token.transfer(bob.address, amount2)).wait();
      await (await token.transfer(carol.address, amount3)).wait();

      expect(await token.balanceOf(alice.address)).to.equal(amount1);
      expect(await token.balanceOf(bob.address)).to.equal(amount2);
      expect(await token.balanceOf(carol.address)).to.equal(amount3);
    });

    it('should handle zero transfer', async function () {
      const beforeBalance = await token.balanceOf(alice.address);

      await (await token.transfer(alice.address, 0)).wait();

      expect(await token.balanceOf(alice.address)).to.equal(beforeBalance);
    });
  });

  // ============ TransferFrom Tests ============

  describe('TransferFrom', function () {
    it('should transfer tokens using allowance', async function () {
      const transferAmount = ethers.parseEther('1000');

      // Owner approves Alice
      await (await token.approve(alice.address, transferAmount)).wait();

      // Alice transfers from Owner to Bob
      await (
        await token
          .connect(alice)
          .transferFrom(owner.address, bob.address, transferAmount)
      ).wait();

      const expectedSupply = ethers.parseEther('1000000');
      expect(await token.balanceOf(bob.address)).to.equal(transferAmount);
      expect(await token.balanceOf(owner.address)).to.equal(
        expectedSupply - transferAmount
      );
      expect(await token.allowance(owner.address, alice.address)).to.equal(0n);
    });

    it('should handle partial allowance spending', async function () {
      const approvalAmount = ethers.parseEther('1000');
      const transferAmount = ethers.parseEther('600');

      await (await token.approve(alice.address, approvalAmount)).wait();
      await (
        await token
          .connect(alice)
          .transferFrom(owner.address, bob.address, transferAmount)
      ).wait();

      expect(await token.allowance(owner.address, alice.address)).to.equal(
        approvalAmount - transferAmount
      );
      expect(await token.balanceOf(bob.address)).to.equal(transferAmount);
    });
  });

  // ============ Mint Tests ============

  describe('Minting', function () {
    it('should mint tokens to address', async function () {
      const mintAmount = ethers.parseEther('100000');
      const beforeSupply = await token.totalSupply();
      const beforeBalance = await token.balanceOf(alice.address);

      await (await token.mint(alice.address, mintAmount)).wait();

      expect(await token.totalSupply()).to.equal(beforeSupply + mintAmount);
      expect(await token.balanceOf(alice.address)).to.equal(
        beforeBalance + mintAmount
      );
    });

    it('should mint multiple times', async function () {
      const mint1 = ethers.parseEther('1000');
      const mint2 = ethers.parseEther('2000');

      await (await token.mint(alice.address, mint1)).wait();
      await (await token.mint(alice.address, mint2)).wait();

      const expectedSupply = ethers.parseEther('1000000');
      expect(await token.balanceOf(alice.address)).to.equal(mint1 + mint2);
      expect(await token.totalSupply()).to.equal(
        expectedSupply + mint1 + mint2
      );
    });
  });

  // ============ Parallel Operations Tests ============

  describe('Parallel Operations (Arcology-specific)', function () {
    it('should handle parallel transfers from different senders', async function () {
      // Setup: Give tokens to alice, bob, carol
      const setupAmount = ethers.parseEther('10000');
      await (await token.transfer(alice.address, setupAmount)).wait();
      await (await token.transfer(bob.address, setupAmount)).wait();
      await (await token.transfer(carol.address, setupAmount)).wait();

      // Create recipient addresses
      const recipients = await Promise.all([
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
      ]);

      const transferAmount = ethers.parseEther('5000');

      // Execute parallel transfers using Arcology's frontend-util
      const txs = [
        frontendUtil.generateTx(
          ([token, from, to, amount]) =>
            token.connect(from).transfer(to, amount),
          token,
          alice,
          recipients[0],
          transferAmount
        ),
        frontendUtil.generateTx(
          ([token, from, to, amount]) =>
            token.connect(from).transfer(to, amount),
          token,
          bob,
          recipients[1],
          transferAmount
        ),
        frontendUtil.generateTx(
          ([token, from, to, amount]) =>
            token.connect(from).transfer(to, amount),
          token,
          carol,
          recipients[2],
          transferAmount
        ),
      ];

      await frontendUtil.waitingTxs(txs);

      // Verify balances
      expect(await token.balanceOf(recipients[0])).to.equal(transferAmount);
      expect(await token.balanceOf(recipients[1])).to.equal(transferAmount);
      expect(await token.balanceOf(recipients[2])).to.equal(transferAmount);
      expect(await token.balanceOf(alice.address)).to.equal(
        setupAmount - transferAmount
      );
      expect(await token.balanceOf(bob.address)).to.equal(
        setupAmount - transferAmount
      );
      expect(await token.balanceOf(carol.address)).to.equal(
        setupAmount - transferAmount
      );
    });

    it('should handle parallel mints', async function () {
      const mint1 = ethers.parseEther('1000');
      const mint2 = ethers.parseEther('2000');
      const mint3 = ethers.parseEther('3000');

      const beforeSupply = await token.totalSupply();

      // Execute parallel mints
      const txs = [
        frontendUtil.generateTx(
          ([token, to, amount]) => token.mint(to, amount),
          token,
          alice.address,
          mint1
        ),
        frontendUtil.generateTx(
          ([token, to, amount]) => token.mint(to, amount),
          token,
          bob.address,
          mint2
        ),
        frontendUtil.generateTx(
          ([token, to, amount]) => token.mint(to, amount),
          token,
          carol.address,
          mint3
        ),
      ];

      await frontendUtil.waitingTxs(txs);

      // Verify balances
      expect(await token.balanceOf(alice.address)).to.equal(mint1);
      expect(await token.balanceOf(bob.address)).to.equal(mint2);
      expect(await token.balanceOf(carol.address)).to.equal(mint3);
      expect(await token.totalSupply()).to.equal(
        beforeSupply + mint1 + mint2 + mint3
      );
    });
  });

  // ============ Balance Tracking Accuracy Tests ============

  describe('Balance Consistency', function () {
    it('should maintain balance consistency after multiple operations', async function () {
      const initialOwnerBalance = await token.balanceOf(owner.address);

      // Perform various operations
      await (
        await token.transfer(alice.address, ethers.parseEther('1000'))
      ).wait();
      await (await token.mint(bob.address, ethers.parseEther('2000'))).wait();
      await (
        await token.transfer(carol.address, ethers.parseEther('500'))
      ).wait();

      await (
        await token
          .connect(alice)
          .transfer(bob.address, ethers.parseEther('300'))
      ).wait();

      // Verify total supply consistency
      const initialSupply = ethers.parseEther('1000000');
      const expectedTotalSupply = initialSupply + ethers.parseEther('2000'); // Only mint added
      expect(await token.totalSupply()).to.equal(expectedTotalSupply);

      // Verify individual balances
      expect(await token.balanceOf(alice.address)).to.equal(
        ethers.parseEther('700')
      ); // 1000 - 300
      expect(await token.balanceOf(bob.address)).to.equal(
        ethers.parseEther('2300')
      ); // 2000 + 300
      expect(await token.balanceOf(carol.address)).to.equal(
        ethers.parseEther('500')
      );
      expect(await token.balanceOf(owner.address)).to.equal(
        initialOwnerBalance - ethers.parseEther('1500')
      ); // 1000 + 500
    });
  });
});
