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

- [x] **Task 1.2.1**: Create ConcurrentERC20.sol contract

  - Create `hardhat/contracts/ConcurrentERC20.sol`
  - Import Arcology's concurrent library
  - Follow ds-token pattern from https://github.com/arcology-network/examples/blob/main/ds-token/contracts/Token.sol

- [x] **Task 1.2.2**: Implement core ERC20 functions with U256Cumulative

  - Implement `totalSupply()` using U256Cumulative
  - Implement `balanceOf()` with concurrent balance tracking
  - Implement `transfer()` with parallel-safe balance updates
  - Implement `approve()` and `transferFrom()` for allowances

- [x] **Task 1.2.3**: Add constructor and mint functionality

  - Constructor with name, symbol, decimals
  - Initial supply minting
  - Public mint function for testing

- [x] **Task 1.2.4**: Write unit tests for ConcurrentERC20 (JavaScript/Solidity)

  - **CRITICAL:** Use Solidity tests for generic test cases and JavaScript for Arcology concurrent library involving behavior
  - Test basic transfers between accounts
  - Test approval and transferFrom flow
  - Test parallel transfers (multiple simultaneous transfers)
  - Test balance tracking accuracy under concurrent operations

### 1.3 ConcurrentERC721 Implementation (Bare, No OpenZeppelin)

- [x] **Task 1.3.1**: Create bare ConcurrentERC721.sol structure

  - Create `hardhat/contracts/ConcurrentERC721.sol`
  - Import Arcology concurrent libraries:
    - `@arcologynetwork/concurrentlib/lib/runtime/Runtime.sol`
    - `@arcologynetwork/concurrentlib/lib/map/U256.sol`
    - `@arcologynetwork/concurrentlib/lib/map/AddressU256Cum.sol`
    - `@arcologynetwork/concurrentlib/lib/commutative/U256Cum.sol`
  - **NO OpenZeppelin dependency** (causes read-write conflicts)
  - Define data structures: `U256Map _owners`, `AddressU256Cum _balances`, `U256Cumulative _totalSupply`
  - Add minter access control (immutable address set in constructor)

- [x] **Task 1.3.2**: Implement conflict-free minting with Runtime.uuid()

  - `mint(address to)` function with minter access control
  - Generate tokenId: `uint256 tokenId = uint256(keccak256(Runtime.uuid()))`
  - **Write-only operations** (no reads after writes):
    - Set owner: `_owners.set(tokenId, uint256(uint160(to)))`
    - Increment balance: `_balances.get(to).add(1)` (auto-initializes if needed)
    - Increment supply: `_totalSupply.add(1)`
  - Emit `Transfer(address(0), to, tokenId)`
  - Return tokenId
  - **Critical**: No reading of concurrent structures after writing them

- [x] **Task 1.3.3**: Implement safe burn functionality

  - `burn(uint256 tokenId)` function
  - Read owner BEFORE any writes: `address owner = ownerOf(tokenId)`
  - Verify ownership/approval using `_isApprovedOrOwner(msg.sender, tokenId)`
  - **Write-only from here**:
    - Delete ownership: `_owners.del(tokenId)`
    - Decrement balance: `_balances.get(owner).sub(1)`
    - Decrement supply: `_totalSupply.sub(1)`
    - Clear approvals: `delete _tokenApprovals[tokenId]`
  - Emit `Transfer(owner, address(0), tokenId)`

- [x] **Task 1.3.4**: Implement conflict-free transfer operations

  - `transferFrom(address from, address to, uint256 tokenId)` function
  - Read owner ONCE at start: `address owner = ownerOf(tokenId)`
  - Verify `owner == from`
  - Verify authorization using `_isApprovedOrOwner(msg.sender, tokenId)`
  - **Write-only updates**:
    - Update owner: `_owners.set(tokenId, uint256(uint160(to)))`
    - Decrement from balance: `_balances.get(from).sub(1)`
    - Increment to balance: `_balances.get(to).add(1)`
    - Clear approvals: `delete _tokenApprovals[tokenId]`
  - Emit `Transfer(from, to, tokenId)`
  - Implement `safeTransferFrom()` wrapper

