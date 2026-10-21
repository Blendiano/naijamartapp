/**
 * A minimal SMTP server that captures the messages it receives.
 *
 * It exists so the route tests can assert what NaijaMart actually puts in an
 * email — most importantly the verification link, which is what customers
 * click. It speaks just enough SMTP for Nodemailer: EHLO, AUTH, MAIL, RCPT,
 * DATA and QUIT. It deliberately does not advertise STARTTLS.
 *
 * @typedef {object} CapturedMessage
 * @property {string} from
 * @property {string[]} to
 * @property {string} raw The raw message body, headers included.
 * @property {string} subject The decoded subject.
 * @property {string} text The decoded plain-text body, when the message has one.
 */
import net from "node:net";

const CRLF = "\r\n";

/**
 * Decodes a quoted-printable string into text.
 *
 * The bytes are collected first and decoded as UTF-8 at the end, so multi-byte
 * characters such as an em dash survive the round trip.
 *
 * @param {string} value
 * @returns {string}
 */
function decodeQuotedPrintable(value) {
  /** @type {number[]} */
  const bytes = [];

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (char === "=") {
      const hex = value.slice(index + 1, index + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        index += 2;
        continue;
      }
      // A soft line break: "=\r\n" or "=\n".
      if (value[index + 1] === "\r" && value[index + 2] === "\n") {
        index += 2;
        continue;
      }
      if (value[index + 1] === "\n") continue;
    }

    bytes.push(char.charCodeAt(0) & 0xff);
  }

  return Buffer.from(bytes).toString("utf8");
}

/**
 * Decodes an RFC 2047 encoded word, e.g. `=?UTF-8?Q?...?=`.
 *
 * @param {string} value
 * @returns {string}
 */
function decodeEncodedWord(value) {
  return value.replace(
    /=\?utf-8\?([bBqQ])\?(.*?)\?=/gi,
    (_match, encoding, payload) => {
      if (String(encoding).toLowerCase() === "b") {
        return Buffer.from(payload, "base64").toString("utf8");
      }
      // Quoted-printable encoding uses "_" for a space.
      return decodeQuotedPrintable(payload.replace(/_/g, " "));
    }
  );
}

/**
 * Parses a header block into a map.
 *
 * Folded headers (a continuation line starting with whitespace) are joined to
 * the header they belong to.
 *
 * @param {string} headerBlock
 * @returns {Map<string, string>}
 */
function parseHeaders(headerBlock) {
  /** @type {Map<string, string>} */
  const headers = new Map();
  let lastKey = null;

  for (const line of headerBlock.split(CRLF)) {
    if (!line) continue;

    if (/^\s/.test(line) && lastKey) {
      headers.set(lastKey, `${headers.get(lastKey)} ${line.trim()}`);
      continue;
    }

    const index = line.indexOf(":");
    if (index === -1) continue;

    lastKey = line.slice(0, index).trim().toLowerCase();
    headers.set(lastKey, line.slice(index + 1).trim());
  }

  return headers;
}

/**
 * Decodes a body according to its `Content-Transfer-Encoding`.
 *
 * @param {string} payload
 * @param {string} encoding
 * @returns {string}
 */
function decodeBody(payload, encoding) {
  const normalized = encoding.trim().toLowerCase();
  if (normalized === "quoted-printable") return decodeQuotedPrintable(payload);
  if (normalized === "base64") {
    return Buffer.from(payload.replace(/\s+/g, ""), "base64").toString("utf8");
  }
  return payload;
}

/**
 * Extracts the decoded text of a MIME message.
 *
 * Each part is decoded with its own transfer encoding: decoding the whole
 * body at once would corrupt the parts that are sent as plain text.
 *
 * @param {string} body
 * @param {Map<string, string>} headers
 * @returns {string}
 */
function decodeMessageBody(body, headers) {
  const contentType = headers.get("content-type") ?? "";
  const boundary = /boundary="?([^";\r\n]+)"?/i.exec(contentType)?.[1];

  if (contentType.trim().toLowerCase().startsWith("multipart/") && boundary) {
    const delimiter = `--${boundary}`;
    const segments = body.split(delimiter);
    const parts = [];

    for (const segment of segments) {
      if (segment.trim() === "--" || segment.trim() === "") continue;

      const separator = segment.indexOf(CRLF + CRLF);
      if (separator === -1) continue;

      const partHeaders = parseHeaders(segment.slice(0, separator));
      const payload = segment.slice(separator + 4);
      parts.push(
        decodeBody(payload, partHeaders.get("content-transfer-encoding") ?? "")
      );
    }

    return parts.join("\n");
  }

  return decodeBody(
    body,
    headers.get("content-transfer-encoding") ?? ""
  );
}

/**
 * @param {string} raw
 */
function parseMessage(raw) {
  const separator = raw.indexOf(CRLF + CRLF);
  const headerBlock = separator === -1 ? raw : raw.slice(0, separator);
  const body = separator === -1 ? "" : raw.slice(separator + 4);

  const headers = parseHeaders(headerBlock);

  const subjectHeader = headers.get("subject") ?? "";
  const fromHeader = headers.get("from") ?? "";
  const toHeader = headers.get("to") ?? "";

  const subject = decodeEncodedWord(subjectHeader);

  const textBody = decodeMessageBody(body, headers);

  return {
    subject,
    text: textBody,
    from: fromHeader,
    to: toHeader
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  };
}

/**
 * Removes SMTP dot-stuffing.
 *
 * A line that begins with a dot is transmitted with an extra leading dot, and
 * the receiver has to strip it again. Without this, a wrapped URL that
 * continues with a dot ("127.0" + ".0.1") would be captured with a duplicated
 * dot and the link would not match.
 *
 * @param {string} payload
 * @returns {string}
 */
