import { NextFunction, Request, Response, Router } from 'express';
import { RelayerService } from '../services/RelayerService';
import { QuoteRequestParams } from '../types/quote';

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

export { resolverRouter };
