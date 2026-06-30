import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Optimizio Performance — ניתוח ביצועי אתרים AI';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #09090B 0%, #1e1b4b 50%, #09090B 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Purple glow */}
        <div style={{
          position: 'absolute',
          width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
        }} />

        {/* Logo badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 80, height: 80,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
          marginBottom: 32,
        }}>
          <span style={{ fontSize: 40, color: 'white' }}>⚡</span>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 56,
          fontWeight: 800,
          color: '#F9FAFB',
          letterSpacing: '-1px',
          marginBottom: 16,
          display: 'flex',
        }}>
          Optimizio Performance
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 26,
          color: '#A78BFA',
          marginBottom: 48,
          display: 'flex',
        }}>
          ניתוח ביצועי אתרים AI · SEO · אבטחה · נגישות
        </div>

        {/* Score pills */}
        <div style={{ display: 'flex', gap: 16 }}>
          {[['ביצועים', '#EC4899'], ['SEO', '#22D3EE'], ['אבטחה', '#10B981'], ['מובייל', '#F97316']].map(([label, color]) => (
            <div key={label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              padding: '10px 20px',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'flex' }} />
              <span style={{ color: '#E5E7EB', fontSize: 18, display: 'flex' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
