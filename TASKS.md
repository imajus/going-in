# Going-In Project Tasks Breakdown

This document breaks down the PRD into actionable development tasks organized by phase and component.

## Phase 1: Core Smart Contracts (Week 1)

### 1.1 Setup & Infrastructure

- [x] **Task 1.1.1**: Add Arcology Concurrent Library dependency

  - Add `@arcologynetwork/concurrentlib` to hardhat/package.json
  - Run `npm install` to install dependencies
  - Verify library import works in test contract

- [x] **Task 1.1.2**: Configure Hardhat for Arcology Network
  - Update `hardhat/hardhat.config.js` with Arcology DevNet RPC endpoint
  - Test connection to Arcology DevNet

### 1.2 ConcurrentERC20 Implementation

- [ ] **Task 1.2.1**: Create ConcurrentERC20.sol contract

  - Create `hardhat/contracts/ConcurrentERC20.sol`
  - Import Arcology's concurrent library
  - Follow ds-token pattern from https://github.com/arcology-network/examples/blob/main/ds-token/contracts/Token.sol

- [ ] **Task 1.2.2**: Implement core ERC20 functions with U256Cumulative

  - Implement `totalSupply()` using U256Cumulative
  - Implement `balanceOf()` with concurrent balance tracking
  - Implement `transfer()` with parallel-safe balance updates
  - Implement `approve()` and `transferFrom()` for allowances

- [ ] **Task 1.2.3**: Add constructor and mint functionality

  - Constructor with name, symbol, decimals
  - Initial supply minting
  - Public mint function for testing

- [ ] **Task 1.2.4**: Write unit tests for ConcurrentERC20
  - Test basic transfers between accounts
  - Test approval and transferFrom flow
  - Test parallel transfers (multiple simultaneous transfers)
  - Test balance tracking accuracy under concurrent operations

### 1.3 ConcurrentERC721 Implementation

- [ ] **Task 1.3.1**: Create ConcurrentERC721.sol contract

  - Create `hardhat/contracts/ConcurrentERC721.sol`
  - Import Arcology's concurrent library and OpenZeppelin ERC721 base
  - Use U256Cumulative for totalSupply tracking
  - Implement as generic, reusable ERC-721 (not ticketing-specific)

- [ ] **Task 1.3.2**: Implement generic minting mechanism

  - `mint(address to)` function with access control
  - Generate sequential token IDs using U256Cumulative
  - Emit Transfer event per ERC721 standard

- [ ] **Task 1.3.3**: Implement burn functionality

  - `burn(uint256 tokenId)` function
  - Verify ownership before burning
  - Decrement totalSupply using U256Cumulative
  - Emit Transfer to zero address

- [ ] **Task 1.3.4**: Implement parallel-safe transfer operations

  - Override `_transfer()` to use concurrent structures
  - Implement `safeTransferFrom()` with conflict detection
  - Add access control (only owner or approved can transfer)
  - Ensure ERC-721 standard compliance

- [ ] **Task 1.3.5**: Write unit tests for ConcurrentERC721
  - Test minting by authorized addresses
  - Test burn functionality
  - Test parallel minting (multiple simultaneous mints)
  - Test transfer operations
  - Test totalSupply accuracy under concurrent operations

### 1.4 TicketingCore Implementation

- [ ] **Task 1.4.1**: Create TicketingCore.sol contract structure

  - Create `hardhat/contracts/TicketingCore.sol`
  - Import ReentrancyGuard from OpenZeppelin
  - Import Arcology concurrent library
  - Add constructor with payment token address parameter
  - Store payment token as immutable state variable
  - Define Event struct with dynamic tier structure

- [ ] **Task 1.4.2**: Define data structures

  ```solidity
  struct Tier {
      string name;           // Tier name (e.g. "VIP", "Premium") - also NFT collection name
      uint256 capacity;
      uint256 price;
      address nftContract;   // Dedicated ConcurrentERC721 per tier
      U256Cumulative sold;  // Arcology concurrent counter
  }

  struct Event {
      uint256 id;
      string name;
      string venue;
      uint256 timestamp;
      address organizer;
      Tier[] tiers;          // Dynamic tier array (minimum 1, recommended max 5)
      U256Cumulative revenue; // Track total revenue
  }
  ```

- [ ] **Task 1.4.3**: Implement event creation function

  - `createEvent()` with parameters: name, venue, timestamp, Tier[] memory tierConfigs (name, capacity, price for each)
  - Loop through tierConfigs array and deploy ConcurrentERC721 for each tier using `new ConcurrentERC721(tier.name, "TICKET")`
  - Initialize each tier with name, capacity, price, nftContract address, and U256Cumulative(0, capacity)
  - Validate timestamp is >12 hours in future
  - Validate at least 1 tier provided, max 5
  - Validate each tier capacity >0 and names are unique
  - Store event in mapping
  - Emit EventCreated event

