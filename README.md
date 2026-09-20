# City Typeahead

A typeahead search component built with Next.js and React. It queries the public [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) as you type.


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
