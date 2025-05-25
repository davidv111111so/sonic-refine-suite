
import { Shield, Truck, Clock, Gift } from 'lucide-react';
import { Card } from '@/components/ui/card';

const benefits = [
  {
    icon: Shield,
    title: "Quality Guarantee",
    description: "All products come with our 30-day money-back guarantee. Shop with confidence."
  },
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Free shipping on all orders over $50. Fast delivery nationwide."
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Round-the-clock customer support. We're here when you need us."
  },
  {
    icon: Gift,
    title: "Exclusive Deals",
    description: "Members get access to exclusive discounts and early product launches."
  }
];

export const Benefits = () => {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're committed to providing the best shopping experience possible
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
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