- [ ] **Task 1.4.4**: Implement ticket purchase function

  - `purchaseTicket(uint256 eventId, uint256 tierIdx)` function
  - Validate event exists and tier index is within bounds (< tiers.length)
  - Get tier-specific NFT contract: `ConcurrentERC721 tierNFT = ConcurrentERC721(tiers[tierIdx].nftContract)`
  - ~~Check availability~~ - no need, because tier.sold.add(1) will revert if exceeds capacity
  - Transfer payment: `paymentToken.transferFrom(msg.sender, address(this), tier.price)`
  - Mint NFT from tier-specific collection: `tierNFT.mint(msg.sender)`
  - Update sold count: tier.sold.add(1)
  - Update revenue: event.revenue.add(tier.price)
  - Emit TicketPurchased event (include tier index, tier name, and NFT address)
  - Add ReentrancyGuard protection

- [ ] **Task 1.4.5**: Implement refund mechanism

  - `refundTicket(uint256 eventId, uint256 tierIdx, uint256 tokenId)` function
  - Validate timestamp < (eventTime - 12 hours)
  - Get tier-specific NFT contract: `ConcurrentERC721 tierNFT = ConcurrentERC721(tiers[tierIdx].nftContract)`
  - Verify msg.sender owns the NFT in that specific collection
  - Burn NFT: `tierNFT.burn(tokenId)` (generic ERC-721 burn)
  - Decrement sold count: tier.sold.sub(1)
  - Transfer refund: `paymentToken.transfer(msg.sender, tier.price)`
  - Decrement revenue: event.revenue.sub(tier.price)
  - Emit TicketRefunded event
  - Add ReentrancyGuard protection

- [ ] **Task 1.4.6**: Implement revenue withdrawal function

  - `withdrawRevenue(uint256 eventId, uint256 amount)` function
  - Validate timestamp > (eventTime - 12 hours) - refund deadline passed
  - Validate msg.sender is event organizer
  - ~~Validate amount <= available revenue~~ - no need, because event.revenue.sub(amount) will revert if falls short the lower boundary (0)
  - Deduct from revenue: event.revenue.sub(amount)
  - Transfer tokens: `paymentToken.transfer(msg.sender, amount)`
  - Emit RevenueWithdrawn event
  - Add ReentrancyGuard protection
  - Allow unlimited withdrawals

- [ ] **Task 1.4.7**: Implement getter functions

  - `getEvent(uint256 eventId)` - return full event details
  - `getTierAvailability(uint256 eventId, uint256 tierIdx)` - return sold/capacity
  - `getRefundDeadline(uint256 eventId)` - return timestamp - 12 hours
  - `canRefund(uint256 eventId)` - return boolean
  - `getAvailableRevenue(uint256 eventId)` - return withdrawable amount

- [ ] **Task 1.4.8**: Write comprehensive unit tests for TicketingCore (using Solidity)

  - Test event creation with valid parameters
  - Test event creation with invalid parameters (past timestamp, zero capacity)
  - Test single ticket purchase
  - Test purchases until capacity reached
  - Test purchase attempt when sold out (should revert)
  - Test parallel purchases in same tier
  - Test parallel purchases across different tiers
  - Test refund before deadline
  - Test refund after deadline (should revert)
  - Test refund by non-owner (should revert)
  - Test revenue withdrawal after refund deadline
  - Test revenue withdrawal before refund deadline (should revert)
  - Test multiple withdrawals by organizer
  - Test withdrawal by non-organizer (should revert)
  - Verify all gas costs meet targets

- [ ] **Task 1.4.9**: Integration tests for full flow (using Solidity)

  - Deploy ConcurrentERC20, mint tokens to test accounts
  - Create event with 3 tiers
  - Multiple users purchase tickets in parallel
  - Some users refund before deadline
  - Time advances past refund deadline
  - Organizer withdraws revenue
  - Verify final state consistency

### 1.5 Load Testing Infrastructure

- [ ] **Task 1.5.1**: Create LoadSimulator.sol contract

  - Create `hardhat/contracts/test/LoadSimulator.sol`
  - Import Arcology's Multiprocess library
  - Implement `simulatePurchaseBatch()` function
  - Implement `simulateRefundBatch()` function

- [ ] **Task 1.5.2**: Implement batch purchase simulation

  - Use Multiprocess to create parallel purchase jobs
  - Random tier selection weighted by capacity
  - Track successful/failed transactions
  - Calculate actual TPS achieved
  - Measure gas consumption per operation

