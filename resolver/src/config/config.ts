// Network configurations

export const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

export const NETWORKS = {
    sepolia: {
      name: "sepolia",
      rpcUrl: process.env.RPC_URL_SEPOLIA || "https://eth-sepolia.public.blastapi.io",
      settlementEngine: "0x85DCa9A8E3CaD2601a64B6C43ED945E9bc0a31c5",
      factory: "0x6C44835ae63566c49Ed27CD1DB8cCE529fa9671A",
      permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
      mockToken: "0x4e3E4E8FC04ba2B6A0cCaDA9fA478E42a7482945",
      resolver: "0x85DCa9A8E3CaD2601a64B6C43ED945E9bc0a31c5",
      chainId: 11155111
    },
    monad: {
      name: "monad",
      rpcUrl: process.env.RPC_URL_MONAD || "https://monad-testnet.drpc.org",
      settlementEngine: "0x68fA6aD3B9b3cd85063663d78ae58ee3c3128C90",
      factory: "0x4000d874b8D77e77538682E32106C54C26987dA5",
      permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
      mockToken: "0x85f754abfD3b82158E2925f877f0b201187d3a3c", // Assuming same address
      resolver: "0x68fA6aD3B9b3cd85063663d78ae58ee3c3128C90",
      chainId: 10143
    }
};