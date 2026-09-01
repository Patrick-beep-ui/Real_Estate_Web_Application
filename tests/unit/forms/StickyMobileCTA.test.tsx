/// <reference types="jest" />

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import StickyMobileCTA from "@/components/leads/StickyMobileCTA";
import { usePageConfig } from "@/context/PageContext";
import { useRouter } from "next/navigation";
import { submitLead } from "@/lib/leads";
import { getRecaptchaToken } from "@/lib/tracking/recaptcha";
import { toast } from "sonner";
import { trackPhoneClick, trackConversion } from "@/lib/tracking/analytics";

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

// Navigate through all 3 steps after expanding the CTA.
// Assumes the CTA is already expanded. Leaves on step 3 ready to submit.
const navigateToStep3 = () => {
  // Step 1: address
  fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), { target: { value: "123 Main St" } });
  fireEvent.click(screen.getByText(/next →/i));

  // Step 2: name, phone, email, consents
  fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: "John" } });
  fireEvent.change(screen.getByPlaceholderText(/\(555\) 123-4567/i), { target: { value: "+1234567890" } });
  fireEvent.change(screen.getByPlaceholderText(/email.*optional/i), { target: { value: "john@test.com" } });
  fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
  fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));
  fireEvent.click(screen.getByLabelText(/agree to the/i));
  fireEvent.click(screen.getByText(/next →/i));
};

describe("StickyMobileCTA", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders collapsed state on load", () => {
    render(<StickyMobileCTA />);
    expect(screen.getByText(/get your free cash offer/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/enter your property address/i)).not.toBeInTheDocument();
  });

  it("expands to show address field on step 1 (name/phone not visible yet)", () => {
    render(<StickyMobileCTA />);
    fireEvent.click(screen.getByText(/get your free cash offer/i));
    expect(screen.getByPlaceholderText(/enter your property address/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/your name/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/\(555\) 123-4567/i)).not.toBeInTheDocument();
  });

  it("submits with valid data and calls submitLead", async () => {
    render(<StickyMobileCTA />);
    fireEvent.click(screen.getByText(/get your free cash offer/i));

    navigateToStep3();

    // Step 3: select required dropdowns and submit
    await waitFor(() => {
      expect(screen.getByText(/submit/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByDisplayValue(/how soon are you looking/i), { target: { value: "ASAP (within 30 days)" } });
    fireEvent.change(screen.getByDisplayValue(/currently listed/i), { target: { value: "Unlisted" } });
    fireEvent.change(screen.getByDisplayValue(/how old is the home/i), { target: { value: "20+ Years Old" } });
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
        "fake-recaptcha-token",
        expect.any(String)
      );
    });
  });

  it("redirects to thank-you page on success", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(<StickyMobileCTA />);
    fireEvent.click(screen.getByText(/get your free cash offer/i));

    navigateToStep3();

    await waitFor(() => {
      expect(screen.getByText(/submit/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByDisplayValue(/how soon are you looking/i), { target: { value: "ASAP (within 30 days)" } });
    fireEvent.change(screen.getByDisplayValue(/currently listed/i), { target: { value: "Unlisted" } });
    fireEvent.change(screen.getByDisplayValue(/how old is the home/i), { target: { value: "20+ Years Old" } });
    fireEvent.click(screen.getByText(/submit/i));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/landing/thank-you"));
    });
  });

  it("shows error toast on submission failure", async () => {
    (submitLead as jest.Mock).mockRejectedValueOnce(new Error("API error"));

    render(<StickyMobileCTA />);
    fireEvent.click(screen.getByText(/get your free cash offer/i));

    navigateToStep3();

    await waitFor(() => {
      expect(screen.getByText(/submit/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByDisplayValue(/how soon are you looking/i), { target: { value: "ASAP (within 30 days)" } });
    fireEvent.change(screen.getByDisplayValue(/currently listed/i), { target: { value: "Unlisted" } });
    fireEvent.change(screen.getByDisplayValue(/how old is the home/i), { target: { value: "20+ Years Old" } });
    fireEvent.click(screen.getByText(/submit/i));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong. Please try calling us directly.");
    });
  });

  it("closes when X button is clicked while expanded", () => {
    render(<StickyMobileCTA />);
    fireEvent.click(screen.getByText(/get your free cash offer/i));
    expect(screen.getByPlaceholderText(/enter your property address/i)).toBeInTheDocument();

    const closeButton = screen.getByLabelText(/close form/i);
    fireEvent.click(closeButton);

    expect(screen.queryByPlaceholderText(/enter your property address/i)).not.toBeInTheDocument();
    expect(screen.getByText(/get your free cash offer/i)).toBeInTheDocument();
  });

  it("dispatches sticky_cta_state event on expand/collapse", () => {
    const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");
    render(<StickyMobileCTA />);

    fireEvent.click(screen.getByText(/get your free cash offer/i));
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "sticky_cta_state" })
    );

    const closeButton = screen.getByLabelText(/close form/i);
    fireEvent.click(closeButton);
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "sticky_cta_state" })
    );

    dispatchEventSpy.mockRestore();
  });

  it("stays hidden until the user scrolls past the threshold when revealOnScroll is enabled", () => {
    render(<StickyMobileCTA revealOnScroll />);
    const ctaBar = screen.getByRole("complementary", { hidden: true });
    expect(ctaBar).toHaveAttribute("aria-hidden", "true");

    Object.defineProperty(window, "scrollY", { value: 600, configurable: true });
    fireEvent.scroll(window);

    expect(ctaBar).toHaveAttribute("aria-hidden", "false");

    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });

  it("reveals via the sticky_cta_open event even when above the scroll threshold", () => {
    render(<StickyMobileCTA revealOnScroll />);
    expect(screen.getByRole("complementary", { hidden: true })).toHaveAttribute("aria-hidden", "true");

    act(() => {
      window.dispatchEvent(new Event("sticky_cta_open"));
    });

    expect(screen.getByPlaceholderText(/enter your property address/i)).toBeInTheDocument();
  });

  it("remains visible by default when revealOnScroll is not set", () => {
    render(<StickyMobileCTA />);
    expect(screen.getByRole("complementary")).toHaveAttribute("aria-hidden", "false");
  });
});
