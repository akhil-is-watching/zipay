import { ObjectId } from 'mongodb';
import { getQuotesCollection } from '../lib/mongo';
import {
  ExecuteRequestParams,
  QuoteRequestParams,
  QuoteResponse,
} from '../types/quote';

export class RelayerService {
  getStatus() {
    return {
      message: 'Relayer operational',
    };
  }

  async requestQuote(params: QuoteRequestParams): Promise<QuoteResponse> {
    const quotes = await getQuotesCollection();
    const result = await quotes.insertOne({
      ...params,
      createdAt: new Date(),
    });

    return { id: result.insertedId.toString() };
  }

  async executeOrder({ orderId, signature }: ExecuteRequestParams): Promise<boolean> {
    void signature;

    if (!ObjectId.isValid(orderId)) {
      throw new Error('Invalid order id');
    }

    const quotes = await getQuotesCollection();
    const order = await quotes.findOne({ _id: new ObjectId(orderId) });

    if (!order) {
      throw new Error('Order not found');
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    return true;
  }
}
