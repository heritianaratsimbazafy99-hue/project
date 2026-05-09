import { describe, expect, it } from "vitest";

import { getRequiredEnv } from "@/lib/env";

describe("environment helpers", () => {
  it("throws a readable error for missing required values", () => {
    expect(() => getRequiredEnv("JOBMADA_MISSING_TEST_VALUE")).toThrow(
      "Missing environment variable: JOBMADA_MISSING_TEST_VALUE"
    );
  });
});
