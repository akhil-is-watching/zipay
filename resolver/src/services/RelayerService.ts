import { ObjectId } from 'mongodb';
import { getQuotesCollection, getSecretsCollection } from '../lib/mongo';
import {
  ExecuteRequestParams,
  QuoteDocument,
  QuoteRequestParams,
  QuoteResponse,
} from '../types/quote';
import { PastSecret, SecretDocument, SecretRequestParams } from '../types/secret';
import { NETWORKS, PERMIT2 } from '../config/config';

import { ethers, version } from 'ethers';
import { SignatureTransfer } from '@uniswap/permit2-sdk';

export class RelayerService {
  getStatus() {
    return {
      message: 'Relayer operational',
    };
  }

  async requestQuote(params: QuoteRequestParams): Promise<QuoteResponse> {
    // Validate fromChain and toChain
    const validNetworks = Object.keys(NETWORKS);
    if (!validNetworks.includes(params.fromChain)) {
      throw new Error(`Invalid fromChain: ${params.fromChain}. Supported networks: ${validNetworks.join(', ')}`);
    }

    if (!validNetworks.includes(params.toChain)) {
      throw new Error(`Invalid toChain: ${params.toChain}. Supported networks: ${validNetworks.join(', ')}`);
    }

    // Validate hashlock size (should be 32 bytes = 64 hex characters + 0x prefix = 66 total)
    if (!params.hashLock || params.hashLock.length !== 66 || !params.hashLock.startsWith('0x')) {
      throw new Error('Invalid hashlock: must be 32 bytes (66 characters including 0x prefix)');
    }

  const deadline = Math.floor(Date.now() / 1000) + 3600;

  const permit = {
    permitted: {
      token: params.fromToken,
      amount: ethers.BigNumber.from(params.toChainAmount).add(ethers.utils.parseEther("0.8")),
    },
    spender: NETWORKS[params.fromChain as keyof typeof NETWORKS].settlementEngine,
    nonce: Math.floor(Math.random() * 1000000),
    deadline,
  };

  const { domain, types, values } = SignatureTransfer.getPermitData(permit, PERMIT2, NETWORKS[params.fromChain as keyof typeof NETWORKS].chainId);

    const quotes = await getQuotesCollection();
    const result = await quotes.insertOne({
      ...params,
      permit,
      fromTokenAmount: ethers.BigNumber.from(params.toChainAmount).add(ethers.utils.parseEther("0.8")).toString(),
      toTokenAmount: params.toChainAmount,
      createdAt: new Date(),
    });
    


    return { 
      id: result.insertedId.toString(),
      fromTokenAmount: ethers.BigNumber.from(params.toChainAmount).add(ethers.utils.parseEther("0.8")).toString(),
      message: {
        domain: {
          name: domain.name ||"",
          version: domain.version || "",
          chainId: Number(domain.chainId),
          verifyingContract: domain.verifyingContract || "",
        },
        types,
        values
      }
    };
  }

