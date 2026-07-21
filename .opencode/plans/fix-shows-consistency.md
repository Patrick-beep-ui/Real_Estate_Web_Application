# Plan: Fix AboutShows heading and spacing consistency

## File
`src/components/about/AboutShows.tsx`

## Changes

### 1. Section padding — match other sections
```diff
- className="py-16 md:py-24 bg-background border-t border-border"
+ className="py-20 md:py-32 bg-background border-t border-border"
```

### 2. Heading — remove uppercase, match size
```diff
- <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-10">
-   15 YEARS. 1,000+ HOMES.
-   <br />
-   <span className="text-primary">YOU KNOW THE NAME.</span>
- </h2>
+ <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold leading-tight max-w-2xl">
+   15 years. 1,000+ homes.
+   <br />
+   <span className="text-primary">You know the name.</span>
+ </h2>
```

### 3. Add heading container margin to match AboutStoryV2
Wrap the label + heading in a `<div className="mb-14 md:mb-20">` to match the header spacing pattern.
