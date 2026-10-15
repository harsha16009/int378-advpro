import React, { useState, useEffect } from 'react';
import { FiSearch, FiShoppingCart, FiUser, FiLogOut, FiMenu, FiX, FiMessageSquare } from 'react-icons/fi';
import { useAuthStore, useCartStore } from '../store/store';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { items } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const cartCount = items.length;
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-3xl">🍎</div>
            <span className="text-2xl font-bold text-green-600 hidden sm:inline">FruitHub</span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 mx-4 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search fruits, offers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-green-500"
              />
              <FiSearch className="absolute right-3 top-3 text-gray-400" />
            </div>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center space-x-4">
            {/* Live Chat */}
            <Link 
              to="/chat" 
              className="relative p-2 rounded-xl text-gray-600 hover:text-green-600 hover:bg-green-50 transition"
              title="Real-time Chat"
            >
              <FiMessageSquare className="text-xl" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500"></span>
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative">
              <FiShoppingCart className="text-2xl text-gray-600 hover:text-green-600" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex flex-col items-end">
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">₹{totalAmount.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <FiUser className="text-xl text-gray-600" />
                </button>

                {isOpen && (
                  <div className="absolute right-0 mt-48 w-48 bg-white rounded-lg shadow-xl py-2">
                    <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100 text-sm">
                      Profile
                    </Link>
                    <Link to="/orders" className="block px-4 py-2 hover:bg-gray-100 text-sm">
                      My Orders
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm flex items-center space-x-2"
                    >
                      <FiLogOut /> <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <button
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
