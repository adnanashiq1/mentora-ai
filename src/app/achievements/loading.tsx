export default function Loading() {
  return (
    <div className="notebook-bg flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-2 text-chalk-dim">
        <svg className="chalk-squiggle" width="60" height="16" viewBox="0 0 60 16" fill="none">
          <path
            d="M2 8 Q 10 2, 18 8 T 34 8 T 50 8 T 58 8"
            stroke="var(--coral)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="font-hand text-lg">loading...</span>
      </div>
    </div>
  );
}
