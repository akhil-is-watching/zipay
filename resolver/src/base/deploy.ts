import { ethers } from "ethers";
import { BASE_RPC, baseResolverAddress } from "./config";

const provider = new ethers.JsonRpcProvider(BASE_RPC);

if (!process.env.ENV_PRIVATE_KEY) {
  throw new Error("ENV_PRIVATE_KEY environment variable is required");
}

const wallet = new ethers.Wallet(process.env.ENV_PRIVATE_KEY, provider);

interface DeployParams {
  srcImmutables: any;
  builtOrder: any;
  signature: string;
  fillAmount: any;
  trait: any;
  args: any;
}

export async function deployEscrowContract({
  srcImmutables,
  builtOrder,
  signature,
  fillAmount,
  trait,
  args,
}: DeployParams): Promise<string> {
  const resolverABI = require("../../abis/ResolverABI.json");

  const resolverContract = new ethers.Contract(
    baseResolverAddress,
    resolverABI,
    wallet
  );

  const tx = await resolverContract.deploySrc(
    srcImmutables,
    builtOrder,
    ethers.Signature.from(signature).r,
    ethers.Signature.from(signature).yParityAndS,
    fillAmount,
    trait,
    args,
    { value: BigInt(srcImmutables.safetyDeposit), gasLimit: 2000000 }
  );

  // Return the transaction hash
  return tx.hash;
}