  async executeOrder({ orderId, signature }: ExecuteRequestParams): Promise<boolean> {

    const order = await (await getQuotesCollection()).findOne({ _id: new ObjectId(orderId) });

    if (!order) {
      throw new Error('Order not found');
    }

    const permit = {
      permitted: {
        token: order.permit.permitted.token,
        amount: order.permit.permitted.amount,
      },
      nonce: order.permit.nonce,
      deadline: order.permit.deadline,
    };

    const abiCoder = new ethers.utils.AbiCoder();
    const permitData = abiCoder.encode(
      [
        "tuple(tuple(address token, uint256 amount) permitted, uint256 nonce, uint256 deadline)",
        "bytes"
      ],
      [permit, signature]
    );

    const fromNetwork = NETWORKS[order.fromChain as keyof typeof NETWORKS];
    const toNetwork = NETWORKS[order.toChain as keyof typeof NETWORKS];
    const hashLock = order.hashLock;


    // Time locks (current time, 1 hour from now, 1 day from now)
    const currentTime = Math.floor(Date.now() / 1000);
    const timeLocks: [bigint, bigint, bigint] = [
      BigInt(currentTime),
      BigInt(currentTime + 20), // 1 hour
      BigInt(currentTime + 100) // 1 day
    ];  

    
      // Create order hashes for both chains
  const fromNetworkOrderHash = ethers.utils.keccak256(
    abiCoder.encode(
      ["bytes32", "address", "address", "address", "address", "uint256", "uint256", "uint256", "uint256", "uint256"],
      [
        hashLock,
        fromNetwork.mockToken,
        order.sender,
        fromNetwork.resolver, // resolver is taker on Sepolia
        fromNetwork.resolver, // resolver is also resolver
        BigInt(order.fromTokenAmount),
        ethers.utils.parseEther("0.0001"),
        timeLocks[0],
        timeLocks[1],
        timeLocks[2]
      ]
    )
  );

  const toNetworkOrderHash = ethers.utils.keccak256(
    abiCoder.encode(
      ["bytes32", "address", "address", "address", "address", "uint256", "uint256", "uint256", "uint256", "uint256"],
      [
        hashLock,
        toNetwork.mockToken,
        order.sender,
        order.receiver,
        toNetwork.resolver,
        ethers.BigNumber.from(order.toTokenAmount),
        ethers.utils.parseEther("0.0001"),
        timeLocks[0],
        timeLocks[1],
        timeLocks[2]
      ]
    )
  );

  const userPermit = {permitData, permit}
  // Step 2: Create escrow on Sepolia (user's tokens)
  const fromNetworkEscrowAddress = await this.createEscrowOnNetwork(
    fromNetwork,
    fromNetworkOrderHash,
    hashLock,
    NETWORKS.sepolia.mockToken,
    order.sender,
    fromNetwork.resolver,
    fromNetwork.resolver,
    BigInt(order.fromTokenAmount),
    BigInt(ethers.utils.parseEther("0.0001").toString()),
    timeLocks,
    userPermit.permitData,
    RESOLVER_PRIVATE_KEY
  );

  const resolverPermit = await this.createPermitSignature(
    new ethers.Wallet(RESOLVER_PRIVATE_KEY, new ethers.providers.JsonRpcProvider(toNetwork.rpcUrl)),
    order.toToken,
    BigInt(order.toTokenAmount),
    toNetwork.settlementEngine,
    toNetwork.permit2,
    toNetwork.chainId
  );

  const toNetworkEscrowAddress = await this.createEscrowOnNetwork(
    toNetwork,
    toNetworkOrderHash,
    hashLock,
    order.toToken,
    order.sender,
    order.receiver,
    toNetwork.resolver,
    BigInt(order.toTokenAmount),
    BigInt(ethers.utils.parseEther("0.0001").toString()),
    timeLocks,
    resolverPermit.permitData,
    RESOLVER_PRIVATE_KEY
  );

    return true;
  }