- [x] **Task 1.3.5**: Implement approval mechanisms

  - `approve(address to, uint256 tokenId)` - uses standard mapping (conflict-safe)
  - `setApprovalForAll(address operator, bool approved)` - uses standard mapping
  - `getApproved(uint256 tokenId)` view function
  - `isApprovedForAll(address owner, address operator)` view function
  - Internal helper: `_isApprovedOrOwner(address spender, uint256 tokenId)`

- [x] **Task 1.3.6**: Implement view functions

  - `ownerOf(uint256 tokenId)` → convert uint256 back to address:
    - `address(uint160(_owners.get(tokenId)))`
    - Require owner != address(0) (token exists)
  - `balanceOf(address owner)` → `_balances.get(owner).get()`
  - `totalSupply()` → `_totalSupply.get()`
  - `name()` and `symbol()` - public string storage variables
  - `supportsInterface(bytes4 interfaceId)` - ERC165 support

- [x] **Task 1.3.7**: Write Solidity tests (minimal, conflict-free operations)

  - Test metadata (name, symbol)
  - Test minter access control (non-minter cannot mint)
  - Test approval mechanisms (standard mappings, conflict-safe)
  - Test interface support (ERC165, ERC721)
  - **DO NOT test**: minting, transfers, burns (require Arcology DevNet)
  - **Reason**: Solidity tests cannot access concurrent structures without conflicts

- [x] **Task 1.3.8**: Write JavaScript tests for concurrent operations

  - Test single mint → verify tokenId generated from uuid
  - Test parallel mints (10-100) → verify:
    - Unique token IDs (no collisions)
    - Zero transaction reverts
    - Correct balance increments
    - Correct totalSupply (should equal number of mints)
  - Test parallel transfers (different tokens, different owners) → verify:
    - Ownership changes correctly
    - Balance updates correctly
    - No conflicts
  - Test parallel burns (different tokens) → verify:
    - Tokens deleted
    - Balances decremented
    - TotalSupply accurate (minted - burned)
  - Test mixed operations (mint + transfer + burn in parallel) → verify state consistency
  - Test UUID uniqueness: Mint 1000+ tokens, verify all IDs unique
  - Verify zero conflict rate throughout all tests

### 1.4 TicketingCore Implementation

- [x] **Task 1.4.1**: Create TicketingCore.sol contract structure

  - Create `hardhat/contracts/TicketingCore.sol`
  - Import ReentrancyGuard from OpenZeppelin
  - Import Arcology concurrent library
  - Add constructor with payment token address parameter
  - Store payment token as immutable state variable
  - Define Event struct with dynamic tier structure

- [x] **Task 1.4.2**: Define data structures

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

- [x] **Task 1.4.3**: Implement event creation function

  - `createEvent()` with parameters: name, venue, timestamp, Tier[] memory tierConfigs (name, capacity, price for each)
  - Loop through tierConfigs array and deploy ConcurrentERC721 for each tier using `new ConcurrentERC721(tier.name, "TICKET")`
  - Initialize each tier with name, capacity, price, nftContract address, and U256Cumulative(0, capacity)
  - Validate timestamp is >12 hours in future
  - Validate at least 1 tier provided, max 5
  - Validate each tier capacity >0 and names are unique
  - Store event in mapping
  - Emit EventCreated event

- [x] **Task 1.4.4**: Implement ticket purchase function

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

- [x] **Task 1.4.5**: Implement refund mechanism

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

- [x] **Task 1.4.6**: Implement revenue withdrawal function

  - `withdrawRevenue(uint256 eventId, uint256 amount)` function
  - Validate timestamp > (eventTime - 12 hours) - refund deadline passed
  - Validate msg.sender is event organizer
  - ~~Validate amount <= available revenue~~ - no need, because event.revenue.sub(amount) will revert if falls short the lower boundary (0)
  - Deduct from revenue: event.revenue.sub(amount)
  - Transfer tokens: `paymentToken.transfer(msg.sender, amount)`
  - Emit RevenueWithdrawn event
  - Add ReentrancyGuard protection
  - Allow unlimited withdrawals

- [x] **Task 1.4.7**: Implement getter functions

  - `getEventDetails(uint256 eventId)` - return full event details
  - `getTierAvailability(uint256 eventId, uint256 tierIdx)` - return sold/capacity
  - `getRefundDeadline(uint256 eventId)` - return timestamp - 12 hours
  - `canRefund(uint256 eventId)` - return boolean
  - `getAvailableRevenue(uint256 eventId)` - return withdrawable amount

