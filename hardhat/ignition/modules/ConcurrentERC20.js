import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const ConcurrentERC20Module = buildModule('ConcurrentERC20Module', (m) => {
  // Parameters with defaults
  const name = m.getParameter('name', 'Test Token');
  const symbol = m.getParameter('symbol', 'TEST');
  const initialSupply = m.getParameter('initialSupply', 1000000n * 10n ** 18n);

  const token = m.contract('ConcurrentERC20', [name, symbol, initialSupply]);

  return { token };
});

export default ConcurrentERC20Module;
