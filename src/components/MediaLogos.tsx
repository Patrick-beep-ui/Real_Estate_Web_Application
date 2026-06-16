import { MEDIA_LOGOS } from "@/data/mediaLogos";

const MediaLogos = () => (
  <div className="mt-8 mb-6 rounded-xl p-6" style={{ background: "hsl(220, 25%, 12%)" }}>
    <p className="text-xs text-muted-foreground font-semibold mb-4 uppercase tracking-widest text-center">
      As Featured On
    </p>
    <div className="flex flex-wrap items-center justify-center gap-6">
      {MEDIA_LOGOS.map((logo) => {
        const img = (
          <img
            key={logo.name}
            src={logo.url}
            alt={logo.name}
            width={logo.width || 100}
            height={logo.height || 24}
            className={`opacity-70 grayscale invert ${logo.height && logo.width ? "" : "h-6 md:h-7 w-auto"}`}
            loading="lazy"
          />
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
);

export default MediaLogos;
