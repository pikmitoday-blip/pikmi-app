import "./globals.css";
import AuthHashHandler from "./components/AuthHashHandler";

export const metadata = {
  title: "pikmi",
  description: "Tailored portfolios. Real connections.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
      </head>
      <body>
        <AuthHashHandler />
        {children}
      </body>
    </html>
  );
}
