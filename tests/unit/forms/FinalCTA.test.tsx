/// <reference types="jest" />

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import FinalCTA from "@/components/FinalCTA";
import { usePageConfig } from "@/context/PageContext";
import { useRouter } from "next/navigation";
import { submitLead } from "@/lib/leads";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { toast } from "sonner";
import { trackConversion } from "@/lib/analytics";

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

jest.mock("@/lib/recaptcha", () => ({
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

describe("FinalCTA Form", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders step 1 (address input) on load", () => {
    render(<FinalCTA />);
    expect(screen.getByPlaceholderText(/enter your property address/i)).toBeInTheDocument();
    expect(screen.getByText(/get my cash offer/i)).toBeInTheDocument();
  });

  it("advances to step 2 after entering address", () => {
    render(<FinalCTA />);
    const addressInput = screen.getByPlaceholderText(/enter your property address/i);
    fireEvent.change(addressInput, { target: { value: "123 Main St" } });
    fireEvent.click(screen.getByText(/get my cash offer/i));

    expect(screen.getByPlaceholderText(/first name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/phone/i)).toBeInTheDocument();
  });

  it("tracks conversion on step 1", () => {
    render(<FinalCTA />);
    const addressInput = screen.getByPlaceholderText(/enter your property address/i);
    fireEvent.change(addressInput, { target: { value: "123 Main St" } });
    fireEvent.click(screen.getByText(/get my cash offer/i));

    expect(trackConversion).toHaveBeenCalledWith(
      "form_step_1",
      expect.objectContaining({ source: "final_cta" })
    );
  });

  it("submits with valid data and calls submitLead", async () => {
    render(<FinalCTA />);

    // Step 1
    const addressInput = screen.getByPlaceholderText(/enter your property address/i);
    fireEvent.change(addressInput, { target: { value: "123 Main St" } });
    fireEvent.click(screen.getByText(/get my cash offer/i));

    // Step 2 - fill form
    fireEvent.change(screen.getByPlaceholderText(/first name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByPlaceholderText(/phone/i), { target: { value: "+1234567890" } });
    fireEvent.change(screen.getByPlaceholderText(/email.*optional/i), { target: { value: "john@test.com" } });

    // Check consent checkboxes by their ID
    fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));


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

    // Step 1
    const addressInput = screen.getByPlaceholderText(/enter your property address/i);
    fireEvent.change(addressInput, { target: { value: "123 Main St" } });
    fireEvent.click(screen.getByText(/get my cash offer/i));

    // Step 2
    fireEvent.change(screen.getByPlaceholderText(/first name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByPlaceholderText(/phone/i), { target: { value: "+1234567890" } });
    fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));


    fireEvent.click(screen.getByText(/get my free offer/i));

    await waitFor(() => {
      expect(screen.getByText(/we'll reach out within minutes/i)).toBeInTheDocument();
    });
  });

  it("shows error toast on submission failure", async () => {
    (submitLead as jest.Mock).mockRejectedValueOnce(new Error("API error"));

    render(<FinalCTA />);

    // Step 1
    const addressInput = screen.getByPlaceholderText(/enter your property address/i);
    fireEvent.change(addressInput, { target: { value: "123 Main St" } });
    fireEvent.click(screen.getByText(/get my cash offer/i));

    // Step 2
    fireEvent.change(screen.getByPlaceholderText(/first name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByPlaceholderText(/phone/i), { target: { value: "+1234567890" } });
    fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));


    fireEvent.click(screen.getByText(/get my free offer/i));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong. Please try again or call us directly.");
    });
  });

  it("tracks conversion on step 2 success", async () => {
    render(<FinalCTA />);

    // Step 1
    const addressInput = screen.getByPlaceholderText(/enter your property address/i);
    fireEvent.change(addressInput, { target: { value: "123 Main St" } });
    fireEvent.click(screen.getByText(/get my cash offer/i));

    // Step 2
    fireEvent.change(screen.getByPlaceholderText(/first name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByPlaceholderText(/phone/i), { target: { value: "+1234567890" } });
    fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));


    fireEvent.click(screen.getByText(/get my free offer/i));

    await waitFor(() => {
      expect(trackConversion).toHaveBeenCalledWith(
        "form_step_2",
        expect.objectContaining({ source: "final_cta" })
      );
    });
  });

  it("returns to step 1 when 'Change address' is clicked", () => {
    render(<FinalCTA />);

    // Go to step 2
    const addressInput = screen.getByPlaceholderText(/enter your property address/i);
    fireEvent.change(addressInput, { target: { value: "123 Main St" } });
    fireEvent.click(screen.getByText(/get my cash offer/i));

    // Click back button
    fireEvent.click(screen.getByText(/change address/i));

    expect(screen.getByPlaceholderText(/enter your property address/i)).toBeInTheDocument();
  });
});
