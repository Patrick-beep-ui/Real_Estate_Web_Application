/// <reference types="jest" />

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import HeroSection from "@/components/HeroSection";
import { submitLead } from "@/lib/leads";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { toast } from "sonner";
import { trackFormView, trackConversion } from "@/lib/analytics";

// Mocks
jest.mock("@/context/PageContext", () => ({
  usePageConfig: jest.fn(() => ({
    phone: "(949) 678-2174",
    smsLink: "sms:+19496782174",
    telLink: "tel:+19496782174",
    market: {
      slug: "tampa",
      name: "Tampa",
      state: "FL",
      stats: { googleRating: "4.7", bbbRating: "A+", homesClosed: 1000 },
    },
    situation: {
      slug: "home",
      headline: "Sell Your Home Fast in {market}",
      heroImage: "/hero.jpg",
      bodyParagraphs: ["We buy houses quickly."],
      bullets: ["No repairs needed"],
      finalCtaHeadline: "Get Your Offer",
      finalCtaSubline: "It's free",
    },
    text: "(949) 678-2174",
  })),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => "/test-path"),
}));

jest.mock("@/lib/recaptcha", () => ({
  getRecaptchaToken: jest.fn().mockResolvedValue("fake-recaptcha-token"),
}));

jest.mock("@/lib/leads", () => ({
  submitLead: jest.fn().mockResolvedValue(true),
}));

jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

jest.mock("@/lib/analytics", () => ({
  trackPhoneClick: jest.fn(),
  trackSMSClick: jest.fn(),
  trackFormView: jest.fn(),
  trackConversion: jest.fn(),
  trackLeadSubmission: jest.fn(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: function Link({ children, href }: { children: React.ReactNode; href: string }) {
    return require("react").createElement("a", { href }, children);
  },
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: function Image({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) {
    return require("react").createElement("img", { src, alt, ...props });
  },
}));

describe("HeroSection Form", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("renders all form fields on load", () => {
    render(<HeroSection />);
    expect(screen.getByPlaceholderText(/enter your property address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your first name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your phone number/i)).toBeInTheDocument();
  });

  it("tracks form view on mount", () => {
    render(<HeroSection />);
    expect(trackFormView).toHaveBeenCalledWith("hero_form", "tampa", "home");
  });

  it("submits with valid data and calls submitLead", async () => {
    render(<HeroSection />);
    fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), { target: { value: "123 Main St" } });
    fireEvent.change(screen.getByPlaceholderText(/your first name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByPlaceholderText(/your phone number/i), { target: { value: "+1234567890" } });
    fireEvent.change(screen.getByPlaceholderText(/email.*optional/i), { target: { value: "john@test.com" } });

    fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/agree to the/i));

    fireEvent.click(screen.getByText(/get my free offer/i));

    await waitFor(() => {
      expect(getRecaptchaToken).toHaveBeenCalledWith("submit_lead");
      expect(submitLead).toHaveBeenCalled();
    });
  });

  it("shows error toast on submission failure", async () => {
    (submitLead as jest.Mock).mockRejectedValueOnce(new Error("API error"));
    render(<HeroSection />);
    fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), { target: { value: "123 Main St" } });
    fireEvent.change(screen.getByPlaceholderText(/your first name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByPlaceholderText(/your phone number/i), { target: { value: "+1234567890" } });
    fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/agree to the/i));

    fireEvent.click(screen.getByText(/get my free offer/i));

    await waitFor(() => { expect(toast.error).toHaveBeenCalled(); });
  });
});
