## Event Organizer Core Stories (Must-Have)

### 1. Create Multi-Tier Event

**Story**: As an organizer, I can deploy a new ticketing contract with:

- Event details (name, date/timestamp, venue)
- Multiple tiers (e.g., Tier 1: 100 tickets @ 50 tokens, Tier 2: 200 tickets @ 30 tokens, Tier 3: 500 tickets @ 10 tokens)
- My wallet address as the organizer/beneficiary

**Contract stores tier capacities but mints NFTs only on purchase**

_Proves: Gas-efficient lazy minting, multi-tier support_

```mermaid
journey
    title Event Organizer Creates Multi-Tier Event
    section Prepare Event
        Define event details: 5: Organizer
        Set tier structure: 5: Organizer
        Configure prices per tier: 4: Organizer
    section Deploy Contract
        Connect wallet: 5: Organizer
        Submit deployment transaction: 4: Organizer
        Wait for confirmation: 3: Organizer
    section Verify Deployment
        Check contract address: 5: Organizer
        Verify tier configurations: 5: Organizer
        Share event link with fans: 5: Organizer
```

### 2. Withdraw Revenue

**Story**: As an organizer, I can withdraw collected ERC-20 tokens from the contract

- Withdrawal only allowed when <12 hours remain before event (after refund deadline)
- Can withdraw any amount up to contract balance
- Before deadline, withdrawal transactions are rejected by smart contract

_Proves: Time-locked fund access, organizer protections_

```mermaid
journey
    title Event Organizer Withdraws Revenue
    section Check Eligibility
        View contract balance: 5: Organizer
        Check time until event: 4: Organizer
        Verify withdrawal window open: 5: Organizer
    section Withdraw Funds
        Connect wallet: 5: Organizer
        Specify withdrawal amount: 5: Organizer
        Submit withdrawal transaction: 4: Organizer
    section Confirm Receipt
        Transaction confirmed: 5: Organizer
        Verify tokens in wallet: 5: Organizer
```

## Fans - Purchase Flow Case Stories (Must-Have)

### 3. Preview Event & Availability

**Story**: As a fan, I can view an event's:

- Tier information (names, prices in ERC-20 tokens)
- Tickets remaining per tier in real-time
- Event date/timestamp
- Refund deadline (12 hours before event)

_Proves: Transparent availability, no hidden inventory_

```mermaid
journey
    title Fan Previews Event and Availability
    section Discover Event
        Navigate to event page: 5: Fan
        View event details: 5: Fan
        See event timestamp: 5: Fan
    section Check Availability
        Browse tier options: 5: Fan
        Compare prices per tier: 4: Fan
        Check tickets remaining: 5: Fan
        Note refund deadline: 4: Fan
    section Make Decision
        Select preferred tier: 5: Fan
        Prepare to purchase: 5: Fan
```

### 4. Purchase Ticket with ERC-20

**Story**: As a fan, I can buy a ticket from a specific tier using ERC-20 tokens

- **NFT is minted at purchase time and transferred to my wallet**
- Payment (ERC-20 transfer) and ticket delivery (NFT mint + transfer) are atomic
- Either both happen or neither happens
- Tier's available count decrements

_Proves: Atomic lazy minting with ERC-20 payment_

```mermaid
journey
    title Fan Purchases Ticket with ERC-20
    section Prepare Purchase
        Select tier: 5: Fan
        Connect wallet: 5: Fan
        Check ERC-20 balance: 4: Fan
    section Approve Payment
        Approve ERC-20 spending: 4: Fan
        Confirm approval transaction: 3: Fan
    section Complete Purchase
        Initiate purchase: 5: Fan
        Payment and NFT mint atomic: 3: Fan
        Transaction confirmed: 5: Fan
    section Verify Receipt
        NFT appears in wallet: 5: Fan
        Check ticket details: 5: Fan
        Celebrate: 5: Fan
```

### 5. Resilient Purchase with Auto-Retry

**Story**: As a fan, if my purchase fails due to network/consensus issues:

- System automatically retries up to 3 times
- Only reports error to me after all 3 attempts fail

_Proves: Fault tolerance for real-world blockchain conditions_

```mermaid
journey
    title Fan Purchase with Auto-Retry on Failure
    section Initial Attempt
        Submit purchase: 4: Fan
        Network error occurs: 1: Fan
    section Auto-Retry Process
        Attempt 1 automatic retry: 2: System
        Attempt 2 automatic retry: 2: System
        Attempt 3 automatic retry: 2: System
    section Resolution
        Success on retry: 5: Fan
        OR Report error after 3 fails: 1: Fan
```

### 6. Ticket Refund (Time-Bound)

**Story**: As a fan, I can return my ticket and receive full ERC-20 refund

- Only allowed if >12 hours remain before event timestamp
- After deadline, refunds are rejected by smart contract
- **NFT is burned on refund**
- Returned ticket slot goes back into available pool for that tier
- ERC-20 tokens transferred back from contract to my wallet

_Proves: Smart contract time enforcement, NFT burn, refund logic_

