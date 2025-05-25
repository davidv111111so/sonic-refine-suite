
import { Button } from '@/components/ui/button';
import { Users, Award, Globe, TrendingUp, Smartphone, ShoppingCart } from 'lucide-react';

export const About = () => {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-gray-900">
              Your Trusted Tech Partner Since 2020
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Solo Tech specializes in bringing you the latest technology products at wholesale prices. 
              We work directly with manufacturers to eliminate middlemen and pass the savings to you.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              From smartphones and accessories to smart home devices and gaming gear, 
              we curate only the best products that meet our quality standards.
            </p>
            
            <div className="grid grid-cols-3 gap-6 py-6">
              <div className="text-center">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">25K+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
              <div className="text-center">
                <Smartphone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-600">Tech Products</div>
              </div>
              <div className="text-center">
                <Globe className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">50+</div>
                <div className="text-sm text-gray-600">Countries</div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                <span className="font-semibold text-gray-900">Our Mission</span>
              </div>
              <p className="text-gray-700">
                To make cutting-edge technology accessible to everyone by offering 
                authentic products at wholesale prices with exceptional service.
              </p>
            </div>
            
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Start Shopping Now
            </Button>
          </div>
          
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop"
              alt="Solo Tech Products"
              className="w-full h-96 object-cover rounded-2xl shadow-2xl"
            />
            
            {/* Floating stats */}
            <div className="absolute -top-6 -left-6 bg-white rounded-xl p-4 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">70%</div>
                <div className="text-sm text-gray-600">Average Savings</div>
              </div>
            </div>
            
            <div className="absolute -bottom-6 -right-6 bg-white rounded-xl p-4 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">4.8★</div>
                <div className="text-sm text-gray-600">Customer Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
