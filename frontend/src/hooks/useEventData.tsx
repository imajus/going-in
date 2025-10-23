import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTicketingCore, usePaymentToken } from './useContract';
import type { TicketingCore } from 'ethereum-scaffold-contracts/types';

/**
 * Event data structure
 */
export interface EventData {
  id: bigint;
  name: string;
  venue: string;
  timestamp: bigint;
  organizer: string;
  tiers: TierData[];
}

/**
 * Tier data structure
 */
export interface TierData {
  name: string;
  capacity: bigint;
  price: bigint;
  nftContract: string;
  sold: bigint; // Fetched separately via getTierAvailability
}

/**
 * Fetch event details from contract
 */
async function fetchEventDetails(
  contract: TicketingCore,
  eventId: bigint
): Promise<EventData | null> {
  try {
    // Call getEventDetails - this returns basic event info without sold/revenue data
    const eventDetails = await contract.getEventDetails(eventId);

    // Fetch sold count for each tier using getTierAvailability
    const tiersWithSold = await Promise.all(
      eventDetails.tiers.map(async (tier: any, index: number) => {
        try {
          const [sold] = await contract.getTierAvailability.staticCall(eventId, BigInt(index));
          return {
            name: tier.name,
            capacity: tier.capacity,
            price: tier.price,
            nftContract: tier.nftContract,
            sold: sold,
          };
        } catch (error) {
          console.error(`Error fetching sold count for tier ${index}:`, error);
          return {
            name: tier.name,
            capacity: tier.capacity,
            price: tier.price,
            nftContract: tier.nftContract,
            sold: BigInt(0),
          };
        }
      })
    );

    return {
      id: eventDetails.id,
      name: eventDetails.name,
      venue: eventDetails.venue,
      timestamp: eventDetails.timestamp,
      organizer: eventDetails.organizer,
      tiers: tiersWithSold,
    };
  } catch (error: any) {
    // Silently return null for non-existent events (expected behavior)
    // Only log if it's not a CALL_EXCEPTION (which means event doesn't exist)
    if (error.code !== 'CALL_EXCEPTION') {
      console.error('Error fetching event details:', error);
    }
    return null;
  }
}

/**
 * Hook to fetch event data by ID
 */
export function useEvent(eventId: bigint | null) {
  const contract = useTicketingCore(false);

  return useQuery({
    queryKey: ['event', eventId?.toString()],
    queryFn: () => (eventId ? fetchEventDetails(contract, eventId) : null),
    enabled: eventId !== null,
    refetchInterval: 3000, // Refetch every 3 seconds for real-time updates
    staleTime: 2000,
  });
}

/**
 * Hook to fetch all events (by trying sequential IDs)
 * Note: This is a simplified approach. In production, you'd want an indexed list.
 */
export function useEvents(maxEvents: number = 20) {
  const contract = useTicketingCore(false);

  return useQuery({
    queryKey: ['events', maxEvents],
    queryFn: async () => {
      const events: EventData[] = [];

      // Try fetching events with IDs starting from 1 (_nextEventId is initialized to 1 in constructor)
      for (let i = 1; i <= maxEvents; i++) {
        try {
          const event = await fetchEventDetails(contract, BigInt(i));
          if (event && event.name) {
            events.push(event);
          } else {
            // If we hit an empty event, we've likely reached the end
            break;
          }
        } catch (error) {
          // Event doesn't exist, stop searching
          break;
        }
      }

      return events;
    },
    refetchInterval: 5000, // Refetch every 5 seconds
    staleTime: 3000,
  });
}

/**
 * Hook to fetch events organized by a specific address
 */