  async submitSecret({ secret, orderId }: SecretRequestParams): Promise<boolean> {
    const secrets = await getSecretsCollection();
    const quotes = await getQuotesCollection();
    const normalizedSecret = secret.trim();
    const normalizedOrderId = orderId.trim();

    if (!ObjectId.isValid(normalizedOrderId)) {
      throw new Error('Invalid order id');
    }

    const quoteObjectId = new ObjectId(normalizedOrderId);
    const quote = await quotes.findOne({ _id: quoteObjectId });

    if (!quote) {
      throw new Error('Order not found');
    }

    await secrets.insertOne({
      secret: normalizedSecret,
      quoteId: quoteObjectId,
      createdAt: new Date(),
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    return true;
  }

  async getSecretsOlderThan(minutes = 5): Promise<PastSecret[]> {
    const secrets = await getSecretsCollection();
    const threshold = new Date(Date.now() - minutes * 60 * 1000);
    type SecretWithQuote = Required<SecretDocument> & { quote: QuoteDocument };

    const records = await secrets
      .aggregate<SecretWithQuote>([
        { $match: { createdAt: { $lte: threshold } } },
        { $sort: { createdAt: 1 } },
        {
          $lookup: {
            from: 'quotes',
            localField: 'quoteId',
            foreignField: '_id',
            as: 'quote',
          },
        },
        { $unwind: '$quote' },
      ])
      .toArray();

    return records.map((record) => ({
      id: record._id.toHexString(),
      secret: record.secret,
      createdAt: record.createdAt,
      quote: {
        fromChain: record.quote.fromChain,
        toChain: record.quote.toChain,
        fromToken: record.quote.fromToken,
        toToken: record.quote.toToken,
        toChainAmount: record.quote.toChainAmount,
        sender: record.quote.sender,
        receiver: record.quote.receiver,
        hashLock: record.quote.hashLock,
      },
    }));
  }

  private async createPermitSignature(
    signer: any,
    tokenAddress: string,
    amount: bigint,
    spender: string,
    permit2Address: string,
    chainId: number,
    nonce: number = Math.floor(Math.random() * 1000000)
  ) {
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  
    const permit = {
      permitted: {
        token: tokenAddress,
        amount: amount.toString(),
      },
      spender,
      nonce,
      deadline,
    };
  
    const { domain, types, values } = SignatureTransfer.getPermitData(permit, permit2Address, chainId);
  
    
    const signature = await signer.signTypedData(
      {
        name: domain.name,
        version: domain.version,
        chainId: Number(domain.chainId),
        verifyingContract: domain.verifyingContract,
      },
      types,
      values
    );
  
    const abiCoder = new ethers.utils.AbiCoder();
    const permitData = abiCoder.encode(
      [
        "tuple(tuple(address token, uint256 amount) permitted, uint256 nonce, uint256 deadline)",
        "bytes"
      ],
      [permit, signature]
    );
  
    return { permitData, permit };
  }
  
  private async createEscrowOnNetwork(
    networkConfig: any,
    orderHash: string,
    hashLock: string,
    tokenAddress: string,
    maker: string,
    taker: string,
    resolver: string,
    amount: bigint,
    safetyDeposit: bigint,
    timeLocks: [bigint, bigint, bigint],
    permitData: string,
    signerPrivateKey: string
  ) {
    console.log(`\n🌐 Connecting to ${networkConfig.name}...`);
    
    // Create provider and signer for this network
    const provider = new ethers.providers.JsonRpcProvider(networkConfig.rpcUrl);
    const signer = new ethers.Wallet(signerPrivateKey, provider);
    
    console.log(`  Signer address: ${signer.address}`);
    
    // Get contract instance
    const settlementEngine = new ethers.Contract(
      networkConfig.settlementEngine,
      [
        "function createEscrow(bytes32 orderHash, bytes32 hashLock, address token, address maker, address taker, address resolver, uint256 amount, uint256 safetyDeposit, uint256[3] timeLocks, bytes permitData) payable returns (address)",
        "function escrowExists(bytes32 orderHash) view returns (bool)",
        "function getEscrow(bytes32 orderHash) view returns (address)",
        "function getEscrowState(bytes32 orderHash) view returns (uint8)"
      ],
      signer
    );
  
    console.log(`\n🏗️  Creating escrow on ${networkConfig.name}...`);
    try {
      const tx = await settlementEngine.createEscrow(
        orderHash,
        hashLock,
        tokenAddress,
        maker,
        taker,
        resolver,
        amount,
        safetyDeposit,
        timeLocks,
        permitData,
        { value: safetyDeposit }
      );
  
      console.log(`  Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`  ✅ Escrow created successfully on ${networkConfig.name}!`);
      console.log(`  Gas used: ${receipt?.gasUsed?.toString()}`);
  
      // Verify escrow creation
      const escrowExists = await settlementEngine.escrowExists(orderHash);
      const escrowAddress = await settlementEngine.getEscrow(orderHash);
      console.log(`  Escrow exists: ${escrowExists}`);
      console.log(`  Escrow address: ${escrowAddress}`);
  
      return escrowAddress;
    } catch (error) {
      console.error(`❌ Error creating escrow on ${networkConfig.name}:`, error);
      throw error;
    }
  }

}
