import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { PaymentProvider } from './PaymentProvider';

export interface PaymentProps {
  className?: string;
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