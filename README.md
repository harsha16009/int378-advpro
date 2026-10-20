# 🍎 FruitHub - Microservices Fruits Delivery Platform

A modern, scalable fruits delivery platform built with microservices architecture, similar to Blinkit. Features fast delivery, real-time order tracking, and seamless payments.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Frontend (React 19 + Vite)                     │
│                Tailwind CSS + Zustand + Real-Time WebSockets            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       🌐 API Gateway (Port 3000)                        │
│            Express + HTTP Reverse Proxy + WebSocket Upgrade             │
└──┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────────┬┘
   │          │          │          │          │          │              │
   ▼          ▼          ▼          ▼          ▼          ▼              ▼
┌──────┐ ┌──────────┐ ┌─────────┐ ┌──────┐ ┌────────────┐ ┌──────────┐ ┌────────┐
│Auth  │ │ Product  │ │ Order   │ │Pay.  │ │Notification│ │ Tracking │ │  Chat  │
│(3001)│ │ (3002)   │ │ (3003)  │ │(3004)│ │   (3005)   │ │  (3006)  │ │ (3007) │
└──────┘ └──────────┘ └─────────┘ └──────┘ └────────────┘ └──────────┘ └────────┘
   │          │          │          │          │              │          │
   └──────────┴──────────┴──────────┴──────────┴──────────────┴──────────┴──┐
                                                                            │
                                                                            ▼
                                                                      ┌───────────┐
                                                                      │  MongoDB  │
                                                                      │ Shared DB │
                                                                      └───────────┘

📊 External Gateways & Integrations:
├─ Cashfree Payment Gateway (Instant UPI QR, Payment Links, Webhooks)
├─ Google OAuth 2.0 & Phone OTP Verification
├─ Google Maps & Real-Time GPS Telemetry
├─ Stripe (Cards) & Digital Wallets
├─ Gmail (Email Notifications)
└─ Terraform Infrastructure as Code (AWS VPC, Subnets, ECS, ALB, DocumentDB)
```

## 🚀 Microservices Overview

### 1. **API Gateway** (Port: 3000)
- Unified entry point for all client requests
- Reverse proxies to microservices (Auth, Products, Orders, Payments, Notifications, Tracking, Chat)
- WebSocket / Socket.IO upgrade proxying
- Rate limiting & JWT security verification

### 2. **Auth Service** (Port: 3001)
- User registration & password login (bcryptjs + JWT)
- Phone-number login with 6-digit OTP verification & rate limiting
- Google OAuth 2.0 sign-in and automated account linking
- User search for real-time contact discovery

### 3. **Product Service** (Port: 3002)
- Product catalog, category filtering, inventory management
- Fruit nutrition facts, reviews, and organic add-ons

### 4. **Order Service** (Port: 3003)
- Order placement and lifecycle tracking (placed → confirmed → preparing → picked_up → out_for_delivery → delivered)
- Live coordination with Tracking Service and Payment status synchronization

### 5. **Payment Service** (Port: 3004)
- **Cashfree Payments** integration (Dynamic UPI QR generation & hosted payment links)
- Stripe credit/debit card processing
- Digital wallets, UPI, and Cash on Delivery (COD)

### 6. **Notification Service** (Port: 3005)
- Automated order confirmation emails
- Real-time delivery status email notifications via Nodemailer

### 7. **Tracking Service** (Port: 3006)
- Real-time GPS order & delivery partner tracking
- Interactive Google Maps integration with route polylines and live scooter marker movement
- Sub-second Socket.IO position broadcasting
- Live route simulation engine and device geolocation broadcasting mode

### 8. **Chat Service** (Port: 3007)
- Real-time 1-to-1 messaging based on `chat_practice`
- Socket.IO instant delivery, typing indicators, read receipts, and online status
- Thread conversation history and unread counters

## ☁️ DevOps & Infrastructure as Code (Terraform)

Located in `demo-micro/terraform/`:
- **VPC Module**: Custom VPC, 2 public subnets, 2 private subnets, Internet Gateway, route tables.
- **Security Module**: Least-privilege security groups for ALB, ECS Fargate containers, and DocumentDB.
- **Compute Module**: ECS Cluster, Application Load Balancer (ALB), Target Groups, IAM execution roles.
- **Database Module**: MongoDB-compatible AWS DocumentDB cluster with automated backups.
- **Environments**: Modular configurations for `dev` and `prod`.

### Terraform Commands:
```bash
cd terraform
terraform init
terraform plan -var-file="environments/dev/terraform.tfvars"
terraform apply -var-file="environments/dev/terraform.tfvars"
```

## 📦 Tech Stack

### Backend
- **Node.js** - Runtime
- **Express.js** - API Framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Stripe** - Payment Processing
- **Nodemailer** - Email Service

### Frontend
- **React 19** - UI Library
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Zustand** - State Management
- **React Router** - Navigation
- **Axios** - HTTP Client
- **React Hot Toast** - Notifications

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **Jenkins** - CI/CD Pipeline
- **MongoDB** - Database

## 🎯 Features

✅ **User Authentication**
- Secure registration & login
- JWT-based authentication
- Profile management

✅ **Product Management**
- 🍎 Pomegranate, Apples, Oranges, Mangoes, Bananas, Grapes
- Nutritional information
- Add-ons (organic, pesticide-free)
- Reviews & ratings

✅ **Shopping Cart**
- Add/remove items
- Quantity management
- Persistent cart storage
- Promo code support

✅ **Ordering System**
- Real-time order placement
- Delivery address management
- Order notes/instructions
- Status tracking

✅ **Payments**
- Multiple payment methods:
  - 💳 Credit/Debit Card (Stripe)
  - 📱 UPI (Razorpay)
  - 👛 Digital Wallet
  - 💵 Cash on Delivery

✅ **Order Tracking**
- Real-time status updates
- Estimated delivery time
- Status timeline
- Order history

✅ **Notifications**
- Order confirmation emails
- Delivery status updates
- Payment receipts

## 📋 Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- MongoDB
- Git

## 🚀 Quick Start

### Using Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd fruits-delivery-microservices

# 2. Start all services
docker-compose up -d

# 3. Create seed data (products)
# Access the API at: http://localhost:3000
# Frontend at: http://localhost:5173

# 4. Stop services
docker-compose down
```

