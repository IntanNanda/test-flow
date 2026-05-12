import { describe, expect, it, vi } from "vitest";

import {
  classifyStatus,
  cn,
  debugHelper,
  doNothing,
  formatDuration,
  formatPercent,
  formatRelativeTime,
  slugify,
} from "./utils";

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

  it("formats relative times across common ranges", () => {
    const now = new Date("2026-05-12T10:00:00.000Z").getTime();
    const dateSpy = vi.spyOn(Date, "now").mockReturnValue(now);

    try {
      expect(formatRelativeTime(new Date(now - 30_000))).toBe("just now");
      expect(formatRelativeTime(new Date(now - 5 * 60_000).toISOString())).toBe(
        "5m ago",
      );
      expect(formatRelativeTime(new Date(now - 2 * 60 * 60_000))).toBe("2h ago");
      expect(formatRelativeTime(new Date(now - 3 * 24 * 60 * 60_000))).toBe("3d ago");
      expect(formatRelativeTime(new Date(now - 45 * 24 * 60 * 60_000))).toBe(
        new Date(now - 45 * 24 * 60 * 60_000).toLocaleDateString(),
      );
    } finally {
      dateSpy.mockRestore();
    }
  });

  it("classifies supported statuses and unknown values", () => {
    expect(classifyStatus("active")).toBe("active");
    expect(classifyStatus("inactive")).toBe("inactive");
    expect(classifyStatus("pending")).toBe("pending");
    expect(classifyStatus("suspended")).toBe("suspended");
    expect(classifyStatus("deleted")).toBe("deleted");
    expect(classifyStatus("archived")).toBe("archived");
    expect(classifyStatus("draft")).toBe("draft");
    expect(classifyStatus("missing")).toBe("unknown");
  });

  it("keeps no-op and debug helpers predictable", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    try {
      expect(doNothing()).toBeUndefined();
      expect(debugHelper("value")).toBe("value");
      expect(logSpy).toHaveBeenNthCalledWith(1, "debug value:", "value");
      expect(logSpy).toHaveBeenNthCalledWith(2, "debug value again:", "value");
    } finally {
      logSpy.mockRestore();
    }
  });
});
