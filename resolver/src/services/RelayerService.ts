import { QuoteRequestParams } from '../types/quote';

export class RelayerService {
  getStatus() {
    return {
      message: 'Relayer operational',
    };
  }

  requestQuote(_params: QuoteRequestParams) {
    return 'Dummy quote response';
  }
}
