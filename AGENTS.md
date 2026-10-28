# Reversa — Agent Notes

## Contract

**ReversaEscrow.sol** — `/home/user/app/contracts/ReversaEscrow.sol`

Constructor args:
- `_usdc`: the USDC token address on the target chain
- `initialOwner`: the deployer/owner address

On Arc Testnet:
- USDC address: `0x3600000000000000000000000000000000000000`
- Chain ID: `5042002`

## Deployment

**Deployed on Arc mainnet.**

- Contract: `0xef2b1f0afe4e1a08e401264d63b0b2ab825f584b`
- Deploy tx: `0x288144dc9a135dd5cc84500989238567ccd636ab818e9fd88e76cadf50816473`
- Explorer: https://explorer.arc.io/address/0xef2b1f0afe4e1a08e401264d63b0b2ab825f584b
- Previous (deprecated): `0x6a666d2e2929f00efc817f0b411a2cc03f5c315b`
- Chain ID: `5042` (Arc mainnet)
- `VITE_REVERSA_CONTRACT_ADDRESS` is set in `.env`

---

Previous testnet instructions (for reference):

1. Download the project zip
2. Run `forge build` to compile
3. Deploy with:
   ```bash
   forge create contracts/ReversaEscrow.sol:ReversaEscrow \
     --rpc-url https://rpc.testnet.arc.io \
     --private-key $PRIVATE_KEY \
     --constructor-args 0x3600000000000000000000000000000000000000 <your-wallet-address>
   ```
   Or use Circle SCP / Arc Studio deploy_contract tool.
4. Copy the deployed address
5. Add to `.env`: `VITE_REVERSA_CONTRACT_ADDRESS=0x<deployed-address>`
6. Restart the dev server

## Frontend contract config

- `/home/user/app/src/lib/contract.ts` — ABI and address constants
- Set `VITE_REVERSA_CONTRACT_ADDRESS` in `.env` after deployment
- Until set, the app shows a "not yet deployed" notice in all dashboard/purchase flows

## Architecture

- `src/App.tsx` — Router + layout shell
- `src/pages/LandingPage.tsx` — Marketing homepage
- `src/pages/CoursesPage.tsx` — Marketplace + purchase modal
- `src/pages/DashboardPage.tsx` — Student purchase history + refund flow
- `src/pages/CreatorPage.tsx` — Creator course management + payment release
- `src/pages/HowItWorksPage.tsx` — Explainer with security details
- `src/components/Navbar.tsx` — Sticky navigation
- `src/components/Footer.tsx` — Footer
- `src/components/Logo.tsx` — SVG shield+arrow Reversa logo
- `src/components/TxSteps.tsx` — Transaction step progress indicator
- `src/lib/contract.ts` — ABI, addresses, constants
- `src/lib/utils.ts` — Formatting and error parsing helpers
