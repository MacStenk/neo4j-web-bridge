# Neo4j Web Bridge

Access your self-hosted Neo4j database from anywhere, without TLS configuration headaches.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://neo4j-web-bridge-production.up.railway.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## The Problem

When you self-host Neo4j on platforms like Railway, Render, or Docker, accessing the Neo4j Browser remotely becomes complicated:

- Browser requires HTTPS but Neo4j uses `bolt://` (unencrypted)
- TCP Proxies don't handle TLS termination for Bolt protocol
- Complex TLS setup with certificates, configuration, and maintenance

## The Solution

Neo4j Web Bridge is a lightweight proxy that handles TLS termination:

```
Browser (HTTPS) → Neo4j Web Bridge → Neo4j (bolt://)
```

## Quick Start

### Option 1: One-Click Deploy (Railway)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/neo4j-web-bridge)

### Option 2: Docker

```bash
docker run -p 3000:3000 \
  -e NEO4J_URI=bolt://your-neo4j:7687 \
  -e NEO4J_USER=neo4j \
  -e NEO4J_PASSWORD=your-password \
  -e API_KEY=your-secret-api-key \
  neo4j-web-bridge
```

### Option 3: Local Development

```bash
git clone https://github.com/MacStenk/neo4j-web-bridge.git
cd neo4j-web-bridge
npm install
npm start
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `NEO4J_URI` | No* | Neo4j connection URI (e.g., `bolt://host:7687`) |
| `NEO4J_USER` | No* | Neo4j username |
| `NEO4J_PASSWORD` | No* | Neo4j password |
| `NEO4J_DATABASE` | No | Database name (default: `neo4j`) |
| `API_KEY` | **Yes** | Secret key for API authentication |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (default: localhost) |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms (default: 60000) |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window (default: 100) |

*If all three `NEO4J_*` credentials are set, the bridge auto-connects on startup.

## Security Features

| Feature | Description |
|---------|-------------|
| API Key Authentication | All API endpoints require `X-API-Key` header |
| CORS Whitelist | Only allowed origins can make requests |
| Rate Limiting | Prevents abuse (100 req/min default) |
| Input Validation | Cypher queries are validated (max 10k chars) |
| Security Headers | X-Content-Type-Options, X-Frame-Options, etc. |

### API Authentication

All API endpoints (except `/api/health`) require authentication:

```bash
# Using X-API-Key header
curl -X POST https://your-bridge.railway.app/api/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key" \
  -d '{"cypher": "MATCH (n) RETURN count(n)"}'

# Using Authorization header
curl -X POST https://your-bridge.railway.app/api/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-api-key" \
  -d '{"cypher": "MATCH (n) RETURN count(n)"}'
```

### CORS Configuration

```bash
# Allow specific origins
CORS_ORIGINS=https://mcp-gateway.codeback.de,https://myapp.com

# Allow all origins (NOT recommended for production)
CORS_ORIGINS=*
```

## API Reference

### Health Check (Public)
```
GET /api/health
→ { status: "ok", version: "1.1.0", connected: true, security: {...} }
```

### Connect (Requires API Key)
```
POST /api/connect
Headers: X-API-Key: your-key
Body: { uri, username, password, database }
```

### Execute Query (Requires API Key)
```
POST /api/query
Headers: X-API-Key: your-key
Body: { cypher, params, database }
```

### Disconnect (Requires API Key)
```
POST /api/disconnect
Headers: X-API-Key: your-key
```

## Use with MCP Gateway

Neo4j Web Bridge works as a backend for [MCP Gateway](https://github.com/MacStenk/mcp-gateway):

1. Deploy Neo4j Web Bridge with `API_KEY` and auto-connect credentials
2. Add the Bridge URL to MCP Gateway with API Key authentication
3. Chat with your Neo4j database via AI

```json
{
  "name": "neo4j",
  "type": "neo4j",
  "url": "https://your-neo4j-bridge.railway.app",
  "auth": {
    "type": "apikey",
    "key": "your-secret-api-key",
    "header": "X-API-Key"
  }
}
```

## Architecture

```
┌─────────────┐         HTTPS          ┌──────────────────┐
│   Browser   │ ──────────────────────→│  Neo4j Web       │
│  / Gateway  │    + API Key Auth      │  Bridge          │
└─────────────┘                        └──────────────────┘
                                              │
                                              │ Bolt Protocol
                                              ↓
                                       ┌──────────────────┐
                                       │   Neo4j          │
                                       │   Database       │
                                       └──────────────────┘
```

## Changelog

### v1.1.0 (2026-01-19)
- Added API Key authentication for all endpoints
- Added CORS whitelist configuration
- Added rate limiting (configurable)
- Added security headers
- Added input validation for Cypher queries

### v1.0.0 (2026-01-18)
- Initial release
- Auto-connect mode
- Web UI for manual connection
- Basic query execution

## License

MIT
