import express, { NextFunction, Request, Response } from 'express';
import { apiRouter } from './routes';

const app = express();

app.use((req: Request, res: Response, next: NextFunction) => {
  // Allow all cross-origin requests.
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    req.header('Access-Control-Request-Headers') ?? 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

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
