/// <reference types="jest" />

import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import HomePage from "@/app/page";
import { useGeoMarket } from "@/hooks/useGeoMarket";
import { submitLead } from "@/lib/leads";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { toast } from "sonner";

// Mocks
jest.mock("@/hooks/useGeoMarket", () => ({
  useGeoMarket: jest.fn(() => ({
    market: { slug: "tampa", name: "Tampa", state: "FL" },
    loading: false,
  })),
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

jest.mock("next/link", () => ({
  __esModule: true,
  default: function Link({ children, href }: { children: React.ReactNode; href: string }) {
    return require("react").createElement("a", { href }, children);
  },
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: function Image({ src, alt, fill, priority, ...props }: any) {
    return <img src={src || undefined} alt={alt} {...props} />;
  },
}));

// Mock the Footer component since it uses lazy loading
jest.mock("@/components/Footer", () => ({
  __esModule: true,
  default: function Footer() {
    return null;
  },
}));

// Mock ChatWidget to avoid importing its dependencies in form tests
jest.mock("@/components/ChatWidget", () => ({
  __esModule: true,
  default: function ChatWidget() {
    return null;
  },
}));

// Helper to get checkbox by test id pattern
const getCheckbox = (idPattern: RegExp) => {
  const checkboxes = screen.getAllByRole("checkbox");
  return checkboxes.find(cb => idPattern.test(cb.id || ""));
};

describe("HomePage Form", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all form fields on load", () => {
    render(<HomePage />);
    expect(screen.getByPlaceholderText(/enter your property address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your first name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your phone number/i)).toBeInTheDocument();
  });

  it("shows error toast for invalid phone number", async () => {
    render(<HomePage />);

    fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), { target: { value: "123 Main St" } });
    fireEvent.change(screen.getByPlaceholderText(/your first name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByPlaceholderText(/your phone number/i), { target: { value: "123" } });

    fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/agree to the/i));

    fireEvent.click(screen.getByText(/get my free offer/i));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Please enter a valid phone number");
    });
  });

  it("shows validation error if name is missing", () => {
    render(<HomePage />);

    fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), { target: { value: "123 Main St" } });
    fireEvent.click(screen.getByText(/get my free offer/i));

    expect(screen.getByPlaceholderText(/your first name/i)).toBeInTheDocument();
  });

  it("shows validation error if phone is missing", () => {
    render(<HomePage />);

    fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), { target: { value: "123 Main St" } });
    fireEvent.change(screen.getByPlaceholderText(/your first name/i), { target: { value: "John" } });
    fireEvent.click(screen.getByText(/get my free offer/i));

    expect(screen.getByPlaceholderText(/your phone number/i)).toBeInTheDocument();
  });

  it("submits with valid data and shows success UI", async () => {
    render(<HomePage />);

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
      expect(submitLead).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "John",
          phone: "+1234567890",
          email: "john@test.com",
          property_address: "123 Main St",
          market_slug: "tampa",
          situation_slug: "home",
          source: "homepage",
        }),
        "fake-recaptcha-token",
        expect.any(String)
      );
    });

    expect(screen.getByText(/we'll call you soon/i)).toBeInTheDocument();
  });

  it("shows loading state during submission", async () => {
    (submitLead as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
    );

    render(<HomePage />);

    fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), { target: { value: "123 Main St" } });
    fireEvent.change(screen.getByPlaceholderText(/your first name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByPlaceholderText(/your phone number/i), { target: { value: "+1234567890" } });
    fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/agree to the/i));

    const submitButton = screen.getByText(/get my free offer/i);
    fireEvent.click(submitButton);

    expect(screen.getByText(/submitting/i)).toBeInTheDocument();
  });

  it("shows error toast on submission failure", async () => {
    (submitLead as jest.Mock).mockRejectedValueOnce(new Error("API error"));

    render(<HomePage />);

    fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), { target: { value: "123 Main St" } });
    fireEvent.change(screen.getByPlaceholderText(/your first name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByPlaceholderText(/your phone number/i), { target: { value: "+1234567890" } });
    fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));
    fireEvent.click(screen.getByLabelText(/agree to the/i));

    fireEvent.click(screen.getByText(/get my free offer/i));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong. Please call us directly.");
    });
  });
});
