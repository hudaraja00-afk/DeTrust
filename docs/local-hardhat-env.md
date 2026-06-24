# Local Hardhat Environment Checklist

Use this guide when running the full stack against the built-in Hardhat node (chain ID **31337**) with no mock data. Populate the following environment variables before starting the services.

## apps/web/.env.local

| Variable | Example | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | Points the frontend to the local API gateway. |
| `NEXT_PUBLIC_CHAIN_ID` | `31337` | Ensures wagmi/RainbowKit targets the Hardhat chain. |
| `NEXT_PUBLIC_RPC_URL` | `http://127.0.0.1:8545` | Direct JSON-RPC endpoint for wallet reads. |
| `NEXT_PUBLIC_ESCROW_ADDRESS` | `0x...` | Address from `packages/contracts/deployments/latest.json`. |
| `NEXT_PUBLIC_STABLE_TOKEN_ADDRESS` | `0x...` | Local dUSD token address from deployment JSON. |
| `NEXT_PUBLIC_REPUTATION_ADDRESS` | `0x...` | Same as above. |
| `NEXT_PUBLIC_DISPUTE_ADDRESS` | `0x...` | Same as above. |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | `<your_cloud_id>` | Enables RainbowKit connectors (MetaMask, WalletConnect). |
| `NEXT_PUBLIC_IPFS_GATEWAY` | `https://gateway.pinata.cloud/ipfs` | Used for profile assets / evidence. |
| `NEXT_PUBLIC_ENABLE_TESTNET` | `true` | Keeps testnet toggles visible. |
| `NEXT_PUBLIC_ENABLE_2FA` | `true` (optional) | Surfaces 2FA UI when testing auth. |

## apps/api/.env

| Variable | Example | Purpose |
|----------|---------|---------|
| `NODE_ENV` | `development` | Enables verbose logging + hot reload. |
| `PORT` | `4000` | API listen port. |
| `DATABASE_URL` | `postgresql://detrust:detrust_dev_password@localhost:5435/detrust?schema=public` | Matches docker-compose Postgres. |
| `REDIS_URL` | `redis://localhost:6379` | For BullMQ + caching. |
| `JWT_SECRET` | `change-me` | Required for email login session issuance. |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime. |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Refresh token lifetime. |
| `RPC_URL` | `http://127.0.0.1:8545` | Backend blockchain client (same Hardhat node). |
| `CHAIN_ID` | `31337` | Keeps signature verification consistent. |
| `ESCROW_ADDRESS` / `REPUTATION_ADDRESS` / `DISPUTE_ADDRESS` | `0x...` | Copy from latest deployment JSON. |
| `AI_SERVICE_URL` | `http://localhost:8000` | Optional, but required if capability scoring runs locally. |
| `PINATA_API_KEY` / `PINATA_SECRET_KEY` | *(optional in dev)* | Only needed for real IPFS uploads. |
| `SMTP_*` | From Mailtrap or other dev SMTP | Enables email/2FA testing. |
| `FRONTEND_URL` | `http://localhost:3000` | CORS + auth callbacks. |

## packages/contracts/.env

| Variable | Example | Purpose |
|----------|---------|---------|
| `PRIVATE_KEY` | Hardhat default key (`0xac09...f80`) | Unlocks deployment account #0. |
| `LOCALHOST_RPC_URL` | `http://127.0.0.1:8545` | Hardhat node endpoint for scripts. |
| `POLYGON*_RPC_URL` | *(optional)* | Only needed when targeting testnet/mainnet. |
| `POLYGONSCAN_API_KEY` / `ETHERSCAN_API_KEY` | *(optional in dev)* | For contract verification outside local. |

### How to propagate contract addresses
1. Start the Hardhat node: `cd packages/contracts && pnpm node`.
2. Deploy: `pnpm contracts:deploy:local` (writes `deployments/latest.json`).
3. Sync env files automatically: `pnpm contracts:sync-env:local`.
4. This command updates `apps/web/.env.local` and `apps/api/.env` with local `JobEscrow`, `DeTrustUSD`, `ReputationRegistry`, and `DisputeResolution` addresses.

### Minimal startup sequence
1. `docker-compose up -d postgres redis`
2. `pnpm db:generate && pnpm db:push`
3. `cd packages/contracts && pnpm node` (leave running)
4. In a new terminal: `pnpm contracts:deploy:local`
5. `pnpm contracts:sync-env:local`
6. `pnpm dev` (or start `apps/api` and `apps/web` separately)

With these values in place, MetaMask (configured to the “Localhost 8545” network) connects directly, wallet logins hit the SIWE endpoints, and dashboards can pull against live—non-mock—data.
