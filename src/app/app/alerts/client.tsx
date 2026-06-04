"use client";
import { useState, useTransition } from "react";

export function AlertToggleClient({ id, active }: { id: string; active: boolean }) {
  const [on, setOn] = useState(active);
  const [pending, start] = useTransition();
  function toggle() {
    const next = !on;
    setOn(next);
    start(async () => {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active: next }),
      });
      if (!res.ok) setOn(on);
    });
  }
  return (
    <button
      onClick={toggle}
      aria-pressed={on}
      disabled={pending}
      style={{
        position: "relative",
        width: 44,
        height: 26,
        borderRadius: 999,
        background: on ? "var(--primary)" : "rgba(28,32,28,0.18)",
        border: "none",
        cursor: pending ? "wait" : "pointer",
        transition: "background .15s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: on ? 21 : 3,
          width: 20,
          height: 20,
          background: "#fff",
          borderRadius: 999,
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left .15s",
        }}
      />
    </button>
  );
}
