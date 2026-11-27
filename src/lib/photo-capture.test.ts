import { describe, expect, it } from "vitest";
import { formatPhotoCapture } from "./photo-capture";

describe("photo capture metadata", () => {
  it("does not invent a date or time for missing or malformed metadata", () => {
    for (const value of [undefined, "", "yesterday", "2025-02-30", "2025-01-01T25:00", "2025-01-01T12:30:99", "2025-01-01T12:30+99:00"]) {
      expect(formatPhotoCapture(value)).toEqual({ date: "Not updated", time: "Not updated" });
    }
  });
  it("keeps date-only metadata free of a fabricated midnight time", () => {
    expect(formatPhotoCapture("2024-02-29")).toEqual({ date: "29/02/2024", time: "Not updated" });
  });
  it("preserves the camera's local wall clock when no destination zone is provided", () => {
    expect(formatPhotoCapture("2024-05-20T16:45:12")).toEqual({ date: "20/05/2024", time: "16:45" });
    expect(formatPhotoCapture("2024-05-20T16:45:12+08:00")).toEqual({ date: "20/05/2024", time: "16:45" });
  });
  it("converts offset timestamps using the explicit location timezone", () => {
    expect(formatPhotoCapture("2024-05-20T23:45:12Z", "Asia/Ho_Chi_Minh")).toEqual({ date: "21/05/2024", time: "06:45" });
    expect(formatPhotoCapture("2024-05-20T23:45:12Z", "invalid")).toEqual({ date: "Not updated", time: "Not updated" });
  });
});
