# ZiPay

Shopify for Web3: Pay any token, any chain. Gasless. Seamless. Limitless.

[Live Demo](https://zipay.online/)

## Overview

Imagine a payment gateway where merchants have full freedom to accept any token on any chain, and customers can pay however they want—any token, any chain. Behind the scenes, the payment is seamlessly converted and settled to the merchant’s chosen asset. No limits, no middlemen. Trustless by design, gasless for users, and focused on a smooth consumer experience.

This is not just another checkout—it’s the future of Web3 commerce, where payments adapt to you, not the other way around.

## How is it made

We built our Web3 payment gateway on top of HTLCs (Hashed Timelock Contracts) and the 1inch Cross-Chain Intent Resolver architecture. This allows us to trustlessly bridge assets between chains, ensuring users can pay in any token on any chain while merchants receive funds in the token of their choice.

The flow works like this:

- A user initiates payment in their preferred token/chain.

- The intent resolver uses 1inch Fusion+ to route and fulfill the swap, securing liquidity.

- HTLCs guarantee trustless execution across chains—funds are locked until conditions are met, eliminating counterparty risk.

- The merchant receives the exact token they selected, without worrying about what the customer paid with.

- This design gives us gasless UX for users, trustless settlement, and maximum flexibility for merchants. It’s built consumer-first, but battle-tested with DeFi infrastructure under the hood.

- Partnering with 1inch SDKs saved us from reinventing the liquidity layer, while the HTLC escrow model added cryptographic security. The combination means every transaction is transparent, unstoppable, and settlement-final across chains.

## How to run

1. Clone the repository:

```bash
git clone <repo_url>
cd <repo_directory>
```

2. Install dependencies:

```bash
make install
```

3. Set up environment variables in a `.env` files as needed.
4. Start the application:

```bash
make dev
```

## Documentation for using our SDK

[Docs](https://www.zipay.online/docs)

## 1inch Integration

1inch fusion+ cross chain intent resolvers used for bridging tokens trustless and with gasless UX

## Hedara Integration (Testnet)

HTLC Smart contract deployed and extended support of hedara chain to other chains using cross chain swap by 1inch fusion+

HTLCEscrow - `0xb9bA68e68fa0C4047FF071f6b899bB7AD70fC6c5`

HTLCEscrowFactory - `0xE752c74A642487d39EF28cACFCA71Ecfd52F09de`

SettlementEngine - `0xdd94a49AB18b2D673F3E671b5a2E461E52BC69A8`

## Flow Integration (Testnet)

HTLC Smart contract deployed and extended support of flow chain to other chains using cross chain swap by 1inch fusion+

HTLCEscrow - `0xE752c74A642487d39EF28cACFCA71Ecfd52F09de`

HTLCEscrowFactory - `0xdd94a49AB18b2D673F3E671b5a2E461E52BC69A8`

SettlementEngine - `0xB40DFb850f2CAd55875D223D407322C41EAd5e6d`
