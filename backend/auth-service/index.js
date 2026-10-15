import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import validator from 'validator';

dotenv.config();

const app = express();
const PORT = process.env.AUTH_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoUri = process.env.MONGO_AUTH_URI || 'mongodb://mongo:27017/auth-db';

const seedDemoUser = async () => {
  try {
    const demoEmail = 'demo@fruithub.com';
    const existingUser = await mongoose.model('User').findOne({ email: demoEmail });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const demoUser = new (mongoose.model('User'))({
        name: 'Demo Customer',
        email: demoEmail,
        phone: '9876543210',
        password: hashedPassword,
        address: '123 Fresh Way, Orchard Valley'
      });
      await demoUser.save();
      console.log('✅ Demo user seeded: demo@fruithub.com / password123');
    } else {
      console.log('ℹ️ Demo user already exists.');
    }
  } catch (err) {
    console.log('⚠️ Error seeding demo user:', err.message);
  }
};

mongoose.connect(mongoUri)
  .then(() => {
    console.log('✅ Auth Service DB connected');
    seedDemoUser();
  })
  .catch(err => console.log('❌ DB Connection Error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: false },
  password: { type: String, required: false },
  address: String,
  googleId: String,
  isPhoneVerified: { type: Boolean, default: false },
  role: { type: String, default: 'user', enum: ['user', 'admin', 'delivery'] },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// OTP Schema with TTL expiration (5 minutes)
const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 300 }
});

const Otp = mongoose.model('Otp', otpSchema);

// In-memory rate limiting map for OTP requests: phone -> [timestamps]
const otpRateLimits = new Map();

// Helper to check OTP rate limit (max 4 per 15 minutes)
const checkOtpRateLimit = (phone) => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const history = otpRateLimits.get(phone) || [];
  const recent = history.filter(ts => now - ts < windowMs);
  if (recent.length >= 4) {
    return false;
  }
  recent.push(now);
  otpRateLimits.set(phone, recent);
  return true;
};

// Routes
// Register
app.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;

    // Validation
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      address
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Get user profile
app.get('/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Phone OTP - Send OTP
app.post('/phone/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.trim().length < 10) {
      return res.status(400).json({ message: 'Valid phone number is required' });
    }

    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);

    if (!checkOtpRateLimit(cleanPhone)) {
      return res.status(429).json({ message: 'Too many OTP requests. Please wait 15 minutes before requesting again.' });
    }

    // Generate secure 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete existing OTPs for this phone
    await Otp.deleteMany({ phone: cleanPhone });

    // Store new OTP
    await Otp.create({
      phone: cleanPhone,
      otp: generatedOtp,
      attempts: 0
    });

    console.log(`📱 [PHONE OTP] Generated for ${cleanPhone}: ${generatedOtp}`);

    // In production, integrate Twilio/Firebase/SMS gateway here
    res.json({
      success: true,
      message: 'OTP sent successfully to your phone number',
      phone: cleanPhone,
      // Dev helper for seamless testability
      devOtp: generatedOtp
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
});

// Phone OTP - Verify OTP & Login/Register
app.post('/phone/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);

    const record = await Otp.findOne({ phone: cleanPhone });
    if (!record) {
      return res.status(400).json({ message: 'OTP expired or not requested. Please request a new OTP.' });
    }

    if (record.attempts >= 5) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(429).json({ message: 'Maximum verification attempts exceeded. Please request a new OTP.' });
    }

    if (record.otp !== otp.trim()) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ message: 'Invalid OTP code. Please try again.' });
    }

    // Delete verified OTP record
    await Otp.deleteOne({ _id: record._id });

    // Find or create user by phone
    let user = await User.findOne({ phone: cleanPhone });
    if (!user) {
      user = new User({
        name: name || `FruitFan ${cleanPhone.slice(-4)}`,
        email: `${cleanPhone}@phone.fruithub.com`,
        phone: cleanPhone,
        isPhoneVerified: true,
        role: 'user'
      });
      await user.save();
    } else {
      user.isPhoneVerified = true;
      if (name && (!user.name || user.name.startsWith('FruitFan'))) {
        user.name = name;
      }
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, phone: user.phone },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Phone verification successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isPhoneVerified: true
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'OTP verification failed', error: error.message });
  }
});

// Google Sign-In & Account Linking
app.post('/google', async (req, res) => {
  try {
    const { email, name, googleId, picture } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Google account email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists by email or googleId
    let user = await User.findOne({
      $or: [{ email: cleanEmail }, { googleId }]
    });

    if (user) {
      // Link Google ID if not already linked
      if (!user.googleId && googleId) {
        user.googleId = googleId;
      }
      if (!user.name && name) {
        user.name = name;
      }
      await user.save();
    } else {
      // Create new user via Google
      user = new User({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        googleId: googleId || `google_${Date.now()}`,
        role: 'user'
      });
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
});

// Search users (for Chat)
app.get('/users/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const query = q.trim();
    if (!query) {
      const users = await User.find().select('name email phone role').limit(15);
      return res.json(users);
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    }).select('name email phone role').limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
});

// Get all registered users list (for Chat)
app.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('name email phone role').sort({ createdAt: -1 }).limit(30);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Auth Service is running' });
});

app.listen(PORT, () => {
  console.log(`🔐 Auth Service running on port ${PORT}`);
});