- [x] **Task 1.4.8**: Write comprehensive unit tests for TicketingCore (using Solidity/JavaScript)

  - **CRITICAL:** Use Solidity tests for generic test cases and JavaScript for Arcology concurrent library involving behavior
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

- [x] **Task 1.4.9**: Integration tests for full flow (using JavaScript)

  - Deploy ConcurrentERC20, mint tokens to test accounts
  - Create event with 3 tiers
  - Multiple users purchase tickets in parallel
  - Some users refund before deadline
  - Time advances past refund deadline
  - Organizer withdraws revenue
  - Verify final state consistency

### 1.5 Load Testing Infrastructure (JavaScript)

- [ ] **Task 1.5.1**: Create load.js script

  - Create `hardhat/scripts/load.js`
  - Implement `simulatePurchaseBatch()` function
  - Implement `simulateRefundBatch()` function

- [ ] **Task 1.5.2**: Implement batch purchase simulation

  - Random tier selection weighted by capacity
  - Validate 100% success rate

- [ ] **Task 1.5.3**: Implement batch refund simulation

  - Select 10% of previous batch tickets randomly
  - Create parallel refund jobs
  - Validate 100% success rate

- [ ] **Task 1.5.4**: Create load script

  - Script to run 100 parallel transactions every 5 seconds
  - Continue until 2,000 tickets sold (~1 minute)
  - Collect metrics: TPS, gas costs, conflict rate
  - Generate performance report

---

## Phase 2: Frontend Development (Week 2)

### 2.1 Web3 Integration Setup

- [x] **Task 2.1.1**: Set up Ethers BrowserProvider for wallet connection

  - Create `frontend/src/lib/web3.ts` with Arcology network config
  - Implement wallet connection using `window.ethereum` and `ethers.BrowserProvider`
  - Add Arcology DevNet chain ID (118) and RPC endpoint
  - Handle wallet connection errors and chain switching

- [x] **Task 2.1.2**: Update contract loading utilities

  - Review existing `frontend/src/lib/contracts.ts`
  - Verify dynamic loading of deployed contract addresses works
  - Ensure ABIs are imported correctly from hardhat workspace exports
  - Test contract instance creation with ethers.js v6

- [x] **Task 2.1.3**: Create custom React hooks (TypeScript)
  - `useWallet.ts` - wallet connection state and actions using BrowserProvider
  - `useContract.ts` - contract instance management with TypeScript types
  - `useRealtime.ts` - block event listeners for live updates
  - `useEventData.ts` - fetch and cache event data (integrate with @tanstack/react-query)

### 2.2 Event Creation Interface

- [x] **Task 2.2.1**: Update CreateEvent page with form implementation

  - Review existing `frontend/src/pages/CreateEvent.tsx`
  - Implement form using react-hook-form with zod validation schema
  - Define TypeScript interfaces for event creation data
  - Form fields: event name, venue, timestamp (date picker with react-day-picker)
  - Dynamic tier configuration with Add/Remove tier buttons (minimum 1, maximum 5)
  - Each tier: name (string), capacity (number), price (number)
  - Implement default tier configuration: Standard (100 tokens, 100000 tickets), Premium (250 tokens, 10000 tickets), VIP (500 tokens, 1000 tickets)
  - Display payment token address from TicketingCore contract (read-only, for user reference)
  - Form validation: timestamp >12 hours future, at least 1 tier, capacities >0, unique tier names
  - Use shadcn/ui components: Form, Input, Button, Card, Label, Calendar

- [x] **Task 2.2.2**: Implement event creation transaction flow

  - Connect to TicketingCore contract using useContract hook
  - Read payment token address from contract for display
  - Call `createEvent()` with form data (name, venue, timestamp, tier configs)
  - Show transaction pending state using shadcn/ui Button loading state
  - Display success notification using sonner toast
  - Handle errors with user-friendly toast messages
  - Gas estimation before submission
  - Redirect to event details page on success

### 2.3 Event Discovery & Browsing

- [x] **Task 2.3.1**: Update Home page with event listing

  - Review existing `frontend/src/pages/Home.tsx` (already has featured events structure)
  - Replace mock FEATURED_EVENTS with real blockchain data
  - Fetch events from TicketingCore contract using useEventData hook
  - Implement @tanstack/react-query for data fetching and caching
  - Display event cards in grid layout (already implemented)
  - Real-time updates using block event listeners

