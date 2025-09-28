import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useCrossChainSwap } from '../../hooks/useCrossChainSwap';
import { CHAINS } from '../../lib/const';

interface CrossChainSwapProps {
  fromAmount: string;
  toAmount: string;
  onSwapComplete?: (swapId: string) => void;
  onSwapError?: (error: string) => void;
}

export const CrossChainSwap: React.FC<CrossChainSwapProps> = ({
  fromAmount,
  toAmount,
  onSwapComplete,
  onSwapError
}) => {
  const { address, chainId } = useAccount();
  const { swapState, initiateSwap, executeSwap, settleSwap, resetSwap } = useCrossChainSwap();
  const [signature, setSignature] = useState<string>('');

  const handleInitiateSwap = async () => {
    try {
      await initiateSwap({
        fromChain: 'sepolia',
        toChain: 'monad',
        fromToken: CHAINS.sepolia.usdc, // Using sepolia USDC
        toToken: CHAINS.monad.usdc,
        fromAmount,
        toAmount,
        receiverAddress: address || '',
      });
    } catch (error) {
      onSwapError?.(error instanceof Error ? error.message : 'Failed to initiate swap');
    }
  };

  const handleExecuteSwap = async () => {
    if (!swapState.swapId || !signature) return;
    
    try {
      await executeSwap(swapState.swapId, signature);
    } catch (error) {
      onSwapError?.(error instanceof Error ? error.message : 'Failed to execute swap');
    }
  };

  const handleSettleSwap = async () => {
    try {
      await settleSwap();
      if (swapState.swapId) {
        onSwapComplete?.(swapState.swapId);
      }
    } catch (error) {
      onSwapError?.(error instanceof Error ? error.message : 'Failed to settle swap');
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'generating':
        return '🔐';
      case 'initiating':
        return '🚀';
      case 'executing':
        return '⚡';
      case 'settling':
        return '🔓';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStepDescription = (step: string) => {
    switch (step) {
      case 'generating':
        return 'Generating secure secret...';
      case 'initiating':
        return 'Initiating cross-chain swap...';
      case 'executing':
        return 'Creating escrow contracts...';
      case 'settling':
        return 'Settling swap with secret...';
      case 'completed':
        return 'Swap completed successfully!';
      case 'error':
        return 'Swap failed';
      default:
        return 'Ready to start swap';
    }
  };

  if (!address) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-yellow-800">
            Please connect your wallet to initiate cross-chain swap
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Cross-Chain Swap</h3>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getStepIcon(swapState.step)}</span>
          <span className="text-sm text-gray-600">{getStepDescription(swapState.step)}</span>
        </div>
      </div>

      {/* Swap Details */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">From:</span>
          <span className="text-sm font-medium">{fromAmount} USDC (Sepolia)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">To:</span>
          <span className="text-sm font-medium">{toAmount} USDC (Monad)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Receiver:</span>
          <span className="text-sm font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
        </div>
      </div>

      {/* Swap ID Display */}
      {swapState.swapId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">Swap ID:</span>
            <span className="text-sm font-mono text-blue-700">{swapState.swapId}</span>
          </div>
        </div>
      )}

      {/* Hash Lock Display */}
      {swapState.hashLock && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-900">Hash Lock:</span>
            <span className="text-xs font-mono text-green-700">{swapState.hashLock.slice(0, 10)}...{swapState.hashLock.slice(-8)}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {swapState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-800">{swapState.error}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {swapState.step === 'idle' && (
          <button
            onClick={handleInitiateSwap}
            disabled={swapState.isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {swapState.isLoading ? 'Initiating...' : 'Initiate Cross-Chain Swap'}
          </button>
        )}

        {swapState.step === 'executing' && swapState.swapId && (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter signature (mock for demo)"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleExecuteSwap}
              disabled={swapState.isLoading || !signature}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {swapState.isLoading ? 'Executing...' : 'Execute Swap'}
            </button>
          </div>
        )}

        {swapState.step === 'settling' && (
          <button
            onClick={handleSettleSwap}
            disabled={swapState.isLoading}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {swapState.isLoading ? 'Settling...' : 'Settle Swap (Reveal Secret)'}
          </button>
        )}

        {(swapState.step === 'completed' || swapState.step === 'error') && (
          <button
            onClick={resetSwap}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Start New Swap
          </button>
        )}
      </div>

      {/* Status Display */}
      {swapState.status && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Status:</span>
            <span className="text-sm text-gray-700 capitalize">{swapState.status.replace('_', ' ')}</span>
          </div>
        </div>
      )}
    </div>
  );
};
