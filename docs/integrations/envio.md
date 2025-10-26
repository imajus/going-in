## Envio HyperIndex Integration

The project uses Envio **HyperIndex v2.31.0** to provide a real-time GraphQL API for querying blockchain state without expensive RPC calls or client-side filtering.

The indexer tracks two deployed contracts on Arcology Network (Chain ID: 118):

- `TicketingCore` - Captures event creation, ticket purchases, refunds, and revenue withdrawals
- `ConcurrentERC20` - Tracks token transfers and approvals

## Data Model

Beyond storing raw blockchain events, the indexer computes aggregated statistics in real-time through event handlers in `EventHandlers.js`. Each blockchain event triggers cascading updates across multiple entity types:

- `EventStats` - Per-event metrics (total purchases, refunds, net revenue)
- `TierStats` - Per-tier availability and sales data
- `UserStats` - User purchase history and active ticket counts
- `OrganizerStats` - Event organizer revenue and withdrawal tracking
- `PlatformStats` - Global platform metrics (singleton entity)

## Indexes

All schemas have indexes set up for optimised querying performance.