- [x] **Task 2.3.2**: Enhance EventCard display

  - Update existing Card components in Home.tsx to use real data
  - Show tier pricing and availability (fetch from contract)
  - Add countdown timer to event/refund deadline using date-fns
  - Implement click navigation to event details using React Router
  - Show sold out badges dynamically based on actual tier availability
  - Use lucide-react icons (Calendar, MapPin, Ticket already in use)

### 2.4 Ticket Purchase Flow

- [x] **Task 2.4.1**: Update EventDetails page

  - Review existing `frontend/src/pages/EventDetails.tsx`
  - Fetch event data using useParams to get event ID from URL
  - Display full event information using shadcn/ui Card components
  - Show detailed tier breakdown with TypeScript interfaces
  - Real-time availability updates using useRealtime hook
  - Implement loading states with shadcn/ui Skeleton

- [x] **Task 2.4.2**: Implement purchase flow in EventDetails

  - Add tier selection interface using shadcn/ui Tabs or Radio Group
  - Display price and availability for each tier
  - Show token approval status (check current allowance)
  - Add "Mint Test Tokens" button (1 million tokens for testing)
  - Purchase confirmation using shadcn/ui Alert Dialog
  - Use shadcn/ui Button with loading states

- [x] **Task 2.4.3**: Implement two-step purchase transaction

  - Step 1: Check allowance, call `ERC20.approve(TicketingCore, price)` if needed
  - Show approval pending state with Progress indicator
  - Wait for approval confirmation
  - Step 2: Call `TicketingCore.purchaseTicket(eventId, tierIdx)`
  - Show loading states for both steps using Button loading state
  - Display NFT ticket details on success using sonner toast
  - Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
  - Handle errors with user-friendly messages

- [x] **Task 2.4.4**: Create TierSelector component (TypeScript)
  - Create `frontend/src/components/TierSelector.tsx`
  - Dynamic visual representation of event tiers (renders 1-5 tiers)
  - Display tier names prominently using shadcn/ui Badge
  - Show capacity bars (sold/total) using shadcn/ui Progress
  - Highlight selected tier with accent color
  - Disable sold-out tiers visually
  - Price display per tier with proper formatting

### 2.5 Refund Management

- [x] **Task 2.5.1**: Update MyTickets page

  - Review existing `frontend/src/pages/MyTickets.tsx`
  - Fetch all NFTs owned by connected wallet (query each tier NFT contract)
  - Display event details for each ticket using shadcn/ui Card
  - Show refund eligibility status with shadcn/ui Badge
  - Group by upcoming/past events using shadcn/ui Accordion or Tabs
  - Implement TypeScript interfaces for ticket data
  - Use @tanstack/react-query for data fetching

- [x] **Task 2.5.2**: Add refund functionality to MyTickets

  - Display refund deadline countdown using date-fns
  - Add refund button (enabled only before deadline) with shadcn/ui Button
  - Show refund amount prominently
  - Implement confirmation dialog using shadcn/ui Alert Dialog
  - Show transaction status with loading states
  - Display empty state when no tickets owned

- [x] **Task 2.5.3**: Implement refund transaction flow
  - Call `TicketingCore.refundTicket(eventId, tierIdx, tokenId)`
  - Show transaction pending state with Button loading state
  - Display success notification with refunded amount using sonner toast
  - Update UI to remove refunded ticket (optimistic update)
  - Handle errors (after deadline, not owner, etc.) with user-friendly messages
  - Invalidate @tanstack/react-query cache after successful refund

### 2.6 Organizer Dashboard

- [x] **Task 2.6.1**: Update Dashboard page

  - Review existing `frontend/src/pages/Dashboard.tsx`
  - Filter events by organizer (connected wallet address)
  - Display event performance metrics using shadcn/ui Card
  - Implement TypeScript interfaces for dashboard data
  - Use @tanstack/react-query for data fetching
  - Show loading states with shadcn/ui Skeleton

- [x] **Task 2.6.2**: Create EventAnalytics component (TypeScript)

  - Create `frontend/src/components/EventAnalytics.tsx`
  - Total tickets sold per tier with shadcn/ui Progress bars
  - Revenue accumulated display
  - Available withdrawal amount (highlighted)
  - Refund deadline status with countdown using date-fns
  - Visual charts using recharts (bar/pie charts for tier distribution)
  - Use shadcn/ui Chart components for data visualization

