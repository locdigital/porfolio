import '@/styles/global.css';
import Header from './components/Header';
import Footer from './components/Footer';
import LayoutController from './components/LayoutController';
import { Metadata } from 'next';
import { SITE_NAME, DEFAULT_DESCRIPTION, SITE_URL, DEFAULT_OG_IMAGE } from '@/lib/seo';

export const metadata: Metadata = {
  title: {
    default: "Phuc Loc Nguyen | Senior Performance Marketing Executive",
    template: "%s | Phuc Loc Nguyen",
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1774,
        height: 887,
        alt: "Phuc Loc Nguyen",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="no-motion" style={{ background: '#FFFFFF' }}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, interactive-widget=resizes-visual" />
        <meta name="theme-color" content="#FFFFFF" />
        <meta name="google-site-verification" content="tYabJCSeApR0trq6VL7V6_JKbEKbBnznDtNmvaBehfY" />
        <link id="dynamic-favicon" rel="icon" type="image/svg+xml" href="/favicon-active.svg" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Imbue:opsz,wght@10..100,100..900&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400&display=swap" rel="stylesheet" />
        
        {/* Google tag (gtag.js) */}
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            function loadAnalytics() {
              if (window.__locAnalyticsLoaded) return;
              window.__locAnalyticsLoaded = true;
              var script = document.createElement("script");
              script.async = true;
              script.src = "https://www.googletagmanager.com/gtag/js?id=G-DYB5FLYNH4";
              document.head.appendChild(script);
              gtag("js", new Date());
              gtag("config", "G-DYB5FLYNH4");
            }

            if ("requestIdleCallback" in window) {
              requestIdleCallback(loadAnalytics, { timeout: 3000 });
            } else {
              window.addEventListener("load", function () {
                setTimeout(loadAnalytics, 1200);
              }, { once: true });
            }
          `
        }} />
      </head>
      <body>
        <LayoutController />
        <div className="site-grid-bg" aria-hidden="true" />
        <Header />
        
        {children}

        {/* Back to top */}
        <button className="back-to-top" id="back-to-top" type="button" aria-label="Back to top" title="Back to top">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>

        <Footer />
      </body>
    </html>
  );
}
