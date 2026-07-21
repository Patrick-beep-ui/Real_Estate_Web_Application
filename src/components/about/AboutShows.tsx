const shows = [
  { src: "/show-flip-or-flop.webp", alt: "Flip or Flop" },
  { src: "/show-flipping-101.webp", alt: "Flipping 101" },
  { src: "/show-flipping-el-moussas.webp", alt: "The Flipping El Moussas" },
  { src: "/show-flip-off.webp", alt: "The Flip Off" },
];

export default function AboutShows() {
  return (
    <section className="py-20 md:py-32 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14 md:mb-20">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-5 flex items-center gap-3">
            <span className="inline-block w-8 h-0.5 bg-primary rounded" />
            As Seen On Television
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold leading-tight max-w-2xl">
            15 Years. 1,000+ Homes
            <br />
            <span className="text-primary">You Know the Name</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {shows.map((show) => (
            <img
              key={show.src}
              src={show.src}
              alt={show.alt}
              className="w-full rounded-xl object-cover border border-border"
              style={{ aspectRatio: "16/9" }}
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