- [ ] **Task 1.5.3**: Implement batch refund simulation

  - Select 10% of previous batch tickets randomly
  - Create parallel refund jobs
  - Track success rate

- [ ] **Task 1.5.4**: Create load test script
  - Script to run 1000+ parallel transactions every 10 seconds
  - Continue until 25,000 tickets sold
  - Collect metrics: TPS, gas costs, conflict rate
  - Generate performance report

---

## Phase 2: Frontend Development (Week 2)

### 2.1 Web3 Integration Setup

- [ ] **Task 2.1.1**: Drop Reown AppKit support in favour of Ethers' BrowserProvider

  - Update `frontend/src/lib/web3.js` with Arcology network config
  - Add Arcology DevNet chain ID and RPC (extract from `hardhat/hardhat.config.js`)

- [ ] **Task 2.1.2**: Create contract loading utilities

  - Update `frontend/src/lib/contracts.js`
  - Implement dynamic loading of deployed contract addresses
  - Import ABIs from hardhat workspace exports
  - Create contract instance helpers for ethers.js

- [ ] **Task 2.1.3**: Create custom React hooks
  - `useWallet.js` - wallet connection state and actions
  - `useContract.js` - contract instance management
  - `useRealtime.js` - block event listeners for live updates
  - `useEventData.js` - fetch and cache event data

### 2.2 Event Creation Interface

- [ ] **Task 2.2.1**: Create EventCreator component

  - Create `frontend/src/components/EventCreator/EventCreator.jsx`
  - Form for event name, venue, timestamp
  - Dynamic tier configuration with Add/Remove tier buttons (minimum 1, maximum 5)
  - Each tier: name (string), capacity (uint256), price (uint256)
  - Implement default tier configuration: Standard (100 tokens, 100000 tickets), Premium (250 tokens, 10000 tickets), VIP (500 tokens, 1000 tickets)
  - Display payment token address from TicketingCore contract (read-only, for user reference)
  - Form validation (timestamp >12 hours future, at least 1 tier, capacities >0, unique tier names)

- [ ] **Task 2.2.2**: Implement event creation flow

  - Connect to TicketingCore contract
  - Read payment token address from contract for display
  - Call `createEvent()` with form data (name, venue, timestamp, tier configs)
  - Show transaction pending state
  - Display success with event ID
  - Handle errors with user-friendly messages
  - Gas estimation before submission

- [ ] **Task 2.2.3**: Create CreateEvent page
  - Create `frontend/src/pages/CreateEvent.jsx`
  - Integrate EventCreator component
  - Add navigation breadcrumbs
  - Responsive layout

### 2.3 Event Discovery & Browsing

- [ ] **Task 2.3.1**: Create EventBrowser component

  - Create `frontend/src/components/EventBrowser/EventBrowser.jsx`
  - List view of all events
  - Display event name, venue, date
  - Show availability for each tier (sold/capacity)
  - Real-time updates using block events

- [ ] **Task 2.3.2**: Create EventCard component

  - Display event summary
  - Show tier pricing and availability
  - Countdown timer to event/refund deadline
  - Click to navigate to event details

- [ ] **Task 2.3.3**: Create Home page
  - Create `frontend/src/pages/Home.jsx`
  - Integrate EventBrowser
  - Featured events section
  - Search/filter functionality

### 2.4 Ticket Purchase Flow

- [ ] **Task 2.4.1**: Create EventDetails page

  - Create `frontend/src/pages/EventDetails.jsx`
  - Display full event information
  - Show detailed tier breakdown
  - Real-time availability updates (every block)

- [ ] **Task 2.4.2**: Create PurchaseFlow component

  - Create `frontend/src/components/PurchaseFlow/PurchaseFlow.jsx`
  - Tier selection interface
  - Display price and availability
  - Token approval step (if needed)
  - Mint ERC-20 token for testing purposes (1mil)
  - Purchase confirmation

- [ ] **Task 2.4.3**: Implement two-step purchase transaction

  - Step 1: Call `ERC20.approve(TicketingCore, price)` if needed
  - Wait for approval confirmation
  - Step 2: Call `TicketingCore.purchaseTicket(eventId, tierIdx)`
  - Show loading states for both steps
  - Display NFT ticket on success
  - Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)

- [ ] **Task 2.4.4**: Create TierSelector component
  - Dynamic visual representation of event tiers (renders 1-5 tiers)
  - Display tier names prominently
  - Show capacity bars (sold/total)
  - Highlight selected tier
  - Disable sold-out tiers
  - Price display per tier

