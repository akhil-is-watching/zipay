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
