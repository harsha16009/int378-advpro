# 🍎 FruitHub - Project Structure Overview

```
fruits-delivery-microservices/
│
├── 📁 backend/
│   │
│   ├── 🌐 api-gateway/
│   │   ├── index.js                 # Main gateway server
│   │   ├── package.json             # Dependencies
│   │   ├── Dockerfile               # Container config
│   │   └── .env                     # Environment variables
│   │
│   ├── 🔐 auth-service/
│   │   ├── index.js                 # Auth endpoints
│   │   ├── package.json             
│   │   ├── Dockerfile               
│   │   └── .env                     
│   │   # Features: Register, Login, JWT, Profile
│   │
│   ├── 🍎 product-service/
│   │   ├── index.js                 # Product endpoints
│   │   ├── package.json             
│   │   ├── Dockerfile               
│   │   └── .env                     
│   │   # Features: Browse, Filter, Reviews, Add-ons
│   │
│   ├── 📦 order-service/
│   │   ├── index.js                 # Order endpoints
│   │   ├── package.json             
│   │   ├── Dockerfile               
│   │   └── .env                     
│   │   # Features: Create, Track, Cancel, Status
│   │
│   ├── 💳 payment-service/
│   │   ├── index.js                 # Payment endpoints
│   │   ├── package.json             
│   │   ├── Dockerfile               
│   │   └── .env                     
│   │   # Features: Stripe, UPI, Wallet, COD, Refund
│   │
│   └── 📧 notification-service/
│       ├── index.js                 # Notification endpoints
│       ├── package.json             
│       ├── Dockerfile               
│       └── .env                     
│       # Features: Email confirmations, Status updates
│
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── Navbar.jsx           # Navigation & User menu
│   │   │   ├── ProductCard.jsx      # Product display
│   │   │   ├── ProductListing.jsx   # Browse products
│   │   │   ├── Cart.jsx             # Shopping cart
│   │   │   ├── Checkout.jsx         # Order placement
│   │   │   ├── OrderTracking.jsx    # Real-time tracking
│   │   │   ├── Login.jsx            # Login page
│   │   │   └── Signup.jsx           # Registration page
│   │   │
│   │   ├── 📁 api/
│   │   │   └── client.js            # API client (axios)
│   │   │
│   │   ├── 📁 store/
│   │   │   └── store.js             # Zustand state management
│   │   │
│   │   ├── App.jsx                  # Main app component
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Global styles
│   │
│   ├── index.html                   # HTML template
│   ├── package.json                 # Dependencies
│   ├── vite.config.js               # Vite config
│   ├── Dockerfile                   # Container config
│   └── .gitignore                   
│
├── 📁 devops/
│   ├── Jenkinsfile                  # CI/CD pipeline
│   ├── .gitlab-ci.yml              # GitLab CI (optional)
│   └── docker-compose.yml          # Orchestration
│
├── 🐳 docker-compose.yml            # Main orchestration
├── 🐳 docker-compose.staging.yml   # Staging config
├── 🐳 docker-compose.prod.yml      # Production config
│
├── 📄 README.md                     # Main documentation
├── 🚀 QUICKSTART.md                 # Quick start guide
├── 🏗️ ARCHITECTURE.md               # Architecture details
├── 🔧 TROUBLESHOOTING.md            # Common issues
├── 📊 SEED_DATA.md                  # Sample data script
├── 📋 PROJECT_STRUCTURE.md          # This file
├── Jenkinsfile                      # Jenkins pipeline
├── .gitignore                       # Git ignore rules
└── package.json                     # Root package.json
```

## 📊 Directory Tree with Details

### Backend Services Structure
```
Each service follows this pattern:

service-name/
├── index.js                 # Main Express app
├── package.json             # npm dependencies
├── Dockerfile               # Docker container config
├── .env                     # Environment variables
└── README.md               # Service-specific docs

Key Endpoints per Service:
- Auth: /register, /login, /profile/:userId
- Product: /, /:id, /category/:category, /:id/review
- Order: /, /user/:userId, /:id, /:id/status, /:id/cancel
- Payment: /create, /confirm, /:paymentId, /:paymentId/refund
- Notification: /send-order-confirmation, /send-delivery-update, /send-payment-receipt
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/       # React components
│   ├── api/             # API client
│   ├── store/           # State management
│   ├── App.jsx          # Root component
│   └── index.css        # Global styles
├── public/              # Static assets
├── package.json         # Dependencies
└── Dockerfile           # Container config

Routes (React Router):
/ → ProductListing
/products/:id → ProductDetail
/cart → Cart
/checkout → Checkout
/order/:orderId → OrderTracking
/login → Login
/signup → Signup
```

## 🔄 Data Flow

### User Registration Flow
```
Frontend (Signup.jsx)
    ↓
Navbar.jsx (displays login state)
    ↓
API Gateway (/api/auth/register)
    ↓
Auth Service (creates user, hashes password)
    ↓
MongoDB (stores user)
    ↓
Returns JWT Token
    ↓
Zustand Store (useAuthStore)
    ↓
localStorage (persist auth)
```

### Order Placement Flow
```
Cart.jsx (items selected)
    ↓
Checkout.jsx (address, payment method)
    ↓
Order Service (creates order)
    ↓
MongoDB (stores order)
    ↓
Payment Service (processes payment)
    ↓
Stripe/UPI/COD (external payment)
    ↓
Notification Service (sends email)
    ↓
OrderTracking.jsx (real-time updates)
```

