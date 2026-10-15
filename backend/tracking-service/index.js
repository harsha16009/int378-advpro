import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.TRACKING_PORT || 3006;

// Socket.io initialization with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoUri = process.env.MONGO_TRACKING_URI || 'mongodb://mongo:27017/tracking-db';
mongoose.connect(mongoUri)
  .then(() => console.log('✅ Tracking Service DB connected'))
  .catch(err => console.log('❌ Tracking DB Connection Error:', err.message));

// Helper: Haversine distance in KM
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Generate intermediate route waypoints between start and end
function generateRouteWaypoints(start, end, steps = 15) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    // Add subtle curvature/jitter for realistic street navigation
    const jitterLat = Math.sin(ratio * Math.PI) * 0.0025;
    const jitterLng = Math.cos(ratio * Math.PI * 1.5) * 0.002;
    points.push({
      latitude: start.latitude + (end.latitude - start.latitude) * ratio + jitterLat,
      longitude: start.longitude + (end.longitude - start.longitude) * ratio + jitterLng
    });
  }
  return points;
}

// Tracking Schema
const trackingSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'preparing', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'placed'
  },
  deliveryPartner: {
    id: { type: String, default: 'dp_101' },
    name: { type: String, default: 'Rajesh Kumar' },
    phone: { type: String, default: '+91 98765 43210' },
    vehicleNumber: { type: String, default: 'KA-01-EQ-4492' },
    vehicleType: { type: String, default: 'Electric Cargo Scooter' },
    rating: { type: Number, default: 4.9 },
    photo: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }
  },
  storeLocation: {
    name: { type: String, default: 'FruitHub Central Hub (Store #12)' },
    latitude: { type: Number, default: 12.9716 },
    longitude: { type: Number, default: 77.5946 },
    address: { type: String, default: 'Brigade Road, Central Hub, Bengaluru' }
  },
  customerLocation: {
    latitude: { type: Number, default: 12.9850 },
    longitude: { type: Number, default: 77.6100 },
    address: { type: String, default: 'Customer Delivery Address' }
  },
  currentLocation: {
    latitude: { type: Number, default: 12.9716 },
    longitude: { type: Number, default: 77.5946 },
    heading: { type: Number, default: 45 },
    speed: { type: Number, default: 22 },
    updatedAt: { type: Date, default: Date.now }
  },
  routeWaypoints: [
    {
      latitude: Number,
      longitude: Number
    }
  ],
  estimatedTimeMinutes: { type: Number, default: 18 },
  distanceRemainingKm: { type: Number, default: 3.2 },
  updatedAt: { type: Date, default: Date.now }
});

const Tracking = mongoose.model('Tracking', trackingSchema);

// Active in-memory simulation timers
const activeSimulations = new Map();

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log(`🔌 Tracking client connected: ${socket.id}`);

  // Client subscribes to specific order updates
  socket.on('join_order_tracking', async (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`📡 Socket ${socket.id} joined tracking for order: ${orderId}`);

    // Send latest tracking data immediately
    try {
      let tracking = await Tracking.findOne({ orderId });
      if (tracking) {
        socket.emit('tracking_update', tracking);
      }
    } catch (e) {
      console.warn('Error emitting initial tracking state:', e.message);
    }
  });

  // Delivery Partner live GPS broadcast
  socket.on('partner_location_update', async (data) => {
    const { orderId, latitude, longitude, heading, speed } = data;
    try {
      const tracking = await Tracking.findOne({ orderId });
      if (tracking) {
        tracking.currentLocation = {
          latitude,
          longitude,
          heading: heading || 0,
          speed: speed || 20,
          updatedAt: new Date()
        };

        // Recalculate distance
        const dist = calculateDistanceKm(latitude, longitude, tracking.customerLocation.latitude, tracking.customerLocation.longitude);
        tracking.distanceRemainingKm = dist;
        tracking.estimatedTimeMinutes = Math.max(1, Math.round((dist / 20) * 60));
        tracking.updatedAt = new Date();
        await tracking.save();

        io.to(`order_${orderId}`).emit('tracking_update', tracking);
      }
    } catch (err) {
      console.error('Error handling partner location update:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Tracking client disconnected: ${socket.id}`);
  });
});

// Run live simulation of partner driving from store to customer
function runDriverSimulation(orderId) {
  if (activeSimulations.has(orderId)) {
    clearInterval(activeSimulations.get(orderId));
  }

  let step = 0;
  const interval = setInterval(async () => {
    try {
      const tracking = await Tracking.findOne({ orderId });
      if (!tracking || !tracking.routeWaypoints || tracking.routeWaypoints.length === 0) {
        clearInterval(interval);
        activeSimulations.delete(orderId);
        return;
      }

      const totalSteps = tracking.routeWaypoints.length;
      if (step >= totalSteps) {
        tracking.status = 'delivered';
        tracking.distanceRemainingKm = 0;
        tracking.estimatedTimeMinutes = 0;
        tracking.currentLocation = {
          latitude: tracking.customerLocation.latitude,
          longitude: tracking.customerLocation.longitude,
          heading: 0,
          speed: 0,
          updatedAt: new Date()
        };
        await tracking.save();
        io.to(`order_${orderId}`).emit('tracking_update', tracking);

        // Notify Order Service of completion
        try {
          await axios.put(`${process.env.ORDER_SERVICE_URL || 'http://order-service:3003'}/${orderId}/status`, {
            status: 'delivered'
          });
        } catch (e) {
          console.warn('Could not update order service on simulation end:', e.message);
        }

        clearInterval(interval);
        activeSimulations.delete(orderId);
        console.log(`🏁 Simulation for order ${orderId} reached DELIVERED`);
        return;
      }

      const currentPoint = tracking.routeWaypoints[step];
      const dist = calculateDistanceKm(
        currentPoint.latitude,
        currentPoint.longitude,
        tracking.customerLocation.latitude,
        tracking.customerLocation.longitude
      );

      // Status transitions based on progress
      if (step === 1 && tracking.status === 'confirmed') {
        tracking.status = 'preparing';
      } else if (step === 3 && tracking.status === 'preparing') {
        tracking.status = 'picked_up';
      } else if (step === 5 && tracking.status === 'picked_up') {
        tracking.status = 'out_for_delivery';
      }

      tracking.currentLocation = {
        latitude: currentPoint.latitude,
        longitude: currentPoint.longitude,
        heading: Math.floor(Math.random() * 360),
        speed: Math.floor(20 + Math.random() * 15),
        updatedAt: new Date()
      };
      tracking.distanceRemainingKm = dist;
      tracking.estimatedTimeMinutes = Math.max(1, Math.round((dist / 22) * 60));
      tracking.updatedAt = new Date();
      await tracking.save();

      io.to(`order_${orderId}`).emit('tracking_update', tracking);
      step++;
    } catch (err) {
      console.error('Error during simulation step:', err.message);
      clearInterval(interval);
      activeSimulations.delete(orderId);
    }
  }, 3000); // Progress every 3 seconds

  activeSimulations.set(orderId, interval);
}

