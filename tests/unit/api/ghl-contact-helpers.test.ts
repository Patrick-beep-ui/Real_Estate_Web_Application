/// <reference types="jest" />

import { maskPhone, maskEmail, splitName } from "@/app/api/ghl/contact/route";

describe("ghl/contact route - Helper Functions", () => {
  describe("splitName()", () => {
    it("splits full name into first and last name", () => {
      expect(splitName("John Smith")).toEqual({ firstName: "John", lastName: "Smith" });
      expect(splitName("Jane Doe")).toEqual({ firstName: "Jane", lastName: "Doe" });
      expect(splitName("Michael John Smith")).toEqual({ firstName: "Michael", lastName: "John Smith" });
    });

    it("handles single name (no last name)", () => {
      expect(splitName("Cher")).toEqual({ firstName: "Cher", lastName: "" });
      expect(splitName("Madonna")).toEqual({ firstName: "Madonna", lastName: "" });
    });

    it("handles extra whitespace", () => {
      expect(splitName("  John   Smith  ")).toEqual({ firstName: "John", lastName: "Smith" });
    });

    it("handles empty string", () => {
      expect(splitName("")).toEqual({ firstName: "", lastName: "" });
    });
  });

  describe("maskPhone()", () => {
    it("masks phone showing only last 4 digits", () => {
      expect(maskPhone("+11234567890")).toBe("***7890");
      expect(maskPhone("1234567890")).toBe("***7890");
    });

    it("returns **** for short phone numbers", () => {
      expect(maskPhone("123")).toBe("****");
      expect(maskPhone("")).toBe("****");
    });
  });

  describe("maskEmail()", () => {
    it("masks email showing domain", () => {
      expect(maskEmail("john@example.com")).toBe("***@example.com");
      expect(maskEmail("test.user@gmail.com")).toBe("***@gmail.com");
    });

    it("handles email without @ symbol", () => {
      expect(maskEmail("notanemail")).toBe("***");
    });

    it("handles empty string", () => {
      expect(maskEmail("")).toBe("***");
    });
  });
});
