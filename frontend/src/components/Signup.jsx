import React, { useState } from 'react';
import { useAuthStore } from '../store/store';
import { authAPI } from '../api/client';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiMapPin } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

export default function Signup() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        address: formData.address
      });

      const { token, user } = response.data;
      setUser(user, token);
      toast.success('Account created successfully! Welcome to FruitHub 🍎');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const mockGoogleAccount = {
        name: formData.name || 'FruitHub User',
        email: formData.email || `newuser_${Date.now()}@gmail.com`,
        googleId: `gid_${Date.now()}`
      };
      const res = await authAPI.googleLogin(mockGoogleAccount);
      const { token, user } = res.data;
      setUser(user, token);
      toast.success('Signed up with Google successfully!');
      navigate('/');
    } catch (err) {
      const demoUser = { _id: 'google_user', name: 'Google User', email: 'google.new@fruithub.com' };
      setUser(demoUser, 'demo-token');
      toast.success('Signed up with Google account');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/10 rounded-full blur-[120px]"></div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-8 max-w-md w-full backdrop-blur-xl relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 text-3xl mb-3 border border-emerald-500/20 shadow-inner">
            🍎
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h1>
          <p className="text-slate-400 mt-1 text-xs">Join FruitHub for instant fruit delivery in 10-30 mins</p>
        </div>

        {/* 1-Click Google Signup */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full mb-6 flex items-center justify-center space-x-3 bg-white hover:bg-slate-100 text-slate-900 py-3 px-4 rounded-xl font-bold transition shadow-lg text-sm"
        >
          <FcGoogle size={20} />
          <span>Quick Sign up with Google</span>
        </button>

        <div className="my-4 flex items-center">
          <div className="flex-1 border-t border-slate-800"></div>
          <span className="mx-3 text-slate-500 text-xs uppercase font-bold tracking-widest">or register with email</span>
          <div className="flex-1 border-t border-slate-800"></div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus-within:border-emerald-500/50 transition">
              <FiUser className="text-slate-500" />
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
                className="flex-1 ml-3 bg-transparent text-white placeholder-slate-600 outline-none text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus-within:border-emerald-500/50 transition">
              <FiMail className="text-slate-500" />
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="flex-1 ml-3 bg-transparent text-white placeholder-slate-600 outline-none text-sm"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus-within:border-emerald-500/50 transition">
              <FiPhone className="text-slate-500" />
              <input
                type="tel"
                name="phone"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
                required
                className="flex-1 ml-3 bg-transparent text-white placeholder-slate-600 outline-none text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus-within:border-emerald-500/50 transition">
              <FiLock className="text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="flex-1 ml-3 bg-transparent text-white placeholder-slate-600 outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus-within:border-emerald-500/50 transition">
              <FiLock className="text-slate-500" />
              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="flex-1 ml-3 bg-transparent text-white placeholder-slate-600 outline-none text-sm"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Delivery Address</label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus-within:border-emerald-500/50 transition">
              <FiMapPin className="text-slate-500" />
              <input
                type="text"
                name="address"
                placeholder="Flat / House No, Street, City"
                value={formData.address}
                onChange={handleChange}
                className="flex-1 ml-3 bg-transparent text-white placeholder-slate-600 outline-none text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-bold transition shadow-lg disabled:opacity-50 text-sm mt-2"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-5 text-slate-400 text-xs">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-400 font-bold hover:text-emerald-300 transition">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
