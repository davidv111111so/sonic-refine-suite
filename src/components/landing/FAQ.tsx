
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  {
    question: "Are these products authentic and brand new?",
    answer: "Yes, all our products are 100% authentic and brand new. We work directly with manufacturers and authorized distributors to ensure authenticity. Each product comes with original packaging and manufacturer warranty where applicable."
  },
  {
    question: "How long does international shipping take?",
    answer: "Standard international shipping takes 7-15 business days depending on your location. We offer express shipping (3-7 days) for faster delivery. Free shipping is available on orders over $50."
  },
  {
    question: "What's your return and warranty policy?",
    answer: "We offer a 30-day money-back guarantee on all products. Items must be returned in original condition with packaging. Most products also include manufacturer warranty ranging from 6 months to 2 years."
  },
  {
    question: "Why are your prices so low compared to retail stores?",
    answer: "We work directly with manufacturers and buy in bulk volumes, eliminating middlemen markup. This allows us to offer wholesale prices to individual customers while maintaining the same quality standards."
  },
  {
    question: "Do you offer technical support for the products?",
    answer: "Yes, our technical support team is available 24/7 to help with product setup, troubleshooting, and any technical questions. We also provide detailed user guides and video tutorials."
  },
  {
    question: "Can I track my order and get updates?",
    answer: "Absolutely! Once your order ships, you'll receive a tracking number via email and SMS. You can track your package in real-time on our website or the carrier's tracking portal."
  },
  {
    question: "Do you offer bulk discounts for larger orders?",
    answer: "Yes, we offer additional discounts for bulk orders. Contact our sales team for custom pricing on orders over $500. We also have a wholesale program for retailers and businesses."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay, and for larger orders, bank transfers. All transactions are secured with SSL encryption."
  }
];

export const FAQ = () => {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about shopping with Solo Tech
          </p>
        </div>
        
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="bg-white rounded-lg border px-6">
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
