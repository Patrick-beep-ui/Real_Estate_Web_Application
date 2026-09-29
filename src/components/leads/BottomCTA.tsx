import { Phone, MessageCircle } from "lucide-react";
import PhoneLink from "@/components/shared/PhoneLink";
import { PHONE, buildTelLink, buildSmsLink } from "@/lib/shared/phone";

const BottomCTA = () => (
  <section className="py-20 bg-primary/10">
    <div className="max-w-3xl mx-auto px-4 text-center">
      <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Ready to Sell? Get Your Fair Cash Offer.</h2>
      <p className="text-muted-foreground mb-8">No fees. No repairs. No hassle. Just a fair cash offer from Tarek's team.</p>
      <div className="flex flex-wrap justify-center gap-4">
        <PhoneLink href={buildTelLink()} attributionContext={{ leadSource: "bottom_cta" }} className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-125 transition-all text-lg shadow-amber">
          <Phone className="w-5 h-5" /> Call {PHONE.call}
        </PhoneLink>
        <PhoneLink href={buildSmsLink()} attributionContext={{ leadSource: "bottom_cta" }} className="inline-flex items-center gap-2 px-8 py-4 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all text-lg">
          <MessageCircle className="w-5 h-5" /> Text Us
        </PhoneLink>
      </div>
    </div>
  </section>
);

export default BottomCTA;
