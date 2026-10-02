"use client";

import { Check, Circle } from "lucide-react";
import {
  isPasswordRuleMet,
  PASSWORD_RULES,
} from "@/lib/auth/password-rules";

interface PasswordRequirementsProps {
  value: string;
  focused: boolean;
}

/**
 * Progressive requirement checklist. Hidden until the field has content, then
 * reveals one rule at a time in PASSWORD_RULES order: a rule appears only once
 * every preceding rule is met, and met rules are removed from view.
 */
export function PasswordRequirements({ value, focused }: PasswordRequirementsProps) {
  if (!focused || value.length === 0) {
    return null;
  }

  const unmetIds = new Set(
    PASSWORD_RULES.filter((rule) => !isPasswordRuleMet(rule, value)).map(
      (rule) => rule.id
    )
  );

  const firstUnmetId = PASSWORD_RULES.find((rule) =>
    unmetIds.has(rule.id)
  )?.id;

  const visibleRules = PASSWORD_RULES.filter(
    (rule) =>
      unmetIds.has(rule.id) &&
      PASSWORD_RULES.slice(0, PASSWORD_RULES.indexOf(rule)).every(
        (prior) => !unmetIds.has(prior.id)
      )
  );

  if (!firstUnmetId || visibleRules.length === 0) {
    return null;
  }

  return (
    <ul aria-live="polite" className="mt-1.5 flex flex-col gap-1">
      {visibleRules.map((rule) => {
        const met = isPasswordRuleMet(rule, value);
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 text-xs font-medium ${
              met ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {met ? (
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Circle
                className="h-3.5 w-3.5 shrink-0 opacity-40"
                aria-hidden="true"
              />
            )}
            <span>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
