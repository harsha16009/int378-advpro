import React, { useState } from 'react';
import { useCartStore, useAuthStore } from '../store/store';
import { orderAPI, paymentAPI } from '../api/client';
import { FiHome, FiPhone, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Checkout() {
  const { items, getTotalAmount, clearCart } = useCartStore();
  const { user, token } = useAuthStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipcode: '',
    phone: user?.phone || ''
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [notes, setNotes] = useState('');

  const totalAmount = getTotalAmount();
  const deliveryCharge = totalAmount > 500 ? 0 : 50;
  const finalAmount = totalAmount + deliveryCharge;

  const handleAddressChange = (e) => {
    setDeliveryAddress({
      ...deliveryAddress,
      [e.target.name]: e.target.value
    });
  };

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.zipcode) {
      toast.error('Please fill all address fields');
      return;
    }

    setLoading(true);
    try {
      const currentUserId = user?.id || user?._id || 'demo_user';
      const currentUserEmail = user?.email || 'demo@fruithub.com';

      // Create order
      const orderResponse = await orderAPI.createOrder(
        {
          userId: currentUserId,
          items: items.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal
          })),
          deliveryAddress,
          paymentMethod,
          notes
        },
        token
      );

      const orderId = orderResponse.data?.order?._id || orderResponse.data?._id || `order_${Date.now()}`;

      // Process payment
      const paymentResponse = await paymentAPI.createPayment(
        {
          orderId,
          userId: currentUserId,
          amount: finalAmount,
          method: paymentMethod,
          email: currentUserEmail
        },
        token
      );

      if (paymentMethod === 'card' || paymentMethod === 'upi' || paymentMethod === 'wallet' || paymentMethod === 'cashfree') {
        const clientSecret = paymentResponse.data.clientSecret || '';
        const paymentId = paymentResponse.data.paymentId;
        const linkId = paymentResponse.data.linkId || '';
        const qrCode = paymentResponse.data.qrCode ? encodeURIComponent(paymentResponse.data.qrCode) : '';
        const paymentLink = paymentResponse.data.paymentLink ? encodeURIComponent(paymentResponse.data.paymentLink) : '';
        clearCart();
        navigate(`/payment/${orderId}?paymentId=${paymentId}&method=${paymentMethod}&clientSecret=${clientSecret}&linkId=${linkId}&qrCode=${qrCode}&paymentLink=${paymentLink}`);
      } else if (paymentMethod === 'cash') {
        toast.success('Order placed! Payment at delivery');
        clearCart();
        navigate(`/order/${orderId}`);
      }
    } catch (error) {
      toast.error('Error placing order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-xl text-gray-600">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Steps */}
        <div className="lg:col-span-2">
          {/* Step 1: Delivery Address */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">1. Delivery Address</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                name="street"
                placeholder="Street address"
                value={deliveryAddress.street}
                onChange={handleAddressChange}
                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
              <input
                type="text"
                name="city"
                placeholder="City"
                value={deliveryAddress.city}
                onChange={handleAddressChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
              <input
                type="text"
                name="state"
                placeholder="State"
                value={deliveryAddress.state}
                onChange={handleAddressChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
              <input
                type="text"
                name="zipcode"
                placeholder="Zip Code"
                value={deliveryAddress.zipcode}
                onChange={handleAddressChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone number"
                value={deliveryAddress.phone}
                onChange={handleAddressChange}
                className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
            </div>
          </div>

          {/* Step 2: Order Notes */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">2. Special Instructions</h2>
            <textarea
              placeholder="E.g., Please ring the doorbell twice, leave at door, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600 h-24"
            />
          </div>

          {/* Step 3: Payment Method */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">3. Payment Method</h2>

            <div className="space-y-3">
              {[
                { id: 'cashfree', label: '⚡ Cashfree Payments (Recommended)', desc: 'Instant UPI QR, Net Banking, Cards' },
                { id: 'card', label: '💳 Debit/Credit Card', desc: 'Stripe Payment' },
                { id: 'upi', label: '📱 UPI', desc: 'Razorpay' },
                { id: 'wallet', label: '👛 Digital Wallet', desc: 'ApplePay, GooglePay' },
                { id: 'cash', label: '💵 Cash on Delivery', desc: 'Pay at delivery' }
              ].map((method) => (
                <label
                  key={method.id}
                  className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-gray-800">{method.label}</p>
                    <p className="text-sm text-gray-500">{method.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm text-gray-700">
                  <span>{item.name} x {item.quantity}</span>
                  <span>₹{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Delivery</span>
                <span className={deliveryCharge === 0 ? 'text-green-600 font-semibold' : ''}>
                  {deliveryCharge === 0 ? 'Free' : `₹${deliveryCharge}`}
                </span>
              </div>
            </div>

            <div className="border-t mt-4 pt-4 flex justify-between items-center font-bold text-lg">
              <span>Total</span>
              <span className="text-green-600">₹{finalAmount.toFixed(2)}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 transition"
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
