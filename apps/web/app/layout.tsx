import { Analytics } from '@vercel/analytics/next';
import "./globals.css";

export const metadata = { title: "pikmi", description: "Tailored portfolios. Real connections." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
