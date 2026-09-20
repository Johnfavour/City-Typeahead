# City Typeahead

A typeahead search component built with Next.js and React. It queries the public [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) as you type.

**Live demo:** <your-link>

## Features

- Debounced input (300ms, 2-character minimum)
- Loading, empty and error states, with a retry button
- Keyboard navigation: `↑` `↓` `Home` `End` `Enter` `Esc` `Tab`
- Stale and out-of-order responses handled with `AbortController` and an `ignore` flag
- Client-side cache for repeat queries
- ARIA combobox pattern for accessibility

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Structure

- `app/Typeahead.jsx`: the component
- `app/page.jsx`: demo page

## Notes

**Tradeoffs:** plain hooks instead of React Query to keep the logic visible, and an unbounded in-memory cache that is fine for a demo.

**Scaling:** proxy the API through a route handler, add CDN or Redis caching, use an LRU client cache, and add retries with backoff.

**Testing:** Vitest and React Testing Library with fake timers and a mocked `fetch` (including out-of-order responses), plus Playwright for end-to-end tests.