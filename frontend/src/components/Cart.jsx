import React, { useState } from 'react';
import { useCartStore } from '../store/store';
import { useAuthStore } from '../store/store';
import { FiTrash2, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryCharge = subtotal > 500 ? 0 : 50;
  const finalTotal = subtotal + deliveryCharge - discount;

  const applyPromo = () => {
    if (promoCode === 'FRUIT50') {
      setDiscount(50);
      toast.success('Promo code applied! ₹50 discount');
    } else if (promoCode === 'FRESH20') {
      setDiscount(subtotal * 0.2);
      toast.success('Promo code applied! 20% discount');
    } else {
      toast.error('Invalid promo code');
    }
    setPromoCode('');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h1>
        <p className="text-gray-600 mb-8">Start adding fresh fruits to your cart!</p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            {items.map((item) => (
              <div
                key={item.id}
                className="border-b last:border-b-0 p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={item.image || 'https://via.placeholder.com/80?text=' + item.name}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-gray-600">₹{item.price} per unit</p>
                    {item.addOns && item.addOns.length > 0 && (
                      <p className="text-sm text-green-600">
                        Add-ons: {item.addOns.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>

                  <p className="w-24 text-right font-semibold">₹{item.subtotal.toFixed(2)}</p>

                  <button
                    onClick={() => {
                      removeItem(item.id);
                      toast.success('Item removed');
                    }}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Promo Code */}
          <div className="mt-6 bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Have a promo code?</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
              />
              <button
                onClick={applyPromo}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Apply
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Try: FRUIT50 or FRESH20</p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>

            <div className="space-y-3 border-b pb-4 mb-4">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Delivery Charge</span>
                <span className={deliveryCharge === 0 ? 'text-green-600 font-semibold' : ''}>
                  {deliveryCharge === 0 ? 'Free' : `₹${deliveryCharge}`}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mb-6 text-xl font-bold">
              <span>Total</span>
              <span className="text-green-600">₹{finalTotal.toFixed(2)}</span>
            </div>

            {user ? (
              <Link
                to="/checkout"
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center space-x-2 transition"
              >
                <span>Proceed to Checkout</span>
                <FiArrowRight />
              </Link>
            ) : (
              <Link
                to="/login"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center space-x-2 transition"
              >
                <span>Login to Checkout</span>
                <FiArrowRight />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
