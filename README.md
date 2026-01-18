# 🚀 Neo4j Web Bridge

**Access your self-hosted Neo4j database from anywhere, without TLS configuration headaches.**

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://neo4j-web-bridge-production.up.railway.app)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/neo4j-web-bridge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

## 🎮 Try it Live

**[→ Live Demo on Railway](https://neo4j-web-bridge-production.up.railway.app)** 

Connect to your own Neo4j instance or use our demo to try it out!

---

## 🎯 The Problem

When you self-host Neo4j on platforms like Railway, Render, Fly.io, or Docker, accessing the Neo4j Browser remotely becomes a nightmare:

- ❌ **Browser requires HTTPS** but Neo4j uses `bolt://` (unencrypted)
- ❌ **TCP Proxies don't handle TLS termination** for Bolt protocol
- ❌ **Complex TLS setup** with certificates, configuration, and maintenance
- ❌ **Can't access from Internet cafés, mobile, or other locations**

**Even Neo4j Aura's console can't connect to self-hosted Neo4j without TLS!**

---

## ✨ The Solution

**Neo4j Web Bridge** is a lightweight proxy that solves this problem:

```
Browser (HTTPS) → Neo4j Web Bridge → Neo4j (bolt://)
                   ↑ Handles TLS
```

### 🎁 Features

- ✅ **Works everywhere**: Railway, Render, Fly.io, Heroku, Docker, Cloud VMs
- ✅ **Zero TLS config**: Just connect and go
- ✅ **Modern UI**: Clean, responsive web interface
- ✅ **Secure**: Connections stay between you and your database
- ✅ **Fast**: Direct Bolt protocol communication
- ✅ **Open Source**: MIT licensed, host it yourself

---

## 🚀 Quick Start

### Option 1: One-Click Deploy (Railway)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/neo4j-web-bridge)

1. Click the button above
2. Configure environment variables (optional)
3. Deploy!

### Option 2: Docker

```bash
# Pull and run
docker run -p 3000:3000 neo4j-web-bridge

# Or with Docker Compose
docker-compose up
```

### Option 3: Local Development

```bash
# Clone repository
git clone https://github.com/yourusername/neo4j-web-bridge.git
cd neo4j-web-bridge

# Install dependencies
npm install

# Start server
npm start

# Open browser
open http://localhost:3000
```

---

## 📖 Usage

### 1. Connect to Your Neo4j

```
URL:      bolt://your-neo4j-host:7687
Username: neo4j
Password: your-password
Database: neo4j (or your database name)
```

**Example URLs:**
- Railway: `bolt://yamanote.proxy.rlwy.net:36570`
- Docker: `bolt://localhost:7687`
- Remote: `bolt://your-server.com:7687`

### 2. Run Queries

Use the built-in query editor with syntax highlighting:

```cypher
MATCH (n) RETURN n LIMIT 25
```

**Quick queries** are available for common operations:
- Show Nodes
- Show Graph
- List Labels
- Relationship Types

### 3. View Results

Results are displayed in clean JSON format with:
- Record count
- Execution time
- Full node/relationship details

---

## 🏗️ Architecture

```
┌─────────────┐         HTTPS          ┌──────────────────┐
│   Browser   │ ──────────────────────→ │  Neo4j Web       │
│             │                         │  Bridge          │
│ (Anywhere)  │ ←────────────────────── │  (Node.js +      │
└─────────────┘         JSON            │   Express)       │
                                        └──────────────────┘
                                               │
                                               │ Bolt Protocol
                                               │ (bolt://)
                                               │
                                        ┌──────────────────┐
                                        │   Neo4j          │
                                        │   Database       │
                                        │                  │
                                        │  (Self-Hosted)   │
                                        └──────────────────┘
```

**Key Components:**
- **Frontend**: Single-page vanilla JavaScript app
- **Backend**: Express.js REST API
- **Driver**: Official Neo4j JavaScript driver
- **Protocol**: Bolt over unencrypted TCP

---

## 🌍 Deployment Guides

### Railway

1. Create new project in Railway
2. Connect GitHub repository
3. Railway auto-detects and builds
4. Access via generated Railway domain

### Render

1. Create new Web Service
2. Connect repository
3. Build command: `npm install`
4. Start command: `node server.js`
5. Access via Render URL

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

## ⚙️ Configuration

### Environment Variables

```bash
# Server
PORT=3000                              # Server port (default: 3000)

# Neo4j (Optional - can be set via UI)
NEO4J_URI=bolt://localhost:7687       # Default Neo4j URL
NEO4J_USER=neo4j                      # Default username
NEO4J_PASSWORD=changeme123            # Default password
NEO4J_DATABASE=neo4j                  # Default database

# CORS (Optional)
CORS_ORIGIN=*                         # Allowed origins (default: all)
```

### Security Notes

⚠️ **Important Security Considerations:**

1. **Use over HTTPS**: Always deploy with HTTPS in production
2. **Secure passwords**: Never use default passwords
3. **Network security**: Restrict Neo4j access to known IPs if possible
4. **Authentication**: Consider adding auth to the web bridge itself
5. **Private networks**: Best used in private networks or VPNs

---

## 🔧 API Reference

### Health Check
```
GET /api/health
Response: { status: "ok", version: "1.0.0" }
```

### Connect
```
POST /api/connect
Body: {
  uri: "bolt://host:7687",
  username: "neo4j",
  password: "password",
  database: "neo4j"
}
```

### Execute Query
```
POST /api/query
Body: {
  cypher: "MATCH (n) RETURN n",
  params: {},
  database: "neo4j"
}
```

### Disconnect
```
POST /api/disconnect
Response: { success: true }
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Neo4j JavaScript Driver](https://github.com/neo4j/neo4j-javascript-driver)
- Inspired by the Neo4j community's need for simpler remote access
- Special thanks to everyone who struggled with TLS configuration 😅

---

## 🐛 Known Issues & Roadmap

### Current Limitations
- Single connection at a time (by design for simplicity)
- No authentication on the web interface (use network security)
- Basic query editor (no autocomplete yet)

### Roadmap
- [ ] Graph visualization with D3.js
- [ ] Query history and favorites
- [ ] Multi-database support
- [ ] Authentication layer
- [ ] Query autocomplete
- [ ] Export results (CSV, JSON)
- [ ] Dark mode 🌙

---

## 📧 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/neo4j-web-bridge/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/neo4j-web-bridge/discussions)
- 📧 **Email**: your-email@example.com

---

## ⭐ Star History

If this project helped you, please consider giving it a star! ⭐

---

**Made with ❤️ for the Neo4j community**
