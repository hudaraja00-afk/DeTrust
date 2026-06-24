# DeTrust - Setup Guide

Complete guide to set up the DeTrust development environment.

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20+ | JavaScript runtime |
| pnpm | 9+ | Package manager |
| Docker | 24+ | Container runtime |
| Python | 3.11+ | AI service |
| Git | 2.40+ | Version control |

### Optional

| Software | Purpose |
|----------|---------|
| VS Code | Recommended IDE |
| Postman | API testing |
| MetaMask | Wallet for testing |

---

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/your-org/detrust.git
cd detrust
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

### 3. Environment Setup

```bash
# Copy environment files
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
cp apps/ai-service/.env.example apps/ai-service/.env
cp packages/contracts/.env.example packages/contracts/.env
```

#### WalletConnect Cloud (RainbowKit)

RainbowKit requires a WalletConnect Cloud project ID to initialize the MetaMask / WalletConnect modal.

1. Visit [https://cloud.walletconnect.com](https://cloud.walletconnect.com) and create a free account.
2. Create a **New Project** (choose "Web" platform) and copy the generated **Project ID**.
3. Open `apps/web/.env.local` and set:

  ```bash
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
  ```

4. Restart the Next.js dev server so the new ID is picked up.

Without this value, wallet connect buttons remain disabled and the app will surface a warning banner in the auth flows.

### 4. Start Infrastructure

Bring up PostgreSQL and Redis together via Docker (no local installations required):

```bash
# Starts postgres (exposed on localhost:5435) and redis
docker-compose up -d postgres redis

# Verify containers are healthy
docker-compose ps
```


The PostgreSQL container is provisioned with:

| Variable | Value |
|----------|-------|
| Host | `localhost` |
| Port | `5435` |
| User | `detrust` |
| Password | `detrust_dev_password` |
| Database | `detrust` |

Update `DATABASE_URL` if you prefer different credentials.

### 5. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# (Optional) Seed with test data
pnpm db:seed

# (Optional) Open Prisma Studio
pnpm db:studio
```

### 6. Smart Contracts Setup

```bash
# Compile contracts
pnpm contracts:compile

# Start local Hardhat node (Terminal 1)
cd packages/contracts
pnpm node

# Deploy contracts (Terminal 2)
pnpm contracts:deploy:local
```

After deployment, update your `.env` files with the contract addresses from `packages/contracts/deployments/latest.json`.

### 7. AI Service Setup (Optional)

```bash
cd apps/ai-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start AI service
uvicorn app.main:app --reload --port 8000
```

### 8. Start Development Servers

```bash
# From project root, start all apps
pnpm dev
```

> Note: the web app currently runs via `webpack` in development and production builds.
> This avoids a known `wagmi` + `RainbowKit` + React Query context issue seen with Turbopack in this repository.

Or start individually:

```bash
# Terminal 1: Backend API
cd apps/api && pnpm dev

# Terminal 2: Frontend
cd apps/web && pnpm dev



```

---

## Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | <http://localhost:3000> | Next.js web app |
| Backend API | <http://localhost:4000> | Express REST API |
| AI Service | <http://localhost:8000> | FastAPI service |
| API Docs | <http://localhost:8000/docs> | FastAPI Swagger |
| Prisma Studio | <http://localhost:5555> | Database browser |
| pgAdmin (optional) | <http://localhost:5050> | Use if you install pgAdmin locally |
| Hardhat Node | <http://localhost:8545> | Local blockchain |

---

## Verification

### Test API Health

```bash
curl http://localhost:4000/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Test AI Service

```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy","service":"ai-service"}
```

### Test Database Connection

```bash
pnpm db:studio
# Opens Prisma Studio in browser
```

### Test Smart Contracts

```bash
cd packages/contracts
pnpm test
```

---

## Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :3000
# Kill process
kill -9 <PID>
```

### React Query / RainbowKit runtime error

If you see `No QueryClient set, use QueryClientProvider to set one`, do a full dev reset:

```bash
pkill -f "ts-node.*server.ts" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "nodemon" 2>/dev/null
pkill -f "turbo" 2>/dev/null
rm -rf apps/web/.next
pnpm dev
```

If a browser tab still shows the old overlay, open a fresh tab or hard-refresh after the restart.

### Docker (Redis) Issues

```bash
# Restart Redis container
docker-compose down
docker-compose up -d

# View Redis logs
docker-compose logs -f redis
```

### Prisma Issues

```bash
# Reset database
pnpm db:push --force-reset

# Regenerate client
pnpm db:generate
```

### Node Modules Issues

```bash
# Clean and reinstall
pnpm clean
rm -rf node_modules
pnpm install
```

---

## IDE Setup (VS Code)

### Recommended Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-python.python",
    "juanblanco.solidity"
  ]
}
```

### Workspace Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  },
  "[solidity]": {
    "editor.defaultFormatter": "JuanBlanco.solidity"
  }
}
```

---

## Next Steps

1. [API Documentation](API.md) - Learn about available endpoints
2. [Architecture](architecture/README.md) - Understand system design
3. [Smart Contracts](contracts/README.md) - Learn about blockchain integration
