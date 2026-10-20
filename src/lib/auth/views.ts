export const AUTH_VIEWS = [
  "login",
  "signup",
  "forgot-password",
  "reset-password",
] as const;

export type AuthView = (typeof AUTH_VIEWS)[number];

export function isAuthView(value: string): value is AuthView {
  return (AUTH_VIEWS as readonly string[]).includes(value);
}