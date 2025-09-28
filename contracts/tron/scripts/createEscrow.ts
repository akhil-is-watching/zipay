import hre from "hardhat";
import { SignatureTransfer } from "@uniswap/permit2-sdk";




async function main() {
  console.log("🚀 Creating HTLC Escrow...");

  const makerPrivateKey = "befd3d4bc40dda792cc34b98abe5b5d0a1d1986097af0c5e6bac3cdc67164405"
  const maker = new hre.ethers.Wallet(makerPrivateKey, hre.ethers.provider);



  // Get signers
  const [resolver] = await hre.ethers.getSigners();
  const taker = resolver;
  console.log("👥 Using accounts:");
  console.log("  Deployer:", resolver.address);
  console.log("  Maker:", maker.address);
  console.log("  Taker:", taker.address);
  console.log("  Resolver:", resolver.address);

  // Contract addresses from deployment
  const SETTLEMENT_ENGINE_ADDRESS = "0x85DCa9A8E3CaD2601a64B6C43ED945E9bc0a31c5";
  const FACTORY_ADDRESS = "0x6C44835ae63566c49Ed27CD1DB8cCE529fa9671A";
  const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

  // Escrow parameters
  const ESCROW_AMOUNT = hre.ethers.parseEther("100"); // 100 tokens
  const SAFETY_DEPOSIT = hre.ethers.parseEther("0.0001"); // 0.1 ETH
  const SECRET = hre.ethers.randomBytes(32);
  console.log("  Secret:", SECRET.toString());
  const HASH_LOCK = hre.ethers.keccak256(
    hre.ethers.AbiCoder.defaultAbiCoder().encode(["bytes32"], [SECRET])
  );

  // Time locks (current time, 1 hour from now, 1 day from now)
  const currentTime = Math.floor(Date.now() / 1000);
  const timeLocks: [bigint, bigint, bigint] = [
    BigInt(currentTime),
    BigInt(currentTime + 3600), // 1 hour
    BigInt(currentTime + 86400) // 1 day
  ];

  console.log("\n📋 Escrow Parameters:");
  console.log("  Amount:", hre.ethers.formatEther(ESCROW_AMOUNT), "tokens");
  console.log("  Safety Deposit:", hre.ethers.formatEther(SAFETY_DEPOSIT), "ETH");
  console.log("  Hash Lock:", HASH_LOCK);
  console.log("  Time Locks:", {
    deployed: new Date(Number(timeLocks[0]) * 1000).toISOString(),
    withdrawal: new Date(Number(timeLocks[1]) * 1000).toISOString(),
    cancellation: new Date(Number(timeLocks[2]) * 1000).toISOString()
  });

  // Deploy a test token for demonstration
  console.log("\n🪙 Deploying test token...");
  const token = await hre.ethers.getContractAt("MockERC20", "0x4e3E4E8FC04ba2B6A0cCaDA9fA478E42a7482945");
  const tokenAddress = await token.getAddress();
  console.log("  Token deployed at:", tokenAddress);

  // Transfer tokens to maker
  console.log("\n💸 Setting up maker with tokens...");
  await token.transfer(maker.address, ESCROW_AMOUNT); // Give extra for safety
  console.log("  Transferred", hre.ethers.formatEther(ESCROW_AMOUNT), "tokens to maker");

  // Maker approves Permit2 to spend tokens
  console.log("\n✅ Approving Permit2...");
  await token.connect(maker).approve(PERMIT2_ADDRESS, ESCROW_AMOUNT);
  console.log("  Approved Permit2 to spend", hre.ethers.formatEther(ESCROW_AMOUNT), "tokens");

  // Get contract instances
  const settlementEngine = await hre.ethers.getContractAt("SettlementEngine", SETTLEMENT_ENGINE_ADDRESS);

  // Create order hash
  const orderHash = hre.ethers.keccak256(
    hre.ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "address", "address", "address", "address", "uint256", "uint256", "uint256", "uint256", "uint256"],
      [
        HASH_LOCK,
        tokenAddress,
        maker.address,
        taker.address,
        resolver.address,
        ESCROW_AMOUNT,
        SAFETY_DEPOSIT,
        timeLocks[0],
        timeLocks[1],
        timeLocks[2]
      ]
    )
  );

  console.log("\n📝 Order Hash:", orderHash);

  // Get predicted escrow address
  const predictedEscrowAddress = await settlementEngine.getEscrow(orderHash);
  console.log("📍 Predicted Escrow Address:", predictedEscrowAddress);

  // Create Permit2 signature
  console.log("\n🔐 Creating Permit2 signature...");
  const chainId = await hre.ethers.provider.getNetwork().then(n => Number(n.chainId));
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

  // Create permit data using the SDK
  const permit = {
    permitted: {
      token: tokenAddress,
      amount: ESCROW_AMOUNT.toString(),
    },
    spender: SETTLEMENT_ENGINE_ADDRESS,
    nonce: 876787,
    deadline,
  };

  // Get the domain and types from the SDK
  const { domain, types, values } = SignatureTransfer.getPermitData(permit, PERMIT2_ADDRESS, chainId);

  // Sign the typed data
  const signature = await maker.signTypedData(
    {
      name: domain.name,
      version: domain.version,
      chainId: Number(domain.chainId),
      verifyingContract: domain.verifyingContract,
    },
    types,
    values
  );

  // Encode the permit data for the contract
  const permitData = hre.ethers.AbiCoder.defaultAbiCoder().encode(
    [
      "tuple(tuple(address token, uint256 amount) permitted, uint256 nonce, uint256 deadline)",
      "bytes"
    ],
    [permit, signature]
  );

  console.log("  Permit signature created successfully");

  // Create the escrow
  console.log("\n🏗️  Creating escrow...");
  try {
    const tx = await settlementEngine.connect(maker).createEscrow(
      orderHash,
      HASH_LOCK,
      tokenAddress,
      maker.address,
      taker,
      resolver.address,
      ESCROW_AMOUNT,
      SAFETY_DEPOSIT,
      timeLocks,
      permitData,
      { value: SAFETY_DEPOSIT }
    );

    console.log("  Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("  ✅ Escrow created successfully!");
    console.log("  Gas used:", receipt?.gasUsed?.toString());

    // Verify escrow creation
    const escrowExists = await settlementEngine.escrowExists(orderHash);
    console.log("  Escrow exists:", escrowExists);

    if (escrowExists) {
      const escrowAddress = await settlementEngine.getEscrow(orderHash);
      const escrowState = await settlementEngine.getEscrowState(orderHash);
      console.log("  Actual Escrow Address:", escrowAddress);
      console.log("  Escrow State:", escrowState); // 0 = ACTIVE

      // Get escrow contract and check details
      const escrow = await hre.ethers.getContractAt("HTLCEscrow", escrowAddress);
      const orderDetails = await escrow.getOrderDetails();
      
      console.log("\n📊 Escrow Details:");
      console.log("  Order Hash:", orderDetails.orderHash);
      console.log("  Token:", orderDetails.token);
      console.log("  Maker:", orderDetails.maker);
      console.log("  Taker:", orderDetails.taker);
      console.log("  Resolver:", orderDetails.resolver);
      console.log("  Amount:", hre.ethers.formatEther(orderDetails.amount), "tokens");
      console.log("  Safety Deposit:", hre.ethers.formatEther(orderDetails.safetyDeposit), "ETH");
      // Hash lock is part of the contract state, not returned in orderDetails
      console.log("  Hash Lock:", HASH_LOCK);
    }

    console.log("\n🎉 Escrow creation completed successfully!");
    console.log("\n📋 Summary:");
    console.log("  Order Hash:", orderHash);
    console.log("  Secret (for settlement):", SECRET);
    console.log("  Escrow Address:", await settlementEngine.getEscrow(orderHash));
    console.log("  Token Address:", tokenAddress);
    console.log("\n💡 Next steps:");
    console.log("  1. Wait until withdrawal time:", new Date(Number(timeLocks[1]) * 1000).toISOString());
    console.log("  2. Call settlementEngine.settle(orderHash, secret) to claim tokens");
    console.log("  3. Or wait until cancellation time and call settlementEngine.recover(orderHash) to refund");

  } catch (error) {
    console.error("❌ Error creating escrow:", error);
    throw error;
  }
}

// Handle errors and run the script
main()
  .then(() => {
    console.log("\n✨ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
