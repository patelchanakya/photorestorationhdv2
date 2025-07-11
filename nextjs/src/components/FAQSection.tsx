import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does PhotoRestorationHD protect my privacy?",
    answer:
      "Your photos and personal information belong to you. We never share your images or personal data with third parties for marketing. Your photos are stored securely and are only accessible to you. You can delete your photos or account at any time.",
  },
  {
    question: "Will my photos be used for anything else?",
    answer:
      "No. Your uploaded photos are only used to provide your restoration results. We never use your images for training, marketing, or any other purpose. Only you can access your restored images.",
  },
  {
    question: "Can I get a refund if I'm not happy with the results?",
    answer:
      "Because each photo restoration uses real computing resources, credits are used as soon as processing begins. Even if the result isn't perfect, we can't offer refunds for results you don't love. If there's a technical problem or you made a mistake, just reach out and we'll do our best to help!",
  },
  {
    question: "How do I delete my photos or account?",
    answer:
      "You can delete individual photos or your entire account from your dashboard. Deleting your account removes all your data within 30 days. For help, email photorestorationhd@gmail.com.",
  },
  {
    question: "What happens when I delete a photo or my account?",
    answer:
      "When you delete a photo or your account, this is a permanent action. Your images and data are erased forever and cannot be recovered. Please be sure before deleting, as we can't restore deleted content.",
  },
  {
    question: "Is my payment information safe?",
    answer:
      "Yes. All payments are processed securely through Stripe. We never see or store your credit card details.",
  },
  {
    question: "What types of photos can I upload?",
    answer:
      "You can upload old, damaged, or low-quality photos you own or have permission to restore. Please don't upload copyrighted, illegal, or inappropriate content.",
  },
  {
    question: "How long are my photos stored?",
    answer:
      "Your photos are stored securely until you delete them. You can download your restored images anytime. When you delete a photo, it is permanently erased and cannot be recovered.",
  },
  {
    question: "How fast will I get my restored photo?",
    answer:
      "Most restorations are completed within seconds. Processing time may vary based on demand and image complexity.",
  },
  {
    question: "What if I need help or have a problem?",
    answer:
      "You can contact our support team at photorestorationhd@gmail.com. We respond to all inquiries within 48 hours.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="max-w-[85rem] container mx-auto px-4 md:px-6 2xl:max-w-[1400px] py-24 lg:py-32">
      <div className="max-w-2xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={faq.question}>
              <AccordionTrigger className="text-lg font-semibold text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
} 