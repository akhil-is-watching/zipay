import { Router } from 'express';

const router = Router();

// GET /api/health
router.get('/health', (req, res) => {
  res.json({ 
    service: 'Resolver API',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export { router as apiRoutes };
