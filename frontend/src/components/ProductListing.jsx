import React, { useEffect, useState } from 'react';
import { productAPI } from '../api/client';
import ProductCard from './ProductCard';
import Hero from './Hero';
import { FiFilter, FiArrowDown } from 'react-icons/fi';

export default function ProductListing() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const categories = [
    { id: 'pomegranate', name: '🍎 Pomegranate' },
    { id: 'apple', name: '🍎 Apples' },
    { id: 'mango', name: '🥭 Mangoes' },
    { id: 'orange', name: '🍊 Oranges' },
    { id: 'banana', name: '🍌 Bananas' },
    { id: 'grapes', name: '🍇 Grapes' }
  ];

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productAPI.getAllProducts({
        category: selectedCategory,
        sortBy: sortBy
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScrollToMarket = () => {
    const marketEl = document.getElementById('market');
    if (marketEl) {
      marketEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-gray-50/50 min-h-screen">
      <Hero onShopClick={handleScrollToMarket} />

      <div id="market" className="max-w-7xl mx-auto px-4 py-16 scroll-mt-20">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="text-sm font-semibold text-green-600 tracking-wider uppercase bg-green-50 px-3 py-1.5 rounded-full border border-green-200/50">FruitHub Marketplace</span>
          <h2 className="text-4xl font-extrabold text-gray-900 mt-4 mb-3">Fresh Fruits Delivered in 30 Mins!</h2>
          <p className="text-gray-600 max-w-xl mx-auto">Handpicked, organic fruits and nutritious juices sourced directly from farm to table.</p>
        </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <FiFilter /> <span>Filters</span>
          </button>

          <div className="flex items-center space-x-2">
            <FiArrowDown />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
            >
              <option value="">Sort By</option>
              <option value="price-low-high">Price: Low to High</option>
              <option value="price-high-low">Price: High to Low</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-full transition ${
              selectedCategory === ''
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:border-green-600'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full transition ${
                selectedCategory === cat.id
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-green-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No products found</p>
        </div>
      )}
      </div>
    </div>
  );
}
