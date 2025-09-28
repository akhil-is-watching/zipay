import { NextFunction, Request, Response, Router } from 'express';
import { RelayerService } from '../services/RelayerService';
import { ExecuteRequestParams, QuoteRequestParams } from '../types/quote';
import { SecretRequestParams } from '../types/secret';

const resolverRouter = Router();
const relayerService = new RelayerService();

resolverRouter.get('/status', (_req: Request, res: Response) => {
  res.json(relayerService.getStatus());
});

resolverRouter.post(
  '/quote',
  async (
    req: Request<unknown, unknown, QuoteRequestParams>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = await relayerService.requestQuote(req.body);
      res.json({ id });
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
          hashlock: quote.hashlock,
        })),
      });
    } catch (error) {
      next(error);
    }
  },
);

export { resolverRouter };
