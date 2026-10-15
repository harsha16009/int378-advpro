# 🚀 Quick Start Guide

## 📋 Prerequisites

- Docker & Docker Compose installed
- 4GB+ RAM available
- ~2GB disk space

## ⚡ Start in 3 Steps

### Step 1: Clone & Navigate
```bash
cd fruits-delivery-microservices
```

### Step 2: Start Services
```bash
docker compose up -d --build
```

Wait 30-60 seconds for services to start...

### Step 3: Access Application
- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:3000
- **API Docs**: http://localhost:3000/health

## ✅ Verify Setup

```bash
# Check all services are running
docker compose ps

# Test API Gateway
curl http://localhost:3000/health

# View logs
docker compose logs -f
```

## 📈 Monitoring (Prometheus + Grafana)

```bash
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d --build
```

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3006 (login: `admin` / `admin`)

If Grafana dashboards don’t load or you want a clean reset:
```bash
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml down -v
```

## 🧪 Test Features

### 1. Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "password123",
    "address": "123 Main St"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Browse Products
```bash
curl http://localhost:3000/api/products
```

### 4. Filter by Category
```bash
curl "http://localhost:3000/api/products?category=pomegranate"
```

## 🛑 Stop Services

```bash
docker compose down
```

## 📱 Sample Promo Codes

- **FRUIT50** → ₹50 discount
- **FRESH20** → 20% discount

## 🔧 Configuration

Edit `.env` files in each service directory to customize:
- Database credentials
- API keys (Stripe, Gmail)
- Service ports
- JWT secret

## 📊 Service Ports

| Service | Port |
|---------|------|
| Frontend | 5173 |
| API Gateway | 3000 |
| Auth Service | 3001 |
| Product Service | 3002 |
| Order Service | 3003 |
| Payment Service | 3004 |
| Notification Service | 3005 |
| MongoDB | 27017 |

## 📞 Need Help?

See `TROUBLESHOOTING.md` for common issues

Enjoy fresh fruits! 🍎🍊🍌
