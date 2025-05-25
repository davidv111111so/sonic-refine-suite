
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  {
    question: "What is your return policy?",
    answer: "We offer a 30-day money-back guarantee on all products. If you're not satisfied, return the item in its original condition for a full refund."
  },
  {
    question: "How long does shipping take?",
    answer: "Standard shipping takes 3-5 business days. Free shipping is available on orders over $50. Express shipping options are also available."
  },
  {
    question: "Do you ship internationally?",
    answer: "Yes, we ship to over 25 countries worldwide. International shipping costs and delivery times vary by location."
  },
  {
    question: "Are your products authentic?",
    answer: "Absolutely! All our products are 100% authentic and come directly from authorized manufacturers and distributors."
  },
  {
    question: "How can I track my order?",
    answer: "Once your order ships, you'll receive a tracking number via email. You can use this to track your package on our website or the carrier's site."
  },
  {
    question: "Do you offer customer support?",
    answer: "Yes, we provide 24/7 customer support via email, chat, and phone. Our team is always ready to help with any questions or concerns."
  }
];

export const FAQ = () => {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600">
            Find answers to common questions about our products and services
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
