'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Payment, CHAINS } from '@zipay/ui-components';

interface CheckoutData {
  products: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  total: number;
  subtotal?: number;
  tax?: number;
  shipping?: number;
}

export default function CheckoutPage() {
  const [selectedPayment, setSelectedPayment] = useState<'card' | 'upi' | 'crypto'>('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [upiId, setUpiId] = useState('');
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('checkoutData');
    if (data) {
      setCheckoutData(JSON.parse(data));
    }
  }, []);

  const handlePayment = () => {
    // Handle payment logic here
    console.log('Processing payment with:', selectedPayment);
    // Clear cart after successful payment
    localStorage.removeItem('cart');
    sessionStorage.removeItem('checkoutData');
    alert('Payment successful! Thank you for your purchase.');
  };

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No items to checkout</h1>
          <Link href="/" className="bg-black text-white px-4 py-2 rounded-md">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-gray-600 hover:text-gray-800 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your payment securely</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Methods */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>

            {/* Card Payment */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <input
                  type="radio"
                  id="card"
                  name="payment"
                  value="card"
                  checked={selectedPayment === 'card'}
                  onChange={(e) => setSelectedPayment('card')}
                  className="mr-3"
                />
                <label htmlFor="card" className="text-lg font-medium text-gray-900 cursor-pointer">
                  Credit/Debit Card
                </label>
              </div>

              {selectedPayment === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={cardDetails.name}
                      onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* UPI Payment */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <input
                  type="radio"
                  id="upi"
                  name="payment"
                  value="upi"
                  checked={selectedPayment === 'upi'}
                  onChange={(e) => setSelectedPayment('upi')}
                  className="mr-3"
                />
                <label htmlFor="upi" className="text-lg font-medium text-gray-900 cursor-pointer">
                  UPI Payment
                </label>
              </div>

              {selectedPayment === 'upi' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    placeholder="yourname@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    You'll be redirected to your UPI app to complete the payment
                  </p>
                </div>
              )}
            </div>

            {/* Crypto Payment */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <input
                  type="radio"
                  id="crypto"
                  name="payment"
                  value="crypto"
                  checked={selectedPayment === 'crypto'}
                  onChange={(e) => setSelectedPayment('crypto')}
                  className="mr-3"
                />
                <label htmlFor="crypto" className="text-lg font-medium text-gray-900 cursor-pointer">
                  Cryptocurrency
                </label>
              </div>

              {selectedPayment === 'crypto' && (
                <div className="space-y-4">
                  {/* Connect Wallet Section */}
                  <div className="flex items-center justify-between">
                    <Payment
                      price={{ amount: checkoutData.total, currency: "USDC" }}
                      config={{ destChainId: CHAINS.monad.chainId, destTokenAddress: CHAINS.monad.usdc }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              {/* Order Items */}
              <div className="space-y-3">
                {checkoutData.products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                    <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-fill"
              />
              </div>
                  </div>
                ))}
              </div>

              <hr className="border-gray-200" />

              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  ${checkoutData.subtotal ? checkoutData.subtotal.toFixed(2) : (checkoutData.total / 1.1).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium text-gray-900">
                  ${checkoutData.tax ? checkoutData.tax.toFixed(2) : (checkoutData.total * 0.1).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-gray-900">
                  {checkoutData.shipping !== undefined
                    ? (checkoutData.shipping === 0 ? 'Free' : `$${checkoutData.shipping.toFixed(2)}`)
                    : '$0.00'
                  }
                </span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span>${checkoutData.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              className="w-full bg-black text-white py-3 px-6 rounded-md font-medium hover:bg-gray-800 transition-colors duration-200"
            >
              Complete Payment
            </button>

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-green-800">
                  Your payment is secured with 256-bit SSL encryption
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
