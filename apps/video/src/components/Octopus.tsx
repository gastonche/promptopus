import { useCurrentFrame } from 'remotion';

export const Octopus: React.FC<{ size?: number; float?: boolean; glow?: boolean }> = ({
  size = 200,
  float = true,
  glow = true,
}) => {
  const frame = useCurrentFrame();
  const bob = float ? Math.sin(frame / 14) * (size * 0.02) : 0;
  const sway = float ? Math.sin(frame / 16) * 1.2 : 0;

  return (
    <div style={{ position: 'relative', width: size, height: size, transform: `translateY(${bob}px)` }}>
      {glow && (
        <div
          style={{
            position: 'absolute',
            inset: '-30%',
            background: 'radial-gradient(circle, #A855F7 0%, transparent 65%)',
            opacity: 0.45 + 0.1 * Math.sin(frame / 12),
            filter: 'blur(8px)',
          }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        fill="none"
        style={{ position: 'relative', transform: `rotate(${sway}deg)` }}
      >
        <defs>
          <radialGradient id="vh" cx="42%" cy="34%" r="72%">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="45%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6D28D9" />
          </radialGradient>
          <linearGradient id="va" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
        </defs>
        <g stroke="url(#va)" strokeWidth="9" strokeLinecap="round" fill="none">
          <path d="M44 78 C 30 96, 24 104, 16 100" />
          <path d="M52 84 C 44 104, 40 116, 32 116" />
          <path d="M64 86 C 64 108, 64 118, 60 122" />
          <path d="M76 84 C 84 104, 88 116, 96 116" />
          <path d="M84 78 C 98 96, 104 104, 112 100" />
        </g>
        <path
          d="M64 18 C 88 18, 100 38, 100 60 C 100 78, 86 88, 64 88 C 42 88, 28 78, 28 60 C 28 38, 40 18, 64 18 Z"
          fill="url(#vh)"
        />
        <circle cx="51" cy="56" r="9" fill="#1E1B2E" />
        <circle cx="77" cy="56" r="9" fill="#1E1B2E" />
        <circle cx="54" cy="53" r="3" fill="#F5F3FF" />
        <circle cx="80" cy="53" r="3" fill="#F5F3FF" />
      </svg>
    </div>
  );
};
