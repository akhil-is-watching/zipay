import { NextFunction, Request, Response, Router } from 'express';
import { RelayerService } from '../services/RelayerService';
import { 
  ExecuteRequestParams, 
  QuoteRequestParams,
  CrossChainSwapRequest,
  SwapExecutionRequest,
  SwapSettlementRequest
} from '../types/quote';
import { SecretRequestParams } from '../types/secret';

const resolverRouter = Router();
const relayerService = new RelayerService();

resolverRouter.get('/status', (_req: Request, res: Response) => {
  res.json(relayerService.getStatus());
});

// New endpoint: Initiate cross-chain swap
resolverRouter.post(
  '/swap/initiate',
  async (
    req: Request<unknown, unknown, CrossChainSwapRequest>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const swapResponse = await relayerService.initiateCrossChainSwap(req.body);
      res.json(swapResponse);
    } catch (error) {
      next(error);
    }
  },
);

// New endpoint: Execute cross-chain swap (after user signs)
resolverRouter.post(
  '/swap/execute',
  async (
    req: Request<unknown, unknown, SwapExecutionRequest>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { swapId, userSignature } = req.body;
      
      if (!swapId || !userSignature) {
        res.status(400).json({ error: 'swapId and userSignature are required' });
        return;
      }

      const status = await relayerService.executeCrossChainSwap({ swapId, userSignature });
      res.json(status);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Swap not found') {
          res.status(404).json({ error: error.message });
          return;
        }
        if (error.message.includes('Invalid swap status')) {
          res.status(400).json({ error: error.message });
          return;
        }
      }
      next(error);
    }
  },
);

// New endpoint: Get swap status
resolverRouter.get(
  '/swap/:swapId/status',
  async (
    req: Request<{ swapId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { swapId } = req.params;
      const status = await relayerService.getSwapStatus(swapId);
      res.json(status);
    } catch (error) {
      if (error instanceof Error && error.message === 'Swap not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  },
);

// New endpoint: User reveals secret to settle swap
resolverRouter.post(
  '/swap/:swapId/settle',
  async (
    req: Request<{ swapId: string }, unknown, { secret: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { swapId } = req.params;
      const { secret } = req.body;
      
      if (!secret || typeof secret !== 'string') {
        res.status(400).json({ error: 'secret is required' });
        return;
      }

      // Validate secret format (should be 32 bytes hex)
      if (!secret.startsWith('0x') || secret.length !== 66) {
        res.status(400).json({ error: 'Invalid secret format: must be 32 bytes hex string' });
        return;
      }

      const status = await relayerService.settleSwapWithSecret({ orderId: swapId, secret });
      res.json(status);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Swap not found') {
          res.status(404).json({ error: error.message });
          return;
        }
        if (error.message.includes('Invalid swap status') || error.message.includes('Invalid secret')) {
          res.status(400).json({ error: error.message });
          return;
        }
      }
      next(error);
    }
  },
);

resolverRouter.post(
  '/quote',
  async (
    req: Request<unknown, unknown, QuoteRequestParams>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const response = await relayerService.requestQuote(req.body);
      res.json(response);
    } catch (error) {
      next(error);
    }
  },
);

resolverRouter.post(
  '/execute',
  async (
    req: Request<unknown, unknown, ExecuteRequestParams>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { orderId, signature } = req.body;
      const success = await relayerService.executeOrder({ orderId, signature });
      res.json({ success });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid order id') {
          res.status(400).json({ error: error.message });
          return;
        }
        if (error.message === 'Order not found') {
          res.status(404).json({ error: error.message });
          return;
        }
      }
      next(error);
    }
  },
);

resolverRouter.post(
  '/secret',
  async (
    req: Request<unknown, unknown, SecretRequestParams>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { secret, orderId } = req.body;

      if (typeof secret !== 'string' || !secret.trim()) {
        res.status(400).json({ error: 'secret is required' });
        return;
      }

      if (typeof orderId !== 'string' || !orderId.trim()) {
        res.status(400).json({ error: 'orderId is required' });
        return;
      }

      const success = await relayerService.submitSecret({
        secret: secret.trim(),
        orderId: orderId.trim(),
      });
      res.json({ success });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid order id') {
          res.status(400).json({ error: error.message });
          return;
        }
        if (error.message === 'Order not found') {
          res.status(404).json({ error: error.message });
          return;
        }
      }
      next(error);
    }
  },
);

resolverRouter.get(
  '/secrets/expired',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const secrets = await relayerService.getSecretsOlderThan(5);
      res.json({
        secrets: secrets.map(({ id, secret, createdAt, quote }) => ({
          id,
          secret,
          createdAt: createdAt.toISOString(),
          fromChain: quote.fromChain,
          toChain: quote.toChain,
          fromToken: quote.fromToken,
          toToken: quote.toToken,
          toChainAmount: quote.toChainAmount,
          sender: quote.sender,
          receiver: quote.receiver,
          hashlock: quote.hashLock,
        })),
      });
    } catch (error) {
      next(error);
    }
  },
);

export { resolverRouter };