export function useOrganizerEvents(organizerAddress: string | null, maxEvents: number = 20) {
  const contract = useTicketingCore(false);

  return useQuery({
    queryKey: ['organizer-events', organizerAddress, maxEvents],
    queryFn: async () => {
      if (!organizerAddress) {
        return [];
      }

      const events: EventData[] = [];

      // Try fetching events with IDs starting from 1
      for (let i = 1; i <= maxEvents; i++) {
        try {
          const event = await fetchEventDetails(contract, BigInt(i));
          if (event && event.name) {
            // Filter by organizer address (case-insensitive comparison)
            if (event.organizer.toLowerCase() === organizerAddress.toLowerCase()) {
              events.push(event);
            }
          } else {
            // If we hit an empty event, we've likely reached the end
            break;
          }
        } catch (error) {
          // Event doesn't exist, stop searching
          break;
        }
      }

      return events;
    },
    enabled: organizerAddress !== null,
    refetchInterval: 5000, // Refetch every 5 seconds
    staleTime: 3000,
  });
}

/**
 * Hook to fetch tier availability
 */
export function useTierAvailability(eventId: bigint | null, tierIdx: bigint | null) {
  const contract = useTicketingCore(false);

  return useQuery({
    queryKey: ['tier-availability', eventId?.toString(), tierIdx?.toString()],
    queryFn: async () => {
      if (eventId === null || tierIdx === null) {
        return null;
      }

      try {
        const availability = await contract.getTierAvailability.staticCall(eventId, tierIdx);
        return {
          sold: availability[0],
          capacity: availability[1],
        };
      } catch (error) {
        console.error('Error fetching tier availability:', error);
        return null;
      }
    },
    enabled: eventId !== null && tierIdx !== null,
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
  });
}

/**
 * Hook to check if refund is available for an event
 */
