import React from 'react';

interface CryptoPaymentSummaryProps {
  newTokenAmount?: number;
  currency?: string;
  chainName?: string;
  quoteId?: string;
  isLoading?: boolean;
  error?: string;
}

export const CryptoPaymentSummary: React.FC<CryptoPaymentSummaryProps> = ({
  newTokenAmount,
  currency,
  chainName,
  quoteId,
  isLoading = false,
  error
}) => {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-red-800">
            Error fetching payment amount: {error}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-blue-900 mb-1">
            Crypto Payment Required
          </h3>
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-900"></div>
                <span className="text-blue-700">Calculating...</span>
              </div>
            ) : quoteId ? (
              <div className="space-y-1">
                <span className="text-lg font-bold text-blue-900">
                  Quote ID: {quoteId}
                </span>
                {newTokenAmount && currency && (
                  <span className="text-sm text-blue-700 block">
                    {newTokenAmount.toFixed(4)} {currency}
                  </span>
                )}
              </div>
            ) : newTokenAmount && currency ? (
              <span className="text-2xl font-bold text-blue-900">
                {newTokenAmount.toFixed(4)} {currency}
              </span>
            ) : (
              <span className="text-blue-700">Waiting for quote...</span>
            )}
          </div>
          {chainName && (
            <p className="text-xs text-blue-700 mt-1">
              Pay on {chainName}
            </p>
          )}
        </div>
        
        <div className="text-right">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
