import { useMutation } from "react-query";
import { DEFAULT_ADDRESS, DEFAULT_AMOUNT } from "../config";
import { Address, BaseAssetId } from "fuels";
import { useWallet } from "@fuels/react";

export const useTransfer = (senderAddress: string) => {
    const { wallet } = useWallet(senderAddress);

    const mutation  = useMutation(async () => {
        if (!wallet) throw new Error(`Cannot increment wallet is: ${wallet}`)
        const receiverAddress = prompt('Receiver address', DEFAULT_ADDRESS);
        const receiver = Address.fromString(receiverAddress || DEFAULT_ADDRESS);
        const response = await wallet.transfer(
            receiver,
            DEFAULT_AMOUNT,
            BaseAssetId,
            {
                gasPrice: 1,
                gasLimit: 10_000,
            }
        );
        const result = await response?.waitForResult();
        return result;
    }, {
        onError: (error: any) => { alert(error.message) }
    })

    return mutation;
}
