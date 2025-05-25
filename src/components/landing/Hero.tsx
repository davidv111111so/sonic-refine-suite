
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Smartphone, Headphones, Watch } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="relative bg-gradient-to-br from-slate-50 to-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-600">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-medium">Trusted by 25,000+ tech enthusiasts</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Premium Tech
                <span className="text-blue-600"> At Unbeatable Prices</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Discover cutting-edge technology products at wholesale prices. 
                Latest gadgets, accessories, and electronics delivered fast worldwide.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Shop Tech Now
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-2">
                View All Categories
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">25K+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">48H</div>
                <div className="text-sm text-gray-600">Fast Shipping</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">99%</div>
                <div className="text-sm text-gray-600">Satisfaction</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8">
              <img 
                src="https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&h=400&fit=crop"
                alt="Latest Tech Products"
                className="w-full h-96 object-cover rounded-xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Free Shipping</div>
                    <div className="text-sm text-gray-600">Orders over $30</div>
                  </div>
                </div>
              </div>
              
              {/* Floating tech icons */}
              <div className="absolute -top-4 -right-4 bg-white rounded-full p-3 shadow-lg animate-bounce">
                <Smartphone className="h-6 w-6 text-blue-600" />
              </div>
              <div className="absolute top-1/3 -left-4 bg-white rounded-full p-3 shadow-lg animate-pulse">
                <Headphones className="h-6 w-6 text-purple-600" />
              </div>
              <div className="absolute bottom-1/3 -right-4 bg-white rounded-full p-3 shadow-lg animate-bounce delay-300">
                <Watch className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
