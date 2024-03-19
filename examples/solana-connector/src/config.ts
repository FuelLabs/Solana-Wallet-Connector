import { Address, bn } from 'fuels';

export const COUNTER_CONTRACT_ID =
  '0x0a46aafb83b387155222893b52ed12e5a4b9d6cd06770786f2b5e4307a63b65c';
export const DEFAULT_ADDRESS = Address.fromRandom().toString();
export const DEFAULT_AMOUNT = bn.parseUnits('0.00001');
export const DEMO_QUERY_KEYS = {
  count: 'count',
};
