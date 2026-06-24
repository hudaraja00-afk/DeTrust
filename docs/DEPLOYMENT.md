# DeTrust - Deployment Guide

Guide for deploying DeTrust to production environments.

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCTION SETUP                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐                      ┌─────────────────────────────────┐  │
│   │   Vercel    │                      │         AWS / Railway           │  │
│   │  (Frontend) │                      │                                 │  │
│   │             │                      │  ┌─────────┐  ┌─────────────┐  │  │
│   │  apps/web   │───── API calls ────▶ │  │   API   │  │ AI Service  │  │  │
│   │             │                      │  │ (Node)  │  │  (Python)   │  │  │
│   └──────┬──────┘                      │  └────┬────┘  └──────┬──────┘  │  │
│          │                             │       │              │         │  │
│          │ RPC                         └───────┼──────────────┼─────────┘  │
│          │                                     │              │            │
│          ▼                                     ▼              ▼            │
│   ┌─────────────┐                      ┌─────────────────────────────────┐ │
│   │   Polygon   │                      │       Managed Services          │ │
│   │   Mainnet   │                      │                                 │ │
│   │             │                      │  ┌─────────┐  ┌─────────────┐  │ │
│   │  Contracts  │                      │  │Supabase │  │   Upstash   │  │ │
│   └─────────────┘                      │  │(Postgres│  │   (Redis)   │  │ │
│                                        │  └─────────┘  └─────────────┘  │ │
│                                        └─────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

1. **Accounts Required**:
   - Vercel account (frontend hosting)
   - Railway/Render account (backend hosting)
   - Supabase account (PostgreSQL)
   - Upstash account (Redis)
   - Pinata account (IPFS)
   - Alchemy/Infura account (blockchain RPC)
   - Polygonscan account (contract verification)

2. **Domain**: Custom domain configured

3. **Wallet**: Deployer wallet with MATIC for contract deployment

---

## Step 1: Database Setup (Supabase)

### Create Project

1. Go to [Supabase](https://supabase.com)
2. Create new project
3. Note down:
   - Project URL
   - Database password
   - Connection string

### Configure Database

```bash
# Update DATABASE_URL in your environment
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Run migrations
cd packages/database
DATABASE_URL="..." npx prisma migrate deploy
```

---

## Step 2: Redis Setup (Upstash)

### Create Database

1. Go to [Upstash](https://upstash.com)
2. Create Redis database
3. Select region closest to your API servers
4. Note connection URL

```bash
REDIS_URL="redis://default:[PASSWORD]@[HOST]:6379"
```

---

## Step 3: Smart Contract Deployment

### Configure Network

```bash
cd packages/contracts

# Create .env
cat > .env << EOF
PRIVATE_KEY=0x...your-deployer-private-key
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGONSCAN_API_KEY=your-api-key
EOF
```

### Deploy Contracts

```bash
# Compile
pnpm compile

# Deploy to Polygon Mainnet
npx hardhat run scripts/deploy.ts --network polygon

# Verify contracts
npx hardhat verify --network polygon [CONTRACT_ADDRESS] [CONSTRUCTOR_ARGS]
```

### Save Addresses

Contract addresses will be saved to `deployments/latest.json`:

```json
{
  "network": "polygon",
  "chainId": "137",
  "contracts": {
    "JobEscrow": "0x...",
    "ReputationRegistry": "0x...",
    "DisputeResolution": "0x..."
  }
}
```

---

## Step 4: Backend API Deployment

### Option A: Railway

1. Connect GitHub repository
2. Select `apps/api` as root directory
3. Configure environment variables:

```bash
# Server
PORT=4000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# JWT
JWT_SECRET=generate-strong-secret-here
JWT_EXPIRES_IN=7d

# Blockchain
RPC_URL=https://polygon-rpc.com
ESCROW_ADDRESS=0x...
REPUTATION_ADDRESS=0x...
DISPUTE_ADDRESS=0x...

# AI Service
AI_SERVICE_URL=https://your-ai-service.railway.app

# IPFS
PINATA_API_KEY=...
PINATA_SECRET_KEY=...

# Email (SendGrid/Resend)
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=SG...
```

4. Deploy

### Option B: Render

Similar steps with Render's dashboard.

### Option C: Docker (Self-hosted)

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 4000
CMD ["node", "dist/server.js"]
```

```bash
docker build -t detrust-api ./apps/api
docker run -d -p 4000:4000 --env-file .env detrust-api
```

---

## Step 5: AI Service Deployment

### Railway/Render

1. Select `apps/ai-service` as root directory
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
4. Configure environment:

```bash
PORT=8000
DEBUG=false
REDIS_URL=redis://...
```

### Docker

```dockerfile
# apps/ai-service/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Step 6: Frontend Deployment (Vercel)

### Connect Repository

1. Go to [Vercel](https://vercel.com)
2. Import Git repository
3. Configure:
   - Framework: Next.js
   - Root Directory: `apps/web`
   - Build Command: `pnpm build`
   - Output Directory: `.next`

### Environment Variables

```bash
# API
NEXT_PUBLIC_API_URL=https://api.detrust.io

# Blockchain
NEXT_PUBLIC_CHAIN_ID=137
NEXT_PUBLIC_RPC_URL=https://polygon-rpc.com
NEXT_PUBLIC_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_REPUTATION_ADDRESS=0x...
NEXT_PUBLIC_DISPUTE_ADDRESS=0x...

# Wallet Connect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...

# IPFS
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
```

### Domain Setup

1. Add custom domain in Vercel
2. Configure DNS records
3. Enable HTTPS

---

## Step 7: Post-Deployment

### Verify Services

```bash
# Check API health
curl https://api.detrust.io/api/health

# Check AI service
curl https://ai.detrust.io/health

# Check frontend
curl -I https://detrust.io
```

### Initialize Platform

```bash
# Seed initial skills
curl -X POST https://api.detrust.io/api/admin/seed-skills \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Verify contract connectivity
curl https://api.detrust.io/api/health/blockchain
```

### Set Up Monitoring

1. **Error Tracking**: Configure Sentry
2. **Uptime Monitoring**: Set up Better Uptime/UptimeRobot
3. **Logging**: Configure log aggregation (Logtail/Papertrail)

---

## Environment Variables Summary

### apps/web/.env.production

```bash
NEXT_PUBLIC_API_URL=https://api.detrust.io
NEXT_PUBLIC_CHAIN_ID=137
NEXT_PUBLIC_RPC_URL=https://polygon-rpc.com
NEXT_PUBLIC_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_REPUTATION_ADDRESS=0x...
NEXT_PUBLIC_DISPUTE_ADDRESS=0x...
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=xxx
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
```

### apps/api/.env.production

```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=xxx
JWT_EXPIRES_IN=7d
RPC_URL=https://polygon-rpc.com
ESCROW_ADDRESS=0x...
REPUTATION_ADDRESS=0x...
DISPUTE_ADDRESS=0x...
AI_SERVICE_URL=https://ai.detrust.io
PINATA_API_KEY=xxx
PINATA_SECRET_KEY=xxx
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=SG.xxx
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### apps/ai-service/.env.production

```bash
PORT=8000
DEBUG=false
REDIS_URL=redis://...
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Railway
        uses: railwayapp/railway-action@v1
        with:
          service: api
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Rollback Procedures

### Frontend (Vercel)

1. Go to Vercel dashboard
2. Select deployment to rollback to
3. Click "Promote to Production"

### Backend (Railway)

1. Go to Railway dashboard
2. Select previous deployment
3. Click "Rollback"

### Smart Contracts

⚠️ **Smart contracts cannot be rolled back**. Deploy new version and migrate if needed.

---

## Security Checklist

- [ ] All secrets in environment variables (not in code)
- [ ] HTTPS enabled on all endpoints
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled
- [ ] Database backups configured
- [ ] Monitoring and alerting set up
- [ ] Smart contracts audited
- [ ] Admin keys secured (hardware wallet recommended)

---

## Cost Estimation

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| Vercel | Yes | $0-20/month |
| Railway | $5 credit | $5-20/month |
| Supabase | Yes (500MB) | $0-25/month |
| Upstash | Yes (10k/day) | $0-10/month |
| Pinata | Yes (1GB) | $0-20/month |
| Alchemy | Yes (300M CU) | $0-49/month |
| **Total** | | **$5-144/month** |

---

## Support

For deployment issues:
1. Check service status pages
2. Review logs in respective dashboards
3. Contact team on Discord/Slack
