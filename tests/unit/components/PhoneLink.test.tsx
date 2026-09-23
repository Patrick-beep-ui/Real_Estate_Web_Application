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

  it("still invokes the caller's onClick handler", () => {
    const onClick = jest.fn();
    render(<PhoneLink href="tel:+18664073411" onClick={onClick}>Call</PhoneLink>);
    fireEvent.click(screen.getByText("Call"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
