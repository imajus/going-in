/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
const { ConcurrentERC20, TicketingCore } = require('generated');

// Helper function to safely get BigInt value or default to 0
const getBigInt = (value) => value ? BigInt(value) : 0n;

// Helper function to get or initialize PlatformStats (singleton)
const getPlatformStats = async (context) => {
  const PLATFORM_ID = 'platform';
  let stats = await context.PlatformStats.get(PLATFORM_ID);

  if (!stats) {
    stats = {
      id: PLATFORM_ID,
      totalEvents: 0,
      totalTicketsSold: 0,
      totalRefunds: 0,
      totalRevenue: 0n,
      totalRefundAmount: 0n,
    };
  }

  return stats;
};

ConcurrentERC20.Approval.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner,
    spender: event.params.spender,
    value: event.params.value,
  };

  context.ConcurrentERC20_Approval.set(entity);
});

ConcurrentERC20.Transfer.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    from: event.params.from,
    to: event.params.to,
    value: event.params.value,
  };

  context.ConcurrentERC20_Transfer.set(entity);
});

TicketingCore.EventCreated.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    eventId: event.params.eventId,
    name: event.params.name,
    venue: event.params.venue,
    timestamp: event.params.timestamp,
    organizer: event.params.organizer,
    tierCount: event.params.tierCount,
  };

  context.TicketingCore_EventCreated.set(entity);

  // Initialize EventStats for this event
  const eventStatsId = event.params.eventId.toString();
  const eventStats = {
    id: eventStatsId,
    eventId: event.params.eventId,
    totalPurchases: 0,
    totalRefunds: 0,
    totalRevenue: 0n,
    totalRefundAmount: 0n,
    netRevenue: 0n,
    revenueWithdrawn: 0n,
  };
  context.EventStats.set(eventStats);

  // Update OrganizerStats
  const organizerId = event.params.organizer.toLowerCase();
  let organizerStats = await context.OrganizerStats.get(organizerId);

  if (!organizerStats) {
    organizerStats = {
      id: organizerId,
      address: event.params.organizer,
      eventsCreated: 0,
      totalRevenue: 0n,
      totalWithdrawn: 0n,
    };
  }

  organizerStats.eventsCreated += 1;
  context.OrganizerStats.set(organizerStats);

  // Update PlatformStats
  const platformStats = await getPlatformStats(context);
  platformStats.totalEvents += 1;
  context.PlatformStats.set(platformStats);
});

TicketingCore.RevenueWithdrawn.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    eventId: event.params.eventId,
    organizer: event.params.organizer,
    amount: event.params.amount,
  };

  context.TicketingCore_RevenueWithdrawn.set(entity);

  // Update EventStats
  const eventStatsId = event.params.eventId.toString();
  const eventStats = await context.EventStats.get(eventStatsId);

  if (eventStats) {
    eventStats.revenueWithdrawn = getBigInt(eventStats.revenueWithdrawn) + getBigInt(event.params.amount);
    context.EventStats.set(eventStats);
  }

  // Update OrganizerStats
  const organizerId = event.params.organizer.toLowerCase();
  let organizerStats = await context.OrganizerStats.get(organizerId);

  if (organizerStats) {
    organizerStats.totalWithdrawn = getBigInt(organizerStats.totalWithdrawn) + getBigInt(event.params.amount);
    context.OrganizerStats.set(organizerStats);
  }
});

TicketingCore.TicketPurchased.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    eventId: event.params.eventId,
    tierIdx: event.params.tierIdx,
    buyer: event.params.buyer,
    tokenId: event.params.tokenId,
    price: event.params.price,
  };

  context.TicketingCore_TicketPurchased.set(entity);

  const price = getBigInt(event.params.price);

  // Update EventStats
  const eventStatsId = event.params.eventId.toString();
  const eventStats = await context.EventStats.get(eventStatsId);

  if (eventStats) {
    eventStats.totalPurchases += 1;
    eventStats.totalRevenue = getBigInt(eventStats.totalRevenue) + price;
    eventStats.netRevenue = getBigInt(eventStats.totalRevenue) - getBigInt(eventStats.totalRefundAmount);
    context.EventStats.set(eventStats);
  }

  // Update TierStats
  const tierStatsId = `${event.params.eventId}_${event.params.tierIdx}`;
  let tierStats = await context.TierStats.get(tierStatsId);

  if (!tierStats) {
    tierStats = {
      id: tierStatsId,
      eventId: event.params.eventId,
      tierIdx: event.params.tierIdx,
      soldCount: 0,
      purchaseCount: 0,
      refundCount: 0,
      totalRevenue: 0n,
      totalRefundAmount: 0n,
    };
  }

  tierStats.purchaseCount += 1;
  tierStats.soldCount += 1;
  tierStats.totalRevenue = getBigInt(tierStats.totalRevenue) + price;
  context.TierStats.set(tierStats);

  // Update UserStats
  const userId = event.params.buyer.toLowerCase();
  let userStats = await context.UserStats.get(userId);

  if (!userStats) {
    userStats = {
      id: userId,
      address: event.params.buyer,
      totalTicketsPurchased: 0,
      totalTicketsRefunded: 0,
      activeTickets: 0,
      totalSpent: 0n,
      totalRefunded: 0n,
    };
  }

  userStats.totalTicketsPurchased += 1;
  userStats.activeTickets += 1;
  userStats.totalSpent = getBigInt(userStats.totalSpent) + price;
  context.UserStats.set(userStats);

  // Update PlatformStats
  const platformStats = await getPlatformStats(context);
  platformStats.totalTicketsSold += 1;
  platformStats.totalRevenue = getBigInt(platformStats.totalRevenue) + price;
  context.PlatformStats.set(platformStats);
});

TicketingCore.TicketRefunded.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    eventId: event.params.eventId,
    tierIdx: event.params.tierIdx,
    buyer: event.params.buyer,
    tokenId: event.params.tokenId,
    refundAmount: event.params.refundAmount,
  };

  context.TicketingCore_TicketRefunded.set(entity);

  const refundAmount = getBigInt(event.params.refundAmount);

  // Update EventStats
  const eventStatsId = event.params.eventId.toString();
  const eventStats = await context.EventStats.get(eventStatsId);

  if (eventStats) {
    eventStats.totalRefunds += 1;
    eventStats.totalRefundAmount = getBigInt(eventStats.totalRefundAmount) + refundAmount;
    eventStats.netRevenue = getBigInt(eventStats.totalRevenue) - getBigInt(eventStats.totalRefundAmount);
    context.EventStats.set(eventStats);
  }

  // Update TierStats
  const tierStatsId = `${event.params.eventId}_${event.params.tierIdx}`;
  let tierStats = await context.TierStats.get(tierStatsId);

  if (tierStats) {
    tierStats.refundCount += 1;
    tierStats.soldCount -= 1;
    tierStats.totalRefundAmount = getBigInt(tierStats.totalRefundAmount) + refundAmount;
    context.TierStats.set(tierStats);
  }

  // Update UserStats
  const userId = event.params.buyer.toLowerCase();
  let userStats = await context.UserStats.get(userId);

  if (userStats) {
    userStats.totalTicketsRefunded += 1;
    userStats.activeTickets -= 1;
    userStats.totalRefunded = getBigInt(userStats.totalRefunded) + refundAmount;
    context.UserStats.set(userStats);
  }

  // Update PlatformStats
  const platformStats = await getPlatformStats(context);
  platformStats.totalRefunds += 1;
  platformStats.totalRefundAmount = getBigInt(platformStats.totalRefundAmount) + refundAmount;
  context.PlatformStats.set(platformStats);
});
