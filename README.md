# Reversa

A decentralized payment protection platform for online courses. Students purchase courses using USDC on Arc, while the ReversaEscrow smart contract enforces transparent refund deadlines and creator payouts — no support tickets, no gatekeepers.

> "A money-back guarantee you can actually trust."

Built with [Arc Studio](https://studio.arc.io)

## Tech stack

- React 18, TypeScript, Vite
- Tailwind CSS v4, Framer Motion, Lucide icons
- wagmi v2, viem, ConnectKit (wallet connection)
- Solidity 0.8.28, OpenZeppelin 5.6.1 (smart contract)
- Arc Testnet — USDC as native gas

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page — hero, features, how it works, FAQ |
| `/courses` | Course marketplace with USDC purchase flow |
| `/dashboard` | Student dashboard — purchases, refunds, countdowns |
| `/creator` | Creator dashboard — list courses, release payments |
| `/how-it-works` | Detailed explainer with security design notes |

## Smart contract

`contracts/ReversaEscrow.sol` — escrow contract that holds USDC between purchase and refund deadline. Key functions: `purchaseCourse`, `requestRefund`, `releasePayment`, `createCourse`.

## Prerequisites

- Node 18+ / Bun 1.x
- Foundry (`forge`, `cast`) for contract compilation

## Install

```bash
bun install
```

## Environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_REVERSA_CONTRACT_ADDRESS` | Deployed ReversaEscrow contract address (set after deploying) |
| `RPC_PROXY_BASE_URL` | Arc Studio RPC proxy (optional outside Arc Studio) |
| `RPC_PROXY_TOKEN` | Arc Studio RPC proxy token (optional outside Arc Studio) |
| `RPC_PROXY_CHAINS` | Comma-separated chain keys (optional outside Arc Studio) |

## Run

```bash
bun run dev
```

App runs at http://localhost:5173

## Build

```bash
bun run build
```

## Compile contract

```bash
bun run contracts:build
```

## Deploy contract (after building)

1. Compile: `bun run contracts:build`
2. Deploy to Arc Testnet:
   ```bash
   forge create contracts/ReversaEscrow.sol:ReversaEscrow \
     --rpc-url https://rpc.testnet.arc.io \
     --private-key $PRIVATE_KEY \
     --constructor-args 0x3600000000000000000000000000000000000000 <your-wallet-address>
   ```
3. Add the deployed address to `.env`:
   ```
   VITE_REVERSA_CONTRACT_ADDRESS=0x<address>
   ```
4. Restart the dev server

## What Reversa does

Students buy courses using USDC. Their payment enters the ReversaEscrow smart contract (not the creator, not the platform). During the refund window, students can request a full refund themselves — onchain, unconditionally. After the window expires with no refund, the creator releases their payment. All rules are enforced in Solidity with no admin override.
