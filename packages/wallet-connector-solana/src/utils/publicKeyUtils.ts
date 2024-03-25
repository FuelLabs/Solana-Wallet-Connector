import type { PublicKey } from "@solana/web3.js";
import { hexlify } from "fuels";

export const solanaPublicKeyToHex = (publicKey: PublicKey) => {
  return hexlify(publicKey.toBytes());
};
