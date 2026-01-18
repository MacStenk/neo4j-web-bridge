import express from 'express';
import cors from 'cors';
import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Neo4j connection pool
let driver = null;

// Auto-connect on startup if credentials are provided
async function autoConnect() {
  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USER || process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;
  const database = process.env.NEO4J_DATABASE || 'neo4j';

  if (uri && username && password) {
    console.log('Auto-connect enabled. Connecting to Neo4j...');
    
    try {
      const cleanUri = uri.replace(/^(neo4j\+s|bolt\+s|https):\/\//, 'bolt://');
      
      driver = neo4j.driver(
        cleanUri,
        neo4j.auth.basic(username, password),
        {
          maxConnectionLifetime: 3 * 60 * 1000,
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 2 * 60 * 1000,
        }
      );

      // Verify connectivity
      const session = driver.session({ database });
      await session.run('RETURN 1');
      await session.close();

      console.log(`✅ Auto-connected to Neo4j: ${cleanUri}`);
      return true;
    } catch (error) {
      console.error('❌ Auto-connect failed:', error.message);
      driver = null;
      return false;
    }
  }
  
  console.log('No auto-connect credentials. Manual connection required.');
  return false;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.0.0',
    connected: driver !== null,
    autoConnect: !!(process.env.NEO4J_URI && process.env.NEO4J_PASSWORD),
    timestamp: new Date().toISOString() 
  });
});

// Connect to Neo4j
app.post('/api/connect', async (req, res) => {
  try {
    const { uri, username, password, database = 'neo4j' } = req.body;

    if (!uri || !username || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields: uri, username, password' 
      });
    }

    // Close existing driver if any
    if (driver) {
      await driver.close();
    }

    // Create new driver (always use bolt:// for self-hosted)
    const cleanUri = uri.replace(/^(neo4j\+s|bolt\+s|https):\/\//, 'bolt://');
    
    driver = neo4j.driver(
      cleanUri,
      neo4j.auth.basic(username, password),
      {
        maxConnectionLifetime: 3 * 60 * 1000, // 3 minutes
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
      }
    );

    // Verify connectivity
    const session = driver.session({ database });
    await session.run('RETURN 1');
    await session.close();

    res.json({ 
      success: true, 
      message: 'Connected successfully',
      uri: cleanUri,
      database 
    });

  } catch (error) {
    console.error('Connection error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to connect to Neo4j'
    });
  }
});

// Execute Cypher query
app.post('/api/query', async (req, res) => {
  try {
    if (!driver) {
      return res.status(400).json({ 
        error: 'Not connected to Neo4j. Please connect first.' 
      });
    }

    const { cypher, params = {}, database = 'neo4j' } = req.body;

    if (!cypher) {
      return res.status(400).json({ error: 'Cypher query is required' });
    }

    const session = driver.session({ database });
    
    try {
      const result = await session.run(cypher, params);
      
      // Convert Neo4j result to JSON
      const records = result.records.map(record => {
        const obj = {};
        record.keys.forEach((key, i) => {
          const value = record.get(key);
          obj[key] = convertNeo4jValue(value);
        });
        return obj;
      });

      res.json({
        success: true,
        records,
        summary: {
          queryType: result.summary.queryType,
          counters: result.summary.counters.updates(),
          resultAvailableAfter: result.summary.resultAvailableAfter.toNumber(),
          resultConsumedAfter: result.summary.resultConsumedAfter.toNumber(),
        }
      });

    } finally {
      await session.close();
    }

  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to execute query'
    });
  }
});

// Get server info
app.get('/api/info', async (req, res) => {
  try {
    if (!driver) {
      return res.status(400).json({ 
        error: 'Not connected to Neo4j' 
      });
    }

    const session = driver.session();
    
    try {
      const result = await session.run(`
        CALL dbms.components() YIELD name, versions, edition
        RETURN name, versions, edition
      `);

      const info = result.records.map(record => ({
        name: record.get('name'),
        versions: record.get('versions'),
        edition: record.get('edition')
      }));

      res.json({ success: true, info });

    } finally {
      await session.close();
    }

  } catch (error) {
    console.error('Info error:', error);
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// Disconnect
app.post('/api/disconnect', async (req, res) => {
  try {
    if (driver) {
      await driver.close();
      driver = null;
    }
    res.json({ success: true, message: 'Disconnected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper: Convert Neo4j types to JSON
function convertNeo4jValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (neo4j.isInt(value)) {
    return value.toNumber();
  }

  if (typeof value === 'object') {
    if (value.constructor.name === 'Node') {
      return {
        identity: value.identity.toNumber(),
        labels: value.labels,
        properties: convertNeo4jValue(value.properties)
      };
    }
    
    if (value.constructor.name === 'Relationship') {
      return {
        identity: value.identity.toNumber(),
        type: value.type,
        start: value.start.toNumber(),
        end: value.end.toNumber(),
        properties: convertNeo4jValue(value.properties)
      };
    }

    if (Array.isArray(value)) {
      return value.map(convertNeo4jValue);
    }

    const obj = {};
    for (const key in value) {
      obj[key] = convertNeo4jValue(value[key]);
    }
    return obj;
  }

  return value;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (driver) {
    await driver.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  if (driver) {
    await driver.close();
  }
  process.exit(0);
});

// Start server with auto-connect
app.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════╗
║       Neo4j Web Bridge v1.0.0             ║
╠═══════════════════════════════════════════╣
║  Server:  http://localhost:${PORT}           ║
║  API:     http://localhost:${PORT}/api       ║
╚═══════════════════════════════════════════╝
  `);
  
  await autoConnect();
});
