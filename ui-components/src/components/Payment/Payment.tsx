import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { PaymentProvider } from './PaymentProvider';

interface Config {
  destChain: string;
  destToken: string;
}

export interface PaymentProps {
  className?: string;
  config: Config
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