import { Request, Response, Router } from 'express';
import { RelayerService } from '../services/RelayerService';

const resolverRouter = Router();
const relayerService = new RelayerService();

resolverRouter.get('/status', (_req: Request, res: Response) => {
  res.json(relayerService.getStatus());
});

export { resolverRouter };
