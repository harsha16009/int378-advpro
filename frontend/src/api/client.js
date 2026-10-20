import axios from 'axios';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Dynamic resolution for browser environments
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Kubernetes NodePort mapping: frontend is on 31730, gateway is on 30000
    if (port === '31730') {
      return `http://${hostname}:30000/api`;
    }
    
    // Dev server / Docker-compose mapping: frontend on 5173, gateway on 3000
    if (port === '5173') {
      return `http://${hostname}:3000/api`;
    }
    
    // Fallback to same host on gateway port 3000
    return `http://${hostname}:3000/api`;
  }
  
  return 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

// Helper to retrieve auth token from localStorage if not passed explicitly
function getAuthToken() {
  return localStorage.getItem('token');
}


// Auth Service
export const authAPI = {
  register: (userData) => axios.post(`${API_URL}/auth/register`, userData),
  login: (email, password) => axios.post(`${API_URL}/auth/login`, { email, password }),
  sendOtp: (phone) => axios.post(`${API_URL}/auth/phone/send-otp`, { phone }),
  verifyOtp: (phone, otp, name) => axios.post(`${API_URL}/auth/phone/verify-otp`, { phone, otp, name }),
  googleLogin: (payload) => axios.post(`${API_URL}/auth/google`, payload),
  searchUsers: (query) => axios.get(`${API_URL}/auth/users/search`, { params: { q: query } }),
  getAllUsers: () => axios.get(`${API_URL}/auth/users`),
  getProfile: (userId, token) => axios.get(`${API_URL}/auth/profile/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
};

// Product Service
export const productAPI = {
  getAllProducts: (params = {}) => axios.get(`${API_URL}/products`, { params }),
  getProductById: (id) => axios.get(`${API_URL}/products/${id}`),
  getByCategory: (category) => axios.get(`${API_URL}/products/category/${category}`),
  addReview: (productId, review) => axios.post(`${API_URL}/products/${productId}/review`, review)
};

// Order Service
export const orderAPI = {
  createOrder: (orderData, token) => axios.post(`${API_URL}/orders`, orderData, {
    headers: { Authorization: `Bearer ${token ?? getAuthToken()}` }
  }),
  getUserOrders: (userId, token) => axios.get(`${API_URL}/orders/user/${userId}`, {
    headers: { Authorization: `Bearer ${token ?? getAuthToken()}` }
  }),
  getOrderById: (orderId, token) => axios.get(`${API_URL}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token ?? getAuthToken()}` }
  }),
  updateOrderStatus: (orderId, status, token) => axios.put(`${API_URL}/orders/${orderId}/status`, { status }, {
    headers: { Authorization: `Bearer ${token ?? getAuthToken()}` }
  }),
  cancelOrder: (orderId, token) => axios.put(`${API_URL}/orders/${orderId}/cancel`, {}, {
    headers: { Authorization: `Bearer ${token ?? getAuthToken()}` }
  })
};

// Payment Service (Stripe, UPI, Wallet, Cash, Cashfree)
export const paymentAPI = {
  createPayment: (paymentData, token) => axios.post(`${API_URL}/payments/create`, paymentData, {
    headers: { Authorization: `Bearer ${token ?? getAuthToken()}` }
  }),
  confirmPayment: (confirmData, token) => axios.post(`${API_URL}/payments/confirm`, confirmData, {
    headers: { Authorization: `Bearer ${token ?? getAuthToken()}` }
  }),
  createCashfreeQr: (data, token) => axios.post(`${API_URL}/payments/cashfree/create-qr`, data, {
    headers: { Authorization: `Bearer ${token ?? getAuthToken()}` }
  }),
  sendCashfreeOtp: (data, token) => axios.post(`${API_URL}/payments/cashfree/send-otp`, data, {
    headers: { Authorization: `Bearer ${token ?? getAuthToken()}` }
  }),
  verifyCashfreeOtp: (data, token) => axios.post(`${API_URL}/payments/cashfree/verify-otp`, data, {
    headers: { Authorization: `Bearer ${token ?? getAuthToken()}` }
  }),
  verifyCashfree: (data, token) => axios.post(`${API_URL}/payments/cashfree/verify`, data, {
    headers: { Authorization: `Bearer ${token ?? getAuthToken()}` }
  }),
  getPaymentDetails: (paymentId, token) => axios.get(`${API_URL}/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token ?? getAuthToken()}` }
  }),
  refundPayment: (paymentId, token) => axios.post(`${API_URL}/payments/${paymentId}/refund`, {}, {
    headers: { Authorization: `Bearer ${token ?? getAuthToken()}` }
  })
};


// Tracking Service (Real-Time GPS & Map)
export const trackingAPI = {
  getTracking: (orderId) => axios.get(`${API_URL}/tracking/${orderId}`),
  updateLocation: (data) => axios.post(`${API_URL}/tracking/update-location`, data),
  updateStatus: (orderId, status) => axios.post(`${API_URL}/tracking/update-status`, { orderId, status }),
  simulateTracking: (orderId) => axios.post(`${API_URL}/tracking/simulate/${orderId}`)
};

// Chat Service (Real-Time 1-to-1 Chat)
export const chatAPI = {
  sendMessage: (payload) => axios.post(`${API_URL}/chat/send`, payload),
  getThreadMessages: (threadId, page = 1, limit = 50) => axios.get(`${API_URL}/chat/thread/${threadId}`, {
    params: { page, limit }
  }),
  getUserThreads: (userId) => axios.get(`${API_URL}/chat/user-threads/${userId}`),
  createThread: (payload) => axios.post(`${API_URL}/chat/thread/create`, payload),
  getOnlineUsers: () => axios.get(`${API_URL}/chat/online-users`)
};

export default API_URL;
