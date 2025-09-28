import { ObjectId } from 'mongodb';
import { getQuotesCollection, getSecretsCollection } from '../lib/mongo';
import {
  ExecuteRequestParams,
  QuoteDocument,
  QuoteRequestParams,
  QuoteResponse,
} from '../types/quote';
import { PastSecret, SecretDocument, SecretRequestParams } from '../types/secret';

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

  async submitSecret({ secret, orderId }: SecretRequestParams): Promise<boolean> {
    const secrets = await getSecretsCollection();
    const quotes = await getQuotesCollection();
    const normalizedSecret = secret.trim();
    const normalizedOrderId = orderId.trim();

    if (!ObjectId.isValid(normalizedOrderId)) {
      throw new Error('Invalid order id');
    }

    const quoteObjectId = new ObjectId(normalizedOrderId);
    const quote = await quotes.findOne({ _id: quoteObjectId });

    if (!quote) {
      throw new Error('Order not found');
    }

    await secrets.insertOne({
      secret: normalizedSecret,
      quoteId: quoteObjectId,
      createdAt: new Date(),
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    return true;
  }

  async getSecretsOlderThan(minutes = 5): Promise<PastSecret[]> {
    const secrets = await getSecretsCollection();
    const threshold = new Date(Date.now() - minutes * 60 * 1000);
    type SecretWithQuote = Required<SecretDocument> & { quote: QuoteDocument };

    const records = await secrets
      .aggregate<SecretWithQuote>([
        { $match: { createdAt: { $lte: threshold } } },
        { $sort: { createdAt: 1 } },
        {
          $lookup: {
            from: 'quotes',
            localField: 'quoteId',
            foreignField: '_id',
            as: 'quote',
          },
        },
        { $unwind: '$quote' },
      ])
      .toArray();

    return records.map((record) => ({
      id: record._id.toHexString(),
      secret: record.secret,
      createdAt: record.createdAt,
      quote: {
        fromChain: record.quote.fromChain,
        toChain: record.quote.toChain,
        fromToken: record.quote.fromToken,
        toToken: record.quote.toToken,
        toChainAmount: record.quote.toChainAmount,
        sender: record.quote.sender,
        receiver: record.quote.receiver,
        hashlock: record.quote.hashlock,
      },
    }));
  }
}
