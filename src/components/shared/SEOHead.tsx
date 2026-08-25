import { useEffect } from "react";
import { usePageConfig } from "@/context/PageContext";

const SEOHead = () => {
  const { market, situation } = usePageConfig();

  useEffect(() => {
    // JSON-LD LocalBusiness schema
    let jsonLd = document.getElementById("jsonld-local-business");
    if (!jsonLd) {
      jsonLd = document.createElement("script");
      jsonLd.id = "jsonld-local-business";
      jsonLd.setAttribute("type", "application/ld+json");
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "RealEstateBusiness",
      name: `Tarek Buys Houses — ${market.name}`,
      description: `We buy houses for cash in ${market.name}, ${market.stateFullName}. Fast closing, no fees, no repairs needed.`,
      url: `https://tarekbuyshouses.com/${situation.slug}/${market.slug}`,
      telephone: market.phoneE164,
      areaServed: market.serviceAreas.map((area) => ({
        "@type": "City",
        name: area,
      })),
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: parseFloat(market.stats.googleRating),
        reviewCount: parseInt(market.stats.reviewCount.replace("+", ""), 10),
        bestRating: 5,
      },
      founder: {
        "@type": "Person",
        name: "Tarek El Moussa",
        sameAs: "https://en.wikipedia.org/wiki/Tarek_El_Moussa",
      },
    });

    // JSON-LD FAQPage schema for featured snippets
    let faqJsonLd = document.getElementById("jsonld-faq-page");
    if (!faqJsonLd) {
      faqJsonLd = document.createElement("script");
      faqJsonLd.id = "jsonld-faq-page";
      faqJsonLd.setAttribute("type", "application/ld+json");
      document.head.appendChild(faqJsonLd);
    }
    faqJsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: situation.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    });

    return () => {
      document.getElementById("jsonld-local-business")?.remove();
      document.getElementById("jsonld-faq-page")?.remove();
    };
  }, [market, situation]);

  return null;
};

export default SEOHead;
