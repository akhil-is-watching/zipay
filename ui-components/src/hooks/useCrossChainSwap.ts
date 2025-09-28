import { useState, useCallback } from 'react';
import { CrossChainSwapClient, SwapParams } from '../services/CrossChainSwapClient';
import { useAccount } from 'wagmi';

interface SwapState {
  swapId?: string;
  secret?: string;
  hashLock?: string;
  status?: string;
  isLoading: boolean;
  error?: string;
  step: 'idle' | 'generating' | 'initiating' | 'executing' | 'settling' | 'completed' | 'error';
}

export const useCrossChainSwap = () => {
  const { address } = useAccount();
  const [swapState, setSwapState] = useState<SwapState>({
    isLoading: false,
    step: 'idle'
  });

  const swapClient = new CrossChainSwapClient();

  const initiateSwap = useCallback(async (params: Omit<SwapParams, 'userAddress' | 'hashLock'>) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      setSwapState(prev => ({ ...prev, isLoading: true, step: 'generating', error: undefined }));

      // Step 1: Generate secret and hash lock
      console.log('🔐 Generating secret...');
      const { secret, hashLock } = CrossChainSwapClient.generateSecretAndHashLock();
      
      setSwapState(prev => ({ 
        ...prev, 
        secret, 
        hashLock, 
        step: 'initiating' 
      }));

      // Step 2: Initiate swap
      console.log('🚀 Initiating swap...');
      const swapResponse = await swapClient.initiateSwap({
        ...params,
        userAddress: address,
        hashLock
      });

      setSwapState(prev => ({
        ...prev,
        swapId: swapResponse.swapId,
        step: 'executing'
      }));

      console.log('📝 Swap initiated:', swapResponse);
      return swapResponse;

    } catch (error) {
      console.error('Error initiating swap:', error);
      setSwapState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initiate swap',
        step: 'error',
        isLoading: false
      }));
      throw error;
    }
  }, [address, swapClient]);

  const executeSwap = useCallback(async (swapId: string, signature: string) => {
    try {
      setSwapState(prev => ({ ...prev, isLoading: true, step: 'executing' }));

      console.log('⚡ Executing swap...');
      const executionResult = await swapClient.executeSwap(swapId, signature);
      
      console.log('🏗️ Escrows created:', executionResult);
      
      // Check status
      const status = await swapClient.getSwapStatus(swapId);
      setSwapState(prev => ({
        ...prev,
        status: status.status,
        step: status.status === 'awaiting_secret' ? 'settling' : 'completed'
      }));

      return executionResult;

    } catch (error) {
      console.error('Error executing swap:', error);
      setSwapState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to execute swap',
        step: 'error',
        isLoading: false
      }));
      throw error;
    }
  }, [swapClient]);

  const settleSwap = useCallback(async () => {
    if (!swapState.swapId || !swapState.secret) {
      throw new Error('No swap ID or secret available');
    }

    try {
      setSwapState(prev => ({ ...prev, isLoading: true, step: 'settling' }));

      console.log('🔓 Revealing secret to settle swap...');
      const settlementResult = await swapClient.settleSwap(swapState.swapId, swapState.secret);
      
      console.log('✅ Swap settled:', settlementResult);

      // Final status check
      const finalStatus = await swapClient.getSwapStatus(swapState.swapId);
      setSwapState(prev => ({
        ...prev,
        status: finalStatus.status,
        step: 'completed',
        isLoading: false
      }));

      return settlementResult;

    } catch (error) {
      console.error('Error settling swap:', error);
      setSwapState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to settle swap',
        step: 'error',
        isLoading: false
      }));
      throw error;
    }
  }, [swapState.swapId, swapState.secret, swapClient]);

  const getSwapStatus = useCallback(async (swapId?: string) => {
    const id = swapId || swapState.swapId;
    if (!id) return null;

    try {
      const status = await swapClient.getSwapStatus(id);
      setSwapState(prev => ({ ...prev, status: status.status }));
      return status;
    } catch (error) {
      console.error('Error getting swap status:', error);
      return null;
    }
  }, [swapState.swapId, swapClient]);

  const resetSwap = useCallback(() => {
    setSwapState({
      isLoading: false,
      step: 'idle'
    });
  }, []);

  return {
    swapState,
    initiateSwap,
    executeSwap,
    settleSwap,
    getSwapStatus,
    resetSwap
  };
};
