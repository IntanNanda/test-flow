import { describe, expect, it } from "vitest";

import { cn, formatDuration, formatPercent, slugify } from "./utils";

describe("utils", () => {
  it("merges class names with Tailwind conflict resolution", () => {
    expect(cn("px-2", false, "px-4", ["text-sm"])).toBe("px-4 text-sm");
  });

  it("slugifies text for URL-safe labels", () => {
    expect(slugify("  Login Flow: Mobile & Web  ")).toBe("login-flow-mobile-web");
  });

  it("formats durations", () => {
    expect(formatDuration(999)).toBe("999ms");
    expect(formatDuration(1_500)).toBe("1.5s");
    expect(formatDuration(65_000)).toBe("1m 5s");
  });

  it("formats ratios as percentages", () => {
    expect(formatPercent(0.875)).toBe("87.5%");
    expect(formatPercent(1, 0)).toBe("100%");
  });
});
