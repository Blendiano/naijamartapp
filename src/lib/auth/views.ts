export const AUTH_VIEWS = [
  "login",
  "signup",
  "forgot-password",
] as const;

export type AuthView = (typeof AUTH_VIEWS)[number];

export function isAuthView(value: string): value is AuthView {
  return (AUTH_VIEWS as readonly string[]).includes(value);
}

export const AUTH_PATHS: Record<AuthView, string> = {
  login: "/auth/login",
  signup: "/auth/signup",
  "forgot-password": "/auth/forgot-password",
};