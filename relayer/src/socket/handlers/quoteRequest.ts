import type { Socket } from "socket.io";
import { CLIENT_EVENTS, SERVER_EVENTS } from "../events";
import { ensureQuoteIndexes, createQuote } from "../../repos/quotes";
import { ObjectId } from "mongodb";

// Types from your snippet:
type QuoteRequestPayload = {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  toChainAmount: string;
};

type QuoteResponsePayload = QuoteRequestPayload & {
  fromChainAmount: string;
  orderId: string; // <-- NEW
};

function computeFromChainAmount(_payload: QuoteRequestPayload): string {
  // Placeholder until pricing logic is available.
  return _payload.toChainAmount;
}

function buildResponsePayload(
  payload: QuoteRequestPayload,
  fromChainAmount: string,
  orderId: ObjectId
): QuoteResponsePayload {
  return {
    ...payload,
    fromChainAmount,
    orderId: orderId.toString(),
  };
}

export function registerQuoteRequest(socket: Socket) {
  // ensure indexes lazily (or do this once at app bootstrap)
  ensureQuoteIndexes().catch(() => { /* non-fatal */ });

  socket.on(CLIENT_EVENTS.QUOTE_REQUEST, async (raw: string) => {
    try {
      // Parse & basic validation
      const payload = JSON.parse(raw) as QuoteRequestPayload;
      const fields: (keyof QuoteRequestPayload)[] = [
        "fromChain", "toChain", "fromToken", "toToken", "toChainAmount",
      ];
      for (const k of fields) {
        if (typeof payload[k] !== "string" || payload[k].trim() === "") {
          throw new Error(`Invalid or missing field: ${k}`);
        }
      }

      const fromChainAmount = computeFromChainAmount(payload);

      // Persist
      const insertedId = await createQuote({
        ...payload,
        fromChainAmount,
      });

      // Respond
      const response = buildResponsePayload(payload, fromChainAmount, insertedId);
      socket.emit(SERVER_EVENTS.QUOTE_RESPONSE, response);
    } catch (err: any) {
      socket.emit(SERVER_EVENTS.QUOTE_RESPONSE, {
        error: true,
        message: err?.message ?? "Unknown error",
      });
    }
  });
}
