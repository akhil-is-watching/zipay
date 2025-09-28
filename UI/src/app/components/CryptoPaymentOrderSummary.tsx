'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface PaymentAmountResponse {
  newTokenAmount: number;
  currency: string;
  chainName: string;
  chainId: number;
}

interface PaymentAmountRequest {
  totalAmount: number;
  fromChainId?: number;
  toChainId: number;
  fromToken: string;
  toToken: string;
}

interface CryptoPaymentOrderSummaryProps {
  totalAmount: number;
  isCryptoSelected: boolean;
}

export const CryptoPaymentOrderSummary: React.FC<CryptoPaymentOrderSummaryProps> = ({
  totalAmount,
  isCryptoSelected
}) => {
  const { chainId, address } = useAccount();
  const [paymentData, setPaymentData] = useState<PaymentAmountResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isCryptoSelected || !chainId || !address || !totalAmount) {
      setPaymentData(null);
      return;
    }

    const fetchPaymentAmount = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const request: PaymentAmountRequest = {
          totalAmount,
          fromChainId: chainId,
          toChainId: 10143, // Monad chain
          fromToken: "USDC",
          toToken: "USDC",
        };

        const response = await fetch('/api/payment-amount', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setPaymentData(result);
      } catch (err) {
        console.error('Error fetching payment amount:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch payment amount');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentAmount();
  }, [isCryptoSelected, chainId, address, totalAmount]);

  if (!isCryptoSelected) {
    return null;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
        <div className="flex items-center">
          <svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-red-800">
            Error calculating crypto payment: {error}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-blue-900 mb-1">
            Crypto Payment Required
          </h3>
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-900"></div>
                <span className="text-blue-700 text-sm">Calculating...</span>
              </div>
            ) : paymentData ? (
              <span className="text-lg font-bold text-blue-900">
                {paymentData.newTokenAmount.toFixed(4)} {paymentData.currency}
              </span>
            ) : (
              <span className="text-lg font-bold text-blue-900">
                {totalAmount.toFixed(2)} USDC
              </span>
            )}
          </div>
          {paymentData && (
            <p className="text-xs text-blue-700 mt-1">
              Pay on {paymentData.chainName}
            </p>
          )}
        </div>
        
        <div className="text-right">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
