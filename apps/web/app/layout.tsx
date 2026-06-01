import "./globals.css";
import AuthHashHandler from "./components/AuthHashHandler";

export const metadata = {
  title: "pikmi",
  description: "Tailored portfolios. Real connections.",
  icons: {
    icon: { url: "/pikmilogo.jpg", type: "image/jpeg" },
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
        {/* Meta Pixel */}
        <script dangerouslySetInnerHTML={{ __html: `
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
          (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','980912031509026');
          fbq('track','PageView');
        `}} />
        <noscript dangerouslySetInnerHTML={{ __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=980912031509026&ev=PageView&noscript=1"/>` }} />
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
