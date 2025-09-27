import { Router } from 'express';
import { RelayerService } from '../services/RelayerService';
import { ApiResponse, ExecuteSwapOrderRequest, UserIntent } from '../types';

const router = Router();
const relayerService = new RelayerService();

// POST /createSwap
router.post('/createSwap', async (req, res) => {
  const userIntent: UserIntent = req.body;

  console.log('Build swap order request received', {
    userIntent,
  });

  const swapOrder = relayerService.buildEvmSwapOrder(userIntent);

  if (!swapOrder) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to build swap order',
    };

    console.log('Failed to build swap order', { userIntent });

    return res.status(400).json(response);
  }

  const response: ApiResponse = {
    success: true,
    data: swapOrder,
  };

  return res.status(200).json(response);
});

// POST /executeSwap
router.post('/executeSwap', async (req, res) => {
  const { orderHash, signature }: ExecuteSwapOrderRequest = req.body;

  console.log('Execute swap order request received', {
    orderHash,
    signature,
  });

  await relayerService.executeEVMSwapOrder(orderHash, signature);
  return res.status(200).send('Request received and processing');
});

export { router as resolverRoutes };
