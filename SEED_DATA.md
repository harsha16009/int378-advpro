# Fruits Delivery Platform - Seed Data Script

This script creates initial product data for the Fruits Delivery Platform.

## Run Seed Data

```bash
# With Docker running
docker-compose exec product-service node seed.js
```

Or directly:
```bash
# Connect to your MongoDB
mongosh --authenticationDatabase admin -u admin -p admin123 localhost:27017/product-db

# Insert sample products
db.products.insertMany([
  {
    name: "Fresh Pomegranates",
    category: "pomegranate",
    description: "Sweet and juicy pomegranates loaded with antioxidants",
    price: 150,
    originalPrice: 200,
    quantity: 50,
    unit: "kg",
    rating: 4.8,
    nutritionInfo: {
      calories: "83",
      protein: "1.7g",
      carbs: "19g",
      fat: "1.2g",
      fiber: "4g"
    },
    addOns: [
      { name: "Organic", price: 50 },
      { name: "Pesticide-Free", price: 30 }
    ]
  },
  {
    name: "Red Apples",
    category: "apple",
    description: "Crispy red apples perfect for snacking",
    price: 120,
    originalPrice: 150,
    quantity: 100,
    unit: "kg",
    rating: 4.6,
    nutritionInfo: {
      calories: "52",
      protein: "0.3g",
      carbs: "14g",
      fat: "0.2g",
      fiber: "2.4g"
    }
  },
  {
    name: "Ripe Mangoes",
    category: "mango",
    description: "Alphonso mangoes - king of fruits",
    price: 200,
    originalPrice: 300,
    quantity: 30,
    unit: "kg",
    rating: 4.9
  },
  {
    name: "Fresh Oranges",
    category: "orange",
    description: "Juicy oranges rich in Vitamin C",
    price: 100,
    originalPrice: 130,
    quantity: 75,
    unit: "kg",
    rating: 4.5
  },
  {
    name: "Yellow Bananas",
    category: "banana",
    description: "Fresh bananas perfect for smoothies",
    price: 80,
    originalPrice: 100,
    quantity: 150,
    unit: "dozen",
    rating: 4.7
  },
  {
    name: "Green Grapes",
    category: "grapes",
    description: "Sweet green grapes seedless variety",
    price: 200,
    originalPrice: 250,
    quantity: 40,
    unit: "kg",
    rating: 4.8
  }
])
```
