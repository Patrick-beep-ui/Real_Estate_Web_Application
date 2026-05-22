import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: April 7, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_strong]:text-foreground">

          <p>Tarek Buys Houses ("TBH," "we," "us," or "our") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or submit a form to receive a cash offer on your property.</p>

          <h2>1. Information We Collect</h2>
          <h3>Information You Provide</h3>
          <p>When you fill out a form on our site, we may collect:</p>
          <ul>
            <li>Your name</li>
            <li>Phone number</li>
            <li>Email address</li>
            <li>Property address</li>
            <li>Information about your property situation</li>
          </ul>

          <h3>Information Collected Automatically</h3>
          <p>When you visit our website, we may automatically collect:</p>
          <ul>
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Referring website</li>
            <li>Pages viewed and time spent on site</li>
            <li>Geographic location (city/region level)</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Contact you about your property and provide cash offer information</li>
            <li>Connect you with our real estate investment team</li>
            <li>Improve our website and services</li>
            <li>Send you marketing communications (with your consent)</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>3. Information Sharing</h2>
          <p>We do not sell your personal information to third parties. We may share your information with:</p>
          <ul>
            <li>Our affiliated real estate investment companies</li>
            <li>Service providers who assist in our operations</li>
            <li>Legal and regulatory authorities when required</li>
          </ul>

          <h2>4. SMS Communications</h2>
          <p>If you opt in to receive SMS text messages from Tarek Buys Houses, LLC, we will use your phone number to send you messages related to your property cash offer inquiry, transaction updates, appointment confirmations, customer care, or (if separately consented) promotional real estate content.</p>
          <p>Standard message and data rates may apply depending on your mobile carrier plan. Message frequency varies based on your inquiry and opt-in selections.</p>
          <p>You may opt out of SMS communications at any time by replying STOP to any message from us. After replying STOP, you will receive one final confirmation text and will not receive further messages from that campaign. Reply HELP for assistance, or contact us at privacy@tarekbuyshouses.com or (866) 407-3411.</p>
          <p>Carriers are not liable for delayed or undelivered messages.</p>
          <h3>SMS Opt-In Data — No Sharing Policy</h3>
          <p>SMS opt-in consent and phone numbers collected for the purpose of SMS communications are never sold, shared, rented, or transferred to any third party or affiliate for their own marketing or promotional purposes. This data is used exclusively by Tarek Buys Houses, LLC to communicate with the individual who provided consent. This applies regardless of any other data sharing described elsewhere in this Privacy Policy.</p>

          <h2>5. Cookies and Tracking</h2>
          <p>We use cookies and similar tracking technologies to:</p>
          <ul>
            <li>Remember your preferences</li>
            <li>Understand how you use our website</li>
            <li>Deliver relevant advertising</li>
            <li>Track conversions from our advertising campaigns</li>
          </ul>

          <h2>6. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

          <h2>7. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Delete your personal information</li>
            <li>Opt out of marketing communications</li>
            <li>Restrict processing of your information</li>
          </ul>

          <h2>8. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or our privacy practices, please contact us at:</p>
          <p>Email: privacy@tarekkbuyshouses.com</p>

        </div>
      </div>
    </div>
  );
}
