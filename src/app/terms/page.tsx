import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PhoneText from "@/components/shared/PhoneText";
import { PHONE } from "@/lib/shared/phone";
import { CONTACT_EMAIL } from "@/lib/shared/contact";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-10">Effective Date: June 03, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_strong]:text-foreground">

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the website of Tarek Buys Houses, LLC (&ldquo;Website&rdquo;), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use this Website or any of the services offered.
          </p>

          <h3>Business Identity Clause</h3>
          <p>
            Tarek Buys Houses, LLC provides products and services to customers. By using our services and providing your phone number, you agree to receive text messages from us as described in these terms. The messages can be of appointment confirmation &amp; reminders, order confirmation, etc.
          </p>

          <h3>Opt-Out &amp; Support Mechanisms Clause</h3>
          <p>
            You can cancel the SMS service at any time. Just text &ldquo;STOP&rdquo; to <PhoneText>{PHONE.call}</PhoneText>. After you send the SMS message &ldquo;STOP&rdquo; to us, we will send you an SMS message to confirm that you have been unsubscribed. After this, you will no longer receive SMS messages from us. If you want to join again, just sign up as you did the first time and we will start sending SMS messages to you again. If you are experiencing issues with the messaging program you can reply with the keyword HELP for more assistance, or you can get help directly at {CONTACT_EMAIL} or <PhoneText>{PHONE.call}</PhoneText>.
          </p>

          <h3>Carrier Liability Clause</h3>
          <p>
            Carriers are not liable for delayed or undelivered messages.
          </p>

          <h3>Message Frequency Clause</h3>
          <p>
            As always, message and data rates may apply for any messages sent to you from us and to us from you. Message frequency varies based on your activity. If you have any questions about your text plan or data plan, it is best to contact your wireless provider.
          </p>

          <h3>Privacy Policy</h3>
          <p>
            If you have any questions regarding privacy, please read our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>

          <h2>2. Use of the Website</h2>

          <h3>2.1 Eligibility</h3>
          <p>
            You must be at least 18 years old or have the legal capacity in your jurisdiction to enter into a binding agreement to use this Website. If you are under 18, you may only use this Website with the consent and supervision of a parent or legal guardian.
          </p>

          <h3>2.2 Account Registration</h3>
          <p>
            Some areas of the Website may require you to register an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities conducted under your account.
          </p>

          <h3>2.3 Acceptable Use</h3>
          <p>
            You may use the content on the Website for personal, non-commercial purposes only. You may not reproduce, modify, distribute, or exploit any content without prior written consent from Tarek Buys Houses, LLC.
          </p>

          <h2>3. Privacy</h2>
          <p>
            Your use of the Website is subject to our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, which governs the collection, use, and disclosure of your personal information.
          </p>

          <h2>4. Intellectual Property</h2>
          <p>
            All content, trademarks, logos, and other materials on the Website are the property of Tarek Buys Houses, LLC or its licensors, and are protected under applicable intellectual property laws. Unauthorized use of any content is strictly prohibited.
          </p>

          <h2>5. User Conduct</h2>
          <p>When using the Website, you agree not to:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Violate any applicable laws or regulations.</li>
            <li>Infringe upon the rights of others, including their intellectual property, privacy, or publicity rights.</li>
            <li>Post or transmit any defamatory, offensive, obscene, or harmful content.</li>
            <li>Attempt to gain unauthorized access to the Website or interfere with its systems or operations.</li>
          </ol>

          <h2>6. Third-Party Links</h2>
          <p>
            The Website may include links to external websites or services operated by third parties. These are provided for your convenience only. Tarek Buys Houses, LLC does not control or endorse such websites and is not responsible for their content or practices.
          </p>

          <h2>7. Termination of Access</h2>
          <p>
            We reserve the right to terminate or suspend your access to the Website or any services, at our sole discretion, at any time and without prior notice, for any reason including, but not limited to, a violation of these Terms.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Tarek Buys Houses, LLC shall not be liable for any direct, indirect, incidental, consequential, or punitive damages resulting from your access to or use of the Website or any services provided through it, even if advised of the possibility of such damages.
          </p>

          <h2>9. Changes to These Terms</h2>
          <p>
            We may update or modify these Terms and Conditions at any time without prior notice. Changes will take effect immediately upon posting on the Website. Your continued use of the Website after changes have been made constitutes your acceptance of the revised Terms.
          </p>

          <h2>10. Contact Us</h2>
          <p>If you have questions or concerns about these Terms and Conditions, please contact us at:</p>
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
