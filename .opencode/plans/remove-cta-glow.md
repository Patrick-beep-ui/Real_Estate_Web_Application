# Plan: Remove orange glow shadow from CTA call buttons

## Goal
Revert the `shadow-[0_0_12px_2px_hsl(38_92%_50%/0.35)]` class from all 8 CTA call buttons, keeping the existing `border-2 border-primary` solid orange border.

## Files to edit
| File | Line | What to remove |
|------|------|----------------|
| `src/components/HeroSection.tsx` | 371 | `shadow-[0_0_12px_2px_hsl(38_92%_50%/0.35)]` |
| `src/components/FinalCTA.tsx` | 301 | `shadow-[0_0_12px_2px_hsl(38_92%_50%/0.35)]` |
| `src/components/VideoSection.tsx` | 422 | `shadow-[0_0_12px_2px_hsl(38_92%_50%/0.35)]` |
| `src/components/TestimonialCards.tsx` | 133 | `shadow-[0_0_12px_2px_hsl(38_92%_50%/0.35)]` |
| `src/components/about/AboutHero.tsx` | 51 | `shadow-[0_0_12px_2px_hsl(38_92%_50%/0.35)]` |
| `src/components/about/AboutTarek.tsx` | 75 | `shadow-[0_0_12px_2px_hsl(38_92%_50%/0.35)]` |
| `src/app/page.tsx` | 393 | `shadow-[0_0_12px_2px_hsl(38_92%_50%/0.35)]` |
| `src/app/page.tsx` | 521 | Replace shadow with original `shadow-amber` |

## Steps
1. In each file, remove `shadow-[0_0_12px_2px_hsl(38_92%_50%/0.35)] ` from the className string
2. For the filled bottom CTA button on line 521, restore `shadow-amber` (it was replaced)
