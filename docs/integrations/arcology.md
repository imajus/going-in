## Arcology Parallel Execution Implementation

The project's core innovation leverages **Arcology's concurrent library** to achieve conflict-free parallel transaction processing.

Each purchase involves three contracts (ERC-20 payment, TicketingCore logic, ERC-721 minting) executing atomically. Arcology's parallel executor processes these complex transactions simultaneously across multiple users without serialization bottlenecks.

### TicketingCore Smart Contract

Each ticket tier uses `U256Cumulative` from `@arcologynetwork/concurrentlib` for tracking sold tickets. This data structure enables thousands of simultaneous purchases without read-write conflicts.

### ConcurrentERC721 Smart Contract

I implemented `ConcurrentERC721` from scratch using Arcology's concurrent primitives:

- `U256Map` for token ownership tracking (tokenId → owner mapping)
- `AddressU256Cum` for balance tracking with U256Cumulative per address
- `Runtime.uuid()` for conflict-free unique token ID generation during parallel mints
- Write-only mint operations that avoid reading state during concurrent execution

### ConcurrentERC20 Smart Contract

Uses `U256Cumulative` for all balance tracking, enabling parallel transfers between different address pairs without conflicts.

The architecture strictly separates commutative operations (parallel-safe) from non-commutative ones. Ticket purchases only write state (increment sold count, mint NFT), never reading counts that other transactions might be modifying.

## Benchmarking

The benchmark suite is designed to test high-concurrency scenarios by generating and executing transactions from multiple test accounts simultaneously. See [BENCHMARK.md](../../hardhat/BENCHMARK.md) for details.
