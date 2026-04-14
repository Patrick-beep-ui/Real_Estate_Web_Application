import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Tarek Buys Houses | Sell Your House Fast for Cash",
    template: "%s | Tarek Buys Houses",
  },
  description: "Sell your house fast for cash. Tarek El Moussa's team buys homes in any condition. Close in as little as 7 days. No repairs, no fees, no obligation.",
  metadataBase: new URL("https://tarekkbuyshouses.com"),
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} cz-shortcut-listen="true">
        <TooltipProvider delayDuration={0}>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
