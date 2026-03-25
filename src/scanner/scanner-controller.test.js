import { describe, expect, it } from "vitest";

import {
  getClampedZoomValue,
  selectPreferredCamera,
} from "./scanner-controller";

describe("scanner-controller helpers", () => {
  it("prefers back or environment cameras when available", () => {
    expect(
      selectPreferredCamera([
        { id: "1", label: "Front camera" },
        { id: "2", label: "Back camera" },
      ]),
    ).toEqual({ id: "2", label: "Back camera" });
  });

  it("falls back to the last available camera", () => {
    expect(
      selectPreferredCamera([
        { id: "1", label: "Front camera" },
        { id: "2", label: "USB camera" },
      ]),
    ).toEqual({ id: "2", label: "USB camera" });
    expect(selectPreferredCamera([])).toBeNull();
  });

  it("clamps and snaps zoom values using capability limits", () => {
    expect(getClampedZoomValue(3.14, { min: 1, max: 3, step: 0.5 })).toBe(3);
    expect(getClampedZoomValue(0.2, { min: 1, max: 3, step: 0.5 })).toBe(1);
    expect(getClampedZoomValue(1.24, { min: 1, max: 3, step: 0.1 })).toBe(1.2);
  });
});
