import { describe, expect, it } from "vitest";

import { renderInlineError } from "./inline-alert";

describe("inline-alert", () => {
  it("renders inline error feedback", () => {
    expect(renderInlineError("Error")).toContain("Error");
    expect(renderInlineError("Error")).toContain("mt-4");
  });
});
