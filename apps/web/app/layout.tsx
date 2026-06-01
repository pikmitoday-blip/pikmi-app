import "./globals.css";
import AuthHashHandler from "./components/AuthHashHandler";

export const metadata = {
  title: "pikmi",
  description: "Tailored portfolios. Real connections.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/pikmilogo.png", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: "/pikmilogo.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/pikmilogo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/pikmilogo.png" />
      </head>
      <body>
        {/* Postavi temu prije rendera da spriječi flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var t = localStorage.getItem('pikmi-theme');
            document.documentElement.dataset.theme = (t === 'light') ? 'light' : 'dark';
          })();
        `}} />
        <AuthHashHandler />
        {children}
      </body>
    </html>
  );
}
