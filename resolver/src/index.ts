import express, { Request, Response } from 'express';
import { apiRouter } from './routes';

const app = express();

app.use(express.json());
app.use('/api', apiRouter);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  // Log so platform checks can confirm the service started.
  console.log(`Resolver service listening on port ${port}`);
});
