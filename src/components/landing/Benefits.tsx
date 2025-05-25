
import { Shield, Truck, Clock, Zap, DollarSign, Headphones } from 'lucide-react';
import { Card } from '@/components/ui/card';

const benefits = [
  {
    icon: DollarSign,
    title: "Wholesale Prices",
    description: "Direct from manufacturer pricing. Save up to 70% compared to retail stores."
  },
  {
    icon: Truck,
    title: "Fast Worldwide Shipping",
    description: "Express shipping available. Most orders arrive within 5-10 business days."
  },
  {
    icon: Shield,
    title: "Quality Guaranteed",
    description: "30-day money-back guarantee. All products tested for quality and functionality."
  },
  {
    icon: Zap,
    title: "Latest Technology",
    description: "Cutting-edge gadgets and accessories. Stay ahead with the newest innovations."
  },
  {
    icon: Headphones,
    title: "24/7 Tech Support",
    description: "Expert technical support team ready to help with any product questions."
  },
  {
    icon: Clock,
    title: "Quick Processing",
    description: "Orders processed within 24 hours. Fast fulfillment for faster delivery."
  }
];

export const Benefits = () => {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Solo Tech</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're committed to bringing you the latest technology at unbeatable prices
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow border-2 hover:border-blue-200">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <benefit.icon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
