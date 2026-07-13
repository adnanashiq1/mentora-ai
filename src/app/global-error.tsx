"use client";

// This only triggers if the root layout itself throws - a much rarer,
// more severe case than the regular error.tsx. It must render its own
// <html>/<body> since it replaces the entire root layout. Inline styles
// are used deliberately here rather than Tailwind classes, since this is
// the last line of defense and shouldn't depend on anything else working.

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "24px",
          textAlign: "center",
          backgroundColor: "#1e2a22",
          color: "#f3efe1",
          fontFamily: "sans-serif",
        }}
      >
        <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>Something went wrong</h1>
        <p style={{ maxWidth: "320px", fontSize: "14px", color: "#9aab9c" }}>
          Please try again, or come back in a moment.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "8px",
            borderRadius: "9999px",
            backgroundColor: "#e86a4b",
            color: "#1e2a22",
            padding: "12px 24px",
            fontSize: "14px",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
