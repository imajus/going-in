# TicketingCore Benchmark Suite

This directory contains benchmarking scripts to test the parallel execution capabilities of the TicketingCore smart contract on Arcology Network.

## Overview

The benchmark suite is designed to test high-concurrency scenarios by generating and executing transactions from multiple test accounts simultaneously. Since the ticketing logic involves multiple smart contracts (ConcurrentERC20 and TicketingCore), we've separated the benchmarking into three sequential stages:

1. **Token Minting** - Fund test accounts with ConcurrentERC20 tokens
2. **Token Approval** - Approve TicketingCore to spend tokens on behalf of test accounts
3. **Ticket Purchase** - Execute parallel ticket purchases to test concurrent execution

## Prerequisites

- Contracts deployed to Arcology Network (run `npm run deploy --workspace=hardhat`)
- Test accounts configured in `accounts.json` (1000 accounts by default)
- `@arcologynetwork/frontend-util` package installed
- Access to Arcology Network node

## Benchmark Scripts

All benchmark scripts are located in `hardhat/benchmark/` and output transaction files to `hardhat/benchmark/txs/`.

### 1. Token Minting (`benchmark/mint.js`)

Generates transactions to mint 1,000,000 ConcurrentERC20 tokens to each test account.

**Generate transactions:**

```bash
npx hardhat run benchmark/mint.js --network devnet
```

**Expected output:**

- Transaction file: `benchmark/txs/mint.out`
- 100+ parallel mint transactions (one per account)
- Total tokens minted: 100,000,000+ tokens (depending on account count)

### 2. Token Approval (`benchmark/approve.js`)

Generates transactions to approve TicketingCore contract for unlimited token spending from each test account.

**Generate transactions:**

```bash
npx hardhat run benchmark/approve.js --network devnet
```

**Expected output:**

- Transaction file: `benchmark/txs/approve.out`
- 100+ parallel approve transactions (one per account)
- Unlimited allowance (MaxUint256) granted to TicketingCore

### 3. Ticket Purchase (`benchmark/purchase.js`)

Creates a test event and generates transactions for parallel ticket purchases from all test accounts.

**Generate transactions:**

```bash
npx hardhat run benchmark/purchase.js --network devnet
```

This script will:

1. Deploy contracts using Hardhat Ignition
2. Create a test event with capacity = number of test accounts
3. Set ticket price to 10 tokens
4. Generate purchase transactions for all accounts

**Expected output:**

- Transaction file: `benchmark/txs/purchase.out`
- 100+ parallel purchase transactions (one per account)
- All tickets purchased simultaneously, testing parallel execution safety

## Execute transactions

```bash
npx arcology.net-tx-sender http://localhost:8545 benchmark/txs/
```

## Testing Parallel Safety

The purchase benchmark is designed to stress-test Arcology's concurrent execution:

- **Scenario**: Multiple accounts (based on `accounts.json`) purchasing tickets simultaneously
- **Goal**: Verify no duplicate ticket sales or over-capacity scenarios
- **Expected behavior**: All purchases succeed, no conflicts detected
- **Concurrent structures tested**: U256Cumulative for sold count and revenue tracking

## Reference

- **Arcology Benchmarking Guide**: https://docs.arcology.network/arcology-concurrent-programming-guide/run-the-examples.md
- **Transaction Generator Utility**: `@arcologynetwork/frontend-util`
- **Transaction Sender**: `npx arcology.net-tx-sender`
