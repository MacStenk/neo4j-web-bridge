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

*If all three `NEO4J_*` credentials are set, the bridge auto-connects on startup. Otherwise, manual connection via UI or API is required.

### Auto-Connect Mode

For API/Gateway usage, set the environment variables and the bridge connects automatically:

```bash
NEO4J_URI=bolt://yamanote.proxy.rlwy.net:36570
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
```

On startup:
```
✅ Auto-connected to Neo4j: bolt://yamanote.proxy.rlwy.net:36570
```

### Manual Connect Mode

Without environment variables, users connect via the Web UI or API:

```bash
curl -X POST http://localhost:3000/api/connect \
  -H "Content-Type: application/json" \
  -d '{"uri":"bolt://host:7687","username":"neo4j","password":"xxx"}'
```

## API Reference

### Health Check
```
GET /api/health
→ { status: "ok", version: "1.0.0", connected: true, autoConnect: true }
```

### Connect (Manual Mode)
```
POST /api/connect
Body: { uri, username, password, database }
```

### Execute Query
```
POST /api/query
Body: { cypher, params, database }
```

### Disconnect
```
POST /api/disconnect
```

## Use with MCP Gateway

Neo4j Web Bridge works as a backend for [MCP Gateway](https://github.com/MacStenk/mcp-gateway):

1. Deploy Neo4j Web Bridge with auto-connect credentials
2. Add the Bridge URL to MCP Gateway config
3. Chat with your Neo4j database via Gemini AI

```json
{
  "name": "neo4j",
  "type": "neo4j",
  "url": "https://your-neo4j-bridge.railway.app"
}
```

## Architecture

```
┌─────────────┐         HTTPS          ┌──────────────────┐
│   Browser   │ ──────────────────────→│  Neo4j Web       │
│  / Gateway  │                        │  Bridge          │
└─────────────┘                        └──────────────────┘
                                              │
                                              │ Bolt Protocol
                                              ↓
                                       ┌──────────────────┐
                                       │   Neo4j          │
                                       │   Database       │
                                       └──────────────────┘
```

## License

MIT
