# Plan: Add Tarek signature to About page

## Goal
Insert Tarek's signature image between the end of the bio text and the two CTA buttons in the "Meet the Founder" section.

## File
`src/components/about/AboutTarek.tsx`

## Change
After line 62 (`</div>` closing the `space-y-4` text block), before line 63 (`<div className="flex flex-wrap gap-4">` buttons), add:

```tsx
<Image
  src="/images/tarek_signature.webp"
  alt="Tarek El Moussa signature"
  width={200}
  height={80}
  className="h-auto w-40 mb-6 opacity-80"
/>
```

No new imports needed — `Image` is already imported.
