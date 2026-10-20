/**
 * Safe error logging.
 *
 * Drizzle wraps driver failures in `DrizzleQueryError`, whose message embeds the
 * full SQL statement *and* its bound parameters:
 *
 *   Failed query: insert into "users" (...) values (...)
 *   params: $2b$10$..., amina@example.com
 *
 * For auth queries those parameters are password hashes, reset-token hashes and
 * verification-token hashes, so the raw error object must never be handed to a
 * logger. `summarizeError` keeps the useful parts (error name, driver error
 * code, driver message) and drops the query text and its parameters.
 */

interface ErrorSummary {
  name: string;
  code?: string;
  message: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

const NO_MESSAGE = "No error message";

/**
 * Drizzle's wrapper is recognised by name and by shape so a renamed/duck-typed
 * error still has its `query`/`params` stripped instead of being logged raw.
 */
function isQueryError(error: Record<string, unknown>): boolean {
  return (
    error.name === "DrizzleQueryError" ||
    ("query" in error && "params" in error)
  );
}

function summarizeError(error: unknown): ErrorSummary {
  if (typeof error === "string") {
    return { name: "Error", message: error };
  }

  const record = asRecord(error);
  if (!record) {
    return { name: "UnknownError", message: "Non-error value was thrown" };
  }

  if (isQueryError(record)) {
    const cause = asRecord(record.cause);
    return {
      name: "DrizzleQueryError",
      code: typeof cause?.code === "string" ? cause.code : undefined,
      message:
        typeof cause?.message === "string"
          ? cause.message
          : "Database query failed",
    };
  }

  return {
    name: typeof record.name === "string" ? record.name : "Error",
    code: typeof record.code === "string" ? record.code : undefined,
    message: typeof record.message === "string" ? record.message : NO_MESSAGE,
  };
}

function formatError(context: string, error: unknown): string {
  const { name, code, message } = summarizeError(error);
  return `${context}: ${name}${code ? ` (${code})` : ""} - ${message}`;
}

export function logError(context: string, error: unknown): void {
  console.error(formatError(context, error));
}