- [x] **Task 2.6.3**: Create RevenueWithdrawal component (TypeScript)

  - Create `frontend/src/components/RevenueWithdrawal.tsx`
  - Display available revenue prominently
  - Input for withdrawal amount using shadcn/ui Input with number validation
  - Withdraw button (enabled after refund deadline) with shadcn/ui Button
  - Transaction flow with loading states
  - Display withdrawal history using shadcn/ui Table
  - Use react-hook-form for withdrawal amount validation

- [x] **Task 2.6.4**: Implement withdrawal transaction flow
  - Call `TicketingCore.withdrawRevenue(eventId, amount)`
  - Client-side validation: amount <= available revenue
  - Show transaction pending state with Button loading state
  - Display success notification with withdrawn amount using sonner toast
  - Handle errors (before deadline, insufficient balance) with user-friendly messages
  - Invalidate @tanstack/react-query cache after successful withdrawal

### 2.7 Navigation & Layout

- [x] **Task 2.7.1**: Update Navigation component

  - Review existing `frontend/src/components/Navigation.tsx`
  - Add wallet connection button using useWallet hook
  - Display connected address (truncated with ellipsis)
  - Add disconnect functionality
  - Implement responsive mobile menu using shadcn/ui Sheet
  - Links to: Home, Create Event, My Tickets, Dashboard
  - Highlight active route using React Router useLocation
  - Use lucide-react icons for navigation items

- [x] **Task 2.7.2**: Review React Router setup

  - Review existing routes in `frontend/src/App.tsx`
  - Routes already configured: `/`, `/create`, `/events/:id`, `/tickets`, `/dashboard`
  - NotFound page already exists at `frontend/src/pages/NotFound.tsx`
  - Implement protected routes (require wallet connection) using React Router loaders
  - Redirect to home if wallet not connected for protected routes
  - Add route transitions if desired

- [x] **Task 2.7.3**: Verify shadcn/ui components setup
  - All shadcn/ui components already available in `frontend/src/components/ui/`
  - Button component with loading states ✓
  - Input component with validation ✓
  - Card component for content containers ✓
  - Alert Dialog for confirmations ✓
  - Toast notifications (sonner) for success/error messages ✓
  - Review and test components as needed

### 2.8 Real-time Updates & Optimization

- [x] **Task 2.8.1**: Implement block event listeners

  - Create useRealtime hook with TypeScript
  - Listen to TicketPurchased events using ethers.js contract.on()
  - Listen to TicketRefunded events
  - Listen to EventCreated events
  - Update @tanstack/react-query cache on event detection
  - Clean up listeners on component unmount

- [x] **Task 2.8.2**: Implement optimistic UI updates

  - Use @tanstack/react-query optimistic updates
  - Immediately update UI on user action
  - Rollback on transaction failure
  - Show pending state during confirmation
  - Update cache with transaction result

---

## Phase 3: Blockchain Indexing & GraphQL Integration (Week 3)

### 3.1 Envio HyperIndex Setup

- [x] **Task 3.1.1**: Initialize Envio HyperIndex project

  - Create `indexer/` workspace directory
  - Run `envio init` to bootstrap project
  - Configure `config.yaml` with Arcology Network settings:
  - Set `unordered_multichain_mode: true`
  - Set `preload_handlers: true`
  - Verify pnpm package manager (v8+) and Node.js ≥18 installed
  - Ensure Docker Desktop is running (required for local development)

- [x] **Task 3.1.2**: Configure indexed contracts in config.yaml

  - Add TicketingCore contract
    - Event: EventCreated(uint256 indexed eventId, string name, string venue, uint256 timestamp, address indexed organizer, uint256 tierCount)
    - Event: TicketPurchased(uint256 indexed eventId, uint256 indexed tierIdx, address indexed buyer, uint256 tokenId, uint256 price)
    - Event: TicketRefunded(uint256 indexed eventId, uint256 indexed tierIdx, address indexed buyer, uint256 tokenId, uint256 refundAmount)
    - Event: RevenueWithdrawn(uint256 indexed eventId, address indexed organizer, uint256 amount)
  - Add ConcurrentERC20 contract
    - Event: Transfer(address indexed from, address indexed to, uint256 value)
    - Event: Approval(address indexed owner, address indexed spender, uint256 value)

