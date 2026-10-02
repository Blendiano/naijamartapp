import { describe, it, expect } from "vitest";
import {
  getFirstUnmetRule,
  isPasswordValid,
  PASSWORD_RULES,
} from "../lib/auth/password-rules";

/** Mirrors the reveal filter in PasswordRequirements. */
function visibleRules(value: string) {
  const unmetIds = new Set(
    PASSWORD_RULES.filter((rule) => !rule.test(value)).map((rule) => rule.id)
  );
  return PASSWORD_RULES.filter(
    (rule) =>
      unmetIds.has(rule.id) &&
      PASSWORD_RULES.slice(0, PASSWORD_RULES.indexOf(rule)).every(
        (prior) => !unmetIds.has(prior.id)
      )
  );
}

describe("Password Rules", () => {
  it("reveals 'at least an uppercase letter' first and 'at least 8 characters' last", () => {
    expect(PASSWORD_RULES[0].label).toBe("At least an uppercase letter");
    expect(PASSWORD_RULES[PASSWORD_RULES.length - 1].label).toBe(
      "At least 8 characters"
    );
  });

  it("shows exactly one requirement before any input", () => {
    expect(visibleRules("").map((r) => r.id)).toEqual(["uppercase"]);
  });

  it("reveals the next requirement only after the prior one is met", () => {
    expect(visibleRules("a").map((r) => r.id)).toEqual(["uppercase"]);
    expect(visibleRules("A").map((r) => r.id)).toEqual(["number"]);
    expect(visibleRules("A1").map((r) => r.id)).toEqual(["special"]);
    expect(visibleRules("A1!").map((r) => r.id)).toEqual(["length"]);
  });

  it("removes met requirements from display instead of showing a full checklist", () => {
    expect(visibleRules("A1!x").map((r) => r.id)).toEqual(["length"]);
  });

  it("displays nothing once every requirement is met", () => {
    expect(visibleRules("Password1!")).toEqual([]);
    expect(isPasswordValid("Password1!")).toBe(true);
  });

  it("does not count whitespace as a special character", () => {
    expect(isPasswordValid("Password 1")).toBe(false);
    expect(getFirstUnmetRule("Password 1")?.id).toBe("special");
  });

  it("rejects a password of 7 characters despite meeting every other rule", () => {
    expect(isPasswordValid("Passw0!")).toBe(false);
    expect(getFirstUnmetRule("Passw0!")?.id).toBe("length");
  });

  it("reports the first unmet rule in reveal order", () => {
    expect(getFirstUnmetRule("abcdefgh")?.id).toBe("uppercase");
    expect(getFirstUnmetRule("Abcdefgh")?.id).toBe("number");
  });
});
