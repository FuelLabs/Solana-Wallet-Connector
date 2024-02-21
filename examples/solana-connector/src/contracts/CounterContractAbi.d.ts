/* Autogenerated file. Do not edit manually. */

/* tslint:disable */
/* eslint-disable */

/*
  Fuels version: 0.73.0
  Forc version: 0.49.2
  Fuel-Core version: 0.22.0
*/

import type {
  BigNumberish,
  BN,
  BytesLike,
  Contract,
  DecodedValue,
  FunctionFragment,
  Interface,
  InvokeFunction,
} from 'fuels';

interface CounterContractAbiInterface extends Interface {
  functions: {
    count: FunctionFragment;
    increment: FunctionFragment;
  };

  encodeFunctionData(functionFragment: 'count', values: []): Uint8Array;
  encodeFunctionData(functionFragment: 'increment', values: []): Uint8Array;

  decodeFunctionData(functionFragment: 'count', data: BytesLike): DecodedValue;
  decodeFunctionData(
    functionFragment: 'increment',
    data: BytesLike
  ): DecodedValue;
}

export class CounterContractAbi extends Contract {
  interface: CounterContractAbiInterface;
  functions: {
    count: InvokeFunction<[], BN>;
    increment: InvokeFunction<[], void>;
  };
}
