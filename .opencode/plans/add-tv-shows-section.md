# Plan: Add "As Seen On Television" section to About page

## Goal
Add a TV shows section similar to the Tampa site's "As Seen On Television" — a label, heading, and 4-column grid of show poster images.

## Reference
Tampa site (`index.html:395-407`):
- Orange label "As Seen On Television" with accent line
- Heading: "15 YEARS. 1,000+ HOMES. YOU KNOW THE NAME."
- 4-column grid of show poster images (16:9 aspect ratio, rounded, bordered)

## Steps

### 1. Copy show images from Tampa to divorce site
Copy these 4 files from `C:\Users\E4LA-0114_Segovia\Desktop\Lovable_Projects\TBH_Tampa\tarek-buys-tampa\` to `C:\Users\E4LA-0114_Segovia\Desktop\Lovable_Projects\divorce_site_next\public\`:
- `show-flip-or-flop.webp`
- `show-flipping-101.webp`
- `show-flipping-el-moussas.webp`
- `show-flip-off.webp`

### 2. Create new component
**File:** `src/components/about/AboutShows.tsx`

Structure (matching Tampa + existing about page patterns):
```
<section> — py-16 md:py-24, bg-background
  <div> — max-w-7xl mx-auto px-4...
    <p> — "As Seen On Television" label (text-primary, uppercase, tracking-widest)
    <h2> — heading with orange accent span
    <div> — grid grid-cols-2 lg:grid-cols-4 gap-4
      4x <Image> — show posters, 16:9, rounded-xl, border
```

### 3. Add to about page
**File:** `src/app/about/page.tsx`

Import `AboutProps` and place it after `<AboutStoryV2 />` (line 33), before `<AboutValues />` (line 34).

## Heading copy
Options:
- "15 YEARS. 1,000+ HOMES. YOU KNOW THE NAME." (Tampa exact)
- "From Flip or Flop to The Flip Off" (show-focused)
- "15+ YEARS ON NATIONAL TELEVISION" (stats-focused)

Confirm which heading you prefer, or suggest your own.
