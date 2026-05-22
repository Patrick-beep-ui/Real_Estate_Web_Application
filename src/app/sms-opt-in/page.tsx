import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SMSOptIn() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-2">SMS Opt-In Disclosure</h1>
        <p className="text-muted-foreground text-sm mb-10">Tarek Buys Houses, LLC — SMS Messaging Program</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_strong]:text-foreground">

          <p>
            When you submit a property inquiry on <Link href="/" className="text-primary hover:underline">tarekbuyshouses.com</Link>, you
            may opt in to receive SMS text messages from Tarek Buys Houses, LLC. This page describes the
            terms of that program.
          </p>

          <h2>Program Description</h2>
          <p>
            Tarek Buys Houses, LLC operates an SMS messaging program to communicate with homeowners who
            have submitted an inquiry about receiving a cash offer on their property. Messages may include
            offer details and updates, appointment confirmations, property status notifications, and
            customer care communications.
          </p>

          <h2>How You Opt In</h2>
          <p>
            Opt-in occurs on our property inquiry forms. The consent section of each form includes the
            following checkboxes — <strong>all of which are unchecked by default and entirely optional</strong>:
          </p>

          <div className="border border-border rounded-xl p-6 space-y-5 bg-card/50">

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="demo-transactional"
                className="mt-1 h-4 w-4 rounded border-border shrink-0 accent-amber-500"
                defaultChecked={false}
              />
              <label htmlFor="demo-transactional" className="text-sm text-muted-foreground leading-relaxed">
                I agree to receive transactional/informational SMS messages from Tarek Buys Houses, LLC
                regarding your property cash offer, follow-up communications, and related real estate
                services. Message frequency varies. Message and data rates may apply. Reply STOP to
                unsubscribe at any time.
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="demo-promotional"
                className="mt-1 h-4 w-4 rounded border-border shrink-0 accent-amber-500"
                defaultChecked={false}
              />
              <label htmlFor="demo-promotional" className="text-sm text-muted-foreground leading-relaxed">
                I agree to receive promotional/marketing SMS messages from Tarek Buys Houses, LLC and
                affiliated companies operating under the Tarek Buys Houses brand (e.g., new listings,
                market updates, special offers). Message frequency varies. Message and data rates may
                apply. Reply STOP to unsubscribe at any time.
              </label>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="demo-privacy"
                className="mt-1 h-4 w-4 rounded border-border shrink-0 accent-amber-500"
                defaultChecked={false}
              />
              <label htmlFor="demo-privacy" className="text-sm text-muted-foreground leading-relaxed">
                I agree to the{" "}
                <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link> and{" "}
                <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>.
                I acknowledge that my mobile opt-in information and SMS consent will not be shared with
                third parties or affiliates for marketing or promotional purposes.
              </label>
            </div>

            <p className="text-xs text-muted-foreground border-t border-border pt-4">
              (All checkboxes are optional — you can still receive your cash offer without selecting any of the above)
            </p>
          </div>

          <h2>Message Frequency &amp; Rates</h2>
          <p>
            Message frequency varies based on your inquiry and opt-in selections. Standard message and
            data rates may apply depending on your mobile carrier plan.
          </p>

          <h2>How to Opt Out</h2>
          <p>
            You may opt out of SMS communications at any time by replying <strong>STOP</strong> to any
            message from us. After replying STOP, you will receive one final confirmation text and will
            not receive further messages from that campaign. To re-subscribe, reply <strong>START</strong>.
          </p>

          <h2>Need Help?</h2>
          <p>
            Reply <strong>HELP</strong> to any message for assistance, or contact us directly:
          </p>
          <ul>
            <li>Email: <a href="mailto:privacy@tarekbuyshouses.com" className="text-primary hover:underline">privacy@tarekbuyshouses.com</a></li>
            <li>Phone: <a href="tel:+18664073411" className="text-primary hover:underline">(866) 407-3411</a></li>
          </ul>
          <p>Carriers are not liable for delayed or undelivered messages.</p>

          <h2>No Sharing of SMS Opt-In Data</h2>
          <p>
            SMS opt-in consent and phone numbers collected for the purpose of SMS communications are
            never sold, shared, rented, or transferred to any third party or affiliate for their own
            marketing or promotional purposes. This data is used exclusively by Tarek Buys Houses, LLC
            to communicate with the individual who provided consent.
          </p>

          <h2>Age Restriction</h2>
          <p>
            This SMS program is intended solely for individuals 18 years of age or older. By opting in,
            you represent that you meet this requirement.
          </p>

          <div className="border-t border-border pt-6 mt-8">
            <p className="text-xs text-muted-foreground">
              For full details, see our{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and{" "}
              <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link> (Section 12 — SMS Messaging Terms).
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