### 2.5 Refund Management

- [ ] **Task 2.5.1**: Create MyTickets page

  - Create `frontend/src/pages/MyTickets.jsx`
  - List all NFTs owned by connected wallet
  - Display event details for each ticket
  - Show refund eligibility status
  - Group by upcoming/past events

- [ ] **Task 2.5.2**: Create RefundManager component

  - Create `frontend/src/components/RefundManager/RefundManager.jsx`
  - Display refund deadline countdown
  - Refund button (enabled only before deadline)
  - Show refund amount
  - Confirmation dialog

- [ ] **Task 2.5.3**: Implement refund transaction flow
  - Call `TicketingCore.refundTicket(eventId, tokenId)`
  - Show transaction pending state
  - Display success with refunded amount
  - Update UI to remove refunded ticket
  - Handle errors (after deadline, not owner, etc.)

### 2.6 Organizer Dashboard

- [ ] **Task 2.6.1**: Create OrganizerDashboard page

  - Create `frontend/src/pages/OrganizerDashboard.jsx`
  - Filter events by organizer (connected wallet)
  - Display event performance metrics
  - Revenue analytics

- [ ] **Task 2.6.2**: Create EventAnalytics component

  - Create `frontend/src/components/Dashboard/EventAnalytics.jsx`
  - Total tickets sold per tier
  - Revenue accumulated
  - Available withdrawal amount
  - Refund deadline status
  - Visual charts (bar/pie charts for tier distribution)

- [ ] **Task 2.6.3**: Create RevenueWithdrawal component

  - Create `frontend/src/components/Dashboard/RevenueWithdrawal.jsx`
  - Display available revenue
  - Input for withdrawal amount
  - Withdraw button (enabled after refund deadline)
  - Transaction flow with pending state
  - History of withdrawals

- [ ] **Task 2.6.4**: Implement withdrawal transaction flow
  - Call `TicketingCore.withdrawRevenue(eventId, amount)`
  - Validate amount <= available revenue
  - Show transaction pending state
  - Display success with withdrawn amount
  - Handle errors (before deadline, insufficient balance)

### 2.7 Navigation & Layout

- [ ] **Task 2.7.1**: Create Navigation component

  - Create `frontend/src/components/Navigation.jsx`
  - Links to: Home, Create Event, My Tickets, Dashboard
  - Wallet connection button in header
  - Display connected address (truncated)
  - Responsive mobile menu

- [ ] **Task 2.7.2**: Set up React Router

  - Configure routes in `frontend/src/App.jsx`
  - Routes: `/`, `/create`, `/events/:id`, `/tickets`, `/dashboard`
  - Protected routes (require wallet connection)
  - 404 page

- [ ] **Task 2.7.3**: Create shared UI components
  - Button component with loading states
  - Input component with validation
  - Card component for content containers
  - Modal component for confirmations
  - Toast notifications for success/error messages

### 2.8 Real-time Updates & Optimization

- [ ] **Task 2.8.1**: Implement block event listeners

  - Listen to TicketPurchased events
  - Listen to TicketRefunded events
  - Listen to EventCreated events
  - Update UI state on event detection

- [ ] **Task 2.8.2**: Implement optimistic UI updates

  - Immediately update UI on user action
  - Rollback on transaction failure
  - Show pending state during confirmation

- [ ] **Task 2.8.3**: Add polling fallback

  - Poll event data every 3 seconds if WebSocket unavailable
  - Exponential backoff on errors
  - Automatic reconnection logic

- [ ] **Task 2.8.4**: Optimize performance
  - Lazy load components with React.lazy
  - Memoize expensive computations with useMemo
  - Debounce search/filter inputs
  - Virtual scrolling for long lists

---

## Continuous Tasks (Throughout All Phases)

- [ ] **Git Workflow**

  - Pause after completing each task for manual review
  - Do not operate with Git directly (commit, push, etc)

- [ ] **Code Quality**

  - Run linter before commits (ESLint for frontend)
  - Follow Solidity style guide
  - Write JSDoc comments for complex functions
  - Keep code DRY (Don't Repeat Yourself)

- [ ] **Testing**

  - Write tests alongside implementation
  - Maintain >80% test coverage for contracts
  - Test all edge cases
  - Run full test suite before deployment

- [ ] **Documentation**
  - Progressivelt mark tasks in this file complete
  - Update CLAUDE.md with new conventions
  - Document all major decisions
  - Keep README.md current
  - Comment complex logic in code

## Notes

- This task breakdown follows the 3-phase structure from PRD Section 7
- Critical path: Phase 1 → Phase 2 → Phase 3 (sequential)
