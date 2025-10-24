import { GraphQLClient } from 'graphql-request';

/**
 * GraphQL client for querying the Envio HyperIndex indexer
 *
 * Local development: http://localhost:8080/v1/graphql
 * Production: Configured via VITE_INDEXER_URL environment variable
 */
export const graphqlClient = new GraphQLClient(
  import.meta.env.VITE_INDEXER_URL || 'http://localhost:8080/v1/graphql',
  {
    headers: {
      'Content-Type': 'application/json',
    },
  }
);

/**
 * Common GraphQL response types
 */

// Raw event entity types from schema.graphql
export interface EventCreatedEntity {
  id: string;
  eventId: string;
  name: string;
  venue: string;
  timestamp: string;
  organizer: string;
  tierCount: number;
}

export interface TicketPurchasedEntity {
  id: string;
  eventId: string;
  tierIdx: number;
  buyer: string;
  tokenId: string;
  price: string;
}

export interface TicketRefundedEntity {
  id: string;
  eventId: string;
  tierIdx: number;
  buyer: string;
  tokenId: string;
  refundAmount: string;
}

export interface RevenueWithdrawnEntity {
  id: string;
  eventId: string;
  organizer: string;
  amount: string;
}

// Derived analytics entity types
export interface EventStats {
  id: string; // eventId
  totalPurchases: number;
  totalRefunds: number;
  totalRevenue: string; // BigInt as string
  totalRefundAmount: string; // BigInt as string
  netRevenue: string; // BigInt as string
  revenueWithdrawn: string; // BigInt as string
}

export interface TierStats {
  id: string; // {eventId}_{tierIdx}
  eventId: string;
  tierIdx: number;
  purchaseCount: number;
  refundCount: number;
  soldCount: number; // purchaseCount - refundCount (real-time availability)
  totalRevenue: string; // BigInt as string
  totalRefundAmount: string; // BigInt as string
}

export interface UserStats {
  id: string; // lowercase user address
  totalTicketsPurchased: number;
  totalTicketsRefunded: number;
  activeTickets: number; // purchased - refunded
  totalSpent: string; // BigInt as string
  totalRefunded: string; // BigInt as string
}

export interface OrganizerStats {
  id: string; // lowercase organizer address
  eventsCreated: number;
  totalRevenue: string; // BigInt as string
  totalWithdrawn: string; // BigInt as string
}

export interface PlatformStats {
  id: 'platform'; // singleton
  totalEvents: number;
  totalTicketsSold: number;
  totalRefunds: number;
  totalRevenue: string; // BigInt as string
  totalRefundAmount: string; // BigInt as string
}

// GraphQL query response wrapper types
export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

// Helper type for paginated queries
export interface PaginatedResponse<T> {
  items: T[];
  pageInfo?: {
    hasNextPage: boolean;
    endCursor?: string;
  };
}
