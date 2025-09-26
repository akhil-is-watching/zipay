'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  features: string[];
  specifications: { [key: string]: string };
}

const products: Product[] = [
  {
    id: 1,
    name: "Wireless Headphones",
    price: 99.99,
    category: "Electronics",
    image: "🎧",
    description: "High-quality wireless headphones with noise cancellation",
    features: [
      "Active Noise Cancellation",
      "30-hour battery life",
      "Quick charge (15 min = 3 hours)",
      "Premium sound quality",
      "Comfortable over-ear design"
    ],
    specifications: {
      "Battery Life": "30 hours",
      "Charging Time": "2 hours",
      "Connectivity": "Bluetooth 5.0",
      "Weight": "250g",
      "Warranty": "2 years"
    }
  },
  {
    id: 2,
    name: "Smart Watch",
    price: 199.99,
    category: "Electronics",
    image: "⌚",
    description: "Advanced smartwatch with health monitoring",
    features: [
      "Heart rate monitoring",
      "Sleep tracking",
      "Water resistant",
      "GPS enabled",
      "7-day battery life"
    ],
    specifications: {
      "Display": "1.4 inch AMOLED",
      "Battery Life": "7 days",
      "Water Resistance": "5ATM",
      "Connectivity": "Bluetooth, WiFi",
      "Warranty": "1 year"
    }
  },
  {
    id: 3,
    name: "Running Shoes",
    price: 129.99,
    category: "Sports",
    image: "👟",
    description: "Comfortable running shoes for all terrains",
    features: [
      "Breathable mesh upper",
      "Cushioned sole",
      "Lightweight design",
      "Durable construction",
      "All-terrain grip"
    ],
    specifications: {
      "Weight": "280g",
      "Sizes": "6-12 US",
      "Material": "Mesh & Rubber",
      "Drop": "8mm",
      "Warranty": "6 months"
    }
  },
  {
    id: 4,
    name: "Yoga Mat",
    price: 49.99,
    category: "Sports",
    image: "🧘",
    description: "Premium yoga mat with excellent grip",
    features: [
      "Non-slip surface",
      "Eco-friendly materials",
      "Easy to clean",
      "Lightweight and portable",
      "Extra thick for comfort"
    ],
    specifications: {
      "Thickness": "6mm",
      "Dimensions": "72 x 24 inches",
      "Weight": "1.2kg",
      "Material": "TPE",
      "Warranty": "1 year"
    }
  },
  {
    id: 5,
    name: "Coffee Maker",
    price: 79.99,
    category: "Home",
    image: "☕",
    description: "Automatic coffee maker with programmable features",
    features: [
      "Programmable timer",
      "12-cup capacity",
      "Auto shut-off",
      "Permanent filter",
      "Brew strength control"
    ],
    specifications: {
      "Capacity": "12 cups",
      "Power": "1000W",
      "Material": "Stainless steel",
      "Dimensions": "12 x 8 x 10 inches",
      "Warranty": "2 years"
    }
  },
  {
    id: 6,
    name: "Bluetooth Speaker",
    price: 89.99,
    category: "Electronics",
    image: "🔊",
    description: "Portable Bluetooth speaker with deep bass",
    features: [
      "360-degree sound",
      "12-hour battery",
      "Waterproof design",
      "Voice assistant ready",
      "Party mode pairing"
    ],
    specifications: {
      "Battery Life": "12 hours",
      "Range": "30 feet",
      "Water Rating": "IPX7",
      "Weight": "1.1kg",
      "Warranty": "1 year"
    }
  },
  {
    id: 7,
    name: "Fitness Tracker",
    price: 149.99,
    category: "Sports",
    image: "📱",
    description: "Advanced fitness tracker with heart rate monitor",
    features: [
      "24/7 heart rate monitoring",
      "Sleep analysis",
      "Activity tracking",
      "Smartphone notifications",
      "Water resistant"
    ],
    specifications: {
      "Battery Life": "5 days",
      "Display": "Color touchscreen",
      "Water Rating": "5ATM",
      "Connectivity": "Bluetooth 4.0",
      "Warranty": "1 year"
    }
  },
  {
    id: 8,
    name: "Desk Lamp",
    price: 59.99,
    category: "Home",
    image: "💡",
    description: "LED desk lamp with adjustable brightness",
    features: [
      "Adjustable brightness",
      "Color temperature control",
      "USB charging port",
      "Touch control",
      "Energy efficient LED"
    ],
    specifications: {
      "Power": "12W LED",
      "Brightness": "1000 lumens",
      "Color Temperature": "2700K-6500K",
      "USB Port": "5V/2A",
      "Warranty": "2 years"
    }
  }
];

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  
  const productId = parseInt(params.id as string);
  const product = products.find(p => p.id === productId);

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Link href="/" className="bg-black text-white px-4 py-2 rounded-md">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const handleBuyNow = () => {
    // Store product data in sessionStorage for checkout
    const checkoutData = {
      products: [{ ...product, quantity }],
      total: product.price * quantity
    };
    sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    router.push('/checkout');
  };

  const handleAddToCart = () => {
    // Store in localStorage for cart
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart!');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              ShopHub
            </Link>
            <Link 
              href="/cart" 
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              View Cart
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-8xl">{product.image}</span>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {product.category}
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">
                {product.name}
              </h1>
              <p className="text-xl text-gray-600 mt-2">
                ${product.price}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{product.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Features</h3>
              <ul className="space-y-1">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <span className="w-2 h-2 bg-black rounded-full mr-3"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">{key}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 border-x border-gray-300">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-gray-100 text-gray-900 py-3 px-6 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-black text-white py-3 px-6 rounded-md hover:bg-gray-800 transition-colors"
                >
                  Buy Now - ${(product.price * quantity).toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
