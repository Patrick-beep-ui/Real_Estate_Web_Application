import type { VideoStory, WrittenStory, Testimonial } from "@/types/testimonial";

export const ALICE: VideoStory = {
  id: "alice",
  kind: "video",
  name: "Alice Blackwelder",
  initial: "A",
  location: "Charlotte, NC",
  headline: "Selling a 98-year-old parent's vacant home with zero stress",
  body: "Alice stepped in as Power of Attorney to help her 98-year-old mother sell a house she no longer lived in. Even with a minor closing delay of a few days, the team kept both Alice and her mother updated at every single step until the sale was completed smoothly.",
  scenario: "Cash sale",
  src: "https://gjfohwwshiglfdnchgml.supabase.co/storage/v1/object/public/testimonial-videos/Angie-Malone.mp4",
  points: ["Seamless Power of Attorney paperwork", "Constant updates for both daughter & mom", "Honest, transparent communication through closing delays"],
};

export const KEITH: VideoStory = {
  id: "keith",
  kind: "video",
  name: "Keith Martindale",
  initial: "K",
  location: "Oklahoma, CA",
  headline: "From skeptical out-of-state landlord to selling two properties",
  body: "Keith was initially skeptical about selling his rental property from out of state, but Tarek Buys Houses made the process so easy and fair that he returned months later to sell a second home with them.",
  scenario: "Out-of-state landlord",
  points: ["Out-of-state sale managed seamlessly from California", "Addressed early skepticism with a fair, competitive offer", "Sold two properties across several months"],
};

export const BRIAN: WrittenStory = {
  id: "brian",
  kind: "written",
  name: "Brian Aune",
  initial: "B",
  location: "Stevenson Ranch, CA",
  pullQuote: "They were moving out of state and couldn't wait for a buyer — so they sold, then stayed a month.",
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
  pullQuote: "His father-in-law died on Friday. By Monday, the house was sold.",
  body: "Can you guys on Friday night after losing my father-in-law you guys made an offer on Saturday morning and negotiate it later on that day because on Monday everything went well I would highly recommend your service again. I contacted you guys because your show on TV and your area that you worked with Orange County that's why I called you guys first you guys made an offer on the house we negotiate it got it done and sold the house.\n\nMoving to Tennessee to be a family was just an extra perk. Thank you.",
  scenario: "Loss in family",
  reason: "Loss in family · relocating to Tennessee",
  points: ["Contacted Friday night", "Offer Saturday morning", "Closed by Monday", "Moved to Tennessee to be with family"],
};

export const TESTIMONIALS: Testimonial[] = [ALICE, KEITH, BRIAN, DON];
