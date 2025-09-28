import hre from "hardhat";
import { SignatureTransfer } from "@uniswap/permit2-sdk";

// Network configurations
const NETWORKS = {
  sepolia: {
    name: "sepolia",
    rpcUrl: process.env.RPC_URL_SEPOLIA || "https://eth-sepolia.public.blastapi.io",
    settlementEngine: "0x85DCa9A8E3CaD2601a64B6C43ED945E9bc0a31c5",
    factory: "0x6C44835ae63566c49Ed27CD1DB8cCE529fa9671A",
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    mockToken: "0x4e3E4E8FC04ba2B6A0cCaDA9fA478E42a7482945",
    chainId: 11155111
  },
  monad: {
    name: "monad",
    rpcUrl: process.env.RPC_URL_MONAD || "https://monad-testnet.drpc.org",
    settlementEngine: "0x68fA6aD3B9b3cd85063663d78ae58ee3c3128C90",
    factory: "0x4000d874b8D77e77538682E32106C54C26987dA5",
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    mockToken: "0x85f754abfD3b82158E2925f877f0b201187d3a3c", // Assuming same address
    chainId: 10143
  }
};

// Account configurations
const USER_PRIVATE_KEY = "e2cc5c01b445ec7c73069227f26b65f6c3019ad95000f0f10426a2369ef147dc";
const RESOLVER_PRIVATE_KEY = process.env.PRIVATE_KEY || "b0229ffd508019fd81073fb87755815090ff0cdba1343e61cc5d63ca47f2da90";

async function createPermitSignature(
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

  const permitData = hre.ethers.AbiCoder.defaultAbiCoder().encode(
    [
      "tuple(tuple(address token, uint256 amount) permitted, uint256 nonce, uint256 deadline)",
      "bytes"
    ],
    [permit, signature]
  );

  return { permitData, permit };
}

