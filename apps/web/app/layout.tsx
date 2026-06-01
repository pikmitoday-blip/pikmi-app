import "./globals.css";
import AuthHashHandler from "./components/AuthHashHandler";

export const metadata = {
  title: "pikmi",
  description: "Tailored portfolios. Real connections.",
  icons: {
    icon: [
      { url: "/pikmilogo.jpg", type: "image/jpeg" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/pikmilogo.jpg",
    apple: "/pikmilogo.jpg",
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
        <link rel="icon" href="/pikmilogo.jpg" type="image/jpeg" />
        <link rel="shortcut icon" href="/pikmilogo.jpg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/pikmilogo.jpg" />
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
