/// <reference types="jest" />

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ExitIntentPopup from "@/components/ExitIntentPopup";
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
    telLink: "tel:+19496782174",
    market: { slug: "tampa", name: "Tampa", state: "FL" },
    situation: { slug: "divorce", heroImage: "/hero.jpg" },
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

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "sessionStorage", { value: mockSessionStorage });

// Helper to trigger the popup by firing mouseleave with clientY <= 0
const triggerPopup = () => {
  // Mock Date.now to bypass the 30-second delay
  const originalNow = Date.now;
  Date.now = jest.fn(() => originalNow() + 31000);

  // Fire mouseleave on document.documentElement with clientY = -1
  fireEvent.mouseLeave(document.documentElement, { clientY: -1 });

  // Restore Date.now
  Date.now = originalNow;
};

describe("ExitIntentPopup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  it("does not render when not triggered and not dismissed", () => {
    const { container } = render(<ExitIntentPopup />);
    expect(container.firstChild).toBeNull();
  });

  it("respects sessionStorage dismissed state", () => {
    mockSessionStorage.getItem.mockReturnValue("true");
    const { container } = render(<ExitIntentPopup />);
    expect(container.firstChild).toBeNull();
  });

  it("renders when triggered via mouseleave", () => {
    render(<ExitIntentPopup />);
    triggerPopup();
    expect(screen.getByText(/before you go/i)).toBeInTheDocument();
    // Check for the heading text - "Cash Offer" is inside a span in h3
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(/cash offer/i);
  });

  it("renders step 1 form with address input when shown", () => {
    render(<ExitIntentPopup />);
    triggerPopup();
    expect(screen.getByPlaceholderText(/enter your property address/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /get my cash offer/i })).toBeInTheDocument();
  });

  it("advances to step 2 when address is submitted", async () => {
    render(<ExitIntentPopup />);
    triggerPopup();

    const addressInput = screen.getByPlaceholderText(/enter your property address/i);
    const submitButton = screen.getByRole("button", { name: /get my cash offer/i });

    fireEvent.change(addressInput, { target: { value: "123 Main St" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/your first name/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/almost there!/i)).toBeInTheDocument();
  });

  it("tracks conversion on step 1", async () => {
    render(<ExitIntentPopup />);
    triggerPopup();

    const addressInput = screen.getByPlaceholderText(/enter your property address/i);
    const submitButton = screen.getByRole("button", { name: /get my cash offer/i });

    fireEvent.change(addressInput, { target: { value: "123 Main St" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(trackConversion).toHaveBeenCalledWith("form_step_1", expect.objectContaining({
        source: "exit_intent",
      }));
    });
  });

  it("validates phone number in step 2", async () => {
    render(<ExitIntentPopup />);
    triggerPopup();

    // Go to step 2
    fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), {
      target: { value: "123 Main St" },
    });
    fireEvent.click(screen.getByRole("button", { name: /get my cash offer/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/your first name/i)).toBeInTheDocument();
    });

    // Fill step 2 with invalid phone
    fireEvent.change(screen.getByPlaceholderText(/your first name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByPlaceholderText(/your phone number/i), {
      target: { value: "123" },
    });
    fireEvent.change(screen.getByPlaceholderText(/email.*optional/i), {
      target: { value: "john@test.com" },
    });

    // Check consent boxes
    fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));

    // Submit - should show error toast for invalid phone
    fireEvent.click(screen.getByRole("button", { name: /request a callback/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Please enter a valid phone number");
    });
    expect(submitLead).not.toHaveBeenCalled();
  });

  it("submits form with valid data", async () => {
    render(<ExitIntentPopup />);
    triggerPopup();

    // Step 1
    fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), {
      target: { value: "123 Main St" },
    });
    fireEvent.click(screen.getByRole("button", { name: /get my cash offer/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/your first name/i)).toBeInTheDocument();
    });

    // Step 2 with valid data
    fireEvent.change(screen.getByPlaceholderText(/your first name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByPlaceholderText(/your phone number/i), {
      target: { value: "9496782174" },
    });
    fireEvent.change(screen.getByPlaceholderText(/email.*optional/i), {
      target: { value: "john@test.com" },
    });

    // Check consent boxes - using more specific patterns
    fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /request a callback/i }));

    await waitFor(() => {
      expect(getRecaptchaToken).toHaveBeenCalledWith("submit_lead");
    });
    expect(submitLead).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "John",
        phone: "9496782174",
        email: "john@test.com",
        property_address: "123 Main St",
        source: "exit_intent",
      }),
      "fake-recaptcha-token"
    );
  });

  it("close button sets dismissed and hides popup", () => {
    render(<ExitIntentPopup />);
    triggerPopup();

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Click close button (X)
    const closeButton = screen.getByRole("button", { name: "" }); // X button has no text
    fireEvent.click(closeButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith("exit_popup_dismissed", "true");
  });

  it("shows back button to change address in step 2", async () => {
    render(<ExitIntentPopup />);
    triggerPopup();

    // Go to step 2
    fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), {
      target: { value: "123 Main St" },
    });
    fireEvent.click(screen.getByRole("button", { name: /get my cash offer/i }));

    await waitFor(() => {
      expect(screen.getByText(/change address/i)).toBeInTheDocument();
    });

    // Click back
    fireEvent.click(screen.getByText(/change address/i));

    expect(screen.getByPlaceholderText(/enter your property address/i)).toBeInTheDocument();
  });
});
