import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const ConcurrentERC20Module = buildModule('ConcurrentERC20Module', (m) => {
  // Parameters with defaults
  const name = m.getParameter('name', 'Test USDC');
  const symbol = m.getParameter('symbol', 'USDC');
  const initialSupply = m.getParameter(
    'initialSupply',
    1000000000n * 10n ** 18n
  );
  const token = m.contract('ConcurrentERC20', [name, symbol, initialSupply]);
  return { token };
});

export default ConcurrentERC20Module;