function unstuffDots(payload) {
  return payload
    .split(CRLF)
    .map((line) => (line.startsWith("..") ? line.slice(1) : line))
    .join(CRLF);
}

/**
 * Starts the capture server on an ephemeral port.
 *
 * @returns {Promise<{
 *   port: number,
 *   messages: CapturedMessage[],
 *   waitForMessage: (predicate: (message: CapturedMessage) => boolean, timeoutMs?: number) => Promise<CapturedMessage>,
 *   close: () => Promise<void>
 * }>}
 */
export async function startCaptureServer() {
  /** @type {CapturedMessage[]} */
  const messages = [];
  /** @type {Array<{predicate: (m: CapturedMessage) => boolean, resolve: (m: CapturedMessage) => void, reject: (e: Error) => void, timer: NodeJS.Timeout, fromIndex: number}>} */
  const waiters = [];

  const server = net.createServer((socket) => {
    socket.setEncoding("utf8");
    socket.write("220 naijamart.test ESMTP capture\r\n");

    let buffer = "";
    let inData = false;
    let dataBuffer = "";
    let from = "";
    const recipients = [];

    const flushWaiters = (message) => {
      for (const waiter of [...waiters]) {
        if (waiter.fromIndex > 0 && messages.length - 1 < waiter.fromIndex) continue;
        if (!waiter.predicate(message)) continue;
        clearTimeout(waiter.timer);
        waiters.splice(waiters.indexOf(waiter), 1);
        waiter.resolve(message);
      }
    };

    const handleLine = (line) => {
      const upper = line.toUpperCase();

      if (upper.startsWith("EHLO") || upper.startsWith("HELO")) {
        socket.write(
          [
            "250-naijamart.test",
            "250-SIZE 10485760",
            "250-8BITMIME",
            "250-AUTH PLAIN LOGIN",
            "250 HELP",
          ].join(CRLF) +
            CRLF
        );
        return;
      }

      if (upper.startsWith("AUTH")) {
        socket.write("235 2.7.0 Authentication successful\r\n");
        return;
      }

      if (upper.startsWith("MAIL FROM")) {
        from = (line.match(/<([^>]*)>/)?.[1] ?? "").trim();
        socket.write("250 2.1.0 OK\r\n");
        return;
      }

      if (upper.startsWith("RCPT TO")) {
        const address = (line.match(/<([^>]*)>/)?.[1] ?? "").trim();
        if (address) recipients.push(address);
        socket.write("250 2.1.5 OK\r\n");
        return;
      }

      if (upper === "DATA") {
        inData = true;
        dataBuffer = "";
        socket.write("354 End data with <CR><LF>.<CR><LF>\r\n");
        return;
      }

      if (upper === "RSET") {
        recipients.length = 0;
        from = "";
        socket.write("250 2.0.0 OK\r\n");
        return;
      }

      if (upper === "NOOP") {
        socket.write("250 2.0.0 OK\r\n");
        return;
      }

      if (upper === "QUIT") {
        socket.write("221 2.0.0 Bye\r\n");
        socket.end();
        return;
      }

      socket.write("502 5.5.2 Command not implemented\r\n");
    };

    socket.on("data", (chunk) => {
      buffer += chunk;

      if (inData) {
        const end = buffer.indexOf(CRLF + "." + CRLF);
        if (end === -1) return;
        dataBuffer += buffer.slice(0, end);
        buffer = buffer.slice(end + CRLF.length + 3);
        inData = false;

        const parsed = parseMessage(unstuffDots(dataBuffer));
        messages.push({
          raw: unstuffDots(dataBuffer),
          subject: parsed.subject,
          text: parsed.text,
          from: parsed.from || from,
          to: parsed.to.length > 0 ? parsed.to : recipients,
        });
        flushWaiters(messages[messages.length - 1]);

        socket.write("250 2.0.0 OK: queued\r\n");
        return;
      }

      let newlineIndex = buffer.indexOf(CRLF);
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + CRLF.length);
        handleLine(line);
        newlineIndex = buffer.indexOf(CRLF);
      }
    });

    socket.on("error", () => {
      /* client went away */
    });
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(undefined));
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;

  return {
    port,
    messages,
    waitForMessage(predicate, timeoutMs = 15000) {
      const existing = messages.find(predicate);
      if (existing) return Promise.resolve(existing);

      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          const index = waiters.findIndex((waiter) => waiter.timer === timer);
          if (index !== -1) waiters.splice(index, 1);
          reject(new Error("Timed out waiting for a captured email"));
        }, timeoutMs);

        waiters.push({ predicate, resolve, reject, timer, fromIndex: 0 });
      });
    },
    /**
     * Waits for a message that arrives after `fromIndex`.
     *
     * `waitForMessage` returns the first matching message that was ever
     * captured, which is not enough when the same kind of email is sent twice
     * and both copies have to be inspected.
     */
    waitForNewMessage(predicate, fromIndex = 0, timeoutMs = 15000) {
      const existing = messages.slice(fromIndex).find(predicate);
      if (existing) return Promise.resolve(existing);

      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          const index = waiters.findIndex((waiter) => waiter.timer === timer);
          if (index !== -1) waiters.splice(index, 1);
          reject(new Error("Timed out waiting for a captured email"));
        }, timeoutMs);

        waiters.push({ predicate, resolve, reject, timer, fromIndex });
      });
    },
    async close() {
      for (const waiter of waiters) {
        clearTimeout(waiter.timer);
        waiter.reject(new Error("Capture server closed"));
      }
      waiters.length = 0;
      await new Promise((resolve) => server.close(() => resolve(undefined)));
    },
  };
}
