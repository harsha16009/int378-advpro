# Architecture & Deployment Guide

## System Architecture

### Components Overview

```
┌─────────────────────────────────────────┐
│   Client (Web Browser / Mobile App)     │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│    Frontend (React + Vite)              │
│    - Product browsing                   │
│    - Shopping cart                      │
│    - Checkout flow                      │
│    - Order tracking                     │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  API Gateway (Express)                  │
│  - Request routing                      │
│  - JWT validation                       │
│  - Rate limiting                        │
│  - CORS handling                        │
└──┬──────┬──────┬──────┬──────┬──────────┘
   │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼
  Auth  Product Order Payment Notification
  Service Service Service Service Service
```

### Database Strategy

**Polyglot Persistence** - Each service has its own database namespace:
```
MongoDB
├── auth-db (users, sessions)
├── product-db (products, catalog)
├── order-db (orders, delivery)
├── payment-db (transactions, invoices)
└── notification-db (logs, templates)
```

### Advantages of Microservices Architecture

1. **Scalability** - Scale individual services based on demand
2. **Fault Isolation** - One service failure doesn't crash entire system
3. **Independent Deployment** - Deploy services independently
4. **Technology Flexibility** - Use different tech stacks per service
5. **Team Autonomy** - Different teams can own different services

## Deployment Strategies

### Development Environment
```bash
docker-compose up -d
# All services start locally with shared MongoDB
```

### Staging Environment
```bash
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
# Similar to dev but with production-like settings
```

### Production Environment
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
# Optimized for performance, reliability, security
```

## Scaling Strategies

### Horizontal Scaling

```bash
# Scale product service to 3 replicas
docker-compose up -d --scale product-service=3

# Use load balancer (Nginx) in front
```

### Load Balancing with Nginx

```yaml
upstream product_backend {
    server product-service:3002;
    server product-service-2:3002;
    server product-service-3:3002;
}

server {
    listen 3002;
    location / {
        proxy_pass http://product_backend;
    }
}
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: product-service
  template:
    metadata:
      labels:
        app: product-service
    spec:
      containers:
      - name: product-service
        image: your-registry/product-service:latest
        ports:
        - containerPort: 3002
        env:
        - name: MONGO_PRODUCT_URI
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: mongo-uri
```

## Monitoring & Observability

### Health Checks

```javascript
// Every service has a health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Service is running' });
});
```

### Logging Strategy

```javascript
// Centralized logging
import winston from 'winston';

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});
```

### Metrics Collection

```bash
# Using Prometheus
docker run -d -p 9090:9090 prom/prometheus

# Using Grafana
docker run -d -p 3006:3000 grafana/grafana
```

## Security Best Practices

### API Security

1. **JWT Token Validation**
```javascript
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

2. **Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);
```

3. **Input Validation**
```javascript
const validator = require('validator');
if (!validator.isEmail(email)) {
  throw new Error('Invalid email');
}
```

### Data Security

1. **Encryption at Rest**
```javascript
// MongoDB encryption
// Enable in production
```

2. **Encryption in Transit**
```javascript
// Use HTTPS/TLS
// All communication secured
```

3. **Environment Variables**
```bash
# Never commit .env files
# Use secrets management tools
# AWS Secrets Manager
# HashiCorp Vault
```

## Performance Optimization

### Database Optimization

```javascript
// Add indexes
db.users.createIndex({ email: 1 });
db.products.createIndex({ category: 1 });
db.orders.createIndex({ userId: 1 });
```

### Caching Strategy

```javascript
// Redis caching
const redis = require('redis');
const client = redis.createClient();

app.get('/products/:id', async (req, res) => {
  // Check cache first
  const cached = await client.get(`product:${req.params.id}`);
  if (cached) return res.json(JSON.parse(cached));
  
  // Get from DB
  const product = await Product.findById(req.params.id);
  
  // Store in cache (1 hour TTL)
  await client.setex(`product:${req.params.id}`, 3600, JSON.stringify(product));
  res.json(product);
});
```

### API Response Compression

```javascript
const compression = require('compression');
app.use(compression());
```

## Disaster Recovery

### Backup Strategy

```bash
# Automated MongoDB backups
mongodump --uri "mongodb://admin:password@localhost:27017" \
          --out /backups/mongo-$(date +%Y%m%d)

# Restore from backup
mongorestore --uri "mongodb://admin:password@localhost:27017" \
             /backups/mongo-20240101
```

### High Availability

```yaml
# MongoDB Replica Set
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo-1:27017" },
    { _id: 1, host: "mongo-2:27017" },
    { _id: 2, host: "mongo-3:27017" }
  ]
});
```

## Continuous Integration/Deployment

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker images
        run: docker-compose build
      
      - name: Push to registry
        run: |
          docker login -u ${{ secrets.DOCKER_USER }} -p ${{ secrets.DOCKER_PASS }}
          docker-compose push
      
      - name: Deploy to production
        run: |
          ssh user@server 'cd /app && docker-compose pull && docker-compose up -d'
```

## Cost Optimization

### Resource Allocation

```yaml
services:
  auth-service:
    resources:
      limits:
        cpus: '0.5'
        memory: 512M
      reservations:
        cpus: '0.25'
        memory: 256M
```

### Auto-scaling

```bash
# AWS ECS Auto Scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/default/product-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10
```

---

For more details, refer to the main README.md
