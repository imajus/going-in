/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
const { ConcurrentERC20, TicketingCore } = require('generated');

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
});

TicketingCore.RevenueWithdrawn.handler(async ({ event, context }) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    eventId: event.params.eventId,
    organizer: event.params.organizer,
    amount: event.params.amount,
  };

  context.TicketingCore_RevenueWithdrawn.set(entity);
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
});
