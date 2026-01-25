import { describe, it, expect } from "vitest";
import { getPricingContext } from "../../server/pricing-matrix";

describe("Pricing Matrix", () => {
  describe("getPricingContext", () => {
    it("should return pricing context string", async () => {
      const context = await getPricingContext();

      expect(context).toBeDefined();
      expect(typeof context).toBe("string");
      expect(context.length).toBeGreaterThan(0);
    });

    it("should include rate information", async () => {
      const context = await getPricingContext();

      // Should contain rate-related keywords
      expect(
        context.toLowerCase().includes("rate") ||
          context.toLowerCase().includes("cost") ||
          context.toLowerCase().includes("price"),
      ).toBe(true);
    });

    it("should be cacheable (same result on multiple calls)", async () => {
      const context1 = await getPricingContext();
      const context2 = await getPricingContext();

      expect(context1).toBe(context2);
    });
  });
});
