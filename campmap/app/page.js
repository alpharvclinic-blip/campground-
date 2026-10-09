'use client';

import dynamic from 'next/dynamic';

// Leaflet needs the browser, so the app is loaded on the client only.
const CampApp = dynamic(() => import('../components/CampApp'), {
  ssr: false,
  loading: () => <p style={{ padding: 20 }}>Loading map…</p>,
});

export default function Page() {
  return <CampApp />;
}
