## Hardhat 3 Testing Strategy

Hardhat 3's **native Solidity testing** framework is used for standard contract logic—deployment, access control, time-locked withdrawals, and basic validation.

Arcology's concurrent primitives cannot be tested in Solidity's simulated EVM. All parallel execution tests are written in JavaScript using Hardhat's testing framework connected to actual Arcology DevNet:

- 10+ simultaneous mint operations verifying unique UUID generation
- Parallel purchases across multiple tiers with conflict detection
- Mixed operations (mint + transfer + burn) validating state consistency
- 100+ concurrent transaction stress tests measuring TPS and conflict rate

## Hardhat Ignition

Production deployments use Ignition modules for deterministic addresses and complex deployment dependencies logic.

I could not utilise Ignition in the JavaScript tests because Hardhat testnet can't be used. All test deployments use `ethers.getContractFactory()` and `.deploy()` pattern.
