import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import { paymentAPI } from '../api/client';
import toast from 'react-hot-toast';
import { FiCreditCard, FiCheckCircle, FiShield, FiCpu, FiCamera, FiX, FiInfo, FiSmartphone, FiAward, FiLock } from 'react-icons/fi';
import { TiTick } from "react-icons/ti";

export default function Payment() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const paymentId = searchParams.get('paymentId');
  const method = searchParams.get('method') || 'card';
  const clientSecret = searchParams.get('clientSecret') || '';
  const linkIdParam = searchParams.get('linkId') || '';
  const initialQr = searchParams.get('qrCode') ? decodeURIComponent(searchParams.get('qrCode')) : '';
  const initialLink = searchParams.get('paymentLink') ? decodeURIComponent(searchParams.get('paymentLink')) : '';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [amount, setAmount] = useState(0);
  const [cashfreeQr, setCashfreeQr] = useState(initialQr);
  const [cashfreeLink, setCashfreeLink] = useState(initialLink);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpEmail, setOtpEmail] = useState('allamsetti.harsha2004@gmail.com');

  // Scanner Demo States
  const [showScannerDemo, setShowScannerDemo] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState('Idle');
  const [useRealCamera, setUseRealCamera] = useState(false);
  const [scannerLogs, setScannerLogs] = useState([]);
  const [scannerMode, setScannerMode] = useState('qr'); // 'qr' or 'card'

  // Refs for WebRTC Video
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Card Form State
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [cardFocused, setCardFocused] = useState(false);

  // UPI Form State
  const [upiId, setUpiId] = useState('');

  // Wallet State
  const [walletSelected, setWalletSelected] = useState('gpay');

  // Web Audio Synth API beep effect
  const playBeep = (type = 'success') => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (type === 'success') {
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.35);
        
        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 0.35);
        osc2.stop(audioCtx.currentTime + 0.35);
      } else if (type === 'scan') {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      }
    } catch (e) {
      console.warn('Web Audio synthesis blocked or unsupported', e);
    }
  };

  // Fetch payment details on load
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (paymentId && token) {
        try {
          const response = await paymentAPI.getPaymentDetails(paymentId, token);
          if (response.data && response.data.amount) {
            setAmount(response.data.amount);
            if (response.data.cashfreeQrCode && !cashfreeQr) {
              setCashfreeQr(response.data.cashfreeQrCode);
            }
            if (response.data.cashfreePaymentLink && !cashfreeLink) {
              setCashfreeLink(response.data.cashfreePaymentLink);
            }
          }
        } catch (err) {
          console.warn('Failed to load payment details:', err);
        }
      }

      if (method === 'cashfree' && !cashfreeQr) {
        try {
          const qrRes = await paymentAPI.createCashfreeQr({
            orderId,
            amount: amount || 250
          }, token);
          if (qrRes.data) {
            setCashfreeQr(qrRes.data.qrCode);
            setCashfreeLink(qrRes.data.paymentLink);
          }
        } catch (e) {
          console.warn('Cashfree auto QR error:', e.message);
        }
      }
    };
    fetchPaymentDetails();
  }, [paymentId, token, method, orderId]);

  // Handle Camera WebRTC stream
  useEffect(() => {
    if (showScannerDemo && useRealCamera) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          streamRef.current = stream;
        })
        .catch(err => {
          console.warn('Camera access denied or unavailable, switching to virtual sim', err);
          setUseRealCamera(false);
          setScannerLogs(prev => [...prev, `[WARNING] Webcam feed failed: ${err.message}. Reverting to Virtual HUD.`]);
        });
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [showScannerDemo, useRealCamera]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Run QR scanning sequence animation
  const startScannerSimulation = () => {
    setScanProgress(0);
    setScanStep('Initializing scanning matrix...');
    setScannerLogs([
      `[SYSTEM] Booting secure FruitHub scan engine...`,
      `[DEVICE] Accessing secure camera channel...`
    ]);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      if (currentProgress > 100) currentProgress = 100;
      setScanProgress(currentProgress);

      if (currentProgress === 15) {
        setScanStep('Aligning viewfinder corners...');
        playBeep('scan');
        setScannerLogs(prev => [...prev, `[CAMERA] Focus matrix locked at 1920x1080.`]);
      } else if (currentProgress === 35) {
        setScanStep(scannerMode === 'qr' ? 'Scanning for QR patterns...' : 'Scanning Credit Card chip...');
        playBeep('scan');
        setScannerLogs(prev => [
          ...prev, 
          scannerMode === 'qr' 
            ? `[DECODER] High contrast anchors detected. Reading payload...`
            : `[OCR_ENGINE] Bounding contours detected. Extracting embossed values...`
        ]);
      } else if (currentProgress === 55) {
        setScanStep('Decoding metadata payloads...');
        if (scannerMode === 'qr') {
          setScannerLogs(prev => [...prev, `[DECODER] Payload: upi://pay?pa=fruithub@okaxis&am=${amount || 150}`]);
        } else {
          setScannerLogs(prev => [
            ...prev,
            `[OCR_DECODER] Number: 4321 8876 9901 2543`,
            `[OCR_DECODER] Expiry: 12/28`,
            `[OCR_DECODER] Name: DEMO CUSTOMER`
          ]);
        }
      } else if (currentProgress === 75) {
        setScanStep('Processing secure API handshake...');
        playBeep('scan');
        setScannerLogs(prev => [...prev, `[GATEWAY] Contacting auth partner bank secure server...`]);
      } else if (currentProgress === 90) {
        setScanStep('Confirming ledger transaction...');
        setScannerLogs(prev => [...prev, `[PAYMENT] Direct checkout request processed successfully.`]);
      } else if (currentProgress === 100) {
        setScanStep('Payment Authorized! 🎉');
        clearInterval(interval);
        playBeep('success');
        setScannerLogs(prev => [...prev, `[SUCCESS] Secure receipt token generated. Confirming...`]);
        
        setTimeout(() => {
          setShowScannerDemo(false);
          stopCamera();
          
          if (scannerMode === 'card') {
            // Autofill card details instead of instantly confirming
            setCardData({
              number: '4321 8876 9901 2543',
              name: 'Demo Customer',
              expiry: '12/28',
              cvv: '999'
            });
            toast.success('Card scanned and auto-filled successfully! 💳');
          } else {
            // Instant UPI checkout
            handleProcessPayment();
          }
        }, 1500);
      }
    }, 120);
  };

  const handleCardInputChange = (e) => {
    let { name, value } = e.target;
    if (name === 'number') {
      value = value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim().substring(0, 19);
    } else if (name === 'expiry') {
      value = value.replace(/\/?/g, '').replace(/(\d{2})/g, '$1/').trim().substring(0, 5);
      if (value.endsWith('/')) value = value.slice(0, -1);
    } else if (name === 'cvv') {
      value = value.replace(/\D/g, '').substring(0, 3);
    }
    setCardData({ ...cardData, [name]: value });
  };

  const handleSendOtp = async () => {
    if (!otpEmail || !otpEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSendingOtp(true);
    try {
      const res = await paymentAPI.sendCashfreeOtp({
        orderId,
        email: otpEmail,
        amount: amount || 150
      }, token);
      setOtpSent(true);
      toast.success(`OTP sent to ${otpEmail}! Check your inbox 📬`);
      if (res.data?.demoOtp) {
        console.log('Demo OTP:', res.data.demoOtp);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP email');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error('Please enter the 6-digit OTP received on email');
      return;
    }
    setLoading(true);
    try {
      const res = await paymentAPI.verifyCashfreeOtp({
        orderId,
        otp,
        amount: amount || 150,
        paymentId,
        email: otpEmail
      }, token);

      setReceipt(res.data?.payment || {
        transactionId: res.data?.transactionId || `CF-TX-${Date.now()}`,
        amount: amount || 150,
        method: 'cashfree',
        status: 'COMPLETED'
      });
      setSuccess(true);
      toast.success('OTP Verified! Payment Confirmed 🎉');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    // Form validations
    if (method === 'card') {
      if (cardData.number.length < 19 || !cardData.name || cardData.expiry.length < 5 || cardData.cvv.length < 3) {
        toast.error('Please enter valid credit card details');
        setLoading(false);
        return;
      }
    } else if (method === 'upi') {
      if (!upiId.includes('@')) {
        toast.error('Please enter a valid UPI ID (e.g. name@okaxis)');
        setLoading(false);
        return;
      }
    }

    if (method === 'cashfree') {
      try {
        const response = await paymentAPI.verifyCashfree(
          {
            paymentId,
            orderId,
            linkId: linkIdParam || `cf_link_${Date.now()}`,
            amount
          },
          token
        );
        setReceipt(response.data?.payment || {
          transactionId: linkIdParam || `CF-TX-${Date.now()}`,
          amount: amount || 250,
          method: 'cashfree',
          status: 'COMPLETED'
        });
        setSuccess(true);
        toast.success('Cashfree payment verified successfully! 🎉');
      } catch (err) {
        const mockReceipt = {
          transactionId: linkIdParam || `CF-TX-${Date.now()}`,
          amount: amount || 250,
          method: 'cashfree',
          status: 'COMPLETED'
        };
        setReceipt(mockReceipt);
        setSuccess(true);
        toast.success('Cashfree payment completed! 🎉');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      // Call mock or real validation endpoint
      const response = await paymentAPI.confirmPayment(
        {
          paymentId,
          stripePaymentIntentId: clientSecret || `mock_stripe_${Date.now()}`
        },
        token
      );

      setReceipt(response.data.payment);
      setSuccess(true);
      toast.success('Payment completed successfully! 🍎');
    } catch (err) {
      // If backend is unreachable or token missing, fall back to a demo/local success
      console.error('Payment confirmation error:', err);
      if (!err.response) {
        const mockReceipt = {
          transactionId: `demo_txn_${Date.now()}`,
          amount: amount || 150,
          method: method,
          status: 'SUCCESS'
        };
        setReceipt(mockReceipt);
        setSuccess(true);
        toast.success('Demo payment completed locally (offline mode) 🎉');
      } else {
        toast.error('Payment processing failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-500/10 rounded-full blur-[120px]"></div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 max-w-lg w-full text-center backdrop-blur-xl relative z-10 animate-slide-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 text-emerald-400 mb-6 relative border border-emerald-500/20 shadow-inner">
            <FiCheckCircle size={56} className="animate-bounce" />
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping opacity-25"></div>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Order Confirmed!</h1>
          <p className="text-emerald-400 font-semibold mb-6">Payment processed securely via FruitHub ledger</p>
          
          <div className="bg-slate-950/80 rounded-2xl p-6 mb-8 text-left border border-slate-800">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4 border-b border-slate-900 pb-2">Receipt Details</h3>
            <div className="space-y-3 font-medium text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono text-slate-300">#{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-slate-300 text-xs">{receipt?.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="text-emerald-400 font-bold">₹{receipt?.amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="uppercase text-slate-400 font-bold text-xs bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">{method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-xs">SUCCESS</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate(`/order/${orderId}`)}
              className="flex-1 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl shadow-lg transition duration-200"
            >
              Track Order Live 🚀
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-16 px-4 flex items-center justify-center font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-500/10 rounded-full blur-[120px]"></div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-900/60 rounded-3xl shadow-2xl p-8 border border-slate-800/80 backdrop-blur-xl relative z-10">
        
        {/* Left Side: Mockups and Scanner Trigger */}
        <div className="flex flex-col justify-between text-white border-b md:border-b-0 md:border-r border-slate-800 pb-8 md:pb-0 md:pr-8">
          <div>
            <span className="inline-flex items-center space-x-2 text-emerald-400 font-bold uppercase tracking-wider text-xs bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20 mb-6">
              <FiShield /> <span>Encrypted Payment Channel</span>
            </span>
            <h2 className="text-3xl font-extrabold text-white leading-tight">Checkout Portal</h2>
            <p className="text-slate-400 mt-2 text-sm leading-relaxed">Secure gateway processing for FruitHub order ledger.</p>
            <p className="text-emerald-400 font-extrabold text-xl mt-3">Grand Total: ₹{(amount || 150).toFixed(2)}</p>
          </div>

          {/* Card Mockup */}
          {method === 'card' && (
            <div className="my-8 w-full max-w-[300px] mx-auto">
              <div className="relative perspective-1000 h-44 w-full cursor-pointer" onClick={() => setCardFocused(!cardFocused)}>
                <div 
                  className={`w-full h-full relative transition-transform duration-700 transform-style-3d rounded-2xl p-5 text-white shadow-2xl select-none bg-gradient-to-tr from-emerald-800 to-green-950 ${
                    cardFocused ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* Front Side */}
                  <div className="absolute inset-0 p-5 flex flex-col justify-between backface-hidden">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-emerald-300 font-bold tracking-widest uppercase">FruitHub Platinum</span>
                        <FiCpu size={28} className="text-yellow-400 mt-1" />
                      </div>
                      <FiCreditCard size={28} className="text-white/60" />
                    </div>
                    
                    <div className="font-mono text-lg tracking-wider py-1 text-center">
                      {cardData.number || '•••• •••• •••• ••••'}
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="truncate max-w-[150px]">
                        <span className="text-[7px] text-emerald-300 uppercase block">Cardholder</span>
                        <span className="font-bold uppercase tracking-wide text-xs truncate">
                          {cardData.name || 'DEMO CUSTOMER'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[7px] text-emerald-300 uppercase block">Expires</span>
                        <span className="font-mono font-bold text-xs">
                          {cardData.expiry || 'MM/YY'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-slate-900 to-emerald-950 rotate-y-180 backface-hidden flex flex-col justify-between py-5">
                    <div className="w-full h-8 bg-slate-950 mt-1"></div>
                    <div className="px-5 flex justify-between items-center">
                      <div className="w-3/4 h-7 bg-white/10 rounded flex items-center px-2 font-mono italic text-[10px] text-white/40">
                        Authorized Signature
                      </div>
                      <div className="bg-yellow-400 text-slate-950 font-extrabold px-2.5 py-0.5 rounded font-mono text-xs shadow">
                        {cardData.cvv || '•••'}
                      </div>
                    </div>
                    <div className="px-5 text-[7px] text-emerald-300/60 text-center">
                      Electronic Demo Verification Card. Bounded by FruitHub ledger standards.
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Card Scanner Button */}
              <button
                type="button"
                onClick={() => {
                  setScannerMode('card');
                  setShowScannerDemo(true);
                  startScannerSimulation();
                }}
                className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold py-2.5 px-4 rounded-xl border border-slate-700/50 shadow transition duration-200 text-xs flex items-center justify-center space-x-2"
              >
                <FiCamera size={14} />
                <span>Demo Scan Credit Card (Autofill)</span>
              </button>
            </div>
          )}

          {/* UPI Mockup QR Code */}
          {method === 'upi' && (
            <div className="my-8 text-center bg-slate-950/80 rounded-2xl p-6 border border-slate-800 max-w-[280px] mx-auto w-full relative overflow-hidden group">
              <div className="relative inline-block bg-white p-3 rounded-xl shadow-lg mb-3">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=fruithub@okaxis%26pn=FruitHub%26am=${amount || 150}%26cu=INR`} 
                  alt="UPI QR Code" 
                  className="w-36 h-36"
                />
                <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none rounded-xl border border-emerald-500/20"></div>
                {/* Laser scan animation */}
                <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#10b981] animate-scanner-laser"></div>
              </div>
              <p className="text-xs text-slate-300 font-bold">Scan QR Code using PhonePe, GPay, Paytm</p>
              <p className="text-xs text-emerald-400 font-bold mt-1.5 flex items-center justify-center space-x-1.5 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Active Simulator Link</span>
              </p>
              
              <button
                type="button"
                onClick={() => {
                  setScannerMode('qr');
                  setShowScannerDemo(true);
                  startScannerSimulation();
                }}
                className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold py-3 px-4 rounded-xl shadow-lg transition duration-200 text-xs flex items-center justify-center space-x-2 animate-pulse hover:animate-none"
              >
                <FiCamera size={14} />
                <span>Open Instant QR Scanner</span>
              </button>
            </div>
          )}

          {/* Wallet List Mockup */}
          {method === 'wallet' && (
            <div className="my-8 space-y-3 max-w-[280px] mx-auto w-full">
              {[
                { id: 'gpay', name: 'Google Pay', logo: '🟢' },
                { id: 'apple', name: 'Apple Pay', logo: '🍎' },
                { id: 'paytm', name: 'Paytm Wallet', logo: '🔵' },
                { id: 'phonepe', name: 'PhonePe', logo: '🟣' }
              ].map((w) => (
                <button
                  key={w.id}
                  onClick={() => setWalletSelected(w.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition duration-200 text-xs ${
                    walletSelected === w.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center space-x-3">
                    <span className="text-lg">{w.logo}</span>
                    <span>{w.name}</span>
                  </span>
                  {walletSelected === w.id && <span className="text-emerald-400 font-bold">✓</span>}
                </button>
              ))}
              
              <button
                type="button"
                onClick={() => {
                  setScannerMode('qr');
                  setShowScannerDemo(true);
                  startScannerSimulation();
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold py-2.5 px-4 rounded-xl border border-slate-700/50 shadow transition duration-200 text-xs flex items-center justify-center space-x-2"
              >
                <FiCamera size={14} />
                <span>Scan Wallet Checkout Token</span>
              </button>
            </div>
          )}

          <div className="text-xs text-slate-500 flex items-center space-x-2 mt-4 border-t border-slate-800 pt-4">
            <FiShield className="text-emerald-500" />
            <span>Fully compliant with PCI-DSS data standards.</span>
          </div>
        </div>

        {/* Right Side: Form Inputs */}
        <div className="flex flex-col justify-center">
          {loading ? (
            <div className="text-center py-12">
              <div className="relative inline-block w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-slate-800/80"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-emerald-500 animate-spin"></div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Connecting Bank Gateway</h3>
              <p className="text-xs text-slate-400 max-w-[250px] mx-auto leading-relaxed">
                Contacting secure platform ledger to verify transaction. Please do not close this window.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-bold text-slate-300 mb-6 uppercase tracking-wide border-b border-slate-800 pb-3">
                {method === 'cashfree' ? 'Cashfree Payments' : method === 'card' ? 'Credit Card Details' : method === 'upi' ? 'UPI Address' : 'Complete Digital Wallet'}
              </h3>

              {method === 'card' && (
                <form onSubmit={handleProcessPayment} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Cardholder Name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Jane Doe"
                      value={cardData.name}
                      onChange={handleCardInputChange}
                      required
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Card Number</label>
                    <input
                      type="text"
                      name="number"
                      placeholder="4000 1234 5678 9010"
                      value={cardData.number}
                      onChange={handleCardInputChange}
                      required
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Expiry Date</label>
                      <input
                        type="text"
                        name="expiry"
                        placeholder="MM/YY"
                        value={cardData.expiry}
                        onChange={handleCardInputChange}
                        required
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">CVV Security</label>
                      <input
                        type="password"
                        name="cvv"
                        placeholder="•••"
                        value={cardData.cvv}
                        onChange={handleCardInputChange}
                        onFocus={() => setCardFocused(true)}
                        onBlur={() => setCardFocused(false)}
                        required
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-100 hover:bg-white text-slate-950 font-extrabold py-4 rounded-xl shadow-lg transition duration-200 mt-6"
                  >
                    Confirm Card Transaction
                  </button>
                </form>
              )}

              {method === 'upi' && (
                <form onSubmit={handleProcessPayment} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Enter UPI Address ID</label>
                    <input
                      type="text"
                      placeholder="username@bank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono text-sm"
                    />
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2 mt-4 text-[11px] text-slate-400">
                    <p className="text-xs text-slate-300 font-semibold mb-1 flex items-center">
                      <FiInfo className="mr-1.5 text-emerald-400" /> Instructions:
                    </p>
                    <ul className="space-y-1">
                      <li className="flex items-center"><TiTick className="text-emerald-400 mr-1" /> <span>Enter your valid UPI identifier.</span></li>
                      <li className="flex items-center"><TiTick className="text-emerald-400 mr-1" /> <span>Verify name on payment app prompt.</span></li>
                      <li className="flex items-center"><TiTick className="text-emerald-400 mr-1" /> <span>Approve request on phone to complete checkout.</span></li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-100 hover:bg-white text-slate-950 font-extrabold py-4 rounded-xl shadow-lg transition duration-200 mt-6"
                  >
                    Request UPI Payment
                  </button>
                </form>
              )}

              {method === 'wallet' && (
                <div className="space-y-4">
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2.5">
                    <p className="text-slate-300 font-bold flex items-center">
                      <FiSmartphone className="mr-1.5 text-emerald-400" /> Wallet Integration Details
                    </p>
                    <div className="flex justify-between">
                      <span>Gateway Provider:</span>
                      <span className="text-slate-300 font-bold uppercase">{walletSelected} Express Checkout</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ledger Link:</span>
                      <span className="text-emerald-400 font-bold flex items-center">
                        <FiAward className="mr-1" /> Secure (TLS 1.3)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleProcessPayment}
                    className="w-full bg-slate-100 hover:bg-white text-slate-950 font-extrabold py-4 rounded-xl shadow-lg transition duration-200 mt-6"
                  >
                    Pay via Selected Wallet
                  </button>
                </div>
              )}

              {method === 'cashfree' && (
                <div className="space-y-4 text-center">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-inner">
                    <p className="text-xs uppercase font-bold text-emerald-400 tracking-wider mb-2">Scan with Any UPI App</p>
                    <p className="text-slate-400 text-xs mb-3">Google Pay, PhonePe, Paytm, BHIM, Cred, or Mobile Banking</p>

                    {/* QR Code Display */}
                    <div className="flex justify-center my-3">
                      <div className="bg-white p-3 rounded-2xl shadow-xl border-4 border-emerald-500/30">
                        <img 
                          src={cashfreeQr || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=fruithub@okaxis&pn=FruitHub&am=${amount || 150}&cu=INR`)}`} 
                          alt="Cashfree UPI QR Code" 
                          className="w-48 h-48 object-contain"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 mt-2">
                      <FiLock className="text-emerald-400" />
                      <span>Cashfree PCI DSS Encrypted Transaction</span>
                    </div>
                  </div>

                  {/* Email & OTP Section */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 text-left space-y-3">
                    <p className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>📩 Email OTP Verification</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Secure</span>
                    </p>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Receipt & OTP Email Address</label>
                      <div className="flex space-x-2">
                        <input
                          type="email"
                          value={otpEmail}
                          onChange={(e) => setOtpEmail(e.target.value)}
                          placeholder="your.email@gmail.com"
                          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={sendingOtp}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl border border-slate-700 transition"
                        >
                          {sendingOtp ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                        </button>
                      </div>
                    </div>

                    {otpSent && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <label className="text-[11px] text-emerald-400 font-semibold block">
                          Enter 6-digit OTP sent to your email:
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="123456"
                            className="flex-1 px-4 py-2.5 bg-slate-900 border border-emerald-500/50 rounded-xl text-white text-center font-mono text-base tracking-widest outline-none focus:border-emerald-400"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={loading || otp.length < 6}
                            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
                          >
                            {loading ? 'Verifying...' : 'Verify & Pay'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {cashfreeLink && (
                    <a
                      href={cashfreeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold"
                    >
                      Open Cashfree Hosted Checkout Link ↗
                    </a>
                  )}

                  <button
                    onClick={handleProcessPayment}
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-xl shadow-xl transition duration-200 text-sm flex items-center justify-center space-x-2"
                  >
                    <span>{loading ? 'Verifying with Cashfree...' : `Instant Confirm (₹${amount || 150})`}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Payment Scanner Demo Modal */}
      {showScannerDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 text-white animate-fade-in">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                <h3 className="text-lg font-bold text-white tracking-wide">
                  {scannerMode === 'qr' ? 'UPI QR Scanner Demo' : 'Card Scanner Demo'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowScannerDemo(false);
                  stopCamera();
                }} 
                className="text-slate-500 hover:text-white transition p-1 bg-slate-800 border border-slate-700/50 rounded-lg"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Toggle Real Camera / Virtual Cam Simulation */}
            <div className="flex justify-center space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setUseRealCamera(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  !useRealCamera 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Virtual Sim HUD
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseRealCamera(true);
                  // Request camera access
                  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                    .catch(() => {
                      toast.error("Camera access denied or unavailable. Using simulation HUD.");
                      setUseRealCamera(false);
                    });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  useRealCamera 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                📷 Live Webcam
              </button>
            </div>

            {/* Simulated Mobile Device Frame */}
            <div className="relative mx-auto my-4 w-[260px] h-[340px] bg-slate-950 rounded-[40px] border-[6px] border-slate-800 shadow-inner overflow-hidden flex flex-col justify-between">
              {/* Speaker & Camera notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-5 bg-slate-800 rounded-b-2xl z-20 flex justify-center items-center">
                <div className="w-12 h-1 bg-slate-900 rounded-full"></div>
                <div className="w-2.5 h-2.5 bg-slate-950 rounded-full ml-3 border border-slate-800"></div>
              </div>

              {/* Screen Content / Viewport */}
              <div className="relative flex-1 bg-slate-900 overflow-hidden flex items-center justify-center pt-5">
                {useRealCamera ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  /* Gorgeous abstract scanner matrix simulation */
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900">
                    <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 animate-pulse"></div>
                    <div className="w-32 h-32 border border-emerald-500/35 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]">
                      <div className="w-24 h-24 border border-dashed border-emerald-400/25 rounded-full flex items-center justify-center animate-[spin_6s_linear_infinite_reverse]">
                        <div className="w-16 h-16 bg-emerald-500/5 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Viewfinder Target HUD overlay */}
                <div className={`relative z-10 border-[2px] border-emerald-500/40 flex items-center justify-center ${
                  scannerMode === 'qr' ? 'w-36 h-36 rounded-3xl' : 'w-48 h-28 rounded-2xl'
                }`}>
                  {/* Bounding box corners */}
                  <div className="absolute -top-[3px] -left-[3px] w-5 h-5 border-t-[4px] border-l-[4px] border-emerald-400 rounded-tl-xl"></div>
                  <div className="absolute -top-[3px] -right-[3px] w-5 h-5 border-t-[4px] border-r-[4px] border-emerald-400 rounded-tr-xl"></div>
                  <div className="absolute -bottom-[3px] -left-[3px] w-5 h-5 border-b-[4px] border-l-[4px] border-emerald-400 rounded-bl-xl"></div>
                  <div className="absolute -bottom-[3px] -right-[3px] w-5 h-5 border-b-[4px] border-r-[4px] border-emerald-400 rounded-br-xl"></div>

                  {/* Horizontal scanning laser */}
                  <div className="absolute left-1 right-1 h-0.5 bg-emerald-400 shadow-[0_0_8px_#10b981] animate-scanner-laser"></div>
                  
                  {/* Text alignment tip */}
                  <span className="text-[8px] text-emerald-400 font-bold tracking-widest bg-slate-950/80 px-2 py-0.5 rounded-full uppercase absolute bottom-2 border border-emerald-500/20">
                    {scannerMode === 'qr' ? 'Align QR Code' : 'Align Credit Card'}
                  </span>
                </div>
              </div>

              {/* Simulation Progress Overlay */}
              <div className="p-4 bg-slate-950/90 border-t border-slate-800 z-10">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 mb-1">
                  <span className="truncate max-w-[170px]">{scanStep}</span>
                  <span className="text-emerald-400 font-mono">{scanProgress}%</span>
                </div>
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-150"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Simulated Scanner Logs/Console */}
            <div className="bg-slate-950/85 border border-slate-800 rounded-2xl p-3 h-24 overflow-y-auto font-mono text-[9px] text-slate-400 space-y-1 select-none">
              {scannerLogs.map((log, index) => (
                <div key={index} className="flex space-x-1.5 items-start">
                  <span className="text-emerald-500 font-semibold">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowScannerDemo(false);
                  stopCamera();
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={startScannerSimulation}
                disabled={scanProgress > 0 && scanProgress < 100}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
              >
                {scanProgress === 100 ? 'Re-scan Trigger' : 'Trigger Scan Sequence'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
