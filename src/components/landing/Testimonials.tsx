
import { Card } from '@/components/ui/card';
import { Star, ShoppingCart, Truck, Shield } from 'lucide-react';

const testimonials = [
  {
    name: "Alex Chen",
    role: "Tech Enthusiast",
    content: "Amazing prices for authentic products! Got my wireless earbuds for 60% less than retail. Quality is exactly as advertised and shipping was super fast.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    purchase: "Wireless Earbuds Pro",
    verified: true
  },
  {
    name: "Sarah Johnson",
    role: "Mobile Gamer",
    content: "The gaming mouse I ordered exceeded my expectations. Original packaging, fast shipping, and the RGB lighting is incredible. Will definitely order again!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    purchase: "Gaming Mouse RGB Pro",
    verified: true
  },
  {
    name: "Mike Rodriguez",
    role: "Fitness Tracker User",
    content: "Best tech shopping experience ever! Customer service helped me choose the right smartwatch, and it arrived in perfect condition. Saved over $100!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    purchase: "Smart Fitness Watch Pro",
    verified: true
  }
];

export const Testimonials = () => {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Tech Customers Say</h2>
          <p className="text-xl text-gray-600">
            Real reviews from real customers who love their Solo Tech purchases
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow relative">
              {/* Verified badge */}
              {testimonial.verified && (
                <div className="absolute top-4 right-4">
                  <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified Purchase
                  </div>
                </div>
              )}
              
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              
              <p className="text-gray-700 mb-4 leading-relaxed">"{testimonial.content}"</p>
              
              {/* Purchase info */}
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <div className="flex items-center text-sm text-blue-800">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  <span className="font-medium">Purchased: {testimonial.purchase}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img 
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center text-xs text-green-600">
                    <Truck className="h-3 w-3 mr-1" />
                    Fast Delivery
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Join thousands of satisfied tech customers</p>
          <div className="flex justify-center items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-amber-400 mr-1" />
              <span>4.8/5 Average Rating</span>
            </div>
            <div>25,000+ Reviews</div>
            <div>99% Satisfaction Rate</div>
          </div>
        </div>
      </div>
    </section>
  );
};
