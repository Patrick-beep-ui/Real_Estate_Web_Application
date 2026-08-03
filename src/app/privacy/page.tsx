import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PhoneText from "@/components/shared/PhoneText";
import { PHONE } from "@/lib/phone";
import { CONTACT_EMAIL } from "@/lib/contact";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-10">Effective Date: June 03, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_strong]:text-foreground">

          <p>
            This Privacy Policy explains how Tarek Buys Houses (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, protects, and handles your information when you access or use our website (https://tarekbuyshouses.com/) or interact with our services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or submit a form to receive a cash offer on your property.
          </p>

          <h2>1. Information We Collect</h2>
          <p>We collect the following types of information:</p>

          <h3>Personal Information You Provide</h3>
          <p>Name, email address, phone number, and other contact information when you submit a form, request services, or communicate with us.</p>

          <h3>Automatically Collected Information</h3>
          <p>Device type, browser, IP address, referral source, and usage data collected through cookies or similar technologies.</p>

          <h2>2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide, manage, and improve our services</li>
            <li>Respond to inquiries and offer support</li>
            <li>Send appointment confirmations or requested updates</li>
            <li>Maintain records for legal and regulatory compliance</li>
            <li>Conduct internal research and performance analysis</li>
          </ul>
          <p>
            No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. Information sharing to subcontractors in support services, such as customer service, is permitted. All other use case categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.
          </p>

          <h2>3. Text Messaging and Consent</h2>
          <p>
            If you opt-in to receive SMS/text messages from us, we will only use your mobile number to communicate relevant service-related information or updates.
          </p>
          <p>
            Text messaging originator opt-in data and consent will not be shared with any third parties, except for aggregators and providers of the text message services used to deliver those messages.
          </p>

          <h2>4. Cookies and Tracking Technologies</h2>
          <p>We may use cookies and similar tracking tools to:</p>
          <ul>
            <li>Understand how you interact with our website</li>
            <li>Improve site functionality and user experience</li>
            <li>Track usage statistics</li>
          </ul>
          <p>
            You can choose to disable cookies through your browser settings. However, this may affect certain website functions.
          </p>

          <h2>5. Sharing of Information</h2>
          <p className="font-semibold">Note:</p>
          <p>
            &ldquo;No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. Information sharing to subcontractors in support services, such as customer service is permitted. All other use case categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.&rdquo;
          </p>
          <p>
            We do not sell or share your personal information with external parties for promotional or marketing purposes.
          </p>
          <p>
            In cases where we work with service providers (e.g., email services, web hosting, analytics), they are only granted access to the minimum information necessary to perform their function on our behalf and are bound by confidentiality agreements.
          </p>
          <p>
            All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties, excluding aggregators and providers of the text message services.
          </p>

          <h2>6. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your information from unauthorized access, loss, misuse, or alteration.
          </p>

          <h2>7. Data Retention</h2>
          <p>
            We retain your personal data only as long as necessary for business, legal, or regulatory purposes.
          </p>

          <h2>8. Your Rights and Choices</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access and review your personal information</li>
            <li>Request corrections or deletions</li>
            <li>Withdraw your consent to receive marketing communications</li>
            <li>Opt-out of SMS messaging at any time by replying &ldquo;STOP&rdquo;</li>
          </ul>
          <p>
            To exercise your rights, please contact us using the information provided below.
          </p>

          <h2>9. Children&rsquo;s Privacy</h2>
          <p>
            Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children without verified parental consent.
          </p>

          <h2>10. Updates to This Privacy Policy</h2>
          <p>
            We reserve the right to update or revise this policy at any time. Changes will be posted on this page, and the updated date will be reflected above. We encourage users to regularly review this page for any changes.
          </p>

          <h2>11. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or your data, you may contact us at:</p>
          <p>
            Tarek Buys Houses, LLC<br />
            Email: {CONTACT_EMAIL}<br />
            Website: https://tarekbuyshouses.com<br />
            Phone: <PhoneText>{PHONE.call}</PhoneText>
          </p>

        </div>
      </div>
    </div>
  );
}
