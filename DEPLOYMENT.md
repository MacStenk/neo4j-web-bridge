# Deployment Guide

This guide covers deploying Neo4j Web Bridge on various platforms.

## Railway

### One-Click Deploy
1. Click the "Deploy on Railway" button in README
2. Configure environment variables (optional)
3. Click Deploy
4. Access your app at the generated Railway URL

### Manual Deploy
```bash
railway login
railway init
railway up
```

## Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Click "Create Web Service"

## Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Launch app
flyctl launch

# Deploy
flyctl deploy
```

## Heroku

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create your-app-name

# Deploy
git push heroku main

# Open
heroku open
```

## Docker

### Build and Run
```bash
# Build image
docker build -t neo4j-web-bridge .

# Run container
docker run -p 3000:3000 neo4j-web-bridge

# With environment variables
docker run -p 3000:3000 \
  -e PORT=3000 \
  neo4j-web-bridge
```

### Docker Compose
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## DigitalOcean

1. Create a new Droplet (Ubuntu 22.04)
2. SSH into your droplet
3. Install Node.js and npm
4. Clone repository
5. Install dependencies
6. Start with PM2

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Clone repo
git clone https://github.com/yourusername/neo4j-web-bridge.git
cd neo4j-web-bridge

# Install dependencies
npm install

# Start with PM2
pm2 start server.js --name neo4j-web-bridge

# Save PM2 configuration
pm2 save
pm2 startup
```

## AWS EC2

Similar to DigitalOcean, but:
1. Launch EC2 instance (t2.micro for free tier)
2. Configure security group (allow port 3000)
3. Follow DigitalOcean steps above

## Google Cloud Run

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/neo4j-web-bridge

# Deploy
gcloud run deploy neo4j-web-bridge \
  --image gcr.io/PROJECT_ID/neo4j-web-bridge \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Vercel (Static Hosting + Serverless)

While not ideal for this use case, you can adapt for serverless:
1. Convert Express routes to Vercel Functions
2. Use Vercel CLI: `vercel --prod`

## Environment Variables

All platforms support environment variables:

```bash
PORT=3000
NEO4J_URI=bolt://your-neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
NEO4J_DATABASE=neo4j
```

## SSL/HTTPS

Most cloud platforms (Railway, Render, Fly.io) provide automatic HTTPS.

For self-hosted:
- Use Nginx or Caddy as reverse proxy
- Use Let's Encrypt for certificates
- Configure SSL termination

## Monitoring

Recommended monitoring tools:
- **Uptime Robot**: Free uptime monitoring
- **Better Uptime**: Advanced monitoring
- **Sentry**: Error tracking
- **LogDNA/LogRocket**: Log management

## Scaling

For high traffic:
1. Use load balancer
2. Deploy multiple instances
3. Consider connection pooling
4. Monitor memory usage
5. Add caching layer if needed

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 PID
```

### Connection Refused
- Check firewall rules
- Verify Neo4j is accessible
- Check network configuration

### Out of Memory
- Increase container memory
- Check for memory leaks
- Reduce connection pool size

## Production Checklist

- [ ] Set strong passwords
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Set environment variables
- [ ] Test error scenarios
- [ ] Document your setup
- [ ] Set up logging
- [ ] Configure health checks

---

Need help? Open an issue on GitHub!
