# City Typeahead

A small typeahead/autocomplete search component built with React and Next.js. It queries the free [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) as the user types and handles debouncing, loading/empty/error states, keyboard navigation, and out-of-order (stale) responses.

**Live demo:** [add your Vercel/CodeSandbox link]

## Features

- **Debounced input:** waits 300ms after the last keystroke, with a 2-character minimum, to avoid a request on every key press.
- **Loading, empty, and error states:** each has its own message. The error state includes a "Try again" button.
- **Keyboard navigation:** full support for arrow keys, Home/End, Enter, Escape, and Tab (see below).
- **Stale response protection:** in-flight requests are cancelled when the query changes, and late responses are ignored.
- **Client-side cache:** repeated queries return instantly without a network call.
- **Accessible:** follows the ARIA combobox/listbox pattern and announces status changes to screen readers.

## Tech stack

- Next.js (App Router) and React
- Tailwind CSS
- Open-Meteo Geocoding API (no API key required)

## Getting started

```bash
git clone [your-repo-url]
cd [your-repo-folder]
npm install
npm run dev
```

Open http://localhost:3000.

## Project structure

```
app/
├── Typeahead.jsx   # the component (state, fetching, keyboard handling, UI)
└── page.jsx        # demo page that renders the component
```

## Keyboard shortcuts

| Key | Action |
|---|---|
| `↓` / `↑` | Move through results (wraps around); opens the list if closed |
| `Home` / `End` | Jump to first / last result |
| `Enter` | Select the highlighted result |
| `Esc` | Close the list; press again to clear the input |
| `Tab` | Close the list and move focus on |

## How it works

**Debouncing.** A `useDebouncedValue` hook returns the query only after it has stopped changing for 300ms. Each keystroke clears the previous timer.

**Stale and out-of-order responses.** The fetch effect depends on the debounced query. Its cleanup function does two things: it calls `AbortController.abort()` on the in-flight request, and it sets an `ignore` flag. So if "la" is slow and "lag" is fast, the "la" response can never overwrite the newer results. Aborted requests are not treated as errors.

**States.** A single `status` value (`idle | loading | success | empty | error`) drives the UI, so the component can't show contradictory states at once. The API omits `results` when nothing matches, which the code maps to `empty`.

**Selection.** Choosing an option stores its label in a ref so the resulting input change doesn't trigger another search. Options use `onMouseDown` + `preventDefault` so the input's blur event doesn't close the list before the click registers.

## Design tradeoffs

- **Plain hooks instead of React Query/SWR** to keep the debounce, cancellation, and caching logic visible. A library would give retries, deduping, and cache eviction for free.
- **300ms debounce and 2-character minimum** reduce request volume at the cost of slight perceived latency.
- **Old results stay visible during the debounce window** to avoid flicker, and the new request then replaces them.
- **Unbounded in-memory cache:** fine for a demo, but it would grow indefinitely in a long-lived session.
- **Direct browser-to-API calls:** simple, but there is no rate limiting, key protection, or shared caching.

## Scaling and hardening for high traffic

- Proxy requests through a Next.js route handler to hide keys, normalize responses, and add rate limiting.
- Cache server-side (CDN `Cache-Control` with `stale-while-revalidate`, or Redis), since autocomplete queries are highly repetitive.
- Bound the client cache with an LRU and add retries with exponential backoff and jitter.
- Add request timeouts, input length limits, and a circuit breaker so an upstream outage degrades gracefully.
- For large datasets, use a dedicated search index (Algolia, Typesense, Elasticsearch) with prefix matching.
- Monitor p95 latency, error rate, and cache hit rate.

## Testing approach

- **Unit/integration:** Vitest and React Testing Library with fake timers and a mocked `fetch`.
  - Debounce: a burst of keystrokes results in exactly one request.
  - Stale responses: manually-resolved promises deliver responses out of order, and the test asserts the stale one never renders.
  - Empty and error states, including a successful retry.
  - Keyboard: arrow keys and Enter select the correct option.
- **End-to-end:** Playwright with network throttling and offline mode, plus an axe accessibility check.

## Known limitations

- Results depend on the Open-Meteo API's matching and ranking, which can't be tuned.
- No highlighting of the matched part of each result.
- The cache is per component instance and is lost on refresh.

## License

MIT