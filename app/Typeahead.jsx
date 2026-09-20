"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./Typeahead.module.css";

const API = "https://geocoding-api.open-meteo.com/v1/search";
const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t); 
  }, [value, delay]);
  return debounced;
}

const labelFor = (c) => [c.name, c.admin1, c.country].filter(Boolean).join(", ");

export default function Typeahead({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const [status, setStatus] = useState("idle");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [attempt, setAttempt] = useState(0); 

  const debounced = useDebouncedValue(query.trim(), DEBOUNCE_MS);
  const cache = useRef(new Map()); 
  const selectedLabel = useRef(null);
  const listRef = useRef(null);
  const id = useId();
  const listId = `${id}-list`;
  const optionId = (i) => `${id}-opt-${i}`;

  useEffect(() => {
    if (debounced === selectedLabel.current) return;

    if (debounced.length < MIN_CHARS) {
      setStatus("idle");
      setResults([]);
      return;
    }

    const key = debounced.toLowerCase();
    if (cache.current.has(key)) {
      const hit = cache.current.get(key);
      setResults(hit);
      setStatus(hit.length ? "success" : "empty");
      setActive(-1);
      return;
    }

    const controller = new AbortController();
    let ignore = false;
    setStatus("loading");

    (async () => {
      try {
        const url = `${API}?name=${encodeURIComponent(debounced)}&count=8&language=en&format=json`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (ignore) return;
        const list = data.results ?? []; 
        cache.current.set(key, list);
        setResults(list);
        setStatus(list.length ? "success" : "empty");
        setActive(-1);
      } catch (err) {
        if (err.name === "AbortError" || ignore) return; 
        setStatus("error");
      }
    })();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [debounced, attempt]);

  useEffect(() => {
    if (active >= 0) {
      listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
    }
  }, [active]);

  function choose(item) {
    const label = labelFor(item);
    selectedLabel.current = label;
    setQuery(label);
    setOpen(false);
    setActive(-1);
    onSelect?.(item);
  }

  function onKeyDown(e) {
    const count = results.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) setOpen(true);
        if (count) setActive((i) => (i + 1) % count);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) setOpen(true);
        if (count) setActive((i) => (i <= 0 ? count - 1 : i - 1));
        break;
      case "Home":
        if (open && count) { e.preventDefault(); setActive(0); }
        break;
      case "End":
        if (open && count) { e.preventDefault(); setActive(count - 1); }
        break;
      case "Enter":
        if (open && active >= 0) { e.preventDefault(); choose(results[active]); }
        break;
      case "Escape":
        if (open) setOpen(false);
        else setQuery("");
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  const showPanel = open && status !== "idle";
  const message = {
    loading: "Searching…",
    empty: `No places match “${debounced}”.`,
    error: "Couldn’t load results.",
  }[status];

  return (
    <div className={styles.root}>
      <label htmlFor={`${id}-input`} className={styles.label}>
        Search for a city
      </label>
      <input
        id={`${id}-input`}
        className={styles.input}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? optionId(active) : undefined}
        value={query}
        placeholder="e.g. Lagos, Lisbon, Lima"
        onChange={(e) => {
          selectedLabel.current = null;
          setQuery(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />

      {showPanel && (
        <div className={styles.panel}>
          {message && (
            <div className={styles.status} data-status={status}>
              <span>{message}</span>
              {status === "error" && (
                <button
                  type="button"
                  className={styles.retry}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setAttempt((n) => n + 1)}
                >
                  Try again
                </button>
              )}
            </div>
          )}

          <ul id={listId} ref={listRef} role="listbox" className={styles.list}>
            {status === "success" &&
              results.map((r, i) => (
                <li
                  key={r.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  className={styles.option}
                  data-active={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(r)}
                  onMouseEnter={() => setActive(i)}
                >
                  <span>{r.name}</span>
                  <span className={styles.meta}>
                    {[r.admin1, r.country].filter(Boolean).join(", ")}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className={styles.srOnly} role="status" aria-live="polite">
        {status === "success" && `${results.length} results available`}
        {status !== "success" && showPanel ? message : ""}
      </div>
    </div>
  );
}