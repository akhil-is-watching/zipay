import { ObjectId } from 'mongodb';

export type QuoteRequestParams = {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  toChainAmount: string;
  sender: string;
  receiver: string;
  hashLock: string;
};

export type QuoteDocument = QuoteRequestParams & {
  _id?: ObjectId;
  createdAt: Date;
  fromTokenAmount: string;
  toTokenAmount: string;
  permit: any;
};

export type QuoteResponse = {
  id: string;
  fromTokenAmount: string;
  message: {
    domain: {
      name: string;
      version: string;
      chainId: number;
      verifyingContract: string;
    };
    types: any;
    values: any;
  };
};

export type ExecuteRequestParams = {
  orderId: string;
  signature: string;
};

// Updated types for user-controlled secret flow
export type CrossChainSwapRequest = {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  userAddress: string;
  receiverAddress: string;
  hashLock: string; // User provides the hash lock (hash of their secret)
};

export type CrossChainSwapResponse = {
  swapId: string;
  hashLock: string;
  fromChainOrderHash: string;
  toChainOrderHash: string;
  permitSignature: {
    domain: {
      name: string;
      version: string;
      chainId: number;
      verifyingContract: string;
    };
    types: any;
    values: any;
  };
  timeLocks: {
    deployed: number;
    withdrawal: number;
    cancellation: number;
  };
  status: 'pending_user_signature';
};

export type SwapExecutionRequest = {
  swapId: string;
  userSignature: string;
};

export type SwapSettlementRequest = {
  swapId: string;
  secret: string; // User reveals the secret for settlement
};

export type SwapStatus = {
  swapId: string;
  status: 'pending_user_signature' | 'creating_escrows' | 'escrows_created' | 'awaiting_secret' | 'settling' | 'completed' | 'failed';
  hashLock: string;
  fromChainEscrowAddress?: string;
  toChainEscrowAddress?: string;
  fromChainTxHash?: string;
  toChainTxHash?: string;
  settlementTxHashes?: {
    fromChain?: string;
    toChain?: string;
  };
  timeLocks: {
    deployed: number;
    withdrawal: number;
    cancellation: number;
  };
  error?: string;
};

export type SwapDocument = {
  _id?: ObjectId;
  swapId: string;
  hashLock: string; // Only store hash lock, not the secret
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  userAddress: string;
  receiverAddress: string;
  fromChainOrderHash: string;
  toChainOrderHash: string;
  fromChainEscrowAddress?: string;
  toChainEscrowAddress?: string;
  fromChainTxHash?: string;
  toChainTxHash?: string;
  settlementTxHashes?: {
    fromChain?: string;
    toChain?: string;
  };
  timeLocks: {
    deployed: number;
    withdrawal: number;
    cancellation: number;
  };
  permit: any;
  status: 'pending_user_signature' | 'creating_escrows' | 'escrows_created' | 'awaiting_secret' | 'settling' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
};
