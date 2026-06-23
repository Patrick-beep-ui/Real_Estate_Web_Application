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
  const originalNow = Date.now;
  Date.now = jest.fn(() => originalNow() + 31000);

  fireEvent.mouseLeave(document.documentElement, { clientY: -1 });

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
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(/cash offer/i);
  });

  it("renders all form fields when shown", () => {
    render(<ExitIntentPopup />);
    triggerPopup();
    expect(screen.getByPlaceholderText(/enter your property address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your first name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your phone number/i)).toBeInTheDocument();
  });

  it("validates phone number", async () => {
    render(<ExitIntentPopup />);
    triggerPopup();

    fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), { target: { value: "123 Main St" } });
    fireEvent.change(screen.getByPlaceholderText(/your first name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByPlaceholderText(/your phone number/i), { target: { value: "123" } });
    fireEvent.change(screen.getByPlaceholderText(/email.*optional/i), { target: { value: "john@test.com" } });

    fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/agree to the/i));

    fireEvent.click(screen.getByRole("button", { name: /request a callback/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Please enter a valid phone number");
    });
    expect(submitLead).not.toHaveBeenCalled();
  });

  it("submits form with valid data", async () => {
    render(<ExitIntentPopup />);
    triggerPopup();

    fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), { target: { value: "123 Main St" } });
    fireEvent.change(screen.getByPlaceholderText(/your first name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByPlaceholderText(/your phone number/i), { target: { value: "9496782174" } });
    fireEvent.change(screen.getByPlaceholderText(/email.*optional/i), { target: { value: "john@test.com" } });

    fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/agree to the/i));

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
      "fake-recaptcha-token",
      expect.any(String)
    );
  });

  it("close button sets dismissed and hides popup", () => {
    render(<ExitIntentPopup />);
    triggerPopup();

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: "" });
    fireEvent.click(closeButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith("exit_popup_dismissed", "true");
  });
});
