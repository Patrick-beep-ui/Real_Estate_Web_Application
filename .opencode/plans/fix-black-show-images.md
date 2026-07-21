# Plan: Fix black show images on mount

## Problem
The first two show poster images in `AboutShows.tsx` render as black on mount. After interacting with the page (console open/close, scrolling), they appear correctly. This is a Next.js `<Image>` lazy loading rendering bug.

## Root cause
`AboutShows.tsx` uses Next.js `<Image>` with `loading="lazy"` for the show poster images. The same images in `WhyTarek.tsx` (homepage) use plain `<img>` tags and work fine.

## Fix
Switch from Next.js `<Image>` to plain `<img>` tags in `AboutShows.tsx`, matching the pattern used in `WhyTarek.tsx` for the same show poster images.

**File:** `src/components/about/AboutShows.tsx`

Change from:
```tsx
import Image from "next/image";
...
<Image
  key={show.src}
  src={show.src}
  alt={show.alt}
  width={400}
  height={225}
  className="w-full rounded-xl object-cover border border-border"
  style={{ aspectRatio: "16/9" }}
  loading="lazy"
/>
```

To:
```tsx
// remove: import Image from "next/image";
...
<img
  key={show.src}
  src={show.src}
  alt={show.alt}
  className="w-full rounded-xl object-cover border border-border"
  style={{ aspectRatio: "16/9" }}
  loading="lazy"
/>
```

This matches how `WhyTarek.tsx:50` renders the same show poster images.