### Local Development Setup

```bash
# 1. Install dependencies for each service
cd backend/api-gateway && npm install
cd ../auth-service && npm install
cd ../product-service && npm install
cd ../order-service && npm install
cd ../payment-service && npm install
cd ../notification-service && npm install
cd ../../frontend && npm install

# 2. Start MongoDB locally (or using Docker)
docker run -d -p 27017:27017 --name mongo -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=admin123 mongo:6.0

# 3. Configure environment variables
# Copy .env files and update configurations

# 4. Start each service
# Terminal 1: API Gateway
cd backend/api-gateway && npm run dev

# Terminal 2: Auth Service
cd backend/auth-service && npm run dev

# Terminal 3: Product Service
cd backend/product-service && npm run dev

# Terminal 4: Order Service
cd backend/order-service && npm run dev

# Terminal 5: Payment Service
cd backend/payment-service && npm run dev

# Terminal 6: Notification Service
cd backend/notification-service && npm run dev

# Terminal 7: Frontend
cd frontend && npm run dev

# Access the application at http://localhost:5173
```

## 🔑 Environment Variables

### API Gateway (.env)
```env
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
AUTH_SERVICE_URL=http://auth-service:3001
PRODUCT_SERVICE_URL=http://product-service:3002
ORDER_SERVICE_URL=http://order-service:3003
PAYMENT_SERVICE_URL=http://payment-service:3004
NOTIFICATION_SERVICE_URL=http://notification-service:3005
```

### Auth Service (.env)
```env
AUTH_PORT=3001
MONGO_AUTH_URI=mongodb://admin:admin123@mongo:27017/auth-db?authSource=admin
JWT_SECRET=your-secret-key-change-in-production
```

