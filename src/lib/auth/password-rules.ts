export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

/**
 * Ordered by reveal sequence: the first rule shown is "at least an uppercase
 * letter", the last is "at least 8 characters". Order is meaningful and is
 * relied on by the progressive requirement list in the signup form.
 */
export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: "uppercase",
    label: "At least an uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "number",
    label: "At least a number",
    test: (value) => /[0-9]/.test(value),
  },
  {
    id: "special",
    label: "At least a special character",
    test: (value) => /[^A-Za-z0-9\s]/.test(value),
  },
  {
    id: "length",
    label: "At least 8 characters",
    test: (value) => value.length >= 8,
  },
] as const;

export const PASSWORD_MIN_LENGTH = 8;

export function isPasswordRuleMet(rule: PasswordRule, value: string): boolean {
  return rule.test(value);
}

export function isPasswordValid(value: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}

export const PASSWORD_RULE_MESSAGES: Record<string, string> = {
  uppercase: "Password must contain at least an uppercase letter",
  number: "Password must contain at least a number",
  special: "Password must contain at least a special character",
  length: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
};

/**
 * First unmet rule in reveal order, or null when the password satisfies all
 * rules. Used to derive both the Zod error message and the visible list.
 */
export function getFirstUnmetRule(value: string): PasswordRule | null {
  return PASSWORD_RULES.find((rule) => !rule.test(value)) ?? null;
}
