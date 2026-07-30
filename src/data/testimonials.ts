export type VideoStory = {
  id: string;
  kind: "video";
  name: string;
  initial: string;
  location: string;
  headline: string;
  body: string;
  scenario: string;
  youtubeId?: string;
  src?: string;
  poster?: string;
  points: string[];
};

export type WrittenStory = {
  id: string;
  kind: "written";
  name: string;
  initial: string;
  location: string;
  pullQuote: string;
  body: string;
  scenario: string;
  reason: string;
  points: string[];
};

export type Testimonial = VideoStory | WrittenStory;

export const ALICE: VideoStory = {
  id: "alice",
  kind: "video",
  name: "Alice Blackwelder",
  initial: "A",
  location: "Orange County",
  headline: "A quick and fair cash sale",
  body: "Alice worked with Tarek Buys Houses to sell her home with a straightforward cash offer and a smooth closing process.",
  scenario: "Cash sale",
  src: "https://mcgzyxrozhogzmohyfos.supabase.co/storage/v1/object/public/testimonial-videos/Angie-Malone.mp4",
  points: ["Fair cash offer", "Quick closing", "No hassle"],
};

export const BRIAN: WrittenStory = {
  id: "brian",
  kind: "written",
  name: "Brian Aune",
  initial: "B",
  location: "",
  pullQuote: "The traditional selling process just wasn't practical for us.",
  body: "We were in a time crunch to sell our home so we could relocate to another state. The traditional selling process just wasn't practical for us, so we researched other options and found Tarek Buys Houses.\n\nThey responded to our inquiry quickly, explained the process clearly, and made everything feel straightforward and stress-free. That's exactly how it turned out.\n\nTarek and his team were professional, thoughtful, and genuinely easy to work with. They even allowed us to stay in our home for a month after closing to match our moving timeline, which took a tremendous amount of stress off our shoulders.\n\nTarek has built a process that's simple, convenient, and truly focused on the seller. We're grateful we found them and wouldn't hesitate to recommend them to anyone looking for a fast, hassle-free home sale.",
  scenario: "Relocation",
  reason: "Relocating to another state",
  points: ["Quick response to inquiry", "Clear explanation of process", "Allowed us to stay in our home for a month after closing", "Stress-free experience"],
};

export const DON: WrittenStory = {
  id: "don",
  kind: "written",
  name: "Don D",
  initial: "D",
  location: "Orange County",
  pullQuote: "You guys made an offer on Saturday morning and we negotiated it that day. On Monday everything went well.",
  body: "Can you guys on Friday night after losing my father-in-law you guys made an offer on Saturday morning and negotiate it later on that day because on Monday everything went well I would highly recommend your service again. I contacted you guys because your show on TV and your area that you worked with Orange County that's why I called you guys first you guys made an offer on the house we negotiate it got it done and sold the house.\n\nMoving to Tennessee to be a family was just an extra perk. Thank you.",
  scenario: "Loss in family",
  reason: "Loss in family · relocating to Tennessee",
  points: ["Contacted Friday night", "Offer Saturday morning", "Closed by Monday", "Moved to Tennessee to be with family"],
};

export const TESTIMONIALS: Testimonial[] = [ALICE, BRIAN, DON];

export const SUSAN = DON;

export const TESTIMONIAL_DISCLAIMER =
  "Every story shared with the seller's written consent. Results vary based on property condition, market factors, and individual circumstances. Not a guarantee of any particular outcome.";
