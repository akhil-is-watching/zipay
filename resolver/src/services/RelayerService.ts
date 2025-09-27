import { EvmSwapOrder, UserIntent } from "@/types";
import * as Sdk from "@1inch/cross-chain-sdk";  

export class RelayerService {
    public async buildEvmSwapOrder(intent: UserIntent): Promise<Sdk.EIP712TypedData | undefined | undefined> {
        return undefined;
    }

    public async executeEVMSwapOrder(orderHash: string, signature: string): Promise<void> {}

}