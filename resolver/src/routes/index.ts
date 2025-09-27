import { Router } from 'express';
import { resolverRouter } from './resolver';

const apiRouter = Router();

apiRouter.use('/resolver', resolverRouter);

export { apiRouter };
