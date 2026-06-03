import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DoNotSell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-2">Do Not Sell My Personal Information</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: May 26, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3">

          <p>We respect your privacy and your right to control how your personal information is used. California residents and other users may have additional rights regarding the sale of their personal information.</p>

          <h2>Your Rights</h2>
          <p>You have the right to request that we do not sell your personal information to third parties. To exercise this right, please contact us using the methods below.</p>

          <h2>How to Opt Out</h2>
          <p>To request that we do not sell your personal information:</p>
          <ul>
            <li>Email us at: subscriptions@tarekbuyshouses.com</li>
            <li>Include "Do Not Sell My Information" in the subject line</li>
            <li>Provide your name, email, and phone number</li>
          </ul>

          <h2>What Happens Next</h2>
          <p>Once we receive your request, we will:</p>
          <ul>
            <li>Verify your identity</li>
            <li>Remove your information from our marketing lists</li>
            <li>Update our systems to respect your preference</li>
            <li>Confirm your request within 15 days</li>
          </ul>

          <h2>Information We Collect</h2>
          <p>For more details about the types of information we collect and how we use it, please review our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</p>

          <h2>Contact Us</h2>
          <p>If you have questions about this policy or your privacy rights, please contact us:</p>
          <p>
            <strong className="text-foreground">Email:</strong> subscriptions@tarekbuyshouses.com<br />
            <strong className="text-foreground">Subject Line:</strong> "Do Not Sell My Information"
          </p>

        </div>
      </div>
    </div>
  );
}
