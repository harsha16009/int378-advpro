import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PRODUCT_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoUri = process.env.MONGO_PRODUCT_URI || 'mongodb://mongo:27017/product-db';
mongoose.connect(mongoUri)
  .then(async () => {
    console.log('✅ Product Service DB connected');
    await seedDatabase();
  })
  .catch(err => console.log('❌ DB Connection Error:', err));

// Auto Seed Function
async function seedDatabase() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding products...');
      const seedProducts = [
        {
          name: "Premium Fresh Pomegranates",
          category: "pomegranate",
          description: "Sweet, ruby-red juicy pomegranates loaded with antioxidants and vital nutrients. Selected by experts.",
          price: 150,
          originalPrice: 200,
          quantity: 50,
          unit: "kg",
          image: "/images/pom1.jpg",
          rating: 4.8,
          nutritionInfo: {
            calories: 83,
            protein: "1.7g",
            carbs: "19g",
            fat: "1.2g",
            fiber: "4g"
          },
          addOns: [
            { name: "Organic Certified", price: 50 },
            { name: "Pesticide-Free", price: 30 }
          ]
        },
        {
          name: "Organic Red Apples",
          category: "apple",
          description: "Crispy, sweet red apples sourced from Shimla orchards, perfect for health-conscious snacking.",
          price: 120,
          originalPrice: 150,
          quantity: 100,
          unit: "kg",
          image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80",
          rating: 4.6,
          nutritionInfo: {
            calories: 52,
            protein: "0.3g",
            carbs: "14g",
            fat: "0.2g",
            fiber: "2.4g"
          },
          addOns: [
            { name: "Gift Pack Wrapping", price: 40 }
          ]
        },
        {
          name: "Alphonso Mangoes (King of Fruits)",
          category: "mango",
          description: "Rich, creamy, tender Alphonso mangoes with excellent aroma and sweet flavour.",
          price: 200,
          originalPrice: 300,
          quantity: 30,
          unit: "kg",
          image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80",
          rating: 4.9,
          nutritionInfo: {
            calories: 60,
            protein: "0.8g",
            carbs: "15g",
            fat: "0.3g",
            fiber: "1.6g"
          }
        },
        {
          name: "Fresh Nagpur Oranges",
          category: "orange",
          description: "Juicy, sweet-sour oranges rich in Vitamin C and fiber. Great for freshly squeezed juice.",
          price: 100,
          originalPrice: 130,
          quantity: 75,
          unit: "kg",
          image: "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=600&q=80",
          rating: 4.5,
          nutritionInfo: {
            calories: 47,
            protein: "0.9g",
            carbs: "12g",
            fat: "0.1g",
            fiber: "2.4g"
          }
        },
        {
          name: "Yellow Robusta Bananas",
          category: "banana",
          description: "Perfectly ripe yellow bananas, rich in potassium and instant energy. Great for post-workout smoothies.",
          price: 80,
          originalPrice: 100,
          quantity: 150,
          unit: "dozen",
          image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80",
          rating: 4.7,
          nutritionInfo: {
            calories: 89,
            protein: "1.1g",
            carbs: "23g",
            fat: "0.3g",
            fiber: "2.6g"
          }
        },
        {
          name: "Sweet Seedless Green Grapes",
          category: "grapes",
          description: "Plump, sweet seedless green grapes, handpicked and cold-stored for ultimate freshness.",
          price: 200,
          originalPrice: 250,
          quantity: 40,
          unit: "kg",
          image: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=600&q=80",
          rating: 4.8,
          nutritionInfo: {
            calories: 69,
            protein: "0.7g",
            carbs: "18g",
            fat: "0.2g",
            fiber: "0.9g"
          }
        }
      ];
      await Product.insertMany(seedProducts);
      console.log('✅ Seeding completed!');
    }
  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
}

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true }, // pomegranate, apple, mango, orange, etc.
  description: String,
  price: { type: Number, required: true },
  originalPrice: Number, // for discount
  quantity: { type: Number, default: 0 }, // stock
  unit: { type: String, default: 'kg' }, // kg, piece, pack
  image: String,
  rating: { type: Number, default: 0 },
  reviews: [{ user: String, comment: String, rating: Number }],
  addOns: [{ // bundled items like organic, pesticide-free, etc.
    name: String,
    price: Number
  }],
  nutritionInfo: {
    calories: Number,
    protein: String,
    carbs: String,
    fat: String,
    fiber: String
  },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Routes
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Product Service is running' });
});

// Get all products
app.get('/', async (req, res) => {
  try {
    const { category, search, sortBy } = req.query;
    let query = {};

    if (category) query.category = category;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];

    let products = Product.find(query);

    if (sortBy === 'price-low-high') products = products.sort({ price: 1 });
    else if (sortBy === 'price-high-low') products = products.sort({ price: -1 });
    else if (sortBy === 'rating') products = products.sort({ rating: -1 });

    const result = await products;
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Get single product
app.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

// Create product (admin only)
app.post('/', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});

// Update product
app.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
});

// Delete product
app.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

// Get product by category
app.get('/category/:category', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Add review
app.post('/:id/review', async (req, res) => {
  try {
    const { user, comment, rating } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.reviews.push({ user, comment, rating });
    const avgRating = product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;
    product.rating = avgRating;

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error adding review', error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Product Service is running' });
});

app.listen(PORT, () => {
  console.log(`🍎 Product Service running on port ${PORT}`);
});
