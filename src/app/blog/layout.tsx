import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Real Estate Blog | Tarek Buys Houses",
  description:
    "Expert advice on selling your home fast, navigating foreclosure, divorce, inherited properties, and more — from Tarek El Moussa with 20+ years in real estate.",
  openGraph: {
    title: "Real Estate Blog | Tarek Buys Houses",
    description:
      "Expert advice on selling your home fast, navigating foreclosure, divorce, inherited properties, and more — from Tarek El Moussa with 20+ years in real estate.",
    url: "https://tarekbuyshouses.com/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Real Estate Blog | Tarek Buys Houses",
    description:
      "Expert advice on selling your home fast, navigating foreclosure, divorce, inherited properties, and more — from Tarek El Moussa with 20+ years in real estate.",
  },
  alternates: {
    canonical: "https://tarekbuyshouses.com/blog",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Footer homepage />
    </>
  );
}
