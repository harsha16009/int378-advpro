import React, { useEffect, useState } from 'react';
import { FiStar, FiShoppingCart, FiTruck } from 'react-icons/fi';
import { productAPI } from '../api/client';
import { useCartStore } from '../store/store';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`${product.name} added to cart!`);
    setQuantity(1);
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group">
      {/* Product Image */}
      <div className="relative overflow-hidden h-48 bg-gray-200">
        <img
          src={product.image || 'https://via.placeholder.com/300x200?text=' + product.name}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
        />
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
            {discount}% OFF
          </div>
        )}
        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
          {product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-2">{product.description}</p>

        {/* Rating */}
        <div className="flex items-center space-x-1 mb-2">
          <FiStar className="text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-semibold">{product.rating?.toFixed(1) || 4.5}</span>
          <span className="text-xs text-gray-500">(120)</span>
        </div>

        {/* Nutrition Info */}
        {product.nutritionInfo && (
          <div className="bg-green-50 rounded p-2 mb-2 text-xs text-gray-600">
            <p>🥗 {product.nutritionInfo.calories} kcal</p>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-xl font-bold text-gray-800">₹{product.price}</span>
          {product.originalPrice && (
            <span className="text-sm line-through text-gray-500">₹{product.originalPrice}</span>
          )}
          <span className="text-xs text-gray-600">per {product.unit}</span>
        </div>

        {/* Add-ons */}
        {product.addOns && product.addOns.length > 0 && (
          <div className="mb-3 text-xs">
            <p className="text-gray-600 font-semibold mb-1">Add-ons available:</p>
            <div className="flex flex-wrap gap-1">
              {product.addOns.map((addon, idx) => (
                <span key={idx} className="bg-gray-200 px-2 py-1 rounded text-xs">
                  {addon.name} +₹{addon.price}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Delivery Badge */}
        <div className="flex items-center space-x-1 text-xs text-green-600 mb-3">
          <FiTruck />
          <span>Express delivery in 30-45 min</span>
        </div>

        {/* Quantity & Add Button */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-2 py-1 text-gray-600 hover:bg-gray-100"
            >
              -
            </button>
            <span className="px-4 py-1 font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-2 py-1 text-gray-600 hover:bg-gray-100"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.quantity === 0}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <FiShoppingCart /> <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
