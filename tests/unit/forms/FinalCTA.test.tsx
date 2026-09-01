/// <reference types="jest" />

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import FinalCTA from "@/components/leads/FinalCTA";
import { usePageConfig } from "@/context/PageContext";
import { useRouter } from "next/navigation";
import { submitLead } from "@/lib/leads";
import { getRecaptchaToken } from "@/lib/tracking/recaptcha";
import { toast } from "sonner";
import { trackConversion } from "@/lib/tracking/analytics";

// Mocks
jest.mock("@/context/PageContext", () => ({
  usePageConfig: jest.fn(() => ({
    phone: "(949) 678-2174",
    smsLink: "sms:+19496782174",
    telLink: "tel:+19496782174",
    market: { slug: "tampa", name: "Tampa", state: "FL" },
    situation: {
      slug: "home",
      finalCtaHeadline: "Get Your Free Cash Offer",
      finalCtaSubline: "No obligation, 100% confidential",
    },
    text: "(949) 678-2174",
  })),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  usePathname: jest.fn(() => "/test-path"),
}));

jest.mock("@/lib/tracking/recaptcha", () => ({
  getRecaptchaToken: jest.fn().mockResolvedValue("fake-recaptcha-token"),
}));

jest.mock("@/lib/leads", () => ({
  submitLead: jest.fn().mockResolvedValue(true),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("@/lib/tracking/analytics", () => ({
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

// Navigate through all 3 steps, filling required fields and consents.
// Leaves the form on step 3 ready to submit.
const navigateToStep3 = () => {
  // Step 1: address
  fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), { target: { value: "123 Main St" } });
  fireEvent.click(screen.getByText(/next/i));

  // Step 2: name, phone, email, consents
  fireEvent.change(screen.getByPlaceholderText(/your first name/i), { target: { value: "John" } });
  fireEvent.change(screen.getByPlaceholderText(/\(555\) 123-4567/i), { target: { value: "+1234567890" } });
  fireEvent.change(screen.getByPlaceholderText(/email.*optional/i), { target: { value: "john@test.com" } });
  fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
  fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));
  fireEvent.click(screen.getByLabelText(/agree to the/i));
  fireEvent.click(screen.getByText(/next/i));
};

describe("FinalCTA Form", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders address field on step 1 (name/phone not visible yet)", () => {
    render(<FinalCTA />);
    expect(screen.getByPlaceholderText(/enter your property address/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/your first name/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/\(555\) 123-4567/i)).not.toBeInTheDocument();
  });

  it("submits with valid data and calls submitLead", async () => {
    render(<FinalCTA />);

    navigateToStep3();

    // Step 3: select required dropdowns and submit
    await waitFor(() => {
      expect(screen.getByText(/get my free offer/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByDisplayValue(/how soon are you looking/i), { target: { value: "ASAP (within 30 days)" } });
    fireEvent.change(screen.getByDisplayValue(/currently listed/i), { target: { value: "Unlisted" } });
    fireEvent.change(screen.getByDisplayValue(/how old is the home/i), { target: { value: "20+ Years Old" } });
    fireEvent.click(screen.getByText(/get my free offer/i));

    await waitFor(() => {
      expect(getRecaptchaToken).toHaveBeenCalledWith("submit_lead");
      expect(submitLead).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "John",
          phone: "+1234567890",
          email: "john@test.com",
          property_address: "123 Main St",
          market_slug: "tampa",
          situation_slug: "home",
          source: "final_cta",
        }),
        "fake-recaptcha-token",
        expect.any(String)
      );
    });
  });

  it("shows success UI on submission success", async () => {
    render(<FinalCTA />);

    navigateToStep3();

    await waitFor(() => {
      expect(screen.getByText(/get my free offer/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByDisplayValue(/how soon are you looking/i), { target: { value: "ASAP (within 30 days)" } });
    fireEvent.change(screen.getByDisplayValue(/currently listed/i), { target: { value: "Unlisted" } });
    fireEvent.change(screen.getByDisplayValue(/how old is the home/i), { target: { value: "20+ Years Old" } });
    fireEvent.click(screen.getByText(/get my free offer/i));

    await waitFor(() => {
      expect(screen.getByText(/we'll reach out within minutes/i)).toBeInTheDocument();
    });
  });

  it("shows error toast on submission failure", async () => {
    (submitLead as jest.Mock).mockRejectedValueOnce(new Error("API error"));

    render(<FinalCTA />);

    navigateToStep3();

    await waitFor(() => {
      expect(screen.getByText(/get my free offer/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByDisplayValue(/how soon are you looking/i), { target: { value: "ASAP (within 30 days)" } });
    fireEvent.change(screen.getByDisplayValue(/currently listed/i), { target: { value: "Unlisted" } });
    fireEvent.change(screen.getByDisplayValue(/how old is the home/i), { target: { value: "20+ Years Old" } });
    fireEvent.click(screen.getByText(/get my free offer/i));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong. Please try again or call us directly.");
    });
  });

  it("tracks conversion on submission success", async () => {
    render(<FinalCTA />);

    navigateToStep3();

    await waitFor(() => {
      expect(screen.getByText(/get my free offer/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByDisplayValue(/how soon are you looking/i), { target: { value: "ASAP (within 30 days)" } });
    fireEvent.change(screen.getByDisplayValue(/currently listed/i), { target: { value: "Unlisted" } });
    fireEvent.change(screen.getByDisplayValue(/how old is the home/i), { target: { value: "20+ Years Old" } });
    fireEvent.click(screen.getByText(/get my free offer/i));

    await waitFor(() => {
      expect(trackConversion).toHaveBeenCalledWith(
        "form_submitted",
        expect.objectContaining({ source: "final_cta" })
      );
    });
  });
});
