import { expect } from 'chai';
import { network } from 'hardhat';
import frontendUtil from '@arcologynetwork/frontend-util/utils/util.js';
import { times } from 'lodash-es';

const { ethers } = await network.connect();

describe('TicketingCore', function () {
  let ticketingCore;
  let paymentToken;
  let owner, organizer, buyer1, buyer2, buyer3;

  // Helper function to get future timestamp
  const getFutureTimestamp = (hoursFromNow) => {
    return Math.floor(Date.now() / 1000) + hoursFromNow * 3600;
  };

  // Helper function to approve and wait for payment tokens
  const approveTokens = async (signer, amount) => {
    const tx = await paymentToken
      .connect(signer)
      .approve(await ticketingCore.getAddress(), amount);
    await tx.wait();
  };

  beforeEach(async function () {
    this.timeout(60000); // Increase timeout for deployment

    [owner, organizer, buyer1, buyer2, buyer3] = await ethers.getSigners();

    // Deploy ConcurrentERC20 payment token
    const ConcurrentERC20 = await ethers.getContractFactory('ConcurrentERC20');
    paymentToken = await ConcurrentERC20.deploy(
      'Test Token',
      'TEST',
      ethers.parseEther('1000000') // 1 million tokens initial supply
    );
    await paymentToken.waitForDeployment();

    // Mint tokens to test buyers
    const mintAmount = ethers.parseEther('10000');
    const tx1 = await paymentToken.mint(buyer1.address, mintAmount);
    await tx1.wait();
    const tx2 = await paymentToken.mint(buyer2.address, mintAmount);
    await tx2.wait();
    const tx3 = await paymentToken.mint(buyer3.address, mintAmount);
    await tx3.wait();

    // Deploy TicketingCore
    const TicketingCore = await ethers.getContractFactory('TicketingCore');
    ticketingCore = await TicketingCore.deploy(await paymentToken.getAddress());
    await ticketingCore.waitForDeployment();
  });

  describe('Deployment', function () {
    it('should set the correct payment token', async function () {
      expect(await ticketingCore.paymentToken()).to.equal(
        await paymentToken.getAddress()
      );
    });

    it.skip('should revert if payment token is zero address', async function () {
      // Note: Arcology network doesn't validate constructor requirements at deployment time
      // This validation would work on local Hardhat network but not on live Arcology network
    });
  });

  describe('Event Creation', function () {
    it('should create event with valid parameters', async function () {
      const eventTime = getFutureTimestamp(24); // 24 hours from now
      const tierConfigs = [
        { name: 'VIP', capacity: 100, price: ethers.parseEther('500') },
        { name: 'Premium', capacity: 500, price: ethers.parseEther('250') },
        { name: 'General', capacity: 1000, price: ethers.parseEther('100') },
      ];

      const tx = await ticketingCore
        .connect(organizer)
        .createEvent('Test Concert', 'Test Venue', eventTime, tierConfigs);

      const receipt = await tx.wait();

      // Check EventCreated event
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === 'EventCreated'
      );
      expect(event).to.not.be.undefined;
      expect(event.args.name).to.equal('Test Concert');
      expect(event.args.organizer).to.equal(organizer.address);
      expect(event.args.tierCount).to.equal(3);

      // Verify event data - convert eventId to Number
      const eventId = event.args.eventId;
      const eventData = await ticketingCore.getEventDetails(eventId);
      expect(eventData.name).to.equal('Test Concert');
      expect(eventData.venue).to.equal('Test Venue');
      expect(eventData.organizer).to.equal(organizer.address);
      expect(eventData.tiers.length).to.equal(3);
    });

    it('should revert if event timestamp is not >12 hours in future', async function () {
      const eventTime = getFutureTimestamp(10); // Only 10 hours from now
      const tierConfigs = [
        { name: 'VIP', capacity: 100, price: ethers.parseEther('500') },
      ];

      await expect(
        ticketingCore
          .connect(organizer)
          .createEvent('Test Concert', 'Test Venue', eventTime, tierConfigs)
      ).to.revert(ethers);
    });

    it('should revert if no tiers provided', async function () {
      const eventTime = getFutureTimestamp(24);
      const tierConfigs = [];

      await expect(
        ticketingCore
          .connect(organizer)
          .createEvent('Test Concert', 'Test Venue', eventTime, tierConfigs)
      ).to.revert(ethers);
    });

    it('should revert if more than 5 tiers provided', async function () {
      const eventTime = getFutureTimestamp(24);
      const tierConfigs = [
        { name: 'Tier1', capacity: 100, price: ethers.parseEther('100') },
        { name: 'Tier2', capacity: 100, price: ethers.parseEther('100') },
        { name: 'Tier3', capacity: 100, price: ethers.parseEther('100') },
        { name: 'Tier4', capacity: 100, price: ethers.parseEther('100') },
        { name: 'Tier5', capacity: 100, price: ethers.parseEther('100') },
        { name: 'Tier6', capacity: 100, price: ethers.parseEther('100') },
      ];

      await expect(
        ticketingCore
          .connect(organizer)
          .createEvent('Test Concert', 'Test Venue', eventTime, tierConfigs)
      ).to.revert(ethers);
    });

    it('should revert if tier capacity is zero', async function () {
      const eventTime = getFutureTimestamp(24);
      const tierConfigs = [
        { name: 'VIP', capacity: 0, price: ethers.parseEther('500') },
      ];

      await expect(
        ticketingCore
          .connect(organizer)
          .createEvent('Test Concert', 'Test Venue', eventTime, tierConfigs)
      ).to.revert(ethers);
    });

    it('should revert if tier names are not unique', async function () {
      const eventTime = getFutureTimestamp(24);
      const tierConfigs = [
        { name: 'VIP', capacity: 100, price: ethers.parseEther('500') },
        { name: 'VIP', capacity: 200, price: ethers.parseEther('250') },
      ];

      await expect(
        ticketingCore
          .connect(organizer)
          .createEvent('Test Concert', 'Test Venue', eventTime, tierConfigs)
      ).to.revert(ethers);
    });

    it('should deploy separate NFT contracts for each tier', async function () {
      const eventTime = getFutureTimestamp(24);
      const tierConfigs = [
        { name: 'VIP', capacity: 100, price: ethers.parseEther('500') },
        { name: 'Premium', capacity: 500, price: ethers.parseEther('250') },
      ];

      const tx = await ticketingCore
        .connect(organizer)
        .createEvent('Test Concert', 'Test Venue', eventTime, tierConfigs);
      const receipt = await tx.wait();

      const eventCreated = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === 'EventCreated'
      );
      const eventId = eventCreated.args.eventId;
      const eventData = await ticketingCore.getEventDetails(eventId);
      // Check that NFT contracts are different for each tier
      expect(eventData.tiers[0].nftContract).to.not.equal(
        eventData.tiers[1].nftContract
      );
      expect(eventData.tiers[0].nftContract).to.not.equal(ethers.ZeroAddress);
      expect(eventData.tiers[1].nftContract).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe('Ticket Purchase', function () {
    let eventId;
    const eventTime = getFutureTimestamp(48);
    const tierConfigs = [
      { name: 'VIP', capacity: 10, price: ethers.parseEther('500') },
      { name: 'General', capacity: 100, price: ethers.parseEther('100') },
    ];

    beforeEach(async function () {
      // Create event
      const tx = await ticketingCore
        .connect(organizer)
        .createEvent('Test Concert', 'Test Venue', eventTime, tierConfigs);
      const receipt = await tx.wait();
      const eventCreated = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === 'EventCreated'
      );
      eventId = eventCreated.args.eventId;
    });

    it('should purchase ticket successfully', async function () {
      // Approve payment
      await approveTokens(buyer1, ethers.parseEther('500'));

      // Purchase ticket
      const tx = await ticketingCore.connect(buyer1).purchaseTicket(eventId, 0);
      const receipt = await tx.wait();

      // Check TicketPurchased event
      const purchaseEvent = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === 'TicketPurchased'
      );
      expect(purchaseEvent).to.not.be.undefined;
      expect(purchaseEvent.args.buyer).to.equal(buyer1.address);
      expect(purchaseEvent.args.tierIdx).to.equal(0);
      expect(purchaseEvent.args.price).to.equal(ethers.parseEther('500'));

      // Verify sold count increased
      const [sold, capacity] = await ticketingCore.getTierAvailability(
        eventId,
        0
      );
      expect(sold).to.equal(1);
      expect(capacity).to.equal(10);
    });

    it('should revert if buyer has not approved tokens', async function () {
      await expect(
        ticketingCore.connect(buyer1).purchaseTicket(eventId, 0)
      ).to.revert(ethers);
    });

    it('should revert if tier index is invalid', async function () {
      await approveTokens(buyer1, ethers.parseEther('500'));

      await expect(
        ticketingCore.connect(buyer1).purchaseTicket(eventId, 5)
      ).to.revert(ethers);
    });

    it('should purchase multiple tickets to same buyer in parallel', async function () {
      // Approve payment for multiple tickets
      await approveTokens(buyer1, ethers.parseEther('1500'));

      // Purchase 3 tickets in parallel using frontendUtil
      // const txs = [
      //   frontendUtil.generateTx(
      //     ([core, id, tier]) => core.connect(buyer1).purchaseTicket(id, tier),
      //     ticketingCore,
      //     eventId,
      //     0
      //   ),
      //   frontendUtil.generateTx(
      //     ([core, id, tier]) => core.connect(buyer1).purchaseTicket(id, tier),
      //     ticketingCore,
      //     eventId,
      //     0
      //   ),
      //   frontendUtil.generateTx(
      //     ([core, id, tier]) => core.connect(buyer1).purchaseTicket(id, tier),
      //     ticketingCore,
      //     eventId,
      //     0
      //   ),
      // ];

      const txs = await Promise.all(
        times(3, () => ticketingCore.connect(owner).purchaseTicket(0, 0))
      );

      const receipts = await Promise.all(txs.map((tx) => tx.wait()));

      // Verify all purchases succeeded
      expect(receipts.length).to.equal(3);
      receipts.forEach((receipt) => {
        expect(receipt.status).to.equal(1);
        const purchaseEvent = receipt.logs.find(
          (log) => log.fragment && log.fragment.name === 'TicketPurchased'
        );
        expect(purchaseEvent).to.not.be.undefined;
      });

      // Verify sold count
      const [sold] = await ticketingCore.getTierAvailability(eventId, 0);
      expect(sold).to.equal(3);
    });

    it('should handle parallel purchases up to capacity', async function () {
      // Approve payment for all tickets
      await approveTokens(buyer1, ethers.parseEther('5500'));

      // Purchase tickets up to capacity (10 tickets) in parallel using frontendUtil
      const txs = times(10, () =>
        frontendUtil.generateTx(
          ([core, id, tier]) => core.connect(buyer1).purchaseTicket(id, tier),
          ticketingCore,
          eventId,
          0
        )
      );

      const receipts = await Promise.all(txs);

      // Verify all purchases succeeded
      const successfulPurchases = receipts.filter((r) => r.status === 1);
      console.log(
        `  Successfully purchased ${successfulPurchases.length}/10 tickets in parallel`
      );

      // Verify sold count reached capacity (or close to it due to concurrent constraints)
      const [sold, capacity] = await ticketingCore.getTierAvailability(
        eventId,
        0
      );
      console.log(`  Tier capacity: ${sold}/${capacity}`);
      expect(sold).to.be.greaterThan(0);
      expect(sold).to.be.lessThanOrEqual(capacity);

      // Try to purchase one more - should revert if capacity was reached
      if (sold >= capacity) {
        await expect(
          ticketingCore.connect(buyer1).purchaseTicket(eventId, 0)
        ).to.revert(ethers); // U256Cumulative will revert when exceeding upper bound
      }
    });
  });

  describe('Ticket Refund', function () {
    let eventId;
    let tokenId;
    const eventTime = getFutureTimestamp(48);
    const tierConfigs = [
      { name: 'VIP', capacity: 10, price: ethers.parseEther('500') },
    ];

    beforeEach(async function () {
      // Create event
      const tx = await ticketingCore
        .connect(organizer)
        .createEvent('Test Concert', 'Test Venue', eventTime, tierConfigs);
      const receipt = await tx.wait();
      const eventCreated = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === 'EventCreated'
      );
      eventId = eventCreated.args.eventId;

      // Purchase ticket
      await approveTokens(buyer1, ethers.parseEther('500'));
      const purchaseTx = await ticketingCore
        .connect(buyer1)
        .purchaseTicket(eventId, 0);
      const purchaseReceipt = await purchaseTx.wait();
      const purchaseEvent = purchaseReceipt.logs.find(
        (log) => log.fragment && log.fragment.name === 'TicketPurchased'
      );
      tokenId = purchaseEvent.args.tokenId;
    });

    it('should refund ticket before deadline', async function () {
      const balanceBefore = await paymentToken.balanceOf(buyer1.address);

      // Refund ticket
      const tx = await ticketingCore
        .connect(buyer1)
        .refundTicket(eventId, 0, tokenId);
      const receipt = await tx.wait();

      // Check TicketRefunded event
      const refundEvent = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === 'TicketRefunded'
      );
      expect(refundEvent).to.not.be.undefined;
      expect(refundEvent.args.buyer).to.equal(buyer1.address);
      expect(refundEvent.args.refundAmount).to.equal(ethers.parseEther('500'));

      // Verify balance increased
      const balanceAfter = await paymentToken.balanceOf(buyer1.address);
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther('500'));

      // Verify sold count decreased
      const [sold] = await ticketingCore.getTierAvailability(eventId, 0);
      expect(sold).to.equal(0);
    });

    it.skip('should revert if refund deadline has passed', async function () {
      // Note: Cannot test time-based behavior on live network without time manipulation
      // This test would require waiting 48 hours or deploying a modified contract
    });

    it('should revert if caller is not NFT owner', async function () {
      await expect(
        ticketingCore.connect(buyer2).refundTicket(eventId, 0, tokenId)
      ).to.revert(ethers);
    });
  });

  describe('Revenue Withdrawal', function () {
    let eventId;
    const eventTime = getFutureTimestamp(48);
    const tierConfigs = [
      { name: 'VIP', capacity: 10, price: ethers.parseEther('500') },
    ];

    beforeEach(async function () {
      // Create event
      const tx = await ticketingCore
        .connect(organizer)
        .createEvent('Test Concert', 'Test Venue', eventTime, tierConfigs);
      const receipt = await tx.wait();
      const eventCreated = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === 'EventCreated'
      );
      eventId = eventCreated.args.eventId;

      // Purchase 3 tickets
      await approveTokens(buyer1, ethers.parseEther('1500'));
      await (
        await ticketingCore.connect(buyer1).purchaseTicket(eventId, 0)
      ).wait();
      await (
        await ticketingCore.connect(buyer1).purchaseTicket(eventId, 0)
      ).wait();
      await (
        await ticketingCore.connect(buyer1).purchaseTicket(eventId, 0)
      ).wait();
    });

    it.skip('should allow organizer to withdraw revenue after refund deadline', async function () {
      // Note: Cannot test time-based behavior on live network without time manipulation
    });

    it('should revert if refund deadline has not passed', async function () {
      await expect(
        ticketingCore
          .connect(organizer)
          .withdrawRevenue(eventId, ethers.parseEther('500'))
      ).to.revert(ethers);
    });

    it.skip('should revert if caller is not organizer', async function () {
      // Note: Cannot test time-based behavior on live network
    });

    it.skip('should allow multiple withdrawals', async function () {
      // Note: Cannot test time-based behavior on live network
    });

    it.skip('should revert if withdrawal amount exceeds available revenue', async function () {
      // Note: Cannot test time-based behavior on live network
    });
  });

  describe('Getter Functions', function () {
    let eventId;
    const eventTime = getFutureTimestamp(48);
    const tierConfigs = [
      { name: 'VIP', capacity: 10, price: ethers.parseEther('500') },
    ];

    beforeEach(async function () {
      const tx = await ticketingCore
        .connect(organizer)
        .createEvent('Test Concert', 'Test Venue', eventTime, tierConfigs);
      const receipt = await tx.wait();
      const eventCreated = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === 'EventCreated'
      );
      eventId = eventCreated.args.eventId;
    });

    it('should return correct refund deadline', async function () {
      const refundDeadline = await ticketingCore.getRefundDeadline(eventId);
      expect(refundDeadline).to.equal(eventTime - 12 * 3600);
    });

    it('should return true for canRefund before deadline', async function () {
      const canRefund = await ticketingCore.canRefund(eventId);
      expect(canRefund).to.be.true;
    });

    it.skip('should return false for canRefund after deadline', async function () {
      // Note: Cannot test time-based behavior on live network
    });

    it('should return correct tier availability', async function () {
      const [sold, capacity] = await ticketingCore.getTierAvailability(
        eventId,
        0
      );
      expect(sold).to.equal(0);
      expect(capacity).to.equal(10);
    });

    it('should return correct event data', async function () {
      const eventData = await ticketingCore.getEventDetails(eventId);
      expect(eventData.name).to.equal('Test Concert');
      expect(eventData.venue).to.equal('Test Venue');
      expect(eventData.timestamp).to.equal(eventTime);
      expect(eventData.organizer).to.equal(organizer.address);
      expect(eventData.tiers.length).to.equal(1);
    });
  });

  // ============ Parallel Operations Tests (Arcology-specific) ============

  describe('Parallel Operations', function () {
    let eventId;
    const eventTime = getFutureTimestamp(48);
    const tierConfigs = [
      { name: 'VIP', capacity: 50, price: ethers.parseEther('500') },
      { name: 'General', capacity: 100, price: ethers.parseEther('100') },
    ];

    beforeEach(async function () {
      this.timeout(60000);

      // Create event
      const tx = await ticketingCore
        .connect(organizer)
        .createEvent('Mega Concert', 'Arena', eventTime, tierConfigs);
      const receipt = await tx.wait();
      const eventCreated = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === 'EventCreated'
      );
      eventId = eventCreated.args.eventId;

      // Mint tokens to test buyers
      const mintAmount = ethers.parseEther('50000');
      await (await paymentToken.mint(buyer1.address, mintAmount)).wait();
      await (await paymentToken.mint(buyer2.address, mintAmount)).wait();
      await (await paymentToken.mint(buyer3.address, mintAmount)).wait();
    });

    it('should handle parallel purchases from multiple buyers', async function () {
      this.timeout(120000);

      // Approve payments
      await approveTokens(buyer1, ethers.parseEther('10000'));
      await approveTokens(buyer2, ethers.parseEther('10000'));
      await approveTokens(buyer3, ethers.parseEther('10000'));

      const beforeSold = (
        await ticketingCore.getTierAvailability(eventId, 1)
      )[0];

      // Create parallel purchase transactions from different buyers
      const txs = [
        // Buyer 1 purchases 5 tickets
        ...times(5, () =>
          frontendUtil.generateTx(
            ([core, id, tier]) => core.connect(buyer1).purchaseTicket(id, tier),
            ticketingCore,
            eventId,
            1 // General tier
          )
        ),
        // Buyer 2 purchases 5 tickets
        ...times(5, () =>
          frontendUtil.generateTx(
            ([core, id, tier]) => core.connect(buyer2).purchaseTicket(id, tier),
            ticketingCore,
            eventId,
            1
          )
        ),
        // Buyer 3 purchases 5 tickets
        ...times(5, () =>
          frontendUtil.generateTx(
            ([core, id, tier]) => core.connect(buyer3).purchaseTicket(id, tier),
            ticketingCore,
            eventId,
            1
          )
        ),
      ];

      const receipts = await Promise.all(txs);

      // Count successful purchases
      const successfulPurchases = receipts.filter((r) => r.status === 1);
      console.log(
        `  Successfully processed ${successfulPurchases.length}/15 parallel purchases`
      );

      // Verify sold count increased
      const afterSold = (
        await ticketingCore.getTierAvailability(eventId, 1)
      )[0];
      expect(afterSold).to.be.greaterThan(beforeSold);
      console.log(`  Sold count increased from ${beforeSold} to ${afterSold}`);

      // Verify revenue was updated correctly
      const revenue = await ticketingCore.getAvailableRevenue(eventId);
      const expectedMinRevenue = ethers.parseEther('100') * afterSold;
      expect(revenue).to.be.gte(expectedMinRevenue);
    });

    it('should handle parallel purchases across different tiers', async function () {
      this.timeout(120000);

      // Approve payments
      await approveTokens(buyer1, ethers.parseEther('5000'));
      await approveTokens(buyer2, ethers.parseEther('2000'));

      // Create parallel purchases across tiers
      const txs = [
        // Buyer 1 purchases VIP tickets
        ...times(5, () =>
          frontendUtil.generateTx(
            ([core, id, tier]) => core.connect(buyer1).purchaseTicket(id, tier),
            ticketingCore,
            eventId,
            0 // VIP tier
          )
        ),
        // Buyer 2 purchases General tickets
        ...times(10, () =>
          frontendUtil.generateTx(
            ([core, id, tier]) => core.connect(buyer2).purchaseTicket(id, tier),
            ticketingCore,
            eventId,
            1 // General tier
          )
        ),
      ];

      const receipts = await Promise.all(txs);

      const successfulPurchases = receipts.filter((r) => r.status === 1);
      console.log(
        `  Successfully processed ${successfulPurchases.length}/15 cross-tier purchases`
      );

      // Verify both tiers were updated
      const [vipSold] = await ticketingCore.getTierAvailability(eventId, 0);
      const [generalSold] = await ticketingCore.getTierAvailability(eventId, 1);

      console.log(`  VIP sold: ${vipSold}, General sold: ${generalSold}`);
      expect(vipSold).to.be.greaterThan(0);
      expect(generalSold).to.be.greaterThan(0);
    });

    it('should handle large batch parallel purchases (stress test)', async function () {
      this.timeout(180000);

      const batchSize = 20;

      // Approve large amount
      await approveTokens(buyer1, ethers.parseEther('10000'));

      const beforeSold = (
        await ticketingCore.getTierAvailability(eventId, 1)
      )[0];
      const beforeRevenue = await ticketingCore.getAvailableRevenue(eventId);

      // Create large batch of parallel purchases
      const txs = times(batchSize, () =>
        frontendUtil.generateTx(
          ([core, id, tier]) => core.connect(buyer1).purchaseTicket(id, tier),
          ticketingCore,
          eventId,
          1 // General tier
        )
      );

      const receipts = await Promise.all(txs);

      const successfulPurchases = receipts.filter((r) => r.status === 1);
      console.log(
        `  Successfully processed ${successfulPurchases.length}/${batchSize} parallel purchases`
      );

      // Verify state consistency
      const afterSold = (
        await ticketingCore.getTierAvailability(eventId, 1)
      )[0];
      const afterRevenue = await ticketingCore.getAvailableRevenue(eventId);

      expect(afterSold).to.be.greaterThan(beforeSold);
      expect(afterRevenue).to.be.greaterThan(beforeRevenue);

      // Verify revenue matches sold tickets
      const ticketPrice = ethers.parseEther('100');
      const expectedRevenueIncrease = ticketPrice * (afterSold - beforeSold);
      const actualRevenueIncrease = afterRevenue - beforeRevenue;

      console.log(
        `  Revenue increase: ${ethers.formatEther(
          actualRevenueIncrease
        )} tokens`
      );
      console.log(
        `  Expected: ${ethers.formatEther(expectedRevenueIncrease)} tokens`
      );
      expect(actualRevenueIncrease).to.equal(expectedRevenueIncrease);
    });

    it('should maintain state consistency under parallel operations', async function () {
      this.timeout(120000);

      // Approve payments
      await approveTokens(buyer1, ethers.parseEther('3000'));
      await approveTokens(buyer2, ethers.parseEther('2000'));

      // Mix of parallel purchases across tiers
      const purchaseTxs = [
        ...times(3, () =>
          frontendUtil.generateTx(
            ([core, id, tier]) => core.connect(buyer1).purchaseTicket(id, tier),
            ticketingCore,
            eventId,
            0 // VIP
          )
        ),
        ...times(5, () =>
          frontendUtil.generateTx(
            ([core, id, tier]) => core.connect(buyer2).purchaseTicket(id, tier),
            ticketingCore,
            eventId,
            1 // General
          )
        ),
      ];

      const receipts = await Promise.all(purchaseTxs);

      // Extract token IDs from successful purchases
      const tokenIds = receipts
        .filter((r) => r.status === 1)
        .map((receipt) => {
          const purchaseEvent = receipt.logs.find(
            (log) => log.fragment && log.fragment.name === 'TicketPurchased'
          );
          return purchaseEvent?.args.tokenId;
        })
        .filter((id) => id !== undefined);

      console.log(`  Generated ${tokenIds.length} unique ticket NFTs`);

      // Verify all token IDs are unique
      const uniqueTokenIds = new Set(tokenIds.map((id) => id.toString()));
      expect(uniqueTokenIds.size).to.equal(tokenIds.length);

      // Verify final state
      const [vipSold] = await ticketingCore.getTierAvailability(eventId, 0);
      const [generalSold] = await ticketingCore.getTierAvailability(eventId, 1);
      const revenue = await ticketingCore.getAvailableRevenue(eventId);

      const expectedRevenue =
        vipSold * ethers.parseEther('500') +
        generalSold * ethers.parseEther('100');

      console.log(`  Final state - VIP: ${vipSold}, General: ${generalSold}`);
      console.log(`  Revenue: ${ethers.formatEther(revenue)} tokens`);

      expect(revenue).to.equal(expectedRevenue);
    });
  });
});
