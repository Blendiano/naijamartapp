/**
 * Sign-in throttling policy.
 *
 * Two independent dimensions are tracked:
 *
 *  - **Per IP** (`loginIp`, 20 / 15 min) — broad protection against one source
 *    spraying many accounts. This is enforced hard: once tripped, the request
 *    is rejected before the password is even checked.
 *  - **Per account** (`loginAccount`, 5 / 15 min) — protection against a
 *    distributed attack that a per-IP limit cannot see, because the attacker
 *    rotates IPs against a single account.
 *
 * The account dimension deliberately **fails open when the password is
 * correct**. A hard account lockout is itself an attack: anyone who knows a
 * victim's email could lock them out of their own account by submitting wrong
 * passwords. So an over-budget account is refused a *wrong* password, but a
 * *correct* password still signs in. This keeps the brute-force ceiling at five
 * guesses per window while making denial of service pointless.
 */

export type AccountThrottleDecision =
  | { action: "proceed" }
  /** Wrong password while over budget: refuse, but stay ambiguous. */
  | { action: "reject" }
  /** Correct password while over budget: honour it, then clear the counter. */
  | { action: "allow-and-reset" };

/**
 * Decides what to do with a credential check.
 *
 * `overBudget` is the per-account state *before* this attempt is counted;
 * `passwordValid` is the result of the comparison that already happened.
 */
export function decideAccountThrottle(
  overBudget: boolean,
  passwordValid: boolean
): AccountThrottleDecision {
  if (!overBudget) return { action: "proceed" };
  return passwordValid
    ? { action: "allow-and-reset" }
    : { action: "reject" };
}
