import { Express } from 'express';
import { resolverRoutes } from './resolver';
import { apiRoutes } from './api';

export const registerRoutes = (app: Express): void => {
  // Resolver specific routes
  app.use('/resolver', resolverRoutes);

  // API routes
  app.use('/api', apiRoutes);
  // Add more route groups here as needed
  // app.use('/admin', adminRoutes);
  // app.use('/webhooks', webhookRoutes);
};
