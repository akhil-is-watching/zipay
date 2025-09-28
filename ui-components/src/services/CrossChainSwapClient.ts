import { ethers } from 'ethers';

const API_BASE_URL = 'http://localhost:3000/api';

interface SwapParams {
  fromChain: 'sepolia' | 'monad';
  toChain: 'sepolia' | 'monad';
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  userAddress: string;
  receiverAddress: string;
  hashLock: string; // User provides this
}

export class CrossChainSwapClient {
  private apiUrl: string;

  constructor(apiUrl: string = API_BASE_URL) {
    this.apiUrl = apiUrl;
  }

  // Generate secret and hash lock on client side
  static generateSecretAndHashLock() {
    const secret = ethers.randomBytes(32);
    const hashLock = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(["bytes32"], [secret])
    );
    
    return {
      secret: ethers.hexlify(secret),
      hashLock
    };
  }

  async initiateSwap(params: SwapParams) {
    // Prepare the request body for your resolver endpoint
    const requestBody = {
      fromChain: params.fromChain,
      toChain: params.toChain,
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAmount: params.fromAmount,
      toAmount: params.toAmount,
      userAddress: params.userAddress,
      receiverAddress: params.receiverAddress,
      hashLock: params.hashLock,
      // Add additional fields that your resolver expects
      deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour deadline
      slippage: 100, // 1% slippage in basis points
    };

    console.log('🚀 Initiating swap with request:', requestBody);

    const response = await fetch(`${this.apiUrl}/resolver/swap/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Swap initiation failed:', errorText);
      throw new Error(`Failed to initiate swap: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Swap initiated successfully:', result);
    return result;
  }

  async executeSwap(swapId: string, userSignature: string) {
    // Prepare the request body for your resolver's execute endpoint
    const requestBody = {
      orderId: swapId, // Your resolver uses 'orderId' instead of 'swapId'
      signature: userSignature,
    };

    console.log('⚡ Executing swap with request:', requestBody);

    const response = await fetch(`${this.apiUrl}/resolver/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Swap execution failed:', errorText);
      throw new Error(`Payment is processing`);
    }

    const result = await response.json();
    console.log('✅ Swap executed successfully:', result);
    return result;
  }

  async settleSwap(swapId: string, secret: string) {
    // Prepare the request body for your resolver's secret endpoint
    const requestBody = {
      orderId: swapId, // Your resolver uses 'orderId'
      secret: secret,
    };

    console.log('🔓 Settling swap with secret for order:', swapId);

    const response = await fetch(`${this.apiUrl}/resolver/secret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Swap settlement failed:', errorText);
      throw new Error(`Failed to settle swap: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Swap settled successfully:', result);
    return result;
  }

  async getSwapStatus(swapId: string) {
    const response = await fetch(`${this.apiUrl}/swap/${swapId}/status`);

    if (!response.ok) {
      throw new Error(`Failed to get swap status: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Example usage with proper secret management
export async function performSecureSwap() {
  const swapClient = new CrossChainSwapClient();
  
  // Step 1: User generates secret and keeps it private
  console.log('🔐 Generating secret (kept private by user)...');
  const { secret, hashLock } = CrossChainSwapClient.generateSecretAndHashLock();
  console.log('Hash Lock:', hashLock);
  console.log('Secret (KEEP PRIVATE):', secret);

  // Step 2: Initiate swap with hash lock only
  console.log('🚀 Initiating cross-chain swap...');
  const swapResponse = await swapClient.initiateSwap({
    fromChain: 'sepolia',
    toChain: 'monad',
    fromToken: '0x4e3E4E8FC04ba2B6A0cCaDA9fA478E42a7482945',
    toToken: '0x85f754abfD3b82158E2925f877f0b201187d3a3c',
    fromAmount: '100',
    toAmount: '100',
    userAddress: '0x742d35Cc6634C0532925a3b8D7389C2C1234567',
    receiverAddress: '0x742d35Cc6634C0532925a3b8D7389C2C1234567',
    hashLock, // Only hash lock is shared
  });

  console.log('📝 Swap initiated:', swapResponse);

  // Step 3: User signs permit (in real app, this would use wallet)
  // const signer = new ethers.Wallet(userPrivateKey, provider);
  // const signature = await signer.signTypedData(
  //   swapResponse.permitSignature.domain,
  //   swapResponse.permitSignature.types,
  //   swapResponse.permitSignature.values
  // );

  const mockSignature = '0x...'; // Mock signature for demo

  // Step 4: Execute swap (creates escrows)
  console.log('⚡ Executing swap...');
  const executionResult = await swapClient.executeSwap(swapResponse.swapId, mockSignature);
  console.log('🏗️  Escrows created:', executionResult);

  // Step 5: Monitor status - should be 'awaiting_secret'
  let status = await swapClient.getSwapStatus(swapResponse.swapId);
  console.log('📊 Status:', status);

  if (status.status === 'awaiting_secret') {
    console.log('⏳ Escrows created, waiting for user to reveal secret...');
    
    // Step 6: User decides to settle by revealing secret
    console.log('🔓 User revealing secret to settle swap...');
    const settlementResult = await swapClient.settleSwap(swapResponse.swapId, secret);
    console.log('✅ Swap settled:', settlementResult);
  }

  // Final status check
  status = await swapClient.getSwapStatus(swapResponse.swapId);
  console.log('🎉 Final status:', status);
}

export type { SwapParams };
