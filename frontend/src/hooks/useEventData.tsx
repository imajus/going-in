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
  revenue: bigint;
}

/**
 * Tier data structure
 */
export interface TierData {
  name: string;
  capacity: bigint;
  price: bigint;
  nftContract: string;
  sold: bigint;
}

/**
 * Fetch event details from contract
 */
async function fetchEventDetails(
  contract: TicketingCore,
  eventId: bigint
): Promise<EventData | null> {
  // Call getEventDetails - this returns a struct
  const eventDetails = await contract.getEventDetails(eventId);
  return {
    id: eventDetails.id,
    name: eventDetails.name,
    venue: eventDetails.venue,
    timestamp: eventDetails.timestamp,
    organizer: eventDetails.organizer,
    tiers: eventDetails.tiers.map((tier) => ({
      name: tier.name,
      capacity: tier.capacity,
      price: tier.price,
      nftContract: tier.nftContract,
      sold: tier.sold,
    })),
    revenue: eventDetails.revenue,
  };
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

      // Try fetching events with IDs from 0 to maxEvents
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
        return await contract.balanceOf.staticCall(address);
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
  };
}
