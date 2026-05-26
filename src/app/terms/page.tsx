import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: April 7, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_strong]:text-foreground">

          <p>Welcome to Tarek Buys Houses. These Terms of Service ("Terms") govern your use of our website and services. By accessing or using our website, you agree to be bound by these Terms.</p>

          <h2>1. Acceptance of Terms</h2>
          <p>By using our website, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, please do not use our website.</p>

          <h2>2. Description of Services</h2>
          <p>Tarek Buys Houses provides real estate investment services, including purchasing homes directly from homeowners for cash. We are not a licensed real estate broker or agent, and we do not provide real estate brokerage services.</p>

          <h2>3. No Obligation</h2>
          <p>Submitting a form or contacting us does not obligate you to sell your property or obligate us to make an offer. All transactions are subject to mutual agreement and due diligence.</p>

          <h2>4. Property Information</h2>
          <p>You represent that any information you provide about your property is accurate and complete to the best of your knowledge. We rely on this information in evaluating properties.</p>

          <h2>5. Not Legal or Financial Advice</h2>
          <p>Our services do not constitute legal, tax, financial, or investment advice. We recommend consulting with appropriate professionals regarding your specific situation.</p>

          <h2>6. Intellectual Property</h2>
          <p>All content on our website, including text, graphics, logos, and images, is the property of Tarek Buys Houses or its licensors and is protected by intellectual property laws.</p>

          <h2>7. Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, Tarek Buys Houses shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our website or services.</p>

          <h2>8. Indemnification</h2>
          <p>You agree to indemnify and hold harmless Tarek Buys Houses and its affiliates from any claims, damages, or expenses arising from your use of our website or violation of these Terms.</p>

          <h2>9. Privacy</h2>
          <p>Your privacy is important to us. Please review our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> to understand how we collect, use, and protect your information.</p>

          <h2>10. Modifications to Terms</h2>
          <p>We reserve the right to modify these Terms at any time. Continued use of our website after any changes constitutes your acceptance of the modified Terms.</p>

          <h2>11. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.</p>

          <h2>12. SMS Messaging Terms</h2>

          <h3>12.1 Program Description</h3>
          <p>Tarek Buys Houses, LLC operates an SMS messaging program to communicate with homeowners who have submitted an inquiry about receiving a cash offer on their property. Messages may include: offer details and updates, appointment confirmations, property status notifications, customer care, and (where separately consented) promotional real estate content such as market updates or special offers.</p>

          <h3>12.2 Opt-Out</h3>
          <p>You may opt out of any SMS communications at any time by replying STOP to any message we send. After replying STOP, you will receive one final confirmation text and will not receive further messages from that campaign. To re-subscribe to transactional messages, reply START.</p>

          <h3>12.3 Help</h3>
          <p>Reply HELP to any SMS message for assistance. You will receive a response with our contact details: Tarek Buys Houses, LLC — legal@tarekbuyshouses.com, (866) 407-3411.</p>

          <h3>12.4 Carrier Liability</h3>
          <p>Tarek Buys Houses, LLC is not responsible for and shall not be liable for any delays or failures in the receipt of SMS messages. Wireless carriers are not liable for delayed or undelivered messages. Message and data rates may apply depending on your mobile carrier plan.</p>

          <h3>12.5 Consent Is Optional</h3>
          <p>Consent to receive SMS messages — whether transactional, informational, or promotional — is not required as a condition of receiving a cash offer, entering into any real estate transaction, or accessing any services offered by Tarek Buys Houses, LLC. You may use our services without opting in to SMS.</p>

          <h3>12.6 Age Restriction</h3>
          <p>This SMS messaging program is intended solely for individuals who are 18 years of age or older. By opting in to receive SMS messages from Tarek Buys Houses, LLC, you represent and warrant that you are at least 18 years of age. If you are under the age of 18, you are not permitted to opt in to, use, or receive messages through this program. Tarek Buys Houses, LLC reserves the right to terminate your participation in this SMS program if we have reason to believe you do not meet this age requirement.</p>

          <h2>13. Contact Information</h2>
          <p>For questions about these Terms, please contact us at:</p>
          <p>Email: legal@tarekbuyshouses.com</p>

        </div>
      </div>
    </div>
  );
}
