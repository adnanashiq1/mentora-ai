"use client";

import { useEffect, useRef, useState } from "react";

let idCounter = 0;

export default function MermaidDiagram({ definition }: { definition: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const idRef = useRef(`mermaid-${idCounter++}`);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            background: "#263a2d",
            primaryColor: "#e8ae44",
            primaryTextColor: "#1e2a22",
            primaryBorderColor: "#e86a4b",
            lineColor: "#f3efe1",
            secondaryColor: "#283c30",
            tertiaryColor: "#1e2a22",
            fontFamily: "Inter, sans-serif",
          },
        });
        const { svg: rendered } = await mermaid.render(idRef.current, definition.trim());
        if (!cancelled) setSvg(rendered);
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [definition]);

  if (error) {
    return (
      <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral">
        Couldn't render this diagram.
      </p>
    );
  }

  if (!svg) {
    return <p className="text-xs text-chalk-dim">Sketching the diagram...</p>;
  }

  return (
    <div
      className="overflow-x-auto rounded-xl bg-panel p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
