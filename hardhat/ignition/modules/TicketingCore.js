import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import ConcurrentERC20Module from './ConcurrentERC20.js';

const TicketingCoreModule = buildModule('TicketingCoreModule', (m) => {
  // First, get the deployed ConcurrentERC20 token
  const { token } = m.useModule(ConcurrentERC20Module);

  // Deploy TicketingCore with the token address
  const ticketingCore = m.contract('TicketingCore', [token]);

  return { ticketingCore, token };
});

export default TicketingCoreModule;
