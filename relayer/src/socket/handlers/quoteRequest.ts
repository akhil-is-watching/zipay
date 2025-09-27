import type { Socket } from "socket.io";
import { CLIENT_EVENTS, RESOLVER_EVENTS, SERVER_EVENTS } from "../events";
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

type PendingQuoteRequest = {
  socket: Socket;
  payload: QuoteRequestPayload;
  timeout: NodeJS.Timeout;
};

type ResolverQuoteRequestPayload = QuoteRequestPayload & {
  requestId: string;
  clientSocketId: string;
};

type ResolverQuoteResponsePayload = {
  requestId: string;
  fromChainAmount?: string;
  error?: boolean;
  message?: string;
};

const PENDING_QUOTE_TIMEOUT_MS = 30_000;

const pendingQuoteRequests = new Map<string, PendingQuoteRequest>();

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

  socket.on(CLIENT_EVENTS.QUOTE_REQUEST, async (raw: any) => {
    try {
      // Parse & basic validation
      const payload = typeof raw === "string" ? JSON.parse(raw) as QuoteRequestPayload : (raw as QuoteRequestPayload);
      const fields: (keyof QuoteRequestPayload)[] = [
        "fromChain", "toChain", "fromToken", "toToken", "toChainAmount",
      ];
      for (const k of fields) {
        if (typeof payload[k] !== "string" || payload[k].trim() === "") {
          throw new Error(`Invalid or missing field: ${k}`);
        }
      }

      const requestId = new ObjectId().toHexString();
      console.log('Request id is', requestId)

      const timeout = setTimeout(() => {
        pendingQuoteRequests.delete(requestId);
        socket.emit(SERVER_EVENTS.QUOTE_RESPONSE, {
          error: true,
          message: "Quote request timed out",
        });
      }, PENDING_QUOTE_TIMEOUT_MS);

      pendingQuoteRequests.set(requestId, {
        socket,
        payload,
        timeout,
      });

      const resolverPayload: ResolverQuoteRequestPayload = {
        requestId,
        clientSocketId: socket.id,
        ...payload,
      };

      // Notify all other connected sockets (resolvers) about the new quote request
      console.log("Broadcasting quote request to resolvers...")
      socket.broadcast.emit(SERVER_EVENTS.QUOTE_REQUEST, resolverPayload);
    } catch (err: any) {
      socket.emit(SERVER_EVENTS.QUOTE_RESPONSE, {
        error: true,
        message: err?.message ?? "Unknown error",
      });
    }
  });

  socket.on(RESOLVER_EVENTS.QUOTE_RESPONSE, async (raw: any) => {
    try {
      console.log("Received quote response from resolver...", raw)
      const payload = typeof raw === "string" ? JSON.parse(raw) as ResolverQuoteResponsePayload : (raw as ResolverQuoteResponsePayload);

      if (!payload?.requestId) {
        return;
      }

      const pending = pendingQuoteRequests.get(payload.requestId);
      if (!pending) {
        return;
      }

      clearTimeout(pending.timeout);
      pendingQuoteRequests.delete(payload.requestId);

      if (payload.error) {
        pending.socket.emit(SERVER_EVENTS.QUOTE_RESPONSE, {
          error: true,
          message: payload.message ?? "Quote could not be resolved",
        });
        return;
      }

      if (!payload.fromChainAmount) {
        pending.socket.emit(SERVER_EVENTS.QUOTE_RESPONSE, {
          error: true,
          message: "Resolver response missing fromChainAmount",
        });
        return;
      }

      const insertedId = await createQuote({
        ...pending.payload,
        fromChainAmount: payload.fromChainAmount,
      });

      const response = buildResponsePayload(
        pending.payload,
        payload.fromChainAmount,
        insertedId,
      );

      pending.socket.emit(SERVER_EVENTS.QUOTE_RESPONSE, response);
    } catch (err: any) {
      // best-effort: cannot recover which socket should be notified if parsing fails without requestId
      if (typeof raw === "object" && raw !== null && "requestId" in raw) {
        const requestId = (raw as ResolverQuoteResponsePayload).requestId;
        const pending = pendingQuoteRequests.get(requestId);
        if (pending) {
          clearTimeout(pending.timeout);
          pendingQuoteRequests.delete(requestId);
          pending.socket.emit(SERVER_EVENTS.QUOTE_RESPONSE, {
            error: true,
            message: err?.message ?? "Unknown resolver response error",
          });
        }
      }
    }
  });

  socket.on("disconnect", () => {
    for (const [requestId, pending] of pendingQuoteRequests.entries()) {
      if (pending.socket.id === socket.id) {
        clearTimeout(pending.timeout);
        pendingQuoteRequests.delete(requestId);
      }
    }
  });
}
