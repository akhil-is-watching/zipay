import { Router } from 'express';
import { RelayerService } from '@/services/RelayerService';

const router = Router();
const relayerService = new RelayerService();

// POST /createSwap
router.post('/createSwap', async (req, res) => {});

// POST /executeSwap
router.post('/executeSwap', async (req, res) => {});

export { router as resolverRoutes };
