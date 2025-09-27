import * as Sdk from "@1inch/cross-chain-sdk";


export interface UserIntent {
    srcChainId: number;
    dstChainId: number;
    userAddress: string;
    tokenAmount: string;
    srcChainAsset: string;
    dstChainAsset: string;
    hashLock: string;
    receiver: string;
}

export interface SwapOrder {
    orderHash: string;
    userIntent: UserIntent;
    signature?: string;
    secret?: string;
  
    escrowSrcTxHash?: string;
    escrowDstTxHash?: string;
    escrowDstWithdrawTxHash?: string;
    escrowSrcWithdrawTxHash?: string;
  
  
    createdAt: Date;
    updatedAt: Date;
    executedAt?: Date;
  
    deployedAt?: number;
  
    // Might be source and dest objectId
    suiEscrowObjectId?: string; 
    evmEscrowAddress?: string;
  }
  
  export interface EvmSwapOrder extends SwapOrder {
    typedData: Sdk.EIP712TypedData;
    order: Sdk.EvmCrossChainOrder;
  }