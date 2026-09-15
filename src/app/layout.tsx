import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import GeoWarm from "@/components/providers/GeoWarm";
import Header from "@/components/layout/Header";
import { Analytics } from "@vercel/analytics/next";

const googleTagManagerId = "GTM-NNR4C4F7";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export function generateMetadata(): Metadata {
  return {
    title: {
      default: "Tarek Buys Houses | Sell Your House Fast for Cash",
      template: "%s | Tarek Buys Houses",
    },
    description: "Sell your house fast for cash. Tarek El Moussa's team buys homes in any condition. Close in as little as 7 days. No repairs, no fees, no obligation.",
    metadataBase: new URL("https://tarekbuyshouses.com"),
    openGraph: {
      type: "website",
      siteName: "Tarek Buys Houses",
    },
    twitter: {
      card: "summary_large_image",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <Script
          id="google-tag-manager"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${googleTagManagerId}');`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} cz-shortcut-listen="true">
        <noscript>
          <iframe
            title="Google Tag Manager"
            src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <TooltipProvider delayDuration={0}>
          <QueryProvider>
            <GeoWarm />
            <Header />
            <main>{children}</main>
            <Toaster />
          </QueryProvider>
        </TooltipProvider>
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src='https://connect.facebook.net/en_US/fbevents.js';
            s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script');

            fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          strategy="afterInteractive"
        />
        <Script
          id="callrail-swap"
          strategy="afterInteractive"
          src="//cdn.callrail.com/companies/618641779/c8d5e12557ebcb0a4ec3/12/swap.js"
        />
        <Analytics />
      </body>
    </html>
  );
}
