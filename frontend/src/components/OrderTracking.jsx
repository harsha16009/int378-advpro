import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI, trackingAPI } from '../api/client';
import { useAuthStore } from '../store/store';
import io from 'socket.io-client';
import { 
  FiTruck, FiCheckCircle, FiClock, FiMapPin, FiNavigation, 
  FiPhone, FiMessageSquare, FiShield, FiPlay, FiCompass, FiShare2 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const ORDER_STAGES = [
  { key: 'placed', label: 'Order Placed', icon: '📝', desc: 'Your order was received' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅', desc: 'Order accepted by store' },
  { key: 'preparing', label: 'Preparing', icon: '📦', desc: 'Fresh fruits being packed' },
  { key: 'picked_up', label: 'Picked Up', icon: '🛵', desc: 'Partner has picked up package' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '⚡', desc: 'On the way to your door' },
  { key: 'delivered', label: 'Delivered', icon: '🎉', desc: 'Enjoy your fresh fruits!' }
];

export default function OrderTracking() {
  const { orderId } = useParams();
  const { user, token } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isBroadcastingGps, setIsBroadcastingGps] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  // Fetch Order and Tracking details on mount
  useEffect(() => {
    fetchData();

    // Initialize Socket.io connection for tracking
    // Connect directly or via Gateway
    const socketHost = window.location.hostname;
    const socketPort = window.location.port === '31730' ? '30000' : '3006'; // default tracking port or k8s nodeport
    const socketUrl = `http://${socketHost}:${socketPort}`;

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('📡 Connected to tracking websocket');
      socket.emit('join_order_tracking', orderId);
    });

    socket.on('tracking_update', (updatedTracking) => {
      setTracking(updatedTracking);
      if (updatedTracking.status === 'delivered') {
        setIsSimulating(false);
      }
    });

    // Fallback polling every 4 seconds in case websockets are restricted
    const interval = setInterval(fetchTrackingOnly, 4000);

    return () => {
      clearInterval(interval);
      if (socketRef.current) socketRef.current.disconnect();
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [orderId]);

  const fetchData = async () => {
    try {
      const [orderRes, trackRes] = await Promise.allSettled([
        orderAPI.getOrderById(orderId, token),
        trackingAPI.getTracking(orderId)
      ]);

      if (orderRes.status === 'fulfilled') {
        setOrder(orderRes.value.data);
      }
      if (trackRes.status === 'fulfilled') {
        setTracking(trackRes.value.data);
      }
    } catch (e) {
      console.warn('Initial tracking fetch note:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingOnly = async () => {
    try {
      const res = await trackingAPI.getTracking(orderId);
      if (res.data) setTracking(res.data);
    } catch (e) {
      // ignore silent poll errors
    }
  };

  // Start live GPS Route Simulation
  const handleStartSimulation = async () => {
    setIsSimulating(true);
    toast.success('Live GPS scooter route simulation initiated! 🛵');
    try {
      await trackingAPI.simulateTracking(orderId);
    } catch (e) {
      toast.error('Simulation error: ' + (e.response?.data?.message || e.message));
      setIsSimulating(false);
    }
  };

  // Enable Real Device GPS Tracking (Delivery Partner Mode)
  const toggleDeviceGpsBroadcast = () => {
    if (isBroadcastingGps) {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      setIsBroadcastingGps(false);
      toast('Device GPS broadcast stopped');
    } else {
      if (!('geolocation' in navigator)) {
        toast.error('Geolocation is not supported by your browser');
        return;
      }

      toast.loading('Requesting GPS location permission...');
      const id = navigator.geolocation.watchPosition(
        async (position) => {
          toast.dismiss();
          setIsBroadcastingGps(true);
          const { latitude, longitude, heading, speed } = position.coords;

          try {
            await trackingAPI.updateLocation({
              orderId,
              latitude,
              longitude,
              heading: heading || 0,
              speed: speed ? Math.round(speed * 3.6) : 22
            });
          } catch (e) {
            console.warn('GPS broadcast sync error:', e);
          }
        },
        (err) => {
          toast.dismiss();
          toast.error('GPS permission denied or unavailable: ' + err.message);
          setIsBroadcastingGps(false);
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );
      watchIdRef.current = id;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
        <p className="text-slate-400 text-sm">Connecting to live satellite telemetry...</p>
      </div>
    );
  }

  const displayOrder = order || {
    _id: orderId || 'demo_order_1',
    items: [
      { name: 'Sweet Seedless Green Grapes', quantity: 1, price: 200, subtotal: 200 },
      { name: 'Alphonso Mangoes', quantity: 1, price: 200, subtotal: 200 },
      { name: 'Organic Red Apples', quantity: 1, price: 120, subtotal: 120 }
    ],
    totalAmount: 520,
    deliveryCharge: 0,
    finalAmount: 520,
    status: 'out-for-delivery',
    deliveryAddress: {
      street: '2-82, near ramalayam, abbanagudavalli',
      city: 'Guntur',
      state: 'Andhra Pradesh',
      zipcode: '522261',
      phone: '08179730596'
    }
  };

  // Derive current active stage index
  const currentStatus = (tracking?.status || displayOrder.status || 'placed').replace('-', '_');
  const stageKeys = ORDER_STAGES.map(s => s.key);
  let activeIndex = stageKeys.indexOf(currentStatus);
  if (activeIndex === -1) {
    if (currentStatus === 'out-for-delivery') activeIndex = 4;
    else activeIndex = 1;
  }

  const partner = tracking?.deliveryPartner || {
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    vehicleNumber: 'KA-01-EQ-4492',
    vehicleType: 'Electric Cargo Scooter',
    rating: 4.9,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  };

  const store = tracking?.storeLocation || {
    name: 'FruitHub Fresh Mart - Flagship Hub',
    address: '100 Feet Road, Indiranagar, Bengaluru'
  };

  const currentLoc = tracking?.currentLocation || { latitude: 12.9716, longitude: 77.5946, speed: 24 };
  const destLoc = tracking?.customerLocation || { latitude: 12.9850, longitude: 77.6100 };
  const distanceKm = tracking?.distanceRemainingKm !== undefined ? tracking.distanceRemainingKm : 2.8;
  const etaMins = tracking?.estimatedTimeMinutes !== undefined ? tracking.estimatedTimeMinutes : 12;


  return (
    <div className="min-h-screen bg-slate-950 text-white py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header / ETA Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live GPS Tracking
                </span>
                <span className="text-slate-400 text-xs">Order #{orderId?.slice(-6) || 'FH-8942'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {currentStatus === 'delivered' ? 'Order Delivered 🎉' : `Arriving in ~${etaMins} mins`}
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Distance remaining: <strong className="text-emerald-400">{distanceKm} km</strong> • Current speed: {currentLoc.speed || 24} km/h
              </p>
            </div>

            {/* Simulation & Broadcast Action Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleStartSimulation}
                disabled={isSimulating || currentStatus === 'delivered'}
                className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-lg disabled:opacity-40"
              >
                <FiPlay />
                <span>{isSimulating ? 'Simulating Movement...' : 'Test Live Movement'}</span>
              </button>

              <button
                type="button"
                onClick={toggleDeviceGpsBroadcast}
                className={`flex items-center space-x-2 border px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  isBroadcastingGps 
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <FiCompass className={isBroadcastingGps ? 'animate-spin' : ''} />
                <span>{isBroadcastingGps ? 'Stop Device GPS' : 'Partner GPS Mode'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 6-Stage Progress Indicator */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {ORDER_STAGES.map((stage, idx) => {
              const isPast = idx < activeIndex;
              const isCurrent = idx === activeIndex;
              return (
                <div 
                  key={stage.key}
                  className={`p-3.5 rounded-2xl border transition ${
                    isCurrent 
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-md' 
                      : isPast 
                      ? 'bg-slate-950/60 border-slate-800 text-slate-300' 
                      : 'bg-slate-950/30 border-slate-900 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{stage.icon}</span>
                    {isPast && <span className="text-emerald-400 text-xs font-bold">✓</span>}
                    {isCurrent && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>}
                  </div>
                  <p className="text-xs font-bold leading-tight">{stage.label}</p>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{stage.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Interactive Map + Delivery Partner & Order Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Map Column (Span 2) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative flex flex-col justify-between overflow-hidden">
            
            {/* Map Header */}
            <div className="flex items-center justify-between mb-4 z-10">
              <div className="flex items-center space-x-2">
                <FiNavigation className="text-emerald-400 text-lg" />
                <h3 className="font-bold text-sm text-white">Live Route Telemetry</h3>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> Store
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Partner
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span> You
                </span>
              </div>
            </div>

            {/* Google Maps Live Embed */}
            <div className="w-full bg-slate-950 rounded-2xl border border-slate-800 relative overflow-hidden h-[340px]">
              {/* Real Google Maps iframe centered on delivery partner's live coordinates */}
              <iframe
                key={`${currentLoc.latitude.toFixed(4)}-${currentLoc.longitude.toFixed(4)}`}
                title="Live Delivery Map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${currentLoc.latitude},${currentLoc.longitude}&z=15&output=embed&markers=color:green%7Clabel:P%7C${currentLoc.latitude},${currentLoc.longitude}&markers=color:blue%7Clabel:U%7C${destLoc.latitude},${destLoc.longitude}`}
              />

              {/* Map Floating HUD Overlays */}
              <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] flex items-center gap-2 pointer-events-none">
                <FiCompass className="text-emerald-400 animate-spin" />
                <span>GPS Fix: Lat {currentLoc.latitude.toFixed(4)}, Lng {currentLoc.longitude.toFixed(4)}</span>
              </div>

              <a
                href={`https://www.google.com/maps/dir/${currentLoc.latitude},${currentLoc.longitude}/${destLoc.latitude},${destLoc.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 right-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 shadow-lg transition"
              >
                <FiNavigation size={12} />
                Open in Google Maps ↗
              </a>

              {/* Legend badges */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Partner
                </span>
                <span className="bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span> You
                </span>
              </div>
            </div>


            {/* Address / Location Leg Details */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <p className="text-slate-500 font-semibold mb-0.5">Dispatched from</p>
                <p className="text-white font-bold">{store.name}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">{store.address}</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <p className="text-slate-500 font-semibold mb-0.5">Delivering to</p>
                <p className="text-white font-bold">{displayOrder?.deliveryAddress?.street || '2-82, Near Ramalayam, Abbanagudavalli'}</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {displayOrder?.deliveryAddress?.city || 'Guntur'}, {displayOrder?.deliveryAddress?.zipcode || '522261'}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Partner & Actions Column */}
          <div className="space-y-6">

            {/* Partner Details Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Delivery Partner</h3>

              <div className="flex items-center space-x-4 mb-5">
                <img 
                  src={partner.photo} 
                  alt={partner.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-md"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-white text-base">{partner.name}</h4>
                    <span className="bg-amber-400/20 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-md">
                      ★ {partner.rating}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{partner.vehicleType}</p>
                  <p className="text-[11px] font-mono text-emerald-400 font-bold mt-0.5">{partner.vehicleNumber}</p>
                </div>
              </div>

              {/* Call & Chat Direct CTA Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${partner.phone}`}
                  className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition border border-slate-700"
                >
                  <FiPhone />
                  <span>Call Partner</span>
                </a>

                {/* Direct link to real-time chat */}
                <Link
                  to={`/chat?recipient=${encodeURIComponent(partner.name)}&order=${orderId}`}
                  className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition shadow-lg"
                >
                  <FiMessageSquare />
                  <span>Chat Live</span>
                </Link>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center space-x-2 text-[11px] text-slate-400">
                <FiShield className="text-emerald-400" />
                <span>Masked caller protection enabled</span>
              </div>
            </div>

            {/* Order Items & Bill Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Order Details</h3>
              
              <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-1">
                {displayOrder?.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-bold text-white">₹{item.subtotal || (item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Charge</span>
                  <span className="text-emerald-400 font-semibold">{displayOrder?.deliveryCharge === 0 ? 'FREE' : `₹${displayOrder?.deliveryCharge || 50}`}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800/60">
                  <span>Total Paid</span>
                  <span className="text-emerald-400">₹{displayOrder?.finalAmount || displayOrder?.totalAmount || 0}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
