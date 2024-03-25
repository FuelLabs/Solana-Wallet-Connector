import type {
  BytesLike,
  JsonAbi,
  Provider,
  InputValue
} from 'fuels';
import { Predicate, Address, getPredicateRoot, arrayify } from "fuels";
import memoize from 'memoizee';


export const getPredicateAddress = memoize(
  (
    solanaAddress: string,
    predicateBytecode: BytesLike,
    predicateAbi: JsonAbi
  ): string => {
    const configurable = {
      SIGNER: solanaAddress,
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { predicateBytes } = Predicate.processPredicateData(
      predicateBytecode,
      predicateAbi,
      configurable
    );
    const address = Address.fromB256(getPredicateRoot(predicateBytes));
    return address.toString();
  }
);

export const createPredicate = memoize(
  (
    solanaAddress: string,
    provider: Provider,
    predicateBytecode: BytesLike,
    predicateAbi: JsonAbi
  ): Predicate<InputValue[]> => {
    const configurable = {
      SIGNER: solanaAddress,
    };

    const predicate = new Predicate(
      arrayify(predicateBytecode),
      provider,
      predicateAbi,
      configurable
    );

    return predicate;
  }
);
