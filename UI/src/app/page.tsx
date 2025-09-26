'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
}

const products: Product[] = [
  {
    id: 1,
    name: "Wireless Headphones",
    price: 99.99,
    category: "Electronics",
    image: "🎧",
    description: "High-quality wireless headphones with noise cancellation"
  },
  {
    id: 2,
    name: "Smart Watch",
    price: 199.99,
    category: "Electronics",
    image: "⌚",
    description: "Advanced smartwatch with health monitoring"
  },
  {
    id: 3,
    name: "Running Shoes",
    price: 129.99,
    category: "Sports",
    image: "👟",
    description: "Comfortable running shoes for all terrains"
  },
  {
    id: 4,
    name: "Yoga Mat",
    price: 49.99,
    category: "Sports",
    image: "🧘",
    description: "Premium yoga mat with excellent grip"
  },
  {
    id: 5,
    name: "Coffee Maker",
    price: 79.99,
    category: "Home",
    image: "☕",
    description: "Automatic coffee maker with programmable features"
  },
  {
    id: 6,
    name: "Bluetooth Speaker",
    price: 89.99,
    category: "Electronics",
    image: "🔊",
    description: "Portable Bluetooth speaker with deep bass"
  },
  {
    id: 7,
    name: "Fitness Tracker",
    price: 149.99,
    category: "Sports",
    image: "📱",
    description: "Advanced fitness tracker with heart rate monitor"
  },
  {
    id: 8,
    name: "Desk Lamp",
    price: 59.99,
    category: "Home",
    image: "💡",
    description: "LED desk lamp with adjustable brightness"
  }
];

const categories = ["All", "Electronics", "Sports", "Home"];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<Product[]>([]);

  const filteredProducts = selectedCategory === "All" 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">ShopHub</h1>
            <div className="flex items-center space-x-4">
              <Link 
                href="/cart" 
                className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                Cart ({cart.length})
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Amazing Products
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Shop from our wide selection of high-quality products
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full transition-colors ${
                  selectedCategory === category
                    ? 'bg-black text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="text-4xl mb-4 text-center">{product.image}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-gray-900">
                      ${product.price}
                    </span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {product.category}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      href={`/product/${product.id}`}
                      className="flex-1 bg-gray-100 text-gray-900 py-2 px-4 rounded-md text-center hover:bg-gray-200 transition-colors"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => addToCart(product)}
                      className="flex-1 bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">
            © 2024 ShopHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}