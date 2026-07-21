# Plan: Fix "Get Your Cash Offer" button on About page

## Problem
The "Get Your Cash Offer" button in `AboutTarek.tsx` links to `#about-cta`, but that anchor only exists on the homepage (`page.tsx:418`). On the about page, clicking it does nothing.

## Fix
Change the link from `#about-cta` to `/#about-cta` so it navigates to the homepage and scrolls to the cash offer form.

**File:** `src/components/about/AboutTarek.tsx:72`

```diff
- href="#about-cta"
+ href="/#about-cta"
```
