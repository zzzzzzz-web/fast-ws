# fastify-react-btc-dashboard

A real-time BTC/USD price and trade dashboard built with Fastify, WebSockets, React, Redis, and TimescaleDB.

![Dashboard screenshot](screenshot.png)

## Features

- Live BTC/USD price streamed from the Coinbase WebSocket feed
- Candlestick chart with day / week / month / year range selector, powered by TimescaleDB continuous aggregates
- Live 5-minute price line chart backed by Redis
- Real-time trade feed (last 500 trades)
- All sections collapsible; hold Shift + scroll to interact with charts

## Stack

| Layer | Technology |
|---|---|
| Backend | Fastify, `@fastify/websocket` |
| Data source | Coinbase Advanced Trade WebSocket |
| Cache / backfill | Redis |
| Time-series storage | TimescaleDB (PostgreSQL) |
| Frontend | React, Vite, lightweight-charts v5 |
| Reverse proxy | nginx |

## Development

```bash
cp .env.example .env
docker compose up -d        # redis + postgres
pnpm install
pnpm dev                    # server on :3000, client on :5173
```

## Production

```bash
cp .env.example .env.production
# edit .env.production with real credentials

docker compose -f docker-compose.prod.yml up --build
```

App is served on port 80. nginx handles static files and proxies `/candles` and `/stream` to the server.

## Project structure

```
├── packages/
│   ├── client/        # React + Vite
│   └── server/        # Fastify + WebSocket
├── infra/
│   ├── nginx/         # nginx config + Dockerfile (multi-stage client build)
│   └── postgres/      # TimescaleDB init SQL
├── docker-compose.yml
└── docker-compose.prod.yml
```
