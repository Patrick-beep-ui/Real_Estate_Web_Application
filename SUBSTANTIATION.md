# Claim Substantiation Record

> Track each trust/statistical claim on the site to its source. Keep updated as new coverage
> or internal data becomes available.

---

## Third-Party Claims

### Better Business Bureau (BBB)
- **Badge**: "A+ BBB" linked from both HomePage and HeroSection
- **Action Taken**: Linked to Clever's third-party review page (BBB WAF blocks direct access to bbb.org). Clever independently verifies BBB status.
- **Source**: https://listwithclever.com/cash-home-buyers/reviews/tarek-buys-houses/
- **Status**: ✅ Verified — Accredited since 1/26/2021, A+ rating, 0 complaints
- **Profile ID**: https://www.bbb.org/us/ca/anaheim/profile/real-estate-investing/tarek-buys-houses-1126-172020437 (blocked by WAF, use search URL for real users)

### Google Rating
- **Badge**: "4.7 Google" linked from both HomePage and HeroSection
- **Action Taken**: Added `#lrd` hash to HeroSection link (HomePage already had it)
- **Source**: Third-party confirmations (Houzeo, Clever, Yelp) all cite 4.7 rating
- **Status**: ✅ Verified

### HGTV "As Featured On"
- **Logo link**: https://www.hgtv.com/shows/flip-or-flop
- **Source**: Tarek El Moussa is a longtime HGTV host (Flip or Flop, Flipping 101, The Flipping El Moussas, The Flip Off)
- **Status**: ✅ Verified

### Fox Business "As Featured On"
- **Logo link**: https://www.foxbusiness.com/media/hgtvs-tarek-el-moussa-sees-big-changes-future-real-estate-crash-cards
- **Source**: Tarek interviewed about real estate market (Apr 2025)
- **Status**: ✅ Verified

### People "As Featured On"
- **Logo link**: https://people.com/tag/tarek-el-moussa/
- **Source**: People magazine's tag page for Tarek El Moussa (multiple articles)
- **Status**: ✅ Verified

### USA Today "As Featured On"
- **Logo link**: https://www.usatoday.com/story/entertainment/celebrities/2026/06/10/tarek-el-moussa-heather-rae-home-burglary-hgtv/90490800007/
- **Note**: Article covers Tarek and Heather Rae's home burglary — not directly about Tarek Buys Houses business
- **Status**: ⚠️ Partially substantiated — outlet covers Tarek as a celebrity, not the business specifically

### CNN "As Featured On"
- **Action**: Logo retained (not deleted) but left unlinked (no `href`)
- **Status**: ❌ UNVERIFIED — could not locate specific CNN article featuring Tarek Buys Houses or Tarek El Moussa that would warrant the logo
- **Recommendation**: Locate internal coverage record or remove logo

### Forbes "As Featured On"
- **Action**: Logo retained (not deleted) but left unlinked (no `href`)
- **Status**: ❌ UNVERIFIED — could not locate specific Forbes article featuring Tarek Buys Houses or Tarek El Moussa that would warrant the logo
- **Recommendation**: Locate internal coverage record or remove logo

---

## Internal Claims (Need Internal Verification)

These claims are displayed on the site but exist in internal company data — no public third-party source was found:

### 1,000+ Homes Purchased
- **Displayed in**: TickerBar, HomePage hero stats, AboutStats
- **Public source**: Tarek claimed ~1,000 deals in a podcast interview (Us Weekly, Apr 2025)
- **Recommendation**: Maintain internal tally; podcase interview provides partial public substantiation

### 99% Satisfied Sellers
- **Displayed in**: AboutStats, TickerBar
- **Public source**: None found
- **Recommendation**: Verify against internal post-sale survey data

### $500M+ Paid to Homeowners
- **Displayed in**: AboutStats, TickerBar
- **Public source**: None found
- **Recommendation**: Verify against internal financial records

### Review Count
- **JSON-LD value**: Updated from "80+" to "100+" based on third-party sites (Clever shows ~103 verified reviews)
- **Recommendation**: Verify against actual Google review count; update `src/lib/data/markets.ts` if different

---

## Implementation Notes

- Verified logos have `href` in `src/data/mediaLogos.ts` and render as clickable `<a>` tags
- Unverified logos (CNN, Forbes) have no `href` — render as plain `<img>` tags
- BBB link uses Clever third-party review page — BBB's WAF blocks all direct bbb.org links.
- Google `#lrd` hash added to HeroSection link
- `MEDIA_LOGOS` definition removed from `src/app/page.tsx` (was duplicated), now imports from `@/data/mediaLogos`