```mermaid
journey
    title Fan Returns Ticket for Refund
    section Check Eligibility
        View owned tickets: 5: Fan
        Check time until event: 4: Fan
        Verify within refund window: 5: Fan
    section Initiate Refund
        Select ticket to refund: 4: Fan
        Connect wallet: 5: Fan
        Submit refund transaction: 4: Fan
    section Process Refund
        NFT burned: 3: Fan
        ERC-20 returned atomically: 4: Fan
        Tier availability incremented: 3: Fan
    section Confirm Refund
        Tokens received in wallet: 5: Fan
        NFT removed from collection: 5: Fan
```

### 7. No Duplicate Sales

**Story**: As a fan, once a ticket is purchased, that specific tier slot is marked sold

- Each tier tracks sold count vs. capacity
- Cannot exceed tier capacity

_Proves: Built-in scarcity via blockchain_

```mermaid
journey
    title No Duplicate Sales Protection
    section Purchase Attempt
        Fan A selects last ticket: 5: Fan A
        Fan B selects same tier: 5: Fan B
        Both submit simultaneously: 3: Both
    section Blockchain Processing
        Parallel execution processes: 3: Blockchain
        Fan A transaction confirms first: 5: Fan A
        Tier capacity reached: 3: Blockchain
    section Result
        Fan A receives NFT: 5: Fan A
        Fan B transaction reverts: 1: Fan B
        No duplicate possible: 5: System
```

## Demo Viewer Stories Case Stories (Must-Have)

### 8. Parallel Purchase Simulation

**Story**: As a demo viewer, I can see multiple simulated users buying from different tiers simultaneously

- System handles concurrent requests across tiers without crashes
- Real-time update of remaining tickets per tier
- NFTs minted on-the-fly for each purchase

_Proves: Parallel execution handling high demand with lazy minting_

```mermaid
journey
    title Demo: Parallel Purchase Simulation
    section Setup Simulation
        Configure number of buyers: 5: Demo Viewer
        Set purchase distribution: 5: Demo Viewer
        Start simulation: 5: Demo Viewer
    section Observe Execution
        Watch parallel transactions: 5: Demo Viewer
        See real-time tier updates: 5: Demo Viewer
        Monitor success rate: 5: Demo Viewer
    section Review Results
        Check total sales: 5: Demo Viewer
        Verify no crashes occurred: 5: Demo Viewer
        Compare to traditional systems: 5: Demo Viewer
```

## Nice-to-Have (If Time Permits)

### 9. Ticket Transfer

**Story**: As a ticket holder, I can transfer my ticket NFT to another wallet

_Proves: Secondary market capability_

```mermaid
journey
    title Fan Transfers Ticket to Another User
    section Initiate Transfer
        View owned tickets: 5: Fan
        Select ticket to transfer: 5: Fan
        Enter recipient address: 4: Fan
    section Execute Transfer
        Submit transfer transaction: 4: Fan
        NFT ownership changes: 3: Blockchain
        Transaction confirmed: 5: Fan
    section Verify
        NFT removed from wallet: 4: Fan
        Recipient receives ticket: 5: Recipient
```

### 10. Event Listing/Discovery

**Story**: As a fan, I can browse multiple deployed event contracts

- Filter by date, availability, price range

_Proves: Multi-event marketplace basics_

```mermaid
journey
    title Fan Discovers Events
    section Browse Events
        View all events: 5: Fan
        Apply filters: 4: Fan
        Sort by criteria: 4: Fan
    section Explore Details
        Select interesting event: 5: Fan
        Compare tier options: 4: Fan
        Check availability: 5: Fan
    section Make Choice
        Decide on event: 5: Fan
        Proceed to purchase: 5: Fan
```

### 11. Organizer Dashboard

**Story**: As an organizer, I can view:

- Total sales per tier
- Total ERC-20 collected
- Amount available for withdrawal (after deadline)

_Proves: Business analytics_

```mermaid
journey
    title Organizer Views Dashboard Analytics
    section Access Dashboard
        Navigate to organizer view: 5: Organizer
        Connect wallet: 5: Organizer
        Load event contracts: 4: Organizer
    section Review Metrics
        View sales by tier: 5: Organizer
        Check total revenue: 5: Organizer
        Monitor withdrawal status: 4: Organizer
    section Plan Actions
        Analyze performance: 5: Organizer
        Decide on withdrawal timing: 4: Organizer
```

### 12. Partial Withdrawals

**Story**: As an organizer, I can withdraw funds incrementally after deadline

- Track total withdrawn vs. available

_Proves: Flexible fund management_

```mermaid
journey
    title Organizer Makes Partial Withdrawal
    section Check Status
        View total balance: 5: Organizer
        View previous withdrawals: 4: Organizer
        Calculate available amount: 4: Organizer
    section Withdraw Partial
        Enter withdrawal amount: 5: Organizer
        Submit transaction: 4: Organizer
        Confirm receipt: 5: Organizer
    section Track History
        Update withdrawal record: 4: Organizer
        Note remaining balance: 4: Organizer
```
