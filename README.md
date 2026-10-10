# Lake West Signs and Marketing — website

The website at [lakewestsigns.com](https://lakewestsigns.com): Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 and GSAP. All content lives in plain TypeScript files under `content/`; there is no CMS.

## Run it locally

Use Node.js 24.

```sh
npm ci
npm run dev        # http://localhost:8100
```

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests (Vitest) for content and helpers |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Production build |
| `npm run test:e2e` | Browser tests (Playwright); run `npx playwright install chromium` once first |
| `npm run images:prepare` | Regenerate responsive image sizes after changing photos |

## Editing content

| Change | File |
| --- | --- |
| Contact details, hours, business facts, social links | `content/site.ts` |
| Services, prices and service photos | `content/services.ts` |
| Service page introductions, options and process | `content/service-pages.ts` |
| Homepage, About and privacy text | `content/pages.ts` |
| Gallery photos, captions and order | `content/work.ts` |
| Homepage hero and intro photos | `content/hero.ts` |
| Quote questions and form wording | `content/quote-flow.ts`, `content/quote.ts` |
| FAQs, reviews and search metadata | `content/faq.ts`, `content/testimonials.ts`, `content/seo.ts` |

Prices: `from` is a starting price, `/hr` is hourly. Search results and link previews use the full name "Lake West Signs and Marketing" (`site.fullName`); the visible site uses "Lake West Signs" (`site.name`).

## Photos

Original photos live in `public/work/` and are never edited or overwritten. After adding or changing a photo, run `npm run images:prepare` and commit both `public/optimized/` and `content/responsive-images.json`. The favicon and app icons are generated from the LWS badge in `assets/lws-badge.png` by `node scripts/prepare-favicon.mjs`.

## Hosting

The site runs on Vercel. Connect this repository to a Vercel project and pushing to `main` deploys production. Set these environment variables in the Vercel project:

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Sends quote requests from the website to the shop's email (Resend, sending domain `quotes.lakewestsigns.com`) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 measurement ID |
| `NEXT_PUBLIC_SITE_URL` | Optional. The public address; production defaults to `https://lakewestsigns.com` |

Only production is indexed by search engines; preview deployments are marked `noindex` automatically. Old addresses from the previous website (`/index.php`, `/about.php`, `/vehicles.php`, `/commercial.php`, `/residential.php`, `/join.html`) redirect to the matching new pages (`next.config.ts`).

Keep `public/googledfba28539fad9760.html`: it verifies ownership in Google Search Console, and Google re-checks it.