async function createEscrowOnNetwork(
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
  const provider = new hre.ethers.JsonRpcProvider(networkConfig.rpcUrl);
  const signer = new hre.ethers.Wallet(signerPrivateKey, provider);
  
  console.log(`  Signer address: ${signer.address}`);
  
  // Get contract instance
  const settlementEngine = new hre.ethers.Contract(
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

async function settleEscrow(
  networkConfig: any,
  orderHash: string,
  secret: string,
  signerPrivateKey: string
) {
  console.log(`\n🔓 Settling escrow on ${networkConfig.name}...`);
  
  const provider = new hre.ethers.JsonRpcProvider(networkConfig.rpcUrl);
  const signer = new hre.ethers.Wallet(signerPrivateKey, provider);
  
  const settlementEngine = new hre.ethers.Contract(
    networkConfig.settlementEngine,
    [
      "function settle(bytes32 orderHash, bytes32 secret) external"
    ],
    signer
  );

  try {
    const tx = await settlementEngine.settle(orderHash, secret);
    console.log(`  Settlement transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`  ✅ Escrow settled successfully on ${networkConfig.name}!`);
    console.log(`  Gas used: ${receipt?.gasUsed?.toString()}`);
  } catch (error) {
    console.error(`❌ Error settling escrow on ${networkConfig.name}:`, error);
    throw error;
  }
}

async function setupTokensAndApprovals(
  networkConfig: any,
  userAddress: string,
  resolverAddress: string,
  amount: bigint,
  signerPrivateKey: string
) {
  console.log(`\n🪙 Setting up tokens on ${networkConfig.name}...`);
  
  const provider = new hre.ethers.JsonRpcProvider(networkConfig.rpcUrl);
  const signer = new hre.ethers.Wallet(signerPrivateKey, provider);
  
  const token = new hre.ethers.Contract(
    networkConfig.mockToken,
    [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function approve(address spender, uint256 amount) returns (bool)",
      "function balanceOf(address account) view returns (uint256)",
      "function allowance(address owner, address spender) view returns (uint256)",
      "function mint(address to, uint256 amount) external"
    ],
    signer
  );

  // Mint tokens to user if needed
  try {
    await token.mint(userAddress, amount * 2n); // Mint extra for safety
    console.log(`  Minted ${hre.ethers.formatEther(amount * 2n)} tokens to user`);
  } catch (error) {
    console.log(`  Token minting failed (might not be mintable): ${error}`);
  }

  // Check balances
  const userBalance = await token.balanceOf(userAddress);
  console.log(`  User balance: ${hre.ethers.formatEther(userBalance)} tokens`);

  // Approve Permit2 to spend user's tokens (needed for permit signatures to work)
  try {
    const userSigner = new hre.ethers.Wallet(USER_PRIVATE_KEY, new hre.ethers.JsonRpcProvider(networkConfig.rpcUrl));
    const userToken = new hre.ethers.Contract(
      networkConfig.mockToken,
      [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function balanceOf(address account) view returns (uint256)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function mint(address to, uint256 amount) external"
      ],
      userSigner
    );
    const currentAllowance = await userToken.allowance(userAddress, networkConfig.permit2);
    
    if (currentAllowance < amount) {
      console.log(`  Approving Permit2 to spend user's tokens...`);
      const approveTx = await userToken.approve(networkConfig.permit2, hre.ethers.MaxUint256);
      await approveTx.wait();
      console.log(`  ✅ Permit2 approved for user's tokens`);
    } else {
      console.log(`  ✅ Permit2 already approved for user's tokens`);
    }
  } catch (error) {
    console.log(`  Warning: Could not approve Permit2 for user: ${error}`);
  }

  // Approve Permit2 to spend resolver's tokens (needed for permit signatures to work)
  try {
    const resolverSigner = new hre.ethers.Wallet(RESOLVER_PRIVATE_KEY, new hre.ethers.JsonRpcProvider(networkConfig.rpcUrl));
    const resolverToken = new hre.ethers.Contract(
      networkConfig.mockToken,
      [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function balanceOf(address account) view returns (uint256)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function mint(address to, uint256 amount) external"
      ],
      resolverSigner
    );
    const currentAllowance = await resolverToken.allowance(resolverAddress, networkConfig.permit2);
    
    if (currentAllowance < amount) {
      console.log(`  Approving Permit2 to spend resolver's tokens...`);
      const approveTx = await resolverToken.approve(networkConfig.permit2, hre.ethers.MaxUint256);
      await approveTx.wait();
      console.log(`  ✅ Permit2 approved for resolver's tokens`);
    } else {
      console.log(`  ✅ Permit2 already approved for resolver's tokens`);
    }
  } catch (error) {
    console.log(`  Warning: Could not approve Permit2 for resolver: ${error}`);
  }
}

async function main() {
  console.log("🚀 Starting Cross-Chain HTLC Escrow Creation...");

  // Create wallets
  const userProvider = new hre.ethers.JsonRpcProvider(NETWORKS.sepolia.rpcUrl);
  const user = new hre.ethers.Wallet(USER_PRIVATE_KEY, userProvider);
  
  const resolverProvider = new hre.ethers.JsonRpcProvider(NETWORKS.sepolia.rpcUrl);
  const resolver = new hre.ethers.Wallet(RESOLVER_PRIVATE_KEY, resolverProvider);

  console.log("👥 Using accounts:");
  console.log("  User:", user.address);
  console.log("  Resolver:", resolver.address);

  // Escrow parameters
  const USER_ESCROW_AMOUNT = hre.ethers.parseEther("100"); // User's tokens on Sepolia
  const RESOLVER_ESCROW_AMOUNT = hre.ethers.parseEther("100"); // Resolver's tokens on Monad
  const SAFETY_DEPOSIT = hre.ethers.parseEther("0.001"); // Safety deposit
  
  // Generate secret and hash lock
  const SECRET = hre.ethers.randomBytes(32);
  const HASH_LOCK = hre.ethers.keccak256(
    hre.ethers.AbiCoder.defaultAbiCoder().encode(["bytes32"], [SECRET])
  );

  console.log("\n🔐 Secret and Hash Lock:");
  console.log("  Secret:", hre.ethers.hexlify(SECRET));
  console.log("  Hash Lock:", HASH_LOCK);

  // Time locks (current time, 1 hour from now, 1 day from now)
  const currentTime = Math.floor(Date.now() / 1000);
  const timeLocks: [bigint, bigint, bigint] = [
    BigInt(currentTime),
    BigInt(currentTime + 20), // 1 hour
    BigInt(currentTime + 100) // 1 day
  ];

  console.log("\n⏰ Time Locks:");
  console.log("  Deployed:", new Date(Number(timeLocks[0]) * 1000).toISOString());
  console.log("  Withdrawal:", new Date(Number(timeLocks[1]) * 1000).toISOString());
  console.log("  Cancellation:", new Date(Number(timeLocks[2]) * 1000).toISOString());

  // Create order hashes for both chains
  const sepoliaOrderHash = hre.ethers.keccak256(
    hre.ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "address", "address", "address", "address", "uint256", "uint256", "uint256", "uint256", "uint256"],
      [
        HASH_LOCK,
        NETWORKS.sepolia.mockToken,
        user.address,
        resolver.address, // resolver is taker on Sepolia
        resolver.address, // resolver is also resolver
        USER_ESCROW_AMOUNT,
        SAFETY_DEPOSIT,
        timeLocks[0],
        timeLocks[1],
        timeLocks[2]
      ]
    )
  );

  const monadOrderHash = hre.ethers.keccak256(
    hre.ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "address", "address", "address", "address", "uint256", "uint256", "uint256", "uint256", "uint256"],
      [
        HASH_LOCK,
        NETWORKS.monad.mockToken,
        resolver.address, // resolver is maker on Monad
        user.address, // user is taker on Monad
        resolver.address, // resolver is resolver
        RESOLVER_ESCROW_AMOUNT,
        SAFETY_DEPOSIT,
        timeLocks[0],
        timeLocks[1],
        timeLocks[2]
      ]
    )
  );

  console.log("\n📝 Order Hashes:");
  console.log("  Sepolia Order Hash:", sepoliaOrderHash);
  console.log("  Monad Order Hash:", monadOrderHash);

  // Setup tokens on both networks
  await setupTokensAndApprovals(
    NETWORKS.sepolia,
    user.address,
    resolver.address,
    USER_ESCROW_AMOUNT,
    RESOLVER_PRIVATE_KEY // Use resolver's key to mint tokens
  );

  await setupTokensAndApprovals(
    NETWORKS.monad,
    user.address,
    resolver.address,
    RESOLVER_ESCROW_AMOUNT,
    RESOLVER_PRIVATE_KEY // Use resolver's key to mint tokens
  );

  // Step 1: User creates permit signature for Sepolia escrow
  console.log("\n🔐 Creating user's permit signature for Sepolia...");
  const userPermit = await createPermitSignature(
    user,
    NETWORKS.sepolia.mockToken,
    USER_ESCROW_AMOUNT,
    NETWORKS.sepolia.settlementEngine,
    NETWORKS.sepolia.permit2,
    NETWORKS.sepolia.chainId
  );

  // Step 2: Create escrow on Sepolia (user's tokens)
  const sepoliaEscrowAddress = await createEscrowOnNetwork(
    NETWORKS.sepolia,
    sepoliaOrderHash,
    HASH_LOCK,
    NETWORKS.sepolia.mockToken,
    user.address,
    resolver.address,
    resolver.address,
    USER_ESCROW_AMOUNT,
    SAFETY_DEPOSIT,
    timeLocks,
    userPermit.permitData,
    USER_PRIVATE_KEY
  );

  // Step 3: Resolver creates permit signature for Monad escrow
  console.log("\n🔐 Creating resolver's permit signature for Monad...");
  const resolverPermit = await createPermitSignature(
    new hre.ethers.Wallet(RESOLVER_PRIVATE_KEY, new hre.ethers.JsonRpcProvider(NETWORKS.monad.rpcUrl)),
    NETWORKS.monad.mockToken,
    RESOLVER_ESCROW_AMOUNT,
    NETWORKS.monad.settlementEngine,
    NETWORKS.monad.permit2,
    NETWORKS.monad.chainId
  );

  // Step 4: Create escrow on Monad (resolver's tokens)
  const monadEscrowAddress = await createEscrowOnNetwork(
    NETWORKS.monad,
    monadOrderHash,
    HASH_LOCK,
    NETWORKS.monad.mockToken,
    resolver.address,
    user.address,
    resolver.address,
    RESOLVER_ESCROW_AMOUNT,
    SAFETY_DEPOSIT,
    timeLocks,
    resolverPermit.permitData,
    RESOLVER_PRIVATE_KEY
  );

  console.log("\n🎉 Both escrows created successfully!");
  console.log("\n📋 Summary:");
  console.log("  Sepolia Escrow Address:", sepoliaEscrowAddress);
  console.log("  Monad Escrow Address:", monadEscrowAddress);
  console.log("  Secret (for settlement):", hre.ethers.hexlify(SECRET));

  // Wait for user input to simulate user giving secret to resolver
  console.log("\n⏳ Waiting for withdrawal time...");
  console.log("💡 In a real scenario, user would give the secret to resolver now");
  
  // Wait until withdrawal time
  const waitTime = Number(timeLocks[1]) * 1000 - Date.now();
  if (waitTime > 0) {
    console.log(`  Waiting ${Math.ceil(waitTime / 1000)} seconds until withdrawal time...`);
    await new Promise(resolve => setTimeout(resolve, waitTime + 1000)); // Wait a bit extra
  }

  // Step 5: Resolver settles his escrow first (on Monad)
  console.log("\n🔓 Phase 1: Resolver settling his escrow on Monad...");
  await settleEscrow(NETWORKS.monad, monadOrderHash, hre.ethers.hexlify(SECRET), RESOLVER_PRIVATE_KEY);

  // Step 6: Resolver settles user's escrow (on Sepolia)
  console.log("\n🔓 Phase 2: Resolver settling user's escrow on Sepolia...");
  await settleEscrow(NETWORKS.sepolia, sepoliaOrderHash, hre.ethers.hexlify(SECRET), RESOLVER_PRIVATE_KEY);

  console.log("\n✨ Cross-chain atomic swap completed successfully!");
  console.log("\n📊 Final Summary:");
  console.log("  ✅ User's tokens on Sepolia → Resolver");
  console.log("  ✅ Resolver's tokens on Monad → User");
  console.log("  🔐 Secret revealed:", hre.ethers.hexlify(SECRET));
  console.log("  🌐 Both escrows settled by resolver");
}

// Handle errors and run the script
main()
  .then(() => {
    console.log("\n🎊 Cross-chain escrow script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
