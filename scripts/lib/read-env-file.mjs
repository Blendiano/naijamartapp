/**
 * Reads a `.env`-style file into a plain object.
 *
 * The format is the one Next.js and Node use: `KEY=value` lines, `#` comments,
 * and optionally quoted values. Missing files are not an error — they simply
 * contribute nothing.
 */
import fs from "node:fs";

export function readEnvFile(filePath) {
  const values = {};
  let content = "";
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return values;
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const index = line.indexOf("=");
    if (index === -1) continue;

    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

/**
 * Loads the project's environment the way Next.js does: `.env` first, then
 * `.env.local` on top, with the real process environment winning over both.
 */
export function loadProjectEnv(projectRoot) {
  return {
    ...readEnvFile(`${projectRoot}/.env`),
    ...readEnvFile(`${projectRoot}/.env.local`),
    ...process.env,
  };
}
