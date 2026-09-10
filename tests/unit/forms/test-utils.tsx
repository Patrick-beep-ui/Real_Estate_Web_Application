import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";

// Mock data factories
export const createMockMarket = (overrides = {}) => ({
  slug: "tampa",
  name: "Tampa",
  state: "FL",
  stats: { googleRating: 4.7, bbbRating: "A+", homesClosed: 1000 },
  ...overrides,
});

export const createMockSituation = (overrides = {}) => ({
  slug: "home",
  headline: "Sell Your Home Fast in {market}",
  bodyParagraphs: ["We buy houses in {market} quickly and easily."],
  bullets: ["No repairs needed", "Close in as few as 7 days"],
  heroImage: "/hero.jpg",
  finalCtaHeadline: "Get Your Free Cash Offer",
  finalCtaSubline: "No obligation, 100% confidential",
  ...overrides,
});

// Common mock props for components that use usePageConfig
export const mockPageConfig = {
  phone: "(949) 678-2174",
  smsLink: "sms:+19496782174&body=Hi%20Tarek",
  telLink: "tel:+19496782174",
  market: createMockMarket(),
  situation: createMockSituation(),
  text: "(949) 678-2174",
};

// Setup function to mock all common dependencies
export const setupFormMocks = () => {
  // Mock next/navigation
  jest.mock("next/navigation", () => ({
    useRouter: jest.fn(() => ({
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    })),
    usePathname: jest.fn(() => "/test-path"),
  }));

  // Mock PageContext
  jest.mock("@/context/PageContext", () => ({
    usePageConfig: jest.fn(() => mockPageConfig),
  }));

  // Mock useGeoMarket
  jest.mock("@/hooks/geo/useGeoMarket", () => ({
    useGeoMarket: jest.fn(() => ({
      market: createMockMarket(),
      loading: false,
    })),
  }));

  // Mock recaptcha
  jest.mock("@/lib/tracking/recaptcha", () => ({
    getRecaptchaToken: jest.fn().mockResolvedValue("fake-recaptcha-token"),
  }));

  // Mock leads
  jest.mock("@/lib/leads", () => ({
    submitLead: jest.fn().mockResolvedValue(true),
    isLeadAddressError: jest.fn(() => false),
  }));

  // Mock analytics
  jest.mock("@/lib/tracking/analytics", () => ({
    trackPhoneClick: jest.fn(),
    trackSMSClick: jest.fn(),
    trackFormView: jest.fn(),
    trackConversion: jest.fn(),
    trackLeadSubmission: jest.fn(),
  }));

  // Mock sonner
  jest.mock("sonner", () => ({
    toast: {
      error: jest.fn(),
      success: jest.fn(),
    },
  }));
};

// Custom render with providers if needed
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { ...options });

export * from "@testing-library/react";
export { customRender as render };
