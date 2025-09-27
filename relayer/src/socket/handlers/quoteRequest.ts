import type { Socket } from 'socket.io';
import { CLIENT_EVENTS, SERVER_EVENTS } from '../events';

type QuoteRequestPayload = {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  toChainAmount: number | string;
};

type QuoteResponsePayload = QuoteRequestPayload & {
  fromChainAmount: string;
};

function parseAmount(amount: QuoteRequestPayload['toChainAmount']): number | null {
  if (typeof amount === 'number' && Number.isFinite(amount)) {
    return amount;
  }

  if (typeof amount === 'string') {
    const parsed = Number(amount.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function computeFromChainAmount(_payload: QuoteRequestPayload, normalizedToChainAmount: number): number {
  // Placeholder until pricing logic is available.
  return normalizedToChainAmount;
}

function buildResponsePayload(payload: QuoteRequestPayload, fromChainAmount: number): QuoteResponsePayload {
  return {
    ...payload,
    fromChainAmount: fromChainAmount.toString(),
  };
}

export function registerQuoteRequest(socket: Socket) {
  socket.on(CLIENT_EVENTS.QUOTE_REQUEST, (payload: QuoteRequestPayload) => {
    console.log('Received client:quote-request', payload);

    const normalizedToChainAmount = parseAmount(payload.toChainAmount);

    if (normalizedToChainAmount === null) {
      console.warn('Invalid toChainAmount received in quote request', payload);
      const response: QuoteResponsePayload = {
        ...payload,
        fromChainAmount: '0',
      };
      socket.emit(SERVER_EVENTS.QUOTE_RESPONSE, response);
      return;
    }

    const fromChainAmount = computeFromChainAmount(payload, normalizedToChainAmount);
    const response = buildResponsePayload(payload, fromChainAmount);

    socket.emit(SERVER_EVENTS.QUOTE_RESPONSE, response);
  });
}
