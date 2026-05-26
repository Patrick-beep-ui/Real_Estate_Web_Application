/// <reference types="jest" />

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import StickyMobileCTA from "@/components/StickyMobileCTA";
import { usePageConfig } from "@/context/PageContext";
import { useRouter } from "next/navigation";
import { submitLead } from "@/lib/leads";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { toast } from "sonner";
import { trackPhoneClick, trackConversion } from "@/lib/analytics";

// Mocks
jest.mock("@/context/PageContext", () => ({
  usePageConfig: jest.fn(() => ({
    phone: "(949) 678-2174",
    telLink: "tel:+19496782174",
    market: { slug: "tampa", name: "Tampa", state: "FL" },
    situation: { slug: "home", heroImage: "/hero.jpg" },
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

describe("StickyMobileCTA", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders collapsed state (step 0) on load", () => {
    render(<StickyMobileCTA />);
    expect(screen.getByText(/get your free cash offer/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/enter your property address/i)).not.toBeInTheDocument();
  });

  it("expands to step 1 when collapsed button is clicked", () => {
    render(<StickyMobileCTA />);
    fireEvent.click(screen.getByText(/get your free cash offer/i));
    expect(screen.getByPlaceholderText(/enter your property address/i)).toBeInTheDocument();
  });

  it("advances to step 2 after entering address", () => {
    render(<StickyMobileCTA />);
    fireEvent.click(screen.getByText(/get your free cash offer/i));
    fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), { target: { value: "123 Main St" } });
    fireEvent.click(screen.getByText(/continue/i));

    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/phone number/i)).toBeInTheDocument();
  });

  it("submits with valid data and calls submitLead", async () => {
    render(<StickyMobileCTA />);
    fireEvent.click(screen.getByText(/get your free cash offer/i));
    fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), { target: { value: "123 Main St" } });
    fireEvent.click(screen.getByText(/continue/i));

    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByPlaceholderText(/phone number/i), { target: { value: "+1234567890" } });
    fireEvent.change(screen.getByPlaceholderText(/email.*optional/i), { target: { value: "john@test.com" } });

    // Click consent checkboxes using text matching
    fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/I agree to the.*Privacy Policy/i));

    fireEvent.click(screen.getByText(/submit/i));

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
          source: "sticky_mobile",
        }),
        "fake-recaptcha-token"
      );
    });
  });

  it("redirects to thank-you page on success", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(<StickyMobileCTA />);
    fireEvent.click(screen.getByText(/get your free cash offer/i));
    fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), { target: { value: "123 Main St" } });
    fireEvent.click(screen.getByText(/continue/i));

    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByPlaceholderText(/phone number/i), { target: { value: "+1234567890" } });
    fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/I agree to the.*Privacy Policy/i));

    fireEvent.click(screen.getByText(/submit/i));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/landing/thank-you"));
    });
  });

  it("shows error toast on submission failure", async () => {
    (submitLead as jest.Mock).mockRejectedValueOnce(new Error("API error"));

    render(<StickyMobileCTA />);
    fireEvent.click(screen.getByText(/get your free cash offer/i));
    fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), { target: { value: "123 Main St" } });
    fireEvent.click(screen.getByText(/continue/i));

    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByPlaceholderText(/phone number/i), { target: { value: "+1234567890" } });
    fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/I agree to the.*Privacy Policy/i));

    fireEvent.click(screen.getByText(/submit/i));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong. Please try calling us directly.");
    });
  });

  it("returns to step 1 when 'Change address' is clicked", () => {
    render(<StickyMobileCTA />);
    fireEvent.click(screen.getByText(/get your free cash offer/i));
    fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), { target: { value: "123 Main St" } });
    fireEvent.click(screen.getByText(/continue/i));

    fireEvent.click(screen.getByText(/change address/i));

    expect(screen.getByPlaceholderText(/enter your property address/i)).toBeInTheDocument();
  });

  it("closes to step 0 when X button is clicked in step 1", () => {
    render(<StickyMobileCTA />);
    fireEvent.click(screen.getByText(/get your free cash offer/i));
    expect(screen.getByPlaceholderText(/enter your property address/i)).toBeInTheDocument();

    const closeButton = screen.getByLabelText(/close form/i);
    fireEvent.click(closeButton);

    expect(screen.queryByPlaceholderText(/enter your property address/i)).not.toBeInTheDocument();
    expect(screen.getByText(/get your free cash offer/i)).toBeInTheDocument();
  });

  it("tracks conversion on step 1", () => {
    render(<StickyMobileCTA />);
    fireEvent.click(screen.getByText(/get your free cash offer/i));
    fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), { target: { value: "123 Main St" } });
    fireEvent.click(screen.getByText(/continue/i));

    expect(trackConversion).toHaveBeenCalledWith(
      "form_step_1",
      expect.objectContaining({ source: "sticky_mobile" })
    );
  });

  it("dispatches sticky_cta_state event on expand/collapse", () => {
    const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");
    render(<StickyMobileCTA />);

    // Expand
    fireEvent.click(screen.getByText(/get your free cash offer/i));
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "sticky_cta_state" })
    );

    // Collapse
    const closeButton = screen.getByLabelText(/close form/i);
    fireEvent.click(closeButton);
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "sticky_cta_state" })
    );

    dispatchEventSpy.mockRestore();
  });
});
