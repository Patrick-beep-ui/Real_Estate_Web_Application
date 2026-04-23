import { useState } from "react";
import { Star, MessageCircle, Phone, Play } from "lucide-react";
import { usePageConfig } from "@/context/PageContext";

const youtubeTestimonials = [
  { id: "3VaQol2jWRw", name: "Rachel", location: "Ybor City, Tampa" },
  { id: "vjbp7kMFOT8", name: "Diane & Kim", location: "Tampa Bay" },
  { id: "eLBToOHBpO4", name: "Sara", location: "Tampa" },
];

// Tampa-specific written testimonials
const tampaTestimonials = [
  {
    text: "Divorce situation, handled with complete privacy. No signs, no showings, no neighbors asking questions.",
    name: "Sandra K.",
    location: "Riverview",
  },
  {
    text: "Sold in 8 days, avoided foreclosure. Tarek's team treated me like family, not a transaction.",
    name: "Maria S.",
    location: "Ybor City, Tampa",
  },
  {
    text: "Behind on payments, got fair cash offer in 24 hours. Closed in 9 days. Saved my credit.",
    name: "Debbie W.",
    location: "St. Petersburg",
  },
];

// Generic testimonials for non-Tampa markets
const genericTestimonials = [
  {
    text: "Needed to sell fast during a difficult time. Got a fair cash offer in 24 hours and closed in under two weeks. No repairs, no stress.",
    name: "Jennifer M.",
    location: "Verified Seller",
  },
  {
    text: "Was facing foreclosure and thought I had no options. Tarek's team gave me a real solution. Closed in 10 days and walked away with cash.",
    name: "Robert T.",
    location: "Verified Seller",
  },
  {
    text: "Inherited a property I couldn't maintain. They handled everything — no cleaning, no repairs, no agent fees. Easiest transaction I've ever done.",
    name: "Patricia L.",
    location: "Verified Seller",
  },
];

/** YouTube facade — loads iframe only on click */
const YouTubeFacade = ({ id, name }: { id: string; name: string }) => {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&autoplay=1`}
        title={`${name} - Tarek Buys Houses`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="w-full h-full"
      />
    );
  }

  return (
    <button
      onClick={() => setLoaded(true)}
      className="relative w-full h-full group cursor-pointer bg-black"
      aria-label={`Play video testimonial from ${name}`}
    >
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt={`${name} video testimonial thumbnail`}
        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        loading="lazy"
        width={480}
        height={360}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
          <Play className="w-7 h-7 text-primary-foreground ml-1" />
        </div>
      </div>
    </button>
  );
};

const TestimonialCards = ({ location }: { location: string }) => {
  const { market, phone, smsLink, telLink } = usePageConfig();
  const isTampa = market.slug === "tampa";
  const writtenTestimonials = isTampa ? tampaTestimonials : genericTestimonials;

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Video testimonials header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
            Hear From Sellers Who've Been Through This
          </h2>
          <p className="text-muted-foreground text-lg">
            These sellers faced the same situation you're in. Watch what they say about working with us.
          </p>
        </div>

        {/* YouTube video testimonials — facade pattern */}
        <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto">
          {youtubeTestimonials.map((video) => (
            <div key={video.id}>
              <div className="rounded-xl overflow-hidden aspect-video">
                <YouTubeFacade id={video.id} name={video.name} />
              </div>
              <p className="text-muted-foreground text-sm mt-3 text-center">
                {/*video.name} {isTampa ? ` · ${video.location}` : ""*/}
                {video.name} · {location}
              </p>
            </div>
          ))}
        </div>

        {/* CTA between sections */}
        <div className="flex flex-wrap gap-4 justify-center mb-20">
          <a
            href={smsLink}
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 transition-all text-lg shadow-amber"
          >
            <MessageCircle className="w-5 h-5" />
            Text {phone}
          </a>
          <a
            href={telLink}
            className="inline-flex items-center gap-2 px-8 py-4 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all text-lg"
          >
            <Phone className="w-5 h-5" />
            Call {phone}
          </a>
        </div>

        {/* Written testimonials */}
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-10">
          What {market.name} Homeowners Say
        </h2>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {writtenTestimonials.map((t, i) => (
            <div key={i} className="rounded-xl bg-card border border-border p-6">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-5 h-5 text-primary fill-primary" />
                ))}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                "{t.text}"
              </p>
              <p className="font-bold text-sm text-foreground">{t.name}</p>
              <p className="text-muted-foreground text-xs">{t.location}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialCards;
