import { describe, expect, it } from "vitest";

import { brand } from "@/config/brand";

describe("JobMada brand configuration", () => {
  it("uses the approved brand identity", () => {
    expect(brand.name).toBe("JobMada");
    expect(brand.logoPath).toBe("/assets/logos/jobmada-logo.jpg");
    expect(brand.colors.green).toBe("#8ee321");
  });
});
