import { MEDIA_LOGOS } from "@/data/mediaLogos";

const MediaLogosStrip = () => (
  <div className="bg-secondary/50 py-8">
    <div className="max-w-7xl mx-auto px-4">
      <p className="text-xs text-muted-foreground font-semibold mb-4 uppercase tracking-widest text-center">As Featured On</p>
      <div className="flex flex-wrap items-center justify-center gap-8">
        {MEDIA_LOGOS.map((logo) => {
          const img = (
            <img key={logo.name} src={logo.url} alt={logo.name} width={logo.width || 100} height={logo.height || 24} className={`opacity-70 grayscale invert ${logo.height && logo.width ? "" : "h-6 md:h-7 w-auto"}`} loading="lazy" />
          );
          return logo.href ? (
            <a key={logo.name} href={logo.href} target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition-opacity">
              {img}
            </a>
          ) : (
            img
          );
        })}
      </div>
    </div>
  </div>
);

export default MediaLogosStrip;
