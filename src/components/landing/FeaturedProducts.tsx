
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Zap, Shield, Truck } from 'lucide-react';

const products = [
  {
    id: 1,
    name: "Wireless Bluetooth Earbuds Pro",
    price: 24.99,
    originalPrice: 79.99,
    image: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop",
    rating: 4.8,
    reviews: 2847,
    badge: "Best Seller",
    features: ["Noise Cancelling", "30H Battery", "IPX7 Waterproof"]
  },
  {
    id: 2,
    name: "Smart Fitness Watch Pro",
    price: 39.99,
    originalPrice: 149.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    rating: 4.7,
    reviews: 1923,
    badge: "Hot Deal",
    features: ["Heart Rate Monitor", "GPS Tracking", "7-Day Battery"]
  },
  {
    id: 3,
    name: "Wireless Phone Charger Pad",
    price: 15.99,
    originalPrice: 49.99,
    image: "https://images.unsplash.com/photo-1593642633279-1796119d5482?w=400&h=400&fit=crop",
    rating: 4.6,
    reviews: 856,
    badge: "70% Off",
    features: ["Fast Charging", "Universal Compatible", "LED Indicator"]
  },
  {
    id: 4,
    name: "Gaming Mouse RGB Pro",
    price: 19.99,
    originalPrice: 59.99,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop",
    rating: 4.9,
    reviews: 1456,
    badge: "Gaming",
    features: ["16000 DPI", "RGB Lighting", "Ergonomic Design"]
  }
];

export const FeaturedProducts = () => {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Tech Products</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Handpicked selection of the hottest tech gadgets at unbeatable wholesale prices
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="relative">
                <img 
                  src={product.image}
                  alt={product.name}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-3 left-3 bg-red-600 text-white">
                  {product.badge}
                </Badge>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ShoppingCart className="h-4 w-4 text-gray-700" />
                </div>
                
                {/* Discount percentage */}
                <div className="absolute bottom-3 left-3 bg-green-600 text-white rounded-full px-2 py-1 text-xs font-bold">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium ml-1">{product.rating}</span>
                  </div>
                  <span className="text-sm text-gray-500">({product.reviews} reviews)</span>
                </div>
                
                {/* Features */}
                <div className="space-y-1">
                  {product.features.slice(0, 2).map((feature, index) => (
                    <div key={index} className="flex items-center text-xs text-gray-600">
                      <Zap className="h-3 w-3 text-blue-500 mr-1" />
                      {feature}
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                  <span className="text-lg text-gray-500 line-through">${product.originalPrice}</span>
                </div>
                
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Add to Cart
                </Button>
                
                {/* Trust badges */}
                <div className="flex justify-center gap-4 pt-2 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    Warranty
                  </div>
                  <div className="flex items-center">
                    <Truck className="h-3 w-3 mr-1" />
                    Fast Ship
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="px-8 py-3">
            View All Tech Products
          </Button>
        </div>
      </div>
    </section>
  );
};
