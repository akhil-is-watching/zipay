import React, { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { PaymentProvider } from "./PaymentProvider";
import { useAccount, useReadContract } from "wagmi";
import { CHAINS } from "../../lib/const";

interface Config {
  destChainId: number;
  destTokenAddress: string;
}

interface Price {
  amount: number;
  currency: "USDC" | "ETH";
}

export interface PaymentProps {
  className?: string;
  config: Config;
  price: Price;
}

export const Payment: React.FC<PaymentProps> = ({ className }) => {
  const [balance, setBalance] = useState(0);
  const { chainId, address } = useAccount();

  // Find the current chain configuration
  const currentChain = Object.values(CHAINS).find(
    (chain) => chain.chainId === chainId
  );
  const usdcAddress = currentChain?.usdc;

  // ERC20 balanceOf ABI
  const erc20Abi = [
    {
      constant: true,
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      type: "function",
    },
    {
      constant: true,
      inputs: [],
      name: "decimals",
      outputs: [{ name: "", type: "uint8" }],
      type: "function",
    },
  ] as const;

  // Fetch USDC balance using wagmi
  const { data: balanceData, refetch: refetchBalance, isLoading: isLoadingBalance } = useReadContract({
    address: usdcAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!usdcAddress,
    },
  });

  // Fetch decimals for proper formatting
  const { data: decimals, isLoading: isLoadingDecimals } = useReadContract({
    address: usdcAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
    query: {
      enabled: !!usdcAddress,
    },
  });

  const fetchUsdcBalance = () => {
    refetchBalance();
  };

  // Update balance when data changes
  useEffect(() => {
    if (balanceData !== undefined && balanceData !== null && decimals !== undefined && decimals !== null) {
      // Convert from wei to actual USDC amount (USDC has 6 decimals)
      const formattedBalance =
        Number(balanceData) / Math.pow(10, Number(decimals));
      setBalance(formattedBalance);
    }
  }, [balanceData, decimals]);

  useEffect(() => {
    if (!currentChain) {
      setBalance(0);
    }
  }, [chainId, currentChain]);

  const isLoading = isLoadingBalance || isLoadingDecimals;
  const tokenSymbol = 'USDC';

  useEffect(() => {
    fetchUsdcBalance();
  }, [chainId, address]);

  return (
    <PaymentProvider>
      <div className={className}>
        <ConnectButton showBalance={false}/>
      </div>
      
      {address && (
        <div className="mt-4 p-4 ">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                {tokenSymbol} Balance
              </h3>
              <div className="flex items-center space-x-2">
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span className="text-gray-500">Loading...</span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold" style={{ color: '#000000' }}>
                    {balance.toFixed(4)} {tokenSymbol}
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={fetchUsdcBalance}
              disabled={isLoading}
              className="px-3 py-1 text-lg bg-black hover:bg-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '⟳' : '↻'}
            </button>
          </div>
        </div>
      )}
    </PaymentProvider>
  );
};
