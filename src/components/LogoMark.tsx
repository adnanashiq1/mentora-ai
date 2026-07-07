export default function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="12" fill="#1e2a22" />
      <path
        d="M14 16 L8 24 L14 32"
        stroke="#e86a4b"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M34 16 L40 24 L34 32"
        stroke="#e86a4b"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M24 11 L31 15.5 L24 20 L17 15.5 Z" fill="#e8ae44" />
      <line x1="31" y1="15.5" x2="31" y2="22" stroke="#e8ae44" strokeWidth="2" strokeLinecap="round" />
      <circle cx="31" cy="22.5" r="1.4" fill="#e8ae44" />
    </svg>
  );
}
