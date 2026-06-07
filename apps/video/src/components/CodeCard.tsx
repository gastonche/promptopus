import type { CSSProperties, ReactNode } from 'react';
import { C } from '../theme';
import { mono } from '../fonts';

export const CodeCard: React.FC<{
  title?: string;
  children: ReactNode;
  style?: CSSProperties;
  fontSize?: number;
}> = ({ title, children, style, fontSize = 30 }) => {
  return (
    <div
      style={{
        borderRadius: 24,
        background: '#1b1830',
        border: `1px solid ${C.pop900}`,
        boxShadow: `0 40px 120px -20px ${C.pop900}, 0 0 0 1px #ffffff10`,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '18px 24px',
          borderBottom: '1px solid #ffffff14',
        }}
      >
        <span style={{ width: 14, height: 14, borderRadius: 99, background: '#ff5f56' }} />
        <span style={{ width: 14, height: 14, borderRadius: 99, background: '#ffbd2e' }} />
        <span style={{ width: 14, height: 14, borderRadius: 99, background: '#27c93f' }} />
        {title && (
          <span style={{ marginLeft: 12, color: '#ffffff55', fontFamily: mono, fontSize: 22 }}>
            {title}
          </span>
        )}
      </div>
      <div
        style={{
          padding: '28px 32px',
          fontFamily: mono,
          fontSize,
          lineHeight: 1.6,
          color: '#e9e6f5',
          whiteSpace: 'pre',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const Tok: React.FC<{ c: string; children: ReactNode }> = ({ c, children }) => (
  <span style={{ color: c }}>{children}</span>
);
