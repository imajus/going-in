import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql';
import type {
  EventCreatedEntity,
  EventStats,
  TierStats,
  UserStats,
  OrganizerStats,
  PlatformStats,
  TicketPurchasedEntity,
  TicketRefundedEntity,
  RevenueWithdrawnEntity,
} from '@/lib/graphql';
import { useTicketingCore } from './useContract';
import type { UserTicket } from './useEventData';
import { fetchEventDetails } from './useEventData';

/**
 * Hook to fetch all events from the indexer
 * Queries TicketingCore_EventCreated entities
 */
export function useAllEvents(options?: {
  upcomingOnly?: boolean;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['events', 'all', options],
    queryFn: async () => {
      const currentTimestamp = Math.floor(Date.now() / 1000);

      const query = `
        query GetAllEvents($currentTimestamp: Int, $limit: Int) {
          TicketingCore_EventCreated(
            ${options?.upcomingOnly ? 'where: { timestamp: { _gt: $currentTimestamp } }' : ''}
            order_by: [{ timestamp: asc }]
            ${options?.limit ? 'limit: $limit' : ''}
          ) {
            id
            eventId
            name
            venue
            timestamp
            organizer
            tierCount
          }
        }
      `;

      const variables = {
        currentTimestamp: options?.upcomingOnly ? currentTimestamp : undefined,
        limit: options?.limit,
      };

      const data = await graphqlClient.request<{
        TicketingCore_EventCreated: EventCreatedEntity[];
      }>(query, variables);

      return data.TicketingCore_EventCreated;
    },
    refetchInterval: 60000, // 60 seconds - static query
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}

/**
 * Hook to fetch single event details with statistics
 * Includes EventStats for analytics
 */
export function useEventDetails(eventId: string | undefined): UseQueryResult<{
  event: EventCreatedEntity | null;
  stats: EventStats | null;
}> {
  return useQuery({
    queryKey: ['events', 'details', eventId],
    queryFn: async () => {
      if (!eventId) return { event: null, stats: null };

      const query = `
        query GetEventDetails($eventId: numeric!) {
          TicketingCore_EventCreated(
            where: { eventId: { _eq: $eventId } }
            limit: 1
          ) {
            id
            eventId
            name
            venue
            timestamp
            organizer
            tierCount
          }
          EventStats(where: { eventId: { _eq: $eventId } }) {
            id
            eventId
            totalPurchases
            totalRefunds
            totalRevenue
            totalRefundAmount
            netRevenue
            revenueWithdrawn
          }
        }
      `;

      const data = await graphqlClient.request<{
        TicketingCore_EventCreated: EventCreatedEntity[];
        EventStats: EventStats[];
      }>(query, { eventId });

      return {
        event: data.TicketingCore_EventCreated[0] || null,
        stats: data.EventStats[0] || null,
      };
    },
    enabled: !!eventId,
    refetchInterval: 60000, // 60 seconds
    staleTime: 30000,
  });
}

/**
 * Hook to fetch real-time tier availability
 * CRITICAL: Uses TierStats.soldCount for accurate availability
 */
export function useTierAvailability(
  eventId: string | undefined,
  tierIdx: number | undefined
): UseQueryResult<TierStats | null> {
  return useQuery({
    queryKey: ['tiers', 'availability', eventId, tierIdx],
    queryFn: async () => {
      if (eventId === undefined || tierIdx === undefined) return null;

      const tierId = `${eventId}_${tierIdx}`;

      const query = `
        query GetTierAvailability($tierId: String!) {
          TierStats(where: { id: { _eq: $tierId } }) {
            id
            eventId
            tierIdx
            purchaseCount
            refundCount
            soldCount
            totalRevenue
            totalRefundAmount
          }
        }
      `;

      const data = await graphqlClient.request<{
        TierStats: TierStats[];
      }>(query, { tierId });

      return data.TierStats[0] || null;
    },
    enabled: eventId !== undefined && tierIdx !== undefined,
    refetchInterval: 5000, // 5 seconds - critical real-time data
    staleTime: 2000, // Very fresh data required
  });
}

/**
 * Hook to fetch all tier statistics for an event
 * Used to display tier breakdown on event details page
 */
export function useEventTiers(eventId: string | undefined): UseQueryResult<TierStats[]> {
  return useQuery({
    queryKey: ['tiers', 'event', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const query = `
        query GetEventTiers($eventId: numeric!) {
          TierStats(
            where: { eventId: { _eq: $eventId } }
            order_by: [{ tierIdx: asc }]
          ) {
            id
            eventId
            tierIdx
            purchaseCount
            refundCount
            soldCount
            totalRevenue
            totalRefundAmount
          }
        }
      `;

      const data = await graphqlClient.request<{
        TierStats: TierStats[];
      }>(query, { eventId });

      return data.TierStats;
    },
    enabled: !!eventId,
    refetchInterval: 5000, // 5 seconds - critical data
    staleTime: 2000,
  });
}

/**
 * Hook to fetch user portfolio and ticket history
 * Includes UserStats and purchase/refund events
 */
export function useUserPortfolio(address: string | undefined): UseQueryResult<{
  stats: UserStats | null;
  purchases: TicketPurchasedEntity[];
  refunds: TicketRefundedEntity[];
}> {
  return useQuery({
    queryKey: ['users', 'portfolio', address?.toLowerCase()],
    queryFn: async () => {
      if (!address) {
        return { stats: null, purchases: [], refunds: [] };
      }

      const lowerAddress = address.toLowerCase();

      const query = `
        query GetUserPortfolio($address: String!) {
          UserStats(where: { id: { _eq: $address } }) {
            id
            totalTicketsPurchased
            totalTicketsRefunded
            activeTickets
            totalSpent
            totalRefunded
          }
          TicketingCore_TicketPurchased(
            where: { buyer: { _eq: $address } }
            order_by: [{ eventId: desc }]
          ) {
            id
            eventId
            tierIdx
            buyer
            tokenId
            price
          }
          TicketingCore_TicketRefunded(
            where: { buyer: { _eq: $address } }
            order_by: [{ eventId: desc }]
          ) {
            id
            eventId
            tierIdx
            buyer
            tokenId
            refundAmount
          }
        }
      `;

      const data = await graphqlClient.request<{
        UserStats: UserStats[];
        TicketingCore_TicketPurchased: TicketPurchasedEntity[];
        TicketingCore_TicketRefunded: TicketRefundedEntity[];
      }>(query, { address: lowerAddress });

      return {
        stats: data.UserStats[0] || null,
        purchases: data.TicketingCore_TicketPurchased,
        refunds: data.TicketingCore_TicketRefunded,
      };
    },
    enabled: !!address,
    refetchInterval: 30000, // 30 seconds - dashboard query
    staleTime: 15000,
  });
}

/**
 * Hook to fetch organizer dashboard data
 * Includes OrganizerStats and all organizer's events
 */
export function useOrganizerDashboard(address: string | undefined): UseQueryResult<{
  stats: OrganizerStats | null;
  events: Array<{
    event: EventCreatedEntity;
    stats: EventStats | null;
    tiers: TierStats[];
  }>;
  withdrawals: RevenueWithdrawnEntity[];
}> {
  return useQuery({
    queryKey: ['organizers', 'dashboard', address?.toLowerCase()],
    queryFn: async () => {
      if (!address) {
        return { stats: null, events: [], withdrawals: [] };
      }

      const lowerAddress = address.toLowerCase();

      const query = `
        query GetOrganizerDashboard($address: String!) {
          OrganizerStats(where: { id: { _eq: $address } }) {
            id
            eventsCreated
            totalRevenue
            totalWithdrawn
          }
          TicketingCore_EventCreated(
            where: { organizer: { _eq: $address } }
            order_by: [{ timestamp: desc }]
          ) {
            id
            eventId
            name
            venue
            timestamp
            organizer
            tierCount
          }
          TicketingCore_RevenueWithdrawn(
            where: { organizer: { _eq: $address } }
            order_by: [{ eventId: desc }]
          ) {
            id
            eventId
            organizer
            amount
          }
        }
      `;

      const data = await graphqlClient.request<{
        OrganizerStats: OrganizerStats[];
        TicketingCore_EventCreated: EventCreatedEntity[];
        TicketingCore_RevenueWithdrawn: RevenueWithdrawnEntity[];
      }>(query, { address: lowerAddress });

      // Fetch stats and tiers for each event
      const eventsWithDetails = await Promise.all(
        data.TicketingCore_EventCreated.map(async (event) => {
          const detailsQuery = `
            query GetEventStatsAndTiers($eventId: numeric!) {
              EventStats(where: { eventId: { _eq: $eventId } }) {
                id
                eventId
                totalPurchases
                totalRefunds
                totalRevenue
                totalRefundAmount
                netRevenue
                revenueWithdrawn
              }
              TierStats(
                where: { eventId: { _eq: $eventId } }
                order_by: [{ tierIdx: asc }]
              ) {
                id
                eventId
                tierIdx
                purchaseCount
                refundCount
                soldCount
                totalRevenue
                totalRefundAmount
              }
            }
          `;

          const details = await graphqlClient.request<{
            EventStats: EventStats[];
            TierStats: TierStats[];
          }>(detailsQuery, { eventId: event.eventId });

          return {
            event,
            stats: details.EventStats[0] || null,
            tiers: details.TierStats,
          };
        })
      );

      return {
        stats: data.OrganizerStats[0] || null,
        events: eventsWithDetails,
        withdrawals: data.TicketingCore_RevenueWithdrawn,
      };
    },
    enabled: !!address,
    refetchInterval: 30000, // 30 seconds - dashboard query
    staleTime: 15000,
  });
}

/**
 * Hook to fetch global platform statistics
 * Singleton entity with id="platform"
 */
export function usePlatformStats(): UseQueryResult<PlatformStats | null> {
  return useQuery({
    queryKey: ['platform', 'stats'],
    queryFn: async () => {
      const query = `
        query GetPlatformStats {
          PlatformStats(where: { id: { _eq: "platform" } }) {
            id
            totalEvents
            totalTicketsSold
            totalRefunds
            totalRevenue
            totalRefundAmount
          }
        }
      `;

      const data = await graphqlClient.request<{
        PlatformStats: PlatformStats[];
      }>(query);

      return data.PlatformStats[0] || null;
    },
    refetchInterval: 60000, // 60 seconds
    staleTime: 30000,
  });
}

/**
 * Hook to fetch top events by total purchases
 * Used for platform analytics and leaderboards
 */
export function useTopEvents(limit: number = 10): UseQueryResult<
  Array<{
    eventId: string;
    stats: EventStats;
    event: EventCreatedEntity | null;
  }>
> {
  return useQuery({
    queryKey: ['events', 'top', limit],
    queryFn: async () => {
      const query = `
        query GetTopEvents($limit: Int!) {
          EventStats(
            order_by: [{ totalPurchases: desc }]
            limit: $limit
          ) {
            id
            totalPurchases
            totalRefunds
            totalRevenue
            totalRefundAmount
            netRevenue
            revenueWithdrawn
          }
        }
      `;

      const data = await graphqlClient.request<{
        EventStats: EventStats[];
      }>(query, { limit });

      // Fetch event details for each stat
      const eventsWithDetails = await Promise.all(
        data.EventStats.map(async (stats) => {
          const eventQuery = `
            query GetEventById($eventId: numeric!) {
              TicketingCore_EventCreated(
                where: { eventId: { _eq: $eventId } }
                limit: 1
              ) {
                id
                eventId
                name
                venue
                timestamp
                organizer
                tierCount
              }
            }
          `;

          const eventData = await graphqlClient.request<{
            TicketingCore_EventCreated: EventCreatedEntity[];
          }>(eventQuery, { eventId: stats.id });

          return {
            eventId: stats.id,
            stats,
            event: eventData.TicketingCore_EventCreated[0] || null,
          };
        })
      );

      return eventsWithDetails;
    },
    refetchInterval: 60000, // 60 seconds
    staleTime: 30000,
  });
}

/**
 * Hook to fetch recent activity feed
 * Returns recent purchases, refunds, and events
 */
export function useRecentActivity(limit: number = 20): UseQueryResult<{
  purchases: TicketPurchasedEntity[];
  refunds: TicketRefundedEntity[];
  events: EventCreatedEntity[];
}> {
  return useQuery({
    queryKey: ['activity', 'recent', limit],
    queryFn: async () => {
      const query = `
        query GetRecentActivity($limit: Int!) {
          TicketingCore_TicketPurchased(
            order_by: [{ eventId: desc }]
            limit: $limit
          ) {
            id
            eventId
            tierIdx
            buyer
            tokenId
            price
          }
          TicketingCore_TicketRefunded(
            order_by: [{ eventId: desc }]
            limit: $limit
          ) {
            id
            eventId
            tierIdx
            buyer
            tokenId
            refundAmount
          }
          TicketingCore_EventCreated(
            order_by: [{ timestamp: desc }]
            limit: $limit
          ) {
            id
            eventId
            name
            venue
            timestamp
            organizer
            tierCount
          }
        }
      `;

      const data = await graphqlClient.request<{
        TicketingCore_TicketPurchased: TicketPurchasedEntity[];
        TicketingCore_TicketRefunded: TicketRefundedEntity[];
        TicketingCore_EventCreated: EventCreatedEntity[];
      }>(query, { limit });

      return {
        purchases: data.TicketingCore_TicketPurchased,
        refunds: data.TicketingCore_TicketRefunded,
        events: data.TicketingCore_EventCreated,
      };
    },
    refetchInterval: 30000, // 30 seconds
    staleTime: 15000,
  });
}

/**
 * Hook to fetch user's active (non-refunded) tickets
 * Combines GraphQL portfolio data with contract tier configuration
 */
export function useUserActiveTickets(address: string | undefined): UseQueryResult<UserTicket[]> {
  const contract = useTicketingCore(false);
  const { data: portfolio } = useUserPortfolio(address);

  return useQuery({
    queryKey: ['users', 'active-tickets', address?.toLowerCase()],
    queryFn: async () => {
      if (!address || !portfolio) return [];

      // Filter out refunded tickets
      const refundedSet = new Set(
        portfolio.refunds.map((r) => `${r.eventId}_${r.tokenId}`)
      );
      const activePurchases = portfolio.purchases.filter(
        (p) => !refundedSet.has(`${p.eventId}_${p.tokenId}`)
      );

      if (activePurchases.length === 0) return [];

      // Extract unique event IDs for batch fetching
      const uniqueEventIds = [...new Set(activePurchases.map((p) => p.eventId))];

      // Batch fetch: GraphQL event metadata + contract tier configs
      const eventDataMap = new Map();
      await Promise.all(
        uniqueEventIds.map(async (eventId) => {
          // Fetch GraphQL event details
          const gqlQuery = `
            query GetEventForTicket($eventId: numeric!) {
              TicketingCore_EventCreated(where: { eventId: { _eq: $eventId } }, limit: 1) {
                id
                eventId
                name
                venue
                timestamp
                organizer
                tierCount
              }
            }
          `;
          const gqlData = await graphqlClient.request<{
            TicketingCore_EventCreated: EventCreatedEntity[];
          }>(gqlQuery, { eventId });

          // Fetch contract tier configuration
          const tierConfig = await fetchEventDetails(contract, BigInt(eventId));

          eventDataMap.set(eventId, {
            gqlEvent: gqlData.TicketingCore_EventCreated[0],
            tierConfig,
          });
        })
      );

      // Map to UserTicket structure
      return activePurchases.map((purchase) => {
        const eventData = eventDataMap.get(purchase.eventId);
        const gqlEvent = eventData?.gqlEvent;
        const tierConfig = eventData?.tierConfig;

        const tierIdx = Number(purchase.tierIdx);
        const tier = tierConfig?.tiers[tierIdx];

        // Calculate refund eligibility client-side
        const eventTimestamp = gqlEvent ? BigInt(gqlEvent.timestamp) : BigInt(0);
        const refundDeadline = eventTimestamp - BigInt(12 * 60 * 60);
        const refundEligible = BigInt(Math.floor(Date.now() / 1000)) < refundDeadline;

        return {
          eventId: BigInt(purchase.eventId),
          tierIdx: BigInt(purchase.tierIdx),
          tokenId: BigInt(purchase.tokenId),
          price: BigInt(purchase.price),
          nftContract: tier?.nftContract || '',
          tierName: tier?.name || 'Unknown Tier',
          eventData: tierConfig,
          refundEligible,
          refundDeadline,
        } as UserTicket;
      });
    },
    enabled: !!address && !!portfolio,
    refetchInterval: 30000, // 30 seconds
    staleTime: 15000,
  });
}
