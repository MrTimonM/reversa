/**
 * wagmi configuration
 * Built with Arc Studio — https://studio.arc.io
 */

import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { arcTestnet } from 'viem/chains'
import { injected } from 'wagmi/connectors'
import { registerChain } from './tracing'
import { requireChain } from './onchain-facts'

// Arc mainnet chain definition
const arcMainnetFact = requireChain(5042)
const arcMainnet = {
  id: 5042 as const,
  name: arcMainnetFact.name,
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: [arcMainnetFact.rpcUrls[0]] } },
  blockExplorers: { default: { name: 'Arc Explorer', url: arcMainnetFact.explorerBase } },
}

// Pre-register chain RPC URLs so trace events show correct chain names immediately
registerChain(arcTestnet.id, arcTestnet.rpcUrls.default.http[0])
registerChain(arcMainnet.id, arcMainnetFact.rpcUrls[0])

export const config = createConfig({
  chains: [arcMainnet, arcTestnet, mainnet],
  connectors: [injected()],
  transports: {
    [arcMainnet.id]: http(arcMainnetFact.rpcUrls[0]),
    [arcTestnet.id]: http(),
    [mainnet.id]: http(),
  },
})
