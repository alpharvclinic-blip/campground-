import './globals.css';

export const metadata = {
  title: 'Campground Map',
  description: 'Map campgrounds from Excel files, grouped and color-coded.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