- [] **Task 3.1.3**: Design GraphQL schema with derived entities

  - Create `schema.graphql` with raw event entities:
    - `ConcurrentERC20_Transfer`
    - `ConcurrentERC20_Approval`
    - `TicketingCore_EventCreated`
    - `TicketingCore_TicketPurchased`
    - `TicketingCore_TicketRefunded`
    - `TicketingCore_RevenueWithdrawn`
  - Add derived analytics entities (pre-computed aggregates):
    - `EventStats` - Per-event statistics (totalPurchases, totalRefunds, totalRevenue, netRevenue, revenueWithdrawn)
    - `TierStats` - **Critical**: Per-tier availability tracking with real-time `soldCount` (purchases - refunds)
    - `UserStats` - User portfolio (activeTickets, totalSpent, totalRefunded)
    - `OrganizerStats` - Organizer metrics (eventsCreated, totalRevenue, totalWithdrawn)
    - `PlatformStats` - Global platform statistics (singleton with id="platform")
  - Define proper ID patterns: `eventId`, `{eventId}_{tierIdx}`, lowercase addresses, "platform"
  - Use BigInt for currency amounts, Int for counters

- [] **Task 3.1.4**: Implement event handlers with analytics logic

  - Create `src/EventHandlers.js` with CommonJS module exports
  - Add helper functions:
    - `getBigInt(value)` - Safe BigInt conversion
    - `getPlatformStats(context)` - Singleton platform stats retrieval
  - Implement EventCreated handler:
    - Store raw event entity
    - Initialize EventStats with all counters to 0
    - Update/Initialize OrganizerStats (increment eventsCreated)
    - Update PlatformStats (increment totalEvents)
  - Implement TicketPurchased handler:
    - Store raw event entity
    - Update EventStats (increment totalPurchases, add to totalRevenue, recalculate netRevenue)
    - Update/Initialize TierStats (increment purchaseCount and soldCount, add to totalRevenue)
    - Update/Initialize UserStats (increment totalTicketsPurchased and activeTickets, add to totalSpent)
    - Update PlatformStats (increment totalTicketsSold, add to totalRevenue)
  - Implement TicketRefunded handler:
    - Store raw event entity
    - Update EventStats (increment totalRefunds, add to totalRefundAmount, recalculate netRevenue)
    - Update TierStats (increment refundCount, **decrement soldCount**, add to totalRefundAmount)
    - Update UserStats (increment totalTicketsRefunded, decrement activeTickets, add to totalRefunded)
    - Update PlatformStats (increment totalRefunds, add to totalRefundAmount)
  - Implement RevenueWithdrawn handler:
    - Store raw event entity
    - Update EventStats (add to revenueWithdrawn)
    - Update OrganizerStats (add to totalWithdrawn)
  - Implement ConcurrentERC20 event handlers (Transfer, Approval) - store raw events only

### 3.2 Frontend GraphQL Integration

- [ ] **Task 3.2.1**: Install GraphQL dependencies

  - Add to `frontend/package.json`:
    - `graphql@^16.8.1` - GraphQL core library
    - `graphql-request@^6.1.0` - Lightweight GraphQL client
    - `@tanstack/react-query@^5.83.0` - Already installed for server state management
  - Run `npm install` in frontend workspace
  - Verify packages installed correctly

- [ ] **Task 3.2.2**: Create GraphQL client utility (TypeScript)

  - Create `frontend/src/lib/graphql.ts`
  - Import `GraphQLClient` from `graphql-request`
  - Configure client with indexer URL:
    - Local dev: `http://localhost:8080/v1/graphql`
    - Production: Environment variable `VITE_INDEXER_URL`
  - Add headers: `Content-Type: application/json`
  - Export configured `graphqlClient` instance
  - Add TypeScript types for common GraphQL response structures

