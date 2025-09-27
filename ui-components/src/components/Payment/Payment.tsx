import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { PaymentProvider } from './PaymentProvider';

interface Config {
  destChainId: number;
  destTokenAddress: string;
}

interface Price {
  amount: number,
  currency: "USDC" | "ETH"
}

export interface PaymentProps {
  className?: string;
  config: Config
  price: Price
}

export const Payment: React.FC<PaymentProps> = ({ className }) => {
  return (
    <PaymentProvider>
      <div className={className}>
        <ConnectButton />
      </div>
    </PaymentProvider>
  );
};