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
 * Note: sold counts come from GraphQL TierStats, not this interface
 */
export interface TierData {
  name: string;
  capacity: bigint;
  price: bigint;
  nftContract: string;
}

/**
 * Fetch event details from contract (tier configuration only)
 * Sold counts should be fetched from GraphQL TierStats
 */
export async function fetchEventDetails(
  contract: TicketingCore,
  eventId: bigint
): Promise<EventData | null> {
  try {
    // Call getEventDetails - returns basic event info and tier configuration
    const eventDetails = await contract.getEventDetails(eventId);

    // Extract tier configuration (no sold counts - use GraphQL for that)
    const tiers = eventDetails.tiers.map((tier: any) => ({
      name: tier.name,
      capacity: tier.capacity,
      price: tier.price,
      nftContract: tier.nftContract,
    }));

    return {
      id: eventDetails.id,
      name: eventDetails.name,
      venue: eventDetails.venue,
      timestamp: eventDetails.timestamp,
      organizer: eventDetails.organizer,
      tiers,
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
    invalidateTokenBalance: (address: string) => {
      queryClient.invalidateQueries({ queryKey: ['token-balance', address] });
    },
    invalidateUserTickets: (userAddress: string) => {
      queryClient.invalidateQueries({ queryKey: ['user-tickets', userAddress] });
    },
  };
}
