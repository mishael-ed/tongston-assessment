# T-World Module Service

T-World is a small content operations service that joins three related workflows: publishing content, generating AI summaries, and rewarding useful AI activity with an auditable token ledger. It includes an Express/MongoDB API and a React admin console.

The project defaults to local mock providers. You can exercise the full product without an OpenAI, Cloudinary, or AWS account; the provider boundaries remain the same when real credentials are supplied.

## What is included

- JWT authentication and admin/user role checks
- Content creation, search, tag filtering, pagination, editing and deletion
- Provider-independent AI summarization with timeout handling, latency metrics and fallback output
- Atomic AI rewards and token conversions using MongoDB transactions
- Append-only token transaction history
- Mock USDT/ETH conversion and withdrawal lifecycle
- Cloudinary upload and S3 promotion adapters, plus a disk-backed local mock
- Zod request validation, rate limiting, security headers and request logs
- Responsive React/Tailwind admin console
- Seed data and focused unit tests

## Run locally

Prerequisites are Node.js 20+ and a MongoDB replica set. MongoDB Atlas works without additional configuration. Transactions are used deliberately for ledger consistency, so a standalone local `mongod` is not sufficient.

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

Open `http://localhost:5173` and sign in with:

```text
admin@tworld.local
Password123!
```

The API listens on `http://localhost:4000`. `GET /health` can be used for a health check.

## Provider configuration

`AI_PROVIDER=mock` uses a deterministic local summarizer. To use OpenAI, set `AI_PROVIDER=openai`, `OPENAI_API_KEY`, and optionally `OPENAI_MODEL`. Provider failures and timeouts return a fallback summary but do not award tokens.

`STORAGE_DRIVER=mock` writes uploads beneath the ignored `uploads/` directory and simulates promotion by moving the file between provider folders. Set it to `cloud` and provide the Cloudinary/AWS values in `.env` to upload to Cloudinary and promote to S3.

## API overview

All routes except registration and login expect `Authorization: Bearer <token>`.

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Create a standard user |
| POST | `/api/auth/login` | Public | Issue a 12-hour JWT |
| GET | `/api/auth/me` | User | Current account |
| POST | `/api/content` | Admin | Create content |
| GET | `/api/content?tag=&q=&page=` | User | Filtered content list |
| GET | `/api/content/:id` | User | Content detail |
| PATCH/DELETE | `/api/content/:id` | Admin | Maintain content |
| POST | `/api/content/:id/ai/summarize` | User | Run summary and award tokens |
| GET | `/api/tokens/balance` | User | Balance and available converted assets |
| GET | `/api/tokens/history` | User | Immutable ledger history |
| POST | `/api/tokens/convert` | User | Convert TWT to a mock asset |
| POST | `/api/tokens/withdraw` | User | Withdraw one available conversion |
| POST | `/api/media/upload` | User | Upload a multipart `file` |
| POST | `/api/media/:id/promote` | Admin | Promote Cloudinary asset to S3 |
| GET | `/api/admin/users` | Admin | User balances |
| GET | `/api/admin/ai-runs` | Admin | Recent AI runs |

Example summarization body:

```json
{ "tone": "professional", "length": "medium" }
```

Example conversion and withdrawal bodies:

```json
{ "toAsset": "MOCK_USDT", "amount": 100 }
```

```json
{ "conversionId": "<conversion object id>" }
```

## Consistency and design notes

The user's cached balance is the fast read model; `token_transactions` is the audit trail. An earn or conversion updates both inside one MongoDB transaction. Conversion debits use a conditional update (`tokenBalance >= amount`) so concurrent requests cannot overdraw an account. Ledger documents reject update and delete operations through Mongoose middleware.

An AI run is written before calling the provider and ends in `SUCCESS` or `FALLBACK`. Only a successful provider response enters the reward transaction. This keeps provider outages visible without issuing rewards for work the provider did not complete.

The mock conversion hashes and withdrawal confirmations intentionally resemble Web3 primitives without claiming a real on-chain transfer. `contract_conversions` is the boundary that a real contract adapter could replace later.

## Commands

```bash
npm run dev       # API and admin console
npm run build     # production frontend bundle
npm test          # backend unit tests
npm run seed      # idempotent demo seed
```

No secrets are committed. Change the example JWT secret before deploying.
