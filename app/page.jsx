"use client";

import { useState } from "react";
import Typeahead from "./Typeahead";

export default function Page() {
  const [picked, setPicked] = useState(null);

  return (
    <main style={{ padding: "4rem 1.5rem", display: "grid", gap: "1.5rem", justifyItems: "center" }}>
      <Typeahead onSelect={setPicked} />
      {picked && (
        <p>
          Selected: <strong>{picked.name}</strong> ({picked.latitude.toFixed(2)},{" "}
          {picked.longitude.toFixed(2)})
        </p>
      )}
    </main>
  );
}