import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const SIZE = 512;

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
        }}
      >
        <svg width="60%" height="60%" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 4L10 19h8l-3 13 14-17h-8l3-11z" fill="white" />
        </svg>
      </div>
    ),
    { width: SIZE, height: SIZE }
  );
}
