/// <reference types="jest" />

import { render, fireEvent, screen } from "@testing-library/react";
import PhoneLink from "@/components/shared/PhoneLink";

global.fetch = jest.fn();

describe("PhoneLink attribution beacon", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    localStorage.removeItem("tbh_attribution");
    sessionStorage.removeItem("tbh_attribution_session");
  });

  afterEach(() => {
    localStorage.removeItem("tbh_attribution");
    sessionStorage.removeItem("tbh_attribution_session");
  });

  it("fires a call beacon with a digits-only target phone on tel: links", () => {
    render(<PhoneLink href="tel:+18664073411">Call us</PhoneLink>);
    fireEvent.click(screen.getByText("Call us"));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body).toMatchObject({ channel: "call", target_phone: "18664073411" });
  });

  it("fires an SMS beacon on sms: links", () => {
    render(<PhoneLink href="sms:+18664073411?body=Text%201234">Text us</PhoneLink>);
    fireEvent.click(screen.getByText("Text us"));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body).toMatchObject({ channel: "sms", target_phone: "18664073411" });
  });

  it("forwards Thank You context to the attribution beacon", () => {
    render(
      <PhoneLink
        href="tel:+18664073411"
        attributionContext={{ originPagePath: "/job-loss/mesa", leadSource: "hero_form" }}
      >
        Call from thank you
      </PhoneLink>
    );
    fireEvent.click(screen.getByText("Call from thank you"));

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body).toMatchObject({
      origin_page_path: "/job-loss/mesa",
      lead_source: "hero_form",
    });
  });

  it.each([
    "homepage_hero",
    "bottom_cta",
    "market_hero",
    "video_section",
    "contact_page",
    "chat_widget",
    "about_hero",
    "testimonials_cards",
    "sms_opt_in_disclosure",
    "thank_you_call",
  ])("forwards the %s lead source", (leadSource) => {
    render(
      <PhoneLink href="tel:+18664073411" attributionContext={{ leadSource }}>
        Call from {leadSource}
      </PhoneLink>
    );
    fireEvent.click(screen.getByText(`Call from ${leadSource}`));

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.lead_source).toBe(leadSource);
  });

  it("still invokes the caller's onClick handler", () => {
    const onClick = jest.fn();
    render(<PhoneLink href="tel:+18664073411" onClick={onClick}>Call</PhoneLink>);
    fireEvent.click(screen.getByText("Call"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
