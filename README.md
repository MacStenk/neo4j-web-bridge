# Neo4j Web Bridge

**Access your self-hosted Neo4j database from anywhere, without TLS configuration headaches.**

[![Live Demo](https://img.shields.io/badge/demo-live-58a6ff)](https://neo4j-web-bridge-production.up.railway.app)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/neo4j-web-bridge)
[![License: MIT](https://img.shields.io/badge/License-MIT-58a6ff.svg)](https://opensource.org/licenses/MIT)

[Live Demo](https://neo4j-web-bridge-production.up.railway.app) · [Documentation](#usage) · [Deploy](#quick-start)

---

## The Problem

When you self-host Neo4j on platforms like Railway, Render, Fly.io, or Docker, accessing the Neo4j Browser remotely becomes complicated:

- **Browser requires HTTPS** but Neo4j uses `bolt://` (unencrypted)
- **TCP Proxies don't handle TLS termination** for Bolt protocol  
- **Complex TLS setup** with certificates, configuration, and maintenance
- **Can't access from different locations** without VPN or complex networking

Even Neo4j Aura's console can't connect to self-hosted Neo4j without TLS.

---

## The Solution

Neo4j Web Bridge is a lightweight proxy that handles TLS termination:

```
Browser (HTTPS) → Neo4j Web Bridge → Neo4j (bolt://)
                   ↑ Handles TLS
```

### Features

- **Works everywhere** — Railway, Render, Fly.io, Heroku, Docker, Cloud VMs
- **Zero TLS config** — Connect and go
- **Modern UI** — Clean, responsive web interface  
- **Fast** — Direct Bolt protocol communication
- **Open Source** — MIT licensed, self-host it yourself

---

## Quick Start

### Option 1: One-Click Deploy (Railway)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/neo4j-web-bridge)

1. Click the button above
2. Configure environment variables (optional)
3. Deploy

### Option 2: Docker

```bash
docker run -p 3000:3000 neo4j-web-bridge
```

### Option 3: Local Development

```bash
git clone https://github.com/MacStenk/neo4j-web-bridge.git
cd neo4j-web-bridge
npm install
npm start
```

Open `http://localhost:3000`

---

## Usage

### Connect to Your Neo4j

```
URL:      bolt://your-neo4j-host:7687
Username: neo4j
Password: your-password
Database: neo4j
```

**Example URLs:**

| Platform | URL |
|----------|-----|
| Railway | `bolt://yamanote.proxy.rlwy.net:36570` |
| Docker | `bolt://localhost:7687` |
| Remote | `bolt://your-server.com:7687` |

### Run Queries

Use the built-in query editor:

```cypher
MATCH (n) RETURN n LIMIT 25
```

Quick queries are available for common operations: Show Nodes, Show Graph, List Labels, Relationship Types.

---

## Architecture

```
┌─────────────┐         HTTPS          ┌──────────────────┐
│   Browser   │ ──────────────────────→ │  Neo4j Web       │
│             │                         │  Bridge          │
│ (Anywhere)  │ ←────────────────────── │  (Node.js)       │
└─────────────┘         JSON            └──────────────────┘
                                               │
                                               │ Bolt Protocol
                                               ↓
                                        ┌──────────────────┐
                                        │   Neo4j          │
                                        │   Database       │
                                        └──────────────────┘
```

---

## Deployment

### Railway

1. Create new project in Railway
2. Connect GitHub repository
3. Railway auto-detects and builds
4. Access via generated Railway domain

### Render

1. Create new Web Service
2. Connect repository
3. Build: `npm install` · Start: `node server.js`

### Fly.io

```bash
flyctl launch
flyctl deploy
```

### Docker

```bash
docker build -t neo4j-web-bridge .
docker run -p 3000:3000 neo4j-web-bridge
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NEO4J_URI` | — | Default Neo4j URL |
| `NEO4J_USER` | — | Default username |
| `NEO4J_PASSWORD` | — | Default password |
| `NEO4J_DATABASE` | `neo4j` | Default database |
| `CORS_ORIGIN` | `*` | Allowed origins |

### Security Notes

- Always deploy with HTTPS in production
- Never use default passwords
- Restrict Neo4j access to known IPs if possible
- Consider adding authentication to the web bridge
- Best used in private networks or VPNs

---

## API Reference

### Health Check
```
GET /api/health
→ { status: "ok", version: "1.0.0" }
```

### Connect
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

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

## Roadmap

- [ ] Graph visualization
- [ ] Query history
- [ ] Multi-database support
- [ ] Authentication layer
- [ ] Query autocomplete
- [ ] Export results (CSV, JSON)

---

## Support

- **Issues:** [GitHub Issues](https://github.com/MacStenk/neo4j-web-bridge/issues)
- **Discussions:** [GitHub Discussions](https://github.com/MacStenk/neo4j-web-bridge/discussions)
