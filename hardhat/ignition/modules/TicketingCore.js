import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import ConcurrentERC20Module from './ConcurrentERC20.js';

const TOKEN_FACTOR = 10n ** 18n;
const EVENTS = [
  {
    name: 'Ethereum Global Summit 2025',
    venue: 'San Francisco Convention Center',
    timestamp: 1792839801,
    tiers: [
      {
        name: 'Early Bird',
        capacity: 500n,
        price: 50n * TOKEN_FACTOR, // 50 tokens
      },
      {
        name: 'General Admission',
        capacity: 2000n,
        price: 100n * TOKEN_FACTOR, // 100 tokens
      },
      {
        name: 'VIP Pass',
        capacity: 100n,
        price: 500n * TOKEN_FACTOR, // 500 tokens
      },
    ],
  },
  {
    name: 'The Weekend World Tour',
    venue: 'Madison Square Garden, New York',
    timestamp: 1792839801,
    tiers: [
      {
        name: 'Nosebleed',
        capacity: 5000n,
        price: 75n * TOKEN_FACTOR, // 75 tokens
      },
      {
        name: 'Floor Section',
        capacity: 1000n,
        price: 200n * TOKEN_FACTOR, // 200 tokens
      },
      {
        name: 'VIP Meet & Greet',
        capacity: 50n,
        price: 1500n * TOKEN_FACTOR, // 1500 tokens
      },
    ],
  },
  {
    name: 'Champions League Final',
    venue: 'Wembley Stadium, London',
    timestamp: 1792839801,
    tiers: [
      {
        name: 'Upper Tier',
        capacity: 10000n,
        price: 100n * TOKEN_FACTOR, // 100 tokens
      },
      {
        name: 'Lower Tier',
        capacity: 3000n,
        price: 300n * TOKEN_FACTOR, // 300 tokens
      },
      {
        name: 'Club Seats',
        capacity: 500n,
        price: 800n * TOKEN_FACTOR, // 800 tokens
      },
    ],
  },
];

const TicketingCoreModule = buildModule('TicketingCoreModule', (m) => {
  // First, get the deployed ConcurrentERC20 token
  const { token } = m.useModule(ConcurrentERC20Module);
  // Deploy TicketingCore with the token address
  const ticketingCore = m.contract('TicketingCore', [token]);
  // Seed events
  EVENTS.forEach(({ name, venue, timestamp, tiers }, i) => {
    m.call(ticketingCore, 'createEvent', [name, venue, timestamp, tiers], {
      id: `create_event_${i + 1}`,
    });
  });
  return { ticketingCore, token };
});

export default TicketingCoreModule;
