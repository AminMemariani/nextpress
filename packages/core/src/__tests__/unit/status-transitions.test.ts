import { describe, it, expect } from "vitest";
import { STATUS_TRANSITIONS } from "../../content/content-types";

describe("STATUS_TRANSITIONS", () => {
  it("allows DRAFT → PUBLISHED", () => {
    expect(STATUS_TRANSITIONS.DRAFT).toContain("PUBLISHED");
  });

  it("allows DRAFT → PENDING_REVIEW", () => {
    expect(STATUS_TRANSITIONS.DRAFT).toContain("PENDING_REVIEW");
  });

  it("allows DRAFT → SCHEDULED", () => {
    expect(STATUS_TRANSITIONS.DRAFT).toContain("SCHEDULED");
  });

  it("allows PUBLISHED → TRASH", () => {
    expect(STATUS_TRANSITIONS.PUBLISHED).toContain("TRASH");
  });

  it("allows TRASH → DRAFT only", () => {
    expect(STATUS_TRANSITIONS.TRASH).toEqual(["DRAFT"]);
  });

  it("does not allow DRAFT → ARCHIVED", () => {
    expect(STATUS_TRANSITIONS.DRAFT).not.toContain("ARCHIVED");
  });

  it("allows PUBLISHED → ARCHIVED", () => {
    expect(STATUS_TRANSITIONS.PUBLISHED).toContain("ARCHIVED");
  });

  it("every status has at least one valid transition", () => {
    for (const [status, transitions] of Object.entries(STATUS_TRANSITIONS)) {
      expect(transitions.length).toBeGreaterThan(0);
    }
  });
});