export function useCanRefund(eventId: bigint | null) {
  const contract = useTicketingCore(false);

  return useQuery({
    queryKey: ['can-refund', eventId?.toString()],
    queryFn: async () => {
      if (eventId === null) {
        return false;
      }

      try {
        return await contract.canRefund.staticCall(eventId);
      } catch (error) {
        console.error('Error checking refund availability:', error);
        return false;
      }
    },
    enabled: eventId !== null,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

/**
 * Hook to get refund deadline for an event
 */
export function useRefundDeadline(eventId: bigint | null) {
  const contract = useTicketingCore(false);

  return useQuery({
    queryKey: ['refund-deadline', eventId?.toString()],
    queryFn: async () => {
      if (eventId === null) {
        return null;
      }

      try {
        return await contract.getRefundDeadline.staticCall(eventId);
      } catch (error) {
        console.error('Error fetching refund deadline:', error);
        return null;
      }
    },
    enabled: eventId !== null,
  });
}

/**
 * Hook to get available revenue for withdrawal
 */
export function useAvailableRevenue(eventId: bigint | null) {
  const contract = useTicketingCore(false);

  return useQuery({
    queryKey: ['available-revenue', eventId?.toString()],
    queryFn: async () => {
      if (eventId === null) {
        return BigInt(0);
      }

      try {
        return await contract.getAvailableRevenue.staticCall(eventId);
      } catch (error) {
        console.error('Error fetching available revenue:', error);
        return BigInt(0);
      }
    },
    enabled: eventId !== null,
    refetchInterval: 5000,
  });
}

/**
 * Hook to get payment token address
 */
export function usePaymentTokenAddress() {
  const contract = useTicketingCore(false);

  return useQuery({
    queryKey: ['payment-token-address'],
    queryFn: async () => {
      try {
        return await contract.paymentToken();
      } catch (error) {
        console.error('Error fetching payment token address:', error);
        return null;
      }
    },
    staleTime: Infinity, // Payment token address never changes
  });
}

/**
 * Hook to get user's token balance
 */
export function useTokenBalance(address: string | null) {
  const contract = usePaymentToken(false);

  return useQuery({
    queryKey: ['token-balance', address],
    queryFn: async () => {
      if (!address) {
        return BigInt(0);
      }

      try {
        return await contract.balanceOf(address);
      } catch (error) {
        console.error('Error fetching token balance:', error);
        return BigInt(0);
      }
    },
    enabled: address !== null,
    refetchInterval: 3000,
  });
}

/**
 * Hook to get payment token symbol (e.g., "USDC", "DAI")
 */
export function useTokenSymbol() {
  const contract = usePaymentToken(false);

  return useQuery({
    queryKey: ['token-symbol'],
    queryFn: async () => {
      try {
        return await contract.symbol();
      } catch (error) {
        console.error('Error fetching token symbol:', error);
        return 'TOKEN'; // Fallback to generic "TOKEN" if fetch fails
      }
    },
    staleTime: Infinity, // Token symbol never changes
  });
}

/**
 * User ticket data structure
 */
export interface UserTicket {
  eventId: bigint;
  tierIdx: bigint;
  tokenId: bigint;
  price: bigint;
  nftContract: string;
  tierName: string;
  eventData: EventData | null;
  refundEligible: boolean;
  refundDeadline: bigint | null;
}

/**
 * Hook to fetch all tickets owned by a user
 */
export function useUserTickets(userAddress: string | null) {
  const contract = useTicketingCore(false);

  return useQuery({
    queryKey: ['user-tickets', userAddress],
    queryFn: async () => {
      if (!userAddress) {
        return [];
      }

      try {
        // Fetch latest block number (Arcology doesn't support "latest" as block specifier)
        const provider = contract.runner?.provider;
        if (!provider) {
          throw new Error('Provider not available');
        }
        const latestBlock = await provider.getBlockNumber();

        // Query TicketPurchased events for this user
        const purchaseFilter = contract.filters.TicketPurchased(null, null, userAddress);
        const purchaseEvents = await contract.queryFilter(purchaseFilter, 0, latestBlock);

        // Query TicketRefunded events to filter out refunded tickets
        const refundFilter = contract.filters.TicketRefunded(null, null, userAddress);
        const refundEvents = await contract.queryFilter(refundFilter, 0, latestBlock);

        // Create a set of refunded token IDs for quick lookup
        const refundedTokens = new Set(
          refundEvents.map((event) => {
            const args = event.args as any;
            return `${args.eventId.toString()}-${args.tokenId.toString()}`;
          })
        );

        // Process purchase events and filter out refunded tickets
        const ticketsPromises = purchaseEvents
          .filter((event) => {
            const args = event.args as any;
            const key = `${args.eventId.toString()}-${args.tokenId.toString()}`;
            return !refundedTokens.has(key);
          })
          .map(async (event) => {
            const args = event.args as any;
            const eventId = args.eventId;
            const tierIdx = args.tierIdx;
            const tokenId = args.tokenId;
            const price = args.price;

            // Fetch event details
            const eventData = await fetchEventDetails(contract, eventId);

            // Get tier info
            const tierName = eventData?.tiers[Number(tierIdx)]?.name || 'Unknown Tier';
            const nftContract = eventData?.tiers[Number(tierIdx)]?.nftContract || '';

            // Check refund eligibility
            const refundDeadline = eventData ? eventData.timestamp - BigInt(12 * 60 * 60) : null;
            const refundEligible = refundDeadline ? BigInt(Math.floor(Date.now() / 1000)) < refundDeadline : false;

            return {
              eventId,
              tierIdx,
              tokenId,
              price,
              nftContract,
              tierName,
              eventData,
              refundEligible,
              refundDeadline,
            } as UserTicket;
          });

        const tickets = await Promise.all(ticketsPromises);
        return tickets;
      } catch (error) {
        console.error('Error fetching user tickets:', error);
        return [];
      }
    },
    enabled: userAddress !== null,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    staleTime: 3000,
  });
}

/**
 * Hook to invalidate queries after mutations
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateEvent: (eventId: bigint) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    invalidateAllEvents: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    invalidateTierAvailability: (eventId: bigint, tierIdx: bigint) => {
      queryClient.invalidateQueries({
        queryKey: ['tier-availability', eventId.toString(), tierIdx.toString()]
      });
    },
    invalidateTokenBalance: (address: string) => {
      queryClient.invalidateQueries({ queryKey: ['token-balance', address] });
    },
    invalidateUserTickets: (userAddress: string) => {
      queryClient.invalidateQueries({ queryKey: ['user-tickets', userAddress] });
    },
  };
}
