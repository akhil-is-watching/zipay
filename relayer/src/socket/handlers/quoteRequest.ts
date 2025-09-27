import type { Socket } from 'socket.io';
import { CLIENT_EVENTS, SERVER_EVENTS } from '../events';

type QuoteRequestPayload = {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  toChainAmount: string;
};

type QuoteResponsePayload = QuoteRequestPayload & {
  fromChainAmount: string;
};


function computeFromChainAmount(_payload: QuoteRequestPayload): string {
  // Placeholder until pricing logic is available.
  return _payload.toChainAmount;
}

function buildResponsePayload(payload: QuoteRequestPayload, fromChainAmount: string): QuoteResponsePayload {
  return {
    ...payload,
    fromChainAmount: fromChainAmount,
  };
}

export function registerQuoteRequest(socket: Socket) {
  socket.on(CLIENT_EVENTS.QUOTE_REQUEST, (raw: string) => {
    const payload = JSON.parse(raw) as QuoteRequestPayload;

    const fromChainAmount = computeFromChainAmount(payload);
    const response = buildResponsePayload(payload, fromChainAmount);

    socket.emit(SERVER_EVENTS.QUOTE_RESPONSE, response);
  });
}
