import { useState, useEffect, useRef } from 'react';
import { CrossChainSwapClient } from '../services/CrossChainSwapClient';

interface PaymentAmountResponse {
  newTokenAmount?: number;
  currency?: string;
  chainName?: string;
  chainId?: number;
  quoteId?: string;
}

export type QuoteRequestParams = {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  toChainAmount: string;
  sender: string;
  receiver: string;
  hashLock: string;
};

interface PaymentAmountRequest {
  totalAmount: number;
  fromChainId?: number;
  toChainId: number;
  fromToken: string;
  toToken: string;
  sender: string;
  receiver: string;
}

export const usePaymentAmount = (
  request: PaymentAmountRequest | null,
  enabled: boolean = true
) => {
  const [data, setData] = useState<PaymentAmountResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestInProgress = useRef(false);

  useEffect(() => {
    if (!request || !enabled) {
      setData(null);
      return;
    }

    // Prevent duplicate requests
    if (requestInProgress.current) {
      return;
    }

    const fetchPaymentAmount = async () => {
      requestInProgress.current = true;
      setIsLoading(true);
      setError(null);

      // Convert chain IDs to chain names
      const getChainName = (chainId: number) => {
        switch (chainId) {
          case 1: return 'ethereum';
          case 11155111: return 'sepolia';
          case 8453: return 'base';
          case 10143: return 'monad';
          case 137: return 'polygon';
          case 42161: return 'arbitrum';
          case 10: return 'optimism';
          default: return `chain-${chainId}`;
        }
      };

      // Prepare the request body in the correct format
      const quoteRequest: QuoteRequestParams = {
        fromChain: getChainName(request.fromChainId || 11155111), // Default to sepolia
        toChain: getChainName(request.toChainId),
        fromToken: request.fromToken.toLowerCase(),
        toToken: request.toToken.toLowerCase(),
        toChainAmount: request.totalAmount.toString(),
        sender: request.sender,
        receiver: request.receiver,
        hashLock: CrossChainSwapClient.generateSecretAndHashLock().hashLock,
      };

      console.log('🔄 Fetching payment amount for:', quoteRequest);

      try {
        // Convert chain IDs to chain names
        const getChainName = (chainId: number) => {
          switch (chainId) {
            case 1: return 'Ethereum';
            case 8453: return 'Base';
            case 10143: return 'Monad';
            case 137: return 'Polygon';
            case 42161: return 'Arbitrum';
            case 10: return 'Optimism';
            default: return `Chain ${chainId}`;
          }
        };

        // Call the real API on port 3000
        const response = await fetch('http://localhost:3000/api/resolver/quote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(quoteRequest),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        console.log('✅ API Response (quote ID):', result);
        
        // Set the quote ID immediately so user can see it
        setData({
          quoteId: result.id,
          chainName: getChainName(request.toChainId),
          chainId: request.toChainId,
        });
      } catch (err) {
        console.error('Error fetching payment amount:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch payment amount');
      } finally {
        setIsLoading(false);
        requestInProgress.current = false;
      }
    };

    fetchPaymentAmount();
  }, [request?.fromChainId, request?.toChainId, request?.totalAmount, enabled]);

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      if (request && enabled) {
        setIsLoading(true);
        setError(null);
        // Re-trigger the effect by updating a dependency
        setData(null);
      }
    }
  };
};
