# Plan: Fix CTA call button border color

## Goal
The `border-primary` utility on CTA call buttons is being overridden by a global CSS rule that sets all border colors to dark gray.

## Root cause
`globals.css:56-58` has:
```css
* {
  border-color: var(--color-border);
}
```
This sits in the regular CSS layer, which overrides Tailwind's `border-primary` utility (generated in `@layer utilities`).

## Fix
Wrap the `* { border-color }` rule in `@layer base` so it has lower specificity than Tailwind utilities:

**File:** `src/app/globals.css:56-58`

Change:
```css
* {
  border-color: var(--color-border);
}
```
To:
```css
@layer base {
  * {
    border-color: var(--color-border);
  }
}
```

## Impact
- **No breaking changes** — the dark gray default still applies to all ~10 shadcn/ui components that rely on it
- **CTA buttons fixed** — `border-primary` now correctly overrides the global rule
- **No other files need changes** — the 7 CTA buttons already have `border-2 border-primary`
