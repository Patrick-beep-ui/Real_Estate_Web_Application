/// <reference types="jest" />

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import HomeLeadForm from "@/components/leads/HomeLeadForm";
import { useRouter } from "next/navigation";
import { submitLead } from "@/lib/leads";
import { trackConversion } from "@/lib/tracking/analytics";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

jest.mock("@/hooks/geo/useGeoMarket", () => ({
  useGeoMarket: jest.fn(() => ({
    market: { slug: "tampa", name: "Tampa", state: "FL" },
    loading: false,
  })),
}));

jest.mock("@/lib/tracking/recaptcha", () => ({
  getRecaptchaToken: jest.fn().mockResolvedValue("fake-recaptcha-token"),
}));

jest.mock("@/lib/leads", () => ({
  submitLead: jest.fn().mockResolvedValue(true),
}));

jest.mock("@/lib/tracking/analytics", () => ({
  trackConversion: jest.fn(),
  trackLeadSubmission: jest.fn(),
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

type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };
const getDataLayer = (): Record<string, unknown>[] => (window as DataLayerWindow).dataLayer || [];

const pushMock = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: pushMock });

const navigateToStep3 = () => {
  fireEvent.change(screen.getByPlaceholderText(/enter your property address/i), { target: { value: "123 Main St" } });
  fireEvent.click(screen.getByText(/next/i));

  fireEvent.change(screen.getByPlaceholderText(/your first name/i), { target: { value: "John" } });
  fireEvent.change(screen.getByPlaceholderText(/\(555\) 123-4567/i), { target: { value: "+1234567890" } });
  fireEvent.change(screen.getByPlaceholderText(/email.*optional/i), { target: { value: "john@test.com" } });
  fireEvent.click(screen.getByLabelText(/consent to receive non-marketing text messages/i));
  fireEvent.click(screen.getByLabelText(/consent to receive marketing text messages/i));
  fireEvent.click(screen.getByLabelText(/agree to the/i));
  fireEvent.click(screen.getByText(/next/i));
};

const submitStep3 = async () => {
  fireEvent.change(screen.getByDisplayValue(/how soon are you looking/i), { target: { value: "ASAP (within 30 days)" } });
  fireEvent.change(screen.getByDisplayValue(/currently listed/i), { target: { value: "Unlisted" } });
  fireEvent.change(screen.getByDisplayValue(/how old is the home/i), { target: { value: "20+ Years Old" } });
  fireEvent.click(screen.getByText(/get my free offer/i));
};

describe("HomeLeadForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window as DataLayerWindow).dataLayer = [];
  });

  it("homepage: fires form_submitted dataLayer event and shows success UI without trackConversion", async () => {
    render(<HomeLeadForm source="homepage" />);

    navigateToStep3();
    await waitFor(() => {
      expect(screen.getByText(/get my free offer/i)).toBeInTheDocument();
    });
    await submitStep3();

    await waitFor(() => {
      expect(submitLead).toHaveBeenCalledWith(
        expect.objectContaining({ source: "homepage" }),
        "fake-recaptcha-token",
        expect.any(String)
      );
      expect(getDataLayer()).toContainEqual({ event: "form_submitted" });
    });

    expect(screen.getByText(/we'll call you soon/i)).toBeInTheDocument();
    expect(trackConversion).not.toHaveBeenCalled();
    expect(useRouter().push).not.toHaveBeenCalled();
  });

  it("landing: fires form_submitted dataLayer event + trackConversion and redirects to thank-you", async () => {
    render(<HomeLeadForm source="landing-california" />);

    navigateToStep3();
    await waitFor(() => {
      expect(screen.getByText(/get my free offer/i)).toBeInTheDocument();
    });
    await submitStep3();

    await waitFor(() => {
      expect(submitLead).toHaveBeenCalledWith(
        expect.objectContaining({ source: "landing-california" }),
        "fake-recaptcha-token",
        expect.any(String)
      );
      expect(getDataLayer()).toContainEqual({ event: "form_submitted" });
      expect(trackConversion).toHaveBeenCalledWith("form_submitted", expect.objectContaining({ source: "landing-california" }));
      expect(useRouter().push).toHaveBeenCalledWith(expect.stringContaining("/landing/thank-you?"));
    });

    expect(screen.queryByText(/we'll call you soon/i)).not.toBeInTheDocument();
  });
});
