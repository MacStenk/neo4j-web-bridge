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

// =============================================================================
// SECURITY CONFIGURATION
// =============================================================================

const API_KEY = process.env.API_KEY;
// Default to '*' for web interface accessibility - restrict via env var if needed
const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['*'];

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

// Simple in-memory rate limiter
const rateLimitStore = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }
  
  const record = rateLimitStore.get(ip);
  
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW_MS;
    return next();
  }
  
  record.count++;
  
  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ 
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((record.resetTime - now) / 1000)
    });
  }
  
  next();
}

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// API Key authentication middleware
function requireApiKey(req, res, next) {
  // Skip API key check if not configured (development mode)
  if (!API_KEY) {
    console.warn('⚠️  WARNING: API_KEY not set. Running in insecure mode!');
    return next();
  }
  
  const providedKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!providedKey) {
    return res.status(401).json({ error: 'API key required. Provide via X-API-Key header or Authorization: Bearer <key>' });
  }
  
  if (providedKey !== API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  
  next();
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      return callback(null, true);
    }
    
    if (CORS_ORIGINS.includes('*') || CORS_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization']
};

// Security headers middleware
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}

// Input validation for Cypher queries
function validateCypherInput(cypher) {
  if (!cypher || typeof cypher !== 'string') {
    return { valid: false, error: 'Cypher query must be a non-empty string' };
  }
  
  if (cypher.length > 10000) {
    return { valid: false, error: 'Cypher query too long (max 10000 characters)' };
  }
  
  // Block dangerous operations (optional - uncomment if needed)
  // const dangerousPatterns = [
  //   /CALL\s+dbms\.security/i,
  //   /CALL\s+db\.createUser/i,
  //   /CALL\s+db\.dropUser/i,
  // ];
  // 
  // for (const pattern of dangerousPatterns) {
  //   if (pattern.test(cypher)) {
  //     return { valid: false, error: 'This operation is not allowed' };
  //   }
  // }
  
  return { valid: true };
}

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================

app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(join(__dirname, 'public')));

// Apply rate limiting to API routes
app.use('/api', rateLimit);

// =============================================================================
// NEO4J CONNECTION
// =============================================================================

let driver = null;

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

// =============================================================================
// API ENDPOINTS
// =============================================================================

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    name: 'Neo4j Web Bridge',
    version: '1.1.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      connect: 'POST /api/connect',
      query: 'POST /api/query',
      info: '/api/info',
      disconnect: 'POST /api/disconnect'
    }
  });
});

// Health check - public (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.1.0',
    connected: driver !== null,
    autoConnect: !!(process.env.NEO4J_URI && process.env.NEO4J_PASSWORD),
    security: {
      apiKeyRequired: !!API_KEY,
      corsOrigins: CORS_ORIGINS.includes('*') ? 'all' : CORS_ORIGINS.length
    },
    timestamp: new Date().toISOString() 
  });
});

// Connect to Neo4j - requires API key
app.post('/api/connect', requireApiKey, async (req, res) => {
  try {
    const { uri, username, password, database = 'neo4j' } = req.body;

    if (!uri || !username || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields: uri, username, password' 
      });
    }

    if (driver) {
      await driver.close();
    }

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

// Execute Cypher query - requires API key
app.post('/api/query', requireApiKey, async (req, res) => {
  try {
    if (!driver) {
      return res.status(400).json({ 
        error: 'Not connected to Neo4j. Please connect first.' 
      });
    }

    const { cypher, params = {}, database = 'neo4j' } = req.body;

    // Validate input
    const validation = validateCypherInput(cypher);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const session = driver.session({ database });
    
    try {
      const result = await session.run(cypher, params);
      
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

// Get server info - requires API key
app.get('/api/info', requireApiKey, async (req, res) => {
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

// Disconnect - requires API key
app.post('/api/disconnect', requireApiKey, async (req, res) => {
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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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

// =============================================================================
// ERROR HANDLER - Return JSON instead of HTML for API errors
// =============================================================================

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: err.message || 'Internal server error'
  });
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

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

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║           Neo4j Web Bridge v1.1.0                         ║
╠═══════════════════════════════════════════════════════════╣
║  Server:    http://localhost:${PORT}                         ║
║  API:       http://localhost:${PORT}/api                     ║
║  Security:  ${API_KEY ? '✅ API Key required' : '⚠️  No API Key (insecure!)'}               ║
║  CORS:      ${CORS_ORIGINS.includes('*') ? '⚠️  All origins allowed' : `✅ ${CORS_ORIGINS.length} origin(s) whitelisted`}             ║
╚═══════════════════════════════════════════════════════════╝
  `);
  
  await autoConnect();
});