// REST Endpoints
// Get tracking snapshot for an order (creates realistic tracking entry if none exists)
app.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    let tracking = await Tracking.findOne({ orderId });

    if (!tracking) {
      // Auto initialize tracking with realistic store and delivery locations
      const store = {
        name: 'FruitHub Fresh Mart - Flagship Hub',
        latitude: 12.9716,
        longitude: 77.5946,
        address: '100 Feet Road, Indiranagar, Bengaluru'
      };

      // Random customer destination 2.5-4km away
      const destLat = store.latitude + (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
      const destLng = store.longitude + (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
      const customer = {
        latitude: destLat,
        longitude: destLng,
        address: 'Customer Delivery Destination'
      };

      const waypoints = generateRouteWaypoints(store, customer, 16);
      const distance = calculateDistanceKm(store.latitude, store.longitude, customer.latitude, customer.longitude);

      tracking = new Tracking({
        orderId,
        status: 'confirmed',
        storeLocation: store,
        customerLocation: customer,
        currentLocation: {
          latitude: store.latitude,
          longitude: store.longitude,
          heading: 0,
          speed: 0
        },
        routeWaypoints: waypoints,
        distanceRemainingKm: distance,
        estimatedTimeMinutes: Math.round((distance / 20) * 60) + 5
      });

      await tracking.save();
    }

    res.json(tracking);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tracking details', error: error.message });
  }
});

// Partner updates real GPS position via HTTP
app.post('/update-location', async (req, res) => {
  try {
    const { orderId, latitude, longitude, heading, speed } = req.body;
    if (!orderId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'orderId, latitude, and longitude are required' });
    }

    const tracking = await Tracking.findOne({ orderId });
    if (!tracking) {
      return res.status(404).json({ message: 'Tracking record not found' });
    }

    tracking.currentLocation = {
      latitude,
      longitude,
      heading: heading || 0,
      speed: speed || 20,
      updatedAt: new Date()
    };

    const dist = calculateDistanceKm(latitude, longitude, tracking.customerLocation.latitude, tracking.customerLocation.longitude);
    tracking.distanceRemainingKm = dist;
    tracking.estimatedTimeMinutes = Math.max(1, Math.round((dist / 20) * 60));
    tracking.updatedAt = new Date();
    await tracking.save();

    io.to(`order_${orderId}`).emit('tracking_update', tracking);
    res.json({ message: 'Location updated', tracking });
  } catch (error) {
    res.status(500).json({ message: 'Error updating location', error: error.message });
  }
});

// Update status
app.post('/update-status', async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const tracking = await Tracking.findOne({ orderId });
    if (!tracking) {
      return res.status(404).json({ message: 'Tracking record not found' });
    }

    tracking.status = status;
    tracking.updatedAt = new Date();
    await tracking.save();

    io.to(`order_${orderId}`).emit('tracking_update', tracking);

    if (status === 'out_for_delivery') {
      runDriverSimulation(orderId);
    }

    res.json(tracking);
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
});

// Trigger route simulation
app.post('/simulate/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    let tracking = await Tracking.findOne({ orderId });
    if (!tracking) {
      // Initialize tracking first
      const store = {
        name: 'FruitHub Central Hub',
        latitude: 12.9716,
        longitude: 77.5946,
        address: '100 Feet Road, Bengaluru'
      };
      const customer = {
        latitude: 12.9850,
        longitude: 77.6100,
        address: 'Customer Delivery Address'
      };
      const waypoints = generateRouteWaypoints(store, customer, 16);
      tracking = await Tracking.create({
        orderId,
        status: 'out_for_delivery',
        storeLocation: store,
        customerLocation: customer,
        currentLocation: {
          latitude: store.latitude,
          longitude: store.longitude
        },
        routeWaypoints: waypoints,
        distanceRemainingKm: 3.2,
        estimatedTimeMinutes: 15
      });
    } else {
      tracking.status = 'out_for_delivery';
      await tracking.save();
    }

    runDriverSimulation(orderId);
    res.json({ message: 'Live GPS simulation started', orderId });
  } catch (error) {
    res.status(500).json({ message: 'Error starting simulation', error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Tracking Service is running', activeSimulations: activeSimulations.size });
});

server.listen(PORT, () => {
  console.log(`📍 Real-Time Tracking Service running on port ${PORT}`);
});
