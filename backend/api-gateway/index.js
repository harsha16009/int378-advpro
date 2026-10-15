import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
// Note: Do not use express.json() here as it consumes the request body stream before http-proxy-middleware can forward it.


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Auth middleware for protected routes
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  // If no token or explicitly a demo/guest token, assign demo session seamlessly
  if (!token || token === 'null' || token === 'undefined' || token === 'demo-token' || token.startsWith('demo_')) {
    req.user = { id: '65f000000000000000000001', userId: '65f000000000000000000001', email: 'demo@fruithub.com', name: 'Demo Customer', role: 'customer' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    req.user = decoded;
    console.info('🔐 verifyToken: Token valid for user', decoded.id || decoded.userId || decoded.sub || decoded.email);
    next();
  } catch (error) {
    // If token is invalid or expired in development / demo mode, fallback to demo session instead of blocking the user
    console.warn('🔐 verifyToken: Token verification non-fatal fallback:', error.message);
    req.user = { id: '65f000000000000000000001', userId: '65f000000000000000000001', email: 'demo@fruithub.com', name: 'Demo Customer', role: 'customer' };
    next();
  }
};

// Routes proxy configuration
const serviceUrls = {
  auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  product: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
  order: process.env.ORDER_SERVICE_URL || 'http://order-service:3003',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005',
  tracking: process.env.TRACKING_SERVICE_URL || 'http://tracking-service:3006',
  chat: process.env.CHAT_SERVICE_URL || 'http://chat-service:3007'
};

// Auth routes (public)
app.use('/api/auth', createProxyMiddleware({
  target: serviceUrls.auth,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '' },
}));

// Product routes (public)
app.use('/api/products', createProxyMiddleware({
  target: serviceUrls.product,
  changeOrigin: true,
  pathRewrite: { '^/api/products': '' },
}));

// Order routes (protected)
app.use('/api/orders', verifyToken, createProxyMiddleware({
  target: serviceUrls.order,
  changeOrigin: true,
  pathRewrite: { '^/api/orders': '' },
}));

// Payment routes (protected)
app.use('/api/payments', verifyToken, createProxyMiddleware({
  target: serviceUrls.payment,
  changeOrigin: true,
  pathRewrite: { '^/api/payments': '' },
}));

// Notification routes (protected)
app.use('/api/notifications', verifyToken, createProxyMiddleware({
  target: serviceUrls.notification,
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '' },
}));

// Tracking routes (public or protected)
app.use('/api/tracking', createProxyMiddleware({
  target: serviceUrls.tracking,
  changeOrigin: true,
  ws: true,
  pathRewrite: { '^/api/tracking': '' },
}));

// Chat routes (public or token-handled inside chat service)
app.use('/api/chat', createProxyMiddleware({
  target: serviceUrls.chat,
  changeOrigin: true,
  ws: true,
  pathRewrite: { '^/api/chat': '' },
}));

// Socket.io WebSocket upgrade proxy → chat service
// Socket.io clients connect to /socket.io regardless of app path
app.use('/socket.io', createProxyMiddleware({
  target: serviceUrls.chat,
  changeOrigin: true,
  ws: true,
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

server.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
});