- [ ] **Task 3.2.3**: Create GraphQL query hooks (TypeScript)

  - Create `frontend/src/hooks/useGraphQL.ts`
  - Import `useQuery` from `@tanstack/react-query`
  - Import `graphqlClient` from `@/lib/graphql`
  - Implement query hooks with proper TypeScript types:
    - `useAllEvents()` - List all events from `TicketingCore_EventCreated`
    - `useEventDetails(eventId)` - Fetch single event with EventStats
    - `useTierAvailability(eventId, tierIdx)` - **Critical**: Fetch `TierStats.soldCount` for real-time availability
    - `useUserPortfolio(address)` - Fetch UserStats and user's purchases/refunds
    - `useOrganizerDashboard(address)` - Fetch OrganizerStats and organizer's events
    - `usePlatformStats()` - Fetch global platform metrics (singleton)
  - Configure refetch intervals:
    - Critical queries (tier availability): 5 seconds
    - Dashboard queries: 30 seconds
    - Static queries (event details): 60 seconds
  - Add error handling and loading states
  - Use proper query keys for cache management

- [ ] **Task 3.2.4**: Update Home page to use GraphQL queries

  - Import `useEvents` hook
  - Fetch events data from GraphQL instead of direct contract calls
  - Query `TicketingCore_EventCreated` with filters:
    - Upcoming events: `where: { timestamp: { _gt: currentTimestamp } }`
    - Order by: `order_by: [{ timestamp: asc }]`
    - Limit: Display first 6 events
  - Show quick stats from EventStats (total sales, revenue)

- [ ] **Task 3.2.5**: Update EventDetails page with real-time availability

  - Import `useEvent` and `useTierAvailability` hooks
  - Fetch event metadata from GraphQL instead of direct contract calls
  - For each tier, query `TierStats` to get real-time `soldCount`
  - Calculate available tickets: `tierCapacity - soldCount`
  - **Critical**: Use `soldCount` from indexer (never compute client-side)
  - Display EventStats metrics:
    - Total purchases
    - Total refunds
    - Net revenue (for organizers)
  - Update tier selector to use real-time availability data
  - Add refetch on focus and on purchase success
  - Show loading states while fetching tier availability

- [ ] **Task 3.2.6**: Update MyTickets page with user portfolio

  - Import `useUserTickets` hook
  - Fetch UserStats for connected wallet:
    - `activeTickets` - Currently owned tickets
    - `totalTicketsPurchased` - Lifetime purchases
    - `totalSpent` - Total amount spent
    - `totalRefunded` - Total amount refunded
  - Query `TicketingCore_TicketPurchased` filtered by buyer address
  - Cross-reference with `TicketingCore_TicketRefunded` to show ticket status
  - Display portfolio summary card with UserStats metrics
  - List tickets grouped by event using GraphQL data
  - Show "Active" or "Refunded" badge based on refund status
  - Filter and display only active tickets by default
  - Add "Show Refunded Tickets" toggle
  - Update after refund transaction success

- [ ] **Task 3.2.7**: Update Dashboard page with organizer analytics

  - Import `useOrganizerEvents` hook
  - Fetch OrganizerStats for connected wallet:
    - `eventsCreated` - Number of events created
    - `totalRevenue` - Total revenue across all events
    - `totalWithdrawn` - Total amount withdrawn
  - Query organizer's events via `TicketingCore_EventCreated` filtered by organizer
  - For each event, fetch EventStats for detailed metrics:
    - Total purchases
    - Total refunds
    - Net revenue
    - Revenue withdrawn
  - Fetch TierStats for per-tier breakdown (soldCount for each tier)
  - Display analytics cards with summary metrics
  - Create revenue chart showing revenue per event
  - Add withdrawal history from `TicketingCore_RevenueWithdrawn` events
  - Show real-time updates with 30-second refetch interval
  - Update after withdrawal transaction success

- [ ] **Task 3.2.8**: Create Platform Analytics page (optional)

  - Create `frontend/src/pages/Analytics.tsx` (new page)
  - Import `usePlatformStats` hook
  - Query singleton `PlatformStats`:
    - `totalEvents` - All events created
    - `totalTicketsSold` - Platform-wide ticket sales
    - `totalRefunds` - Platform-wide refunds
    - `totalRevenue` - Total revenue generated
    - `totalRefundAmount` - Total refunds processed
  - Display global metrics in stat cards
  - Query all EventStats and sort by totalPurchases (client-side)
  - Display "Top Events" leaderboard
  - Show recent activity feed from raw event entities:
    - Recent purchases
    - Recent refunds
    - Recent events created
  - Add route to Navigation component: `/analytics`
  - Use recharts for data visualization (bar/line charts)

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
