import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import CookieConsent from "@/components/Cookies";
import { GoogleAnalytics } from '@next/third-parties/google';
import { GlobalProvider } from '@/lib/context/GlobalContext';
import { PostHogProvider } from '@/components/PostHogProvider';
import { WebVitals } from '@/components/WebVitals';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_PRODUCTNAME,
  description: "Instant, cheap, fast photo restoration service.",
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: process.env.NEXT_PUBLIC_PRODUCTNAME,
  },
  other: {
    'msapplication-TileColor': '#f97316',
    'msapplication-TileImage': '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let theme = process.env.NEXT_PUBLIC_THEME
  if(!theme) {
    theme = "theme-orange"
  }
  const gaID = process.env.NEXT_PUBLIC_GOOGLE_TAG;
  return (
    <html lang="en">
      <body className={theme}>
        <PostHogProvider>
          <GlobalProvider>
            {children}
            <WebVitals />
          </GlobalProvider>
        </PostHogProvider>
        <Analytics />
        <SpeedInsights />
        <CookieConsent />
        { gaID && (
          <GoogleAnalytics gaId={gaID}/>
        )}
      </body>
    </html>
  );
}