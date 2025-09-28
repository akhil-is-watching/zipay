import { NextFunction, Request, Response, Router } from 'express';
import { RelayerService } from '../services/RelayerService';
import { ExecuteRequestParams, QuoteRequestParams } from '../types/quote';

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

export { resolverRouter };