## 🗂️ Configuration Files

### Environment Variables (.env)

```env
# API Gateway
PORT=3000
JWT_SECRET=your-secret-key
AUTH_SERVICE_URL=http://auth-service:3001

# Auth Service
MONGO_AUTH_URI=mongodb://admin:password@mongo:27017/auth-db
JWT_SECRET=your-secret-key

# Payment Service
STRIPE_SECRET_KEY=sk_test_...
MONGO_PAYMENT_URI=mongodb://...

# Notification Service
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Docker Compose Files

```yaml
# docker-compose.yml
- Main orchestration file
- Development environment
- All services configured

# docker-compose.staging.yml
- Staging-specific overrides
- More production-like settings

# docker-compose.prod.yml
- Production configuration
- Security hardening
- Resource optimization
```

## 🚀 Deployment Structure

### Docker Image Layers
```
Node.js 18 Alpine
    ↓
npm install dependencies
    ↓
Copy source code
    ↓
Expose port
    ↓
Health check
    ↓
Start application
```

### Container Registry Path
```
your-registry/
├── fruits-delivery-api-gateway:1.0.0
├── fruits-delivery-auth-service:1.0.0
├── fruits-delivery-product-service:1.0.0
├── fruits-delivery-order-service:1.0.0
├── fruits-delivery-payment-service:1.0.0
├── fruits-delivery-notification-service:1.0.0
└── fruits-delivery-frontend:1.0.0
```

## 📦 Dependencies Summary

### Backend Common
- express (web framework)
- mongoose (database ODM)
- jsonwebtoken (authentication)
- bcryptjs (password hashing)
- dotenv (environment config)
- cors (cross-origin)

### Frontend
- react (UI library)
- react-router-dom (navigation)
- axios (HTTP client)
- zustand (state management)
- tailwindcss (styling)
- react-hot-toast (notifications)

### DevOps
- docker (containerization)
- docker-compose (orchestration)
- jenkins (CI/CD)
- git (version control)

## 🔄 Communication Flow

### Synchronous (REST APIs)
```
Frontend → API Gateway → Service → MongoDB
                             ↓
                        Response → Frontend
```

### Asynchronous (Email Notifications)
```
Order Service → Notification Service → Email Server → User
```

### Inter-service Communication
```
Order Service → Product Service (verify inventory)
Order Service → Payment Service (process payment)
Order Service → Notification Service (send email)
```

## 📈 Scalability Considerations

### Current Setup
- Single MongoDB instance
- Services run in Docker containers
- Can be scaled horizontally with Docker Compose

### Enterprise Setup
- Kubernetes orchestration
- MongoDB Replica Sets
- Service mesh (Istio)
- Load balancing (Nginx)
- Caching layer (Redis)
- Message queue (RabbitMQ)

## 🔐 Security Features

### API Security
- JWT token validation
- Rate limiting
- CORS protection
- Input validation
- Helmet.js security headers

### Data Security
- Password hashing (bcryptjs)
- Environment variables for secrets
- MongoDB authentication
- SSL/TLS encryption (production)

## 📊 Monitoring Points

### Health Checks
```
GET /health on each service
- API Gateway (3000)
- Auth Service (3001)
- Product Service (3002)
- Order Service (3003)
- Payment Service (3004)
- Notification Service (3005)
```

### Logs
- Application logs (console + file)
- Database query logs
- API request/response logs
- Error tracking

## 🎯 Key Features Implementation

| Feature | Service | Component |
|---------|---------|-----------|
| User Auth | Auth Service | Login/Signup Pages |
| Browse Products | Product Service | ProductListing |
| Add to Cart | Frontend | Cart.jsx + Zustand |
| Checkout | Order Service | Checkout.jsx |
| Payment | Payment Service | Stripe Integration |
| Order Tracking | Order Service | OrderTracking.jsx |
| Notifications | Notification Service | Email Service |

## 📝 File Statistics

```
Backend Services: 6 services
├── API Gateway: 1 file (index.js)
├── Auth Service: 1 file (index.js)
├── Product Service: 1 file (index.js)
├── Order Service: 1 file (index.js)
├── Payment Service: 1 file (index.js)
└── Notification Service: 1 file (index.js)

Frontend:
├── Components: 7 files
├── API: 1 file
├── Store: 1 file
└── Config: 2 files (vite, tailwind)

DevOps:
├── Docker Compose: 3 files
├── Dockerfile: 7 files (1 per service + frontend)
└── Jenkinsfile: 1 file

Documentation:
├── README.md (main)
├── QUICKSTART.md
├── ARCHITECTURE.md
├── TROUBLESHOOTING.md
├── SEED_DATA.md
└── PROJECT_STRUCTURE.md (this file)

Total: ~60+ files organized in microservices structure
```

---

🎉 **Project Complete!**

All files created with:
✅ Best practices for microservices
✅ Professional UI/UX design
✅ Docker containerization
✅ Jenkins CI/CD pipeline
✅ Comprehensive documentation
✅ Production-ready configuration

**Next Steps:**
1. Run `docker-compose up -d`
2. Access frontend at `http://localhost:5173`
3. Test APIs at `http://localhost:3000`
4. Set up Jenkins pipeline
5. Deploy to production
