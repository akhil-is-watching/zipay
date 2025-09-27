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
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: usdcAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!usdcAddress,
    },
  });

  // Fetch decimals for proper formatting
  const { data: decimals } = useReadContract({
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
    if (balanceData && decimals !== undefined && decimals !== null) {
      // Convert from wei to actual USDC amount (USDC has 6 decimals)
      const formattedBalance =
        Number(balanceData) / Math.pow(10, Number(decimals));
      setBalance(formattedBalance);
    }
  }, [balanceData, decimals]);

  useEffect(() => {
    fetchUsdcBalance();
  }, [chainId, address]);

  return (
    <PaymentProvider>
      <div className={className}>
        <ConnectButton />
      </div>
      Balance: {balance}
    </PaymentProvider>
  );
};