### Payment Service (.env)
```env
PAYMENT_PORT=3004
MONGO_PAYMENT_URI=mongodb://admin:admin123@mongo:27017/payment-db?authSource=admin
STRIPE_SECRET_KEY=sk_test_your_stripe_key_here
ORDER_SERVICE_URL=http://order-service:3003
```

### Notification Service (.env)
```env
NOTIFICATION_PORT=3005
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile/:userId` - Get user profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `GET /api/products/category/:category` - Get products by category
- `POST /api/products/:id/review` - Add review

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/user/:userId` - Get user orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/cancel` - Cancel order

### Payments
- `POST /api/payments/create` - Create payment
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/payments/:paymentId/refund` - Refund payment

## 🔄 CI/CD Pipeline (Jenkins)

### Pipeline Stages
1. **Checkout** - Clone repository
2. **Build Services** - Parallel build of all microservices
3. **Build Frontend** - Build React application
4. **Push Images** - Push Docker images to registry
5. **Deploy Staging** - Deploy to staging environment
6. **Run Tests** - Health checks for all services
7. **Deploy Production** - Deploy to production (main branch only)

### Jenkins Setup

```groovy
# Create Jenkinsfile trigger
- Configure webhook in GitHub
- Set build triggers to "GitHub hook trigger"
- Add Docker registry credentials
```

## 🐳 Docker Commands

```bash
# Build all services
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose stop

# Remove containers
docker-compose down

# Remove volumes
docker-compose down -v
```

## 📱 Frontend Features

### Pages
- **Home/Products** - Browse all fruits
- **Product Details** - View product info & reviews
- **Cart** - Manage cart items
- **Checkout** - Place order
- **Order Tracking** - Real-time status updates
- **Profile** - User information
- **Order History** - Past orders

### UI/UX
- Responsive design (mobile-first)
- Dark mode ready
- Real-time notifications
- Smooth animations
- Loading states
- Error handling

## 🛠️ Database Schema

### Users
```javascript
{
  name: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  address: String,
  role: String (user/admin/delivery),
  createdAt: Date
}
```

### Products
```javascript
{
  name: String,
  category: String,
  description: String,
  price: Number,
  originalPrice: Number,
  quantity: Number,
  unit: String (kg/piece/pack),
  image: String,
  rating: Number,
  reviews: Array,
  addOns: Array,
  nutritionInfo: Object,
  createdAt: Date
}
```

### Orders
```javascript
{
  userId: String,
  items: Array,
  totalAmount: Number,
  deliveryCharge: Number,
  discount: Number,
  finalAmount: Number,
  deliveryAddress: Object,
  status: String (pending/confirmed/preparing/out-for-delivery/delivered),
  paymentStatus: String,
  paymentMethod: String,
  estimatedDelivery: Number,
  notes: String,
  createdAt: Date
}
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing (bcryptjs)
- CORS protection
- Rate limiting
- Input validation
- Environment variables for secrets
- Helmet for HTTP headers

## 🧪 Testing

```bash
# Run tests for a service
cd backend/auth-service
npm test

# Run linting
npm run lint
```

## 🚀 Deployment

### Cloud Deployment Options
1. **AWS EC2** - VM-based deployment
2. **AWS ECS** - Container orchestration
3. **Kubernetes** - For production scaling
4. **Heroku** - Simple deployment
5. **DigitalOcean** - VPS or App Platform

### Health Checks
Each service has a `/health` endpoint for monitoring.

## 📞 Support & Contact

For issues and feature requests:
- GitHub Issues
- Email: support@fruithub.com
- Documentation: https://docs.fruithub.com

## 📄 License

MIT License - See LICENSE file

## 🎉 Future Enhancements

- [ ] Real-time chat with delivery partner
- [ ] Advanced filtering & search
- [ ] Subscription plans
- [ ] Loyalty rewards program
- [ ] Wishlist functionality
- [ ] AI-powered recommendations
- [ ] Multi-language support
- [ ] Admin dashboard
- [ ] Analytics & reporting

---

Made with ❤️ for fresh fruit lovers! 🍎🍊🍌🥭

<!-- Auto-trigger test at 10/20/2026 20:38:54 -->
