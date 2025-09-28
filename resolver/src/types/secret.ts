import { ObjectId } from 'mongodb';
import { QuoteRequestParams } from './quote';

export type SecretRequestParams = {
  secret: string;
  orderId: string;
};

export type SecretDocument = {
  _id?: ObjectId;
  secret: string;
  quoteId: ObjectId;
  createdAt: Date;
};

export type PastSecret = {
  id: string;
  secret: string;
  createdAt: Date;
  quote: QuoteRequestParams;
};
