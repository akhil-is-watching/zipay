import { Request, Response, Router } from 'express';
import { RelayerService } from '../services/RelayerService';
import { QuoteRequestParams } from '../types/quote';

const resolverRouter = Router();
const relayerService = new RelayerService();

resolverRouter.get('/status', (_req: Request, res: Response) => {
  res.json(relayerService.getStatus());
});

resolverRouter.post(
  '/quote',
  (req: Request<unknown, unknown, QuoteRequestParams>, res: Response) => {
    const quote = relayerService.requestQuote(req.body);
    res.json({ quote });
  },
);

export { resolverRouter };
