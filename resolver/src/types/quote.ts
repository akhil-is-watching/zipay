import { ObjectId } from 'mongodb';

export type QuoteRequestParams = {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  toChainAmount: string;
  sender: string;
  receiver: string;
  hashlock: string;
};

export type QuoteDocument = QuoteRequestParams & {
  _id?: ObjectId;
  createdAt: Date;
};

export type QuoteResponse = {
  id: string;
};
