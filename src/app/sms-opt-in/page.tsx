import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PhoneLink from "@/components/shared/PhoneLink";
import { PHONE, buildTelLink } from "@/lib/shared/phone";
import { CONTACT_EMAIL, buildMailtoLink } from "@/lib/shared/contact";

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
                I consent to receive non-marketing text messages from Tarek Buys Houses, LLC about appointment confirmations and property follow-up communications. Message frequency may vary. Msg &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
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
                I consent to receive marketing text messages about special offers, new listings, and market updates from Tarek Buys Houses, LLC at the phone number provided. Message frequency may vary. Msg &amp; data rates may apply. Text HELP for assistance, reply STOP to opt out.
              </label>
            </div>

            <p className="text-xs text-muted-foreground border-t border-border pt-4">
              (SMS checkboxes are optional — you can still receive your cash offer without selecting any of the above)
            </p>
            <p className="text-center text-xs text-primary">
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>{" "}|{" "}
              <Link href="/terms" className="hover:underline">Terms of Service</Link>
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
            <li>Email: <a href={buildMailtoLink()} className="text-primary hover:underline">{CONTACT_EMAIL}</a></li>
            {/* freezeHref: this is a TCPA opt-in disclosure. The number a
                carrier or auditor sees here must be our real business line, so
                we block the href swap too. A call from a compliance page has no
                marketing attribution value anyway. */}
            <li>Phone: <PhoneLink href={buildTelLink()} freezeHref className="text-primary hover:underline">{PHONE.call}</PhoneLink></li>
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
