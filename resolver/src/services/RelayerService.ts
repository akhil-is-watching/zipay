import { getQuotesCollection } from '../lib/mongo';
import { QuoteRequestParams, QuoteResponse } from '../types/quote';

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
}
